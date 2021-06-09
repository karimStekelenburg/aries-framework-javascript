import { inject, scoped, Lifecycle } from 'tsyringe'

import { createOutboundMessage } from '../../../agent/helpers'
import { AriesFrameworkError } from '../../../error'
import { MessageRepository } from '../../../storage/MessageRepository'
import { Symbols } from '../../../symbols'
import { InboundConnection } from '../../../types'
import { ConnectionRecord } from '../../connections'
import { BatchMessage, BatchMessageMessage, BatchPickupMessage } from '../messages'

@scoped(Lifecycle.ContainerScoped)
export class MessagePickupService {
  private messageRepository: MessageRepository

  public constructor(@inject(Symbols.MessageRepository) messageRepository: MessageRepository) {
    this.messageRepository = messageRepository
  }

  public async batchPickup(inboundConnection: InboundConnection) {
    const batchPickupMessage = new BatchPickupMessage({
      batchSize: 10,
    })

    return createOutboundMessage(inboundConnection.connection, batchPickupMessage)
  }

  // TODO: add support for batchSize property
  public async batch(connection: ConnectionRecord) {
    if (!this.messageRepository) {
      throw new AriesFrameworkError('There is no message repository.')
    }
    if (!connection.theirKey) {
      throw new AriesFrameworkError('Trying to find messages to connection without theirKey!')
    }

    const messages = this.messageRepository.findByVerkey(connection.theirKey)
    // TODO: each message should be stored with an id. to be able to conform to the id property
    // of batch message
    const batchMessages = messages.map(
      (msg) =>
        new BatchMessageMessage({
          message: msg,
        })
    )

    const batchMessage = new BatchMessage({
      messages: batchMessages,
    })

    await this.messageRepository.deleteAllByVerkey(connection.theirKey) // TODO Maybe, don't delete, but just marked them as read
    return createOutboundMessage(connection, batchMessage)
  }
}