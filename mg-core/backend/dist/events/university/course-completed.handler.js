"use strict";
/**
 * Course Completed Event Handler
 * Module 13: Corporate University
 *
 * CANON: Course completion triggers recognition and potential dashboard updates.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseCompletedHandler = exports.CourseCompletedHandler = void 0;
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../config/logger");
class CourseCompletedHandler {
    /**
     * Handle COURSE_COMPLETED event
     */
    async handle(eventId, payload) {
        // 1. Idempotency Check
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            logger_1.logger.warn(`[EventFlow] Event ${eventId} not found in store`);
            return;
        }
        if (event.processed_at) {
            logger_1.logger.info(`[EventFlow] Event ${eventId} already processed at ${event.processed_at}`);
            return;
        }
        logger_1.logger.info(`[EventFlow] Processing COURSE_COMPLETED for user ${payload.user_id}, course ${payload.course_id}`);
        try {
            // SIDE EFFECT 1: Check if this was a prerequisite for something else
            // and potentially notify the user about new available courses.
            // (Wait for Component 4 for notifications)
            // SIDE EFFECT 2: Refresh University Dashboard cache if any
            // For now, we don't have a cache, but we could trigger a background job to re-calculate recommendations.
            logger_1.logger.info(`[EventFlow] Course ${payload.course_id} completion processed for user ${payload.user_id}. Recognition: ${payload.recognition_mc} MC.`);
            // 2. Mark as processed
            await prisma_1.prisma.event.update({
                where: { id: eventId },
                data: {
                    processed_at: new Date(),
                },
            });
        }
        catch (error) {
            logger_1.logger.error(`[EventFlow] Error processing COURSE_COMPLETED ${eventId}`, { error });
            throw error;
        }
    }
}
exports.CourseCompletedHandler = CourseCompletedHandler;
exports.courseCompletedHandler = new CourseCompletedHandler();
