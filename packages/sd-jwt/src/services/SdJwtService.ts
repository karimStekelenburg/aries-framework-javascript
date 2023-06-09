import type { AgentContext, Key } from '@aries-framework/core'

import {
  getJwkFromJson,
  getJwkFromKey,
  AriesFrameworkError,
  Buffer,
  Hasher,
  TypedArrayEncoder,
  EventEmitter,
  inject,
  injectable,
  InjectionSymbols,
  Logger,
  JwsService,
} from '@aries-framework/core'
import { randomBytes } from '@stablelib/random'

interface SD_JWT {
  _sd: string[]
  _sd_alg: string
}

export enum DisclosureArray {
  SALT = 0,
  NAME = 1,
  VALUE = 2,
}

const SALT_BYTE_SIZE = 128 / 8 // 128-bit salts

export interface VERIFYSDJWT_RETURN {
  jwt: string
  disclosed: string
}

@injectable()
export class SdJwtService {
  private eventEmitter: EventEmitter
  private logger: Logger

  private jwsService: JwsService

  public constructor(
    eventEmitter: EventEmitter,
    @inject(InjectionSymbols.Logger) logger: Logger,
    jwsService: JwsService
  ) {
    // this.questionAnswerRepository = questionAnswerRepository
    this.eventEmitter = eventEmitter
    this.logger = logger
    this.jwsService = jwsService
  }

  private createDisclosures(claims: Record<string, unknown>) {
    const disclosures: string[] = []
    const sdDigests: string[] = []

    const names = Object.keys(claims)
    const values: unknown[] = Object.values(claims)
    const salts: Buffer[] = names.map((v) => new Buffer(randomBytes(SALT_BYTE_SIZE)))

    for (let i = 0; i < names.length; i++) {
      if (typeof values[i] === 'object') {
        throw new AriesFrameworkError('Nested digests are not supported yet')
      }

      const disclosureArray = [TypedArrayEncoder.toBase64URL(salts[i]), names[i], values[i]]

      const disclosuresArrayBuffer = TypedArrayEncoder.fromString(JSON.stringify(disclosureArray))

      const disclosure = TypedArrayEncoder.toBase64URL(disclosuresArrayBuffer)
      disclosures.push(disclosure)

      const disclosureDigest = Hasher.hash(TypedArrayEncoder.fromString(disclosure), 'sha2-256')
      sdDigests.push(disclosureDigest.toString())
    }
    return { disclosures, sdDigests: sdDigests.sort() }
  }

  public async createSdJwt(
    agentContext: AgentContext,
    jwt: Record<string, unknown>,
    claims: Record<string, unknown>,
    signerKey: Key
  ): Promise<string> {
    const { disclosures, sdDigests } = this.createDisclosures(claims)

    const sdJwt = {
      ...jwt,
      _sd: sdDigests,
      _sd_alg: 'sha2-256',
    }

    const sdJwtString = JSON.stringify(sdJwt)

    const payload = TypedArrayEncoder.fromString(sdJwtString)
    const jwk = getJwkFromKey(signerKey)
    let jws = await this.jwsService.createJwsCompact(agentContext, {
      key: signerKey,
      payload: payload,
      protectedHeaderOptions: {
        alg: 'ES256',
        jwk,
      },
    })

    if (disclosures) {
      jws = jws.concat('~' + disclosures.join('~'))
    }

    return jws
  }

  public async verifySdJwt(agentContext: AgentContext, sdJwt: string): Promise<VERIFYSDJWT_RETURN> {
    try {
      // split SD-JWS into JWS and Disclosures
      const parts = sdJwt.split('~')
      const JWS = parts[0]

      const [header, _payload] = JWS.split('.')

      const deserializedHeader = JSON.parse(TypedArrayEncoder.fromBase64(header).toString())
      const stringPayload = TypedArrayEncoder.fromBase64(_payload).toString()
      const deserializedPayload = JSON.parse(stringPayload)

      // // verify the JWS
      let payload = ''
      try {
        // @ts-ignore
        const issuerPublicJwk = getJwkFromJson(deserializedHeader.jwk)

        const signatureResult = await this.jwsService.verifyJws(agentContext, {
          jws: JWS,
          jwkResolver: () => issuerPublicJwk,
        })

        if (!signatureResult.isValid) {
          throw new Error('Signature validation failed')
        }

        // const result = await jose.compactVerify(JWS, jose.createLocalJWKSet(jwks))
        payload = stringPayload
      } catch (err) {
        throw new Error(`Error validating signature: ${err}`)
      }

      // verify the Disclosures, if any
      // TODO: generalized for nested objects
      let disclosedClaims = {}
      if (parts.length > 1) {
        const disclosures = parts.slice(1)

        const sd = (deserializedPayload as SD_JWT)._sd
        const sd_alg = (deserializedPayload as SD_JWT)._sd_alg
        disclosedClaims = this.verifyDisclosures(disclosures, sd_alg, sd)
      }

      const disclosedClaimsString = JSON.stringify(disclosedClaims)

      return {
        jwt: payload,
        disclosed: disclosedClaimsString,
      }
    } catch (err) {
      throw new Error(`Can't verify the SD-JWT: ${err as string}`)
    }
  }

  private verifyDisclosures(disclosures: string[], sd_alg: string, sd: string[]) {
    const disclosedClaims = {}
    disclosures.forEach((disclosure) => {
      const disclosureDigest = this.hashDisclosure(sd_alg, disclosure)

      if (!sd.includes(disclosureDigest)) {
        throw new Error(`Disclosure ${disclosure} is not contained in SD-JWT`)
      }
      const disclosureArray = this.parseDisclosure(disclosure)
      Object.defineProperty(disclosedClaims, disclosureArray[DisclosureArray.NAME], {
        value: disclosureArray[DisclosureArray.VALUE],
        enumerable: true,
      })
    })

    return disclosedClaims
  }

  public async discloseClaims(sdJwt: string, claims: string[]): Promise<string> {
    // split SD-JWS into JWS and Disclosures
    const parts = sdJwt.split('~')
    if (parts.length <= 1) {
      throw new Error('No Disclosures found in SD-JWT')
    }
    const JWS = parts[0]
    let disclosures = parts.slice(1)
    disclosures = disclosures.filter((disclosure) =>
      claims.includes(this.parseDisclosure(disclosure)[DisclosureArray.NAME])
    )

    // re-encode the updated SD-JWT w/ Disclosures
    const updatedSdJwt = JWS.concat('~' + disclosures.join('~'))
    return updatedSdJwt
  }

  private hashDisclosure(alg: string, disclosure: string): string {
    return Hasher.hash(TypedArrayEncoder.fromString(disclosure), 'sha2-256').toString()
  }

  private parseDisclosure = (disclosure: string): string[] => {
    const input = TypedArrayEncoder.fromBase64(disclosure)
    const parsed: string[] = JSON.parse(input.toString())
    if (parsed.length != 3) {
      throw new Error("can't parse disclosure: " + disclosure)
    }
    return parsed
  }
}
