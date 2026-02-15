import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from '@rai/prisma-client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class OutboxRelay implements OnApplicationBootstrap {
    private readonly logger = new Logger(OutboxRelay.name);
    private isProcessing = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    onApplicationBootstrap() {
        this.logger.log('Outbox Relay initialized.');
    }

    @Cron(CronExpression.EVERY_SECOND) // Aggressive polling for Phase 1
    async processOutbox() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // Atomic Fetch & Lock (SKIP LOCKED pattern) to prevent double-processing in multi-instance env
            const messages: any[] = await this.prisma.$queryRaw`
                UPDATE "outbox_messages"
                SET status = 'PROCESSING', "updatedAt" = NOW()
                WHERE id IN (
                    SELECT id
                    FROM "outbox_messages"
                    WHERE status = 'PENDING'
                    ORDER BY "createdAt" ASC
                    LIMIT 50
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING *;
            `;

            if (messages.length === 0) {
                this.isProcessing = false;
                return;
            }

            this.logger.debug(`Processing ${messages.length} outbox messages...`);

            for (const msg of messages) {
                try {
                    // Already marked as PROCESSING by the raw query above
                    // await this.prisma.outboxMessage.update({ ... });

                    // Relay to Internal Event Emitter (Backward Compatibility for Phase 1)
                    this.logger.debug(`Relaying event ${msg.type} to local EventEmitter`);
                    // We reconstruct the basic event. Note: Typed events might lose prototype methods if not carefully reconstructed.
                    // For now, we emit the payload as the event object, or reconstruction logic is needed.
                    // Ideally, external consumers use the payload directly.
                    // Internal consumers might expect a specific class instance.
                    this.eventEmitter.emit(msg.type, msg.payload);

                    // Also publish to Broker (Placeholder)
                    await this.publishToBroker(msg);

                    // Mark as PROCESSED
                    await this.prisma.outboxMessage.update({
                        where: { id: msg.id },
                        data: { status: OutboxStatus.PROCESSED },
                    });
                } catch (error) {
                    this.logger.error(`Failed to process message ${msg.id}: ${error.message}`);
                    await this.prisma.outboxMessage.update({
                        where: { id: msg.id },
                        data: {
                            status: OutboxStatus.FAILED,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    });
                }
            }
        } catch (error) {
            this.logger.error('Critical error in Outbox Relay loop', error);
        } finally {
            this.isProcessing = false;
        }
    }

    private async publishToBroker(msg: any) {
        // Placeholder for real broker logic
        this.logger.log(`[Bus] Published: ${msg.type} (Agg: ${msg.aggregateId})`);
        return Promise.resolve();
    }
}
