import { Handler, HandlerInboundMessage } from '../../../agent/Handler'
import { CredentialAckMessage } from '../messages'
import { CredentialService } from '../services'

export class CredentialAckHandler implements Handler {
  private credentialService: CredentialService
  public supportedMessages = [CredentialAckMessage]

  public constructor(credentialService: CredentialService) {
    this.credentialService = credentialService
  }

  public async handle(messageContext: HandlerInboundMessage<CredentialAckHandler>) {
    await this.credentialService.processAck(messageContext)
  }
}