import type { JwtPayload } from './jwtTypes'
import type { JsonLdDoc } from '../../../modules/vc/jsonldUtil'
import type { JsonLd } from '../../../modules/vc/libraries/jsonld'

export type VerifiableCredentialJwtPayload = JwtPayload & {
  vc: JsonLdDoc
}

export class JwtVcService {}
