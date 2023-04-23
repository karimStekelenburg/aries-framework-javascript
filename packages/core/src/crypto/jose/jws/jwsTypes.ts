import type { JsonValue } from '../../../types'
import type { TokenType } from '../joseTypes'

export type SignatureAlgorithm =
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'PS256'
  | 'PS384'
  | 'PS512'
  | 'none'

export type JwsHeader = {
  alg: SignatureAlgorithm
  typ?: TokenType
  kid?: string
} & { [key: string]: JsonValue }
