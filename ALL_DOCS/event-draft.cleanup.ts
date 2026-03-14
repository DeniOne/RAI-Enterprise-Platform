import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventDraftRepository } from './event-draft.repository';

@Injectable()
export class EventDraftCleanup {
    private readonly logger = new Logger(EventDraftCleanup.name);

    constructor(private readonly repository: EventDraftRepository) { }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleCleanup() {
        this.logger.log('Starting EventDraft cleanup...');
        const now = new Date();
        const deletedCount = await this.repository.deleteExpired(now);
        this.logger.log(`Cleaned up ${deletedCount} expired drafts.`);
    }
}
