import type { JsonValue } from '../../../types'
import type { JwaAlgorithm } from '../jwa'

export type KeyOperation =
  | 'sign'
  | 'verify'
  | 'encrypt'
  | 'decrypt'
  | 'wrapKey'
  | 'unwrapKey'
  | 'deriveKey'
  | 'deriveBits'

export type Jwk = {
  kty: 'EC' | 'RSA' | 'oct' // Key Type
  use?: 'sig' | 'enc' // Public Key Use (optional)
  key_ops?: KeyOperation[] // Key Operations (optional)
  alg?: JwaAlgorithm // Algorithm (optional)
  kid?: string // Key ID (optional)
  x5u?: string // X.509 URL (optional)
  x5c?: string[] // X.509 Certificate Chain (optional)
  x5t?: string // X.509 Certificate SHA-1 Thumbprint (optional)
  x5tS256?: string // X.509 Certificate SHA-256 Thumbprint (optional)
} & { [key: string]: JsonValue } // Additional custom parameters
