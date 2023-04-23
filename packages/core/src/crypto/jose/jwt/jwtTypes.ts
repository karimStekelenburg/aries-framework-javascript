import type { JsonValue } from '../../../types'

export type JwtPayload = {
  sub?: string
  aud?: string | string[]
  iss?: string
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
} & { [key: string]: JsonValue }
