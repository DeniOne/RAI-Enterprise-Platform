"use strict";
/**
 * University Event Dispatcher
 * Module 13: Corporate University
 *
 * Routes events from Event Store to specific University Handlers.
 * Implements idempotency via processed_at check.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.universityEventDispatcher = exports.UniversityEventDispatcher = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
const course_completed_handler_1 = require("./university/course-completed.handler");
const photocompany_result_handler_1 = require("./university/photocompany-result.handler");
const notification_handler_1 = require("./university/notification.handler");
class UniversityEventDispatcher {
    isProcessing = false;
    /**
     * Dispatch all pending (unprocessed) university events.
     * CAN be called manually or scheduled.
     */
    async dispatchPending() {
        if (this.isProcessing)
            return;
        this.isProcessing = true;
        try {
            // 1. Fetch unprocessed university events
            const pendingEvents = await prisma_1.prisma.event.findMany({
                where: {
                    processed_at: null,
                    type: {
                        in: ['COURSE_COMPLETED', 'PHOTOCOMPANY_RESULT', 'QUALIFICATION_PROPOSED']
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                },
                orderBy: { timestamp: 'asc' },
                take: 50 // Batch processing
            });
            if (pendingEvents.length === 0) {
                this.isProcessing = false;
                return;
            }
            logger_1.logger.info(`[EventFlow] Dispatching ${pendingEvents.length} pending university events`);
            // 2. Route to handlers
            for (const event of pendingEvents) {
                try {
                    await this.routeEvent(event);
                }
                catch (error) {
                    logger_1.logger.error(`[EventFlow] Failed to process event ${event.id}`, { error });
                    // Continue to next event even if one fails
                }
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    /**
     * Route single event to its handler
     */
    async routeEvent(event) {
        const type = event.type;
        const payload = event.payload;
        switch (type) {
            case 'COURSE_COMPLETED':
                await course_completed_handler_1.courseCompletedHandler.handle(event.id, payload);
                await notification_handler_1.notificationHandler.handle(event.id, payload);
                break;
            case 'PHOTOCOMPANY_RESULT':
                await photocompany_result_handler_1.photoCompanyResultHandler.handle(event.id, payload);
                break;
            case 'QUALIFICATION_PROPOSED':
                await notification_handler_1.notificationHandler.handle(event.id, payload);
                break;
            default:
                logger_1.logger.warn(`[EventFlow] No handler for event type: ${type}`);
        }
    }
    /**
     * Background worker - simple polling loop
     */
    startWorker(intervalMs = 10000) {
        logger_1.logger.info(`[EventFlow] Starting University Event Worker (interval: ${intervalMs}ms)`);
        setInterval(() => {
            this.dispatchPending().catch(err => logger_1.logger.error('[EventFlow] Worker error', { err }));
        }, intervalMs);
    }
}
exports.UniversityEventDispatcher = UniversityEventDispatcher;
exports.universityEventDispatcher = new UniversityEventDispatcher();
