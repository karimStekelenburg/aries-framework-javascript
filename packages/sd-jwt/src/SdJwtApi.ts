import type { VERIFYSDJWT_RETURN } from './services'
import type { Key } from '@aries-framework/core'

import { AgentContext, ConnectionService, injectable, MessageSender } from '@aries-framework/core'

import { SdJwtService } from './services'

@injectable()
export class SdJwtApi {
  private sdJwtService: SdJwtService
  private agentContext: AgentContext

  public constructor(agentContext: AgentContext, sdJwtService: SdJwtService) {
    this.agentContext = agentContext
    this.sdJwtService = sdJwtService
  }

  public async createSdJwt(jwt: Record<string, unknown>, claims: Record<string, unknown>, signerKey: Key) {
    return this.sdJwtService.createSdJwt(this.agentContext, jwt, claims, signerKey)
  }

  public async discloseClaims(sdJwt: string, claims: string[]): Promise<string> {
    return this.sdJwtService.discloseClaims(sdJwt, claims)
  }

  public async verifySdJwt(sdJwt: string): Promise<VERIFYSDJWT_RETURN> {
    return this.sdJwtService.verifySdJwt(this.agentContext, sdJwt)
  }
}
