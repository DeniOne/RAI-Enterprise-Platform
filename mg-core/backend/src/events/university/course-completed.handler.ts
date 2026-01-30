/**
 * Course Completed Event Handler
 * Module 13: Corporate University
 * 
 * CANON: Course completion triggers recognition and potential dashboard updates.
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import { ICourseCompletedPayload } from '../../types/core/event.types';

export class CourseCompletedHandler {
    /**
     * Handle COURSE_COMPLETED event
     */
    async handle(eventId: string, payload: ICourseCompletedPayload) {
        // 1. Idempotency Check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            logger.warn(`[EventFlow] Event ${eventId} not found in store`);
            return;
        }

        if (event.processed_at) {
            logger.info(`[EventFlow] Event ${eventId} already processed at ${event.processed_at}`);
            return;
        }

        logger.info(`[EventFlow] Processing COURSE_COMPLETED for user ${payload.user_id}, course ${payload.course_id}`);

        try {
            // SIDE EFFECT 1: Check if this was a prerequisite for something else
            // and potentially notify the user about new available courses.
            // (Wait for Component 4 for notifications)

            // SIDE EFFECT 2: Refresh University Dashboard cache if any
            // For now, we don't have a cache, but we could trigger a background job to re-calculate recommendations.

            logger.info(`[EventFlow] Course ${payload.course_id} completion processed for user ${payload.user_id}. Recognition: ${payload.recognition_mc} MC.`);

            // 2. Mark as processed
            await prisma.event.update({
                where: { id: eventId },
                data: {
                    processed_at: new Date(),
                },
            });

        } catch (error) {
            logger.error(`[EventFlow] Error processing COURSE_COMPLETED ${eventId}`, { error });
            throw error;
        }
    }
}

export const courseCompletedHandler = new CourseCompletedHandler();
