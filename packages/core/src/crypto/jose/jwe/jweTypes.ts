import type { JsonValue } from '../../../types'
import type { TokenType } from '../joseTypes'
import type { Jwk } from '../jwk'

export type JweEncryptionAlgorithm =
  | 'RSA1_5'
  | 'RSA-OAEP'
  | 'RSA-OAEP-256'
  | 'A128KW'
  | 'A192KW'
  | 'A256KW'
  | 'dir'
  | 'ECDH-ES'
  | 'ECDH-ES+A128KW'
  | 'ECDH-ES+A192KW'
  | 'ECDH-ES+A256KW'
  | 'A128GCMKW'
  | 'A192GCMKW'
  | 'A256GCMKW'
  | 'PBES2-HS256+A128KW'
  | 'PBES2-HS384+A192KW'
  | 'PBES2-HS512+A256KW'

export type JweEncryptionMethod =
  | 'A128CBC-HS256'
  | 'A192CBC-HS384'
  | 'A256CBC-HS512'
  | 'A128GCM'
  | 'A192GCM'
  | 'A256GCM'

export type JWEHeader = {
  alg: JweEncryptionAlgorithm // Algorithm
  enc: JweEncryptionMethod // Encryption method
  zip?: 'DEF' // Compression algorithm (optional)
  jku?: string // JWK Set URL (optional)
  jwk?: Jwk // JSON Web Key (optional)
  kid?: string // Key ID (optional)
  x5u?: string // X.509 URL (optional)
  x5c?: string[] // X.509 Certificate Chain (optional)
  x5t?: string // X.509 Certificate SHA-1 Thumbprint (optional)
  x5tS256?: string // X.509 Certificate SHA-256 Thumbprint (optional)
  typ?: string // Type (optional)
  cty?: string // Content Type (optional)
  crit?: string[] // Critical (optional)
} & { [key: string]: JsonValue }
