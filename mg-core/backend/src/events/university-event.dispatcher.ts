/**
 * University Event Dispatcher
 * Module 13: Corporate University
 * 
 * Routes events from Event Store to specific University Handlers.
 * Implements idempotency via processed_at check.
 */

import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { EventType } from '../types/core/event.types';
import { courseCompletedHandler } from './university/course-completed.handler';
import { photoCompanyResultHandler } from './university/photocompany-result.handler';
import { notificationHandler } from './university/notification.handler';

export class UniversityEventDispatcher {
    private isProcessing = false;

    /**
     * Dispatch all pending (unprocessed) university events.
     * CAN be called manually or scheduled.
     */
    async dispatchPending() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            // 1. Fetch unprocessed university events
            const pendingEvents = await prisma.event.findMany({
                where: {
                    processed_at: null,
                    type: {
                        in: ['COURSE_COMPLETED', 'PHOTOCOMPANY_RESULT', 'QUALIFICATION_PROPOSED']
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any,
                orderBy: { timestamp: 'asc' },
                take: 50 // Batch processing
            });

            if (pendingEvents.length === 0) {
                this.isProcessing = false;
                return;
            }

            logger.info(`[EventFlow] Dispatching ${pendingEvents.length} pending university events`);

            // 2. Route to handlers
            for (const event of pendingEvents) {
                try {
                    await this.routeEvent(event);
                } catch (error) {
                    logger.error(`[EventFlow] Failed to process event ${event.id}`, { error });
                    // Continue to next event even if one fails
                }
            }

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Route single event to its handler
     */
    private async routeEvent(event: any) {
        const type = event.type as EventType;
        const payload = event.payload as any;

        switch (type) {
            case 'COURSE_COMPLETED':
                await courseCompletedHandler.handle(event.id, payload);
                await notificationHandler.handle(event.id, payload);
                break;
            case 'PHOTOCOMPANY_RESULT':
                await photoCompanyResultHandler.handle(event.id, payload);
                break;
            case 'QUALIFICATION_PROPOSED':
                await notificationHandler.handle(event.id, payload);
                break;
            default:
                logger.warn(`[EventFlow] No handler for event type: ${type}`);
        }
    }

    /**
     * Background worker - simple polling loop
     */
    startWorker(intervalMs: number = 10000) {
        logger.info(`[EventFlow] Starting University Event Worker (interval: ${intervalMs}ms)`);
        setInterval(() => {
            this.dispatchPending().catch(err => logger.error('[EventFlow] Worker error', { err }));
        }, intervalMs);
    }
}

export const universityEventDispatcher = new UniversityEventDispatcher();
