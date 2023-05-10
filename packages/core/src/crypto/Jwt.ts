import { TypedArrayEncoder } from "../utils"



type customClaims = Record<string, string>

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

    private defaultClaims: DefaultClaims
    private customClaims: Record<string, string>

    constructor(options: JwtOptions) {
        this.defaultClaims = {
            iss: options.iss,
            sub: options.sub,
            aud: options.aud,
            exp: options.exp,
            nbf: options.nbf,
            iat: options.iat,
            jti: options.jti
        }

        this.customClaims



        this.message = TypedArrayEncoder.fromString(JSON.stringify(options.claims))

    }



}
