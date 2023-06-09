import type { JwtPayloadJson, JwtPayloadOptions } from './JwtPayload'
import type { Buffer } from '../../../utils'

import { randomBytes } from '@stablelib/random'

import { AriesFrameworkError } from '../../../error'
import { Hasher, TypedArrayEncoder } from '../../../utils'

import { JwtPayload } from './JwtPayload'

export interface SdJwtPayloadJson extends JwtPayloadJson {
  _sd: string[]
}

type JwtSdPayloadOptions = Omit<JwtPayloadOptions, 'additionalClaims'> & { digests: string[]; hashAlg: string }

export class SdJwtPayload extends JwtPayload {
  public static SALT_BYTE_SIZE = 128 / 8 // 128-bit salts

  private digests: string[]
  private hashAlg: string

  public constructor(options?: JwtSdPayloadOptions) {
    super(options)
    this.hashAlg = options?.hashAlg ?? 'sha-256'
    this.digests = options?.digests ?? []
  }

  public toJson(): SdJwtPayloadJson {
    return {
      _sd: this.digests,
      _sd_alg: this.hashAlg,
      iss: this.iss,
      sub: this.sub,
      aud: this.aud,
      exp: this.exp,
      nbf: this.nbf,
      iat: this.iat,
      jti: this.jti,
    }
  }
}
