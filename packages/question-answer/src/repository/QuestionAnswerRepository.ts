import { EventEmitter, inject, injectable, InjectionSymbols, Repository, StorageService } from '@credo-ts/core'

import { QuestionAnswerRecord } from './QuestionAnswerRecord'

@injectable()
export class QuestionAnswerRepository extends Repository<QuestionAnswerRecord> {
  public constructor(
    @inject(InjectionSymbols.StorageService) storageService: StorageService<QuestionAnswerRecord>,
    eventEmitter: EventEmitter
  ) {
    super(QuestionAnswerRecord, storageService, eventEmitter)
  }
}
