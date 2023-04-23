import { TypedArrayEncoder } from '../utils'

export interface JwtOptions {
  claims: Record<string, string>
}

interface DefaultClaims {
  iss?: string
  sub?: string
  aud?: string
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
}

class Jwt {
  private message: Uint8Array

  constructor(options: JwtOptions) {
    this.message = TypedArrayEncoder.fromString(JSON.stringify(options.claims))
  }
}
