/**
 * Notification Handler
 * Module 13: Corporate University
 * 
 * CANON:
 * - Regular event handler (same pattern as CourseCompletedHandler)
 * - Subscribes to COURSE_COMPLETED and QUALIFICATION_PROPOSED events
 * - Sends notifications via NotificationService
 * - Implements idempotency
 */

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';
import notificationService from '../../services/notification.service';
import { ICourseCompletedPayload } from '../../types/core/event.types';

export class NotificationHandler {
    /**
     * Handle university events and send notifications
     * 
     * Supports:
     * - COURSE_COMPLETED
     * - QUALIFICATION_PROPOSED
     */
    async handle(eventId: string, payload: any) {
        // 1. Idempotency Check
        const event = await prisma.event.findUnique({
            where: { id: eventId },
        });

        if (!event) {
            logger.warn(`[NotificationHandler] Event ${eventId} not found in store`);
            return;
        }

        // Check if notification already sent (using metadata or separate tracking)
        const existingNotification = await prisma.notification.findFirst({
            where: {
                metadata: {
                    path: ['eventId'],
                    equals: eventId
                }
            }
        });

        if (existingNotification) {
            logger.info(`[NotificationHandler] Notification already sent for event ${eventId}`);
            return;
        }

        logger.info(`[NotificationHandler] Processing ${event.type} for event ${eventId}`);

        try {
            // 2. Route to appropriate notification method
            switch (event.type) {
                case 'COURSE_COMPLETED':
                    await this.handleCourseCompleted(eventId, payload as ICourseCompletedPayload);
                    break;

                case 'QUALIFICATION_PROPOSED':
                    await this.handleQualificationProposed(eventId, payload);
                    break;

                default:
                    logger.warn(`[NotificationHandler] No handler for event type: ${event.type}`);
            }

            logger.info(`[NotificationHandler] Finished processing ${event.type} ${eventId}`);

        } catch (error) {
            logger.error(`[NotificationHandler] Error processing event ${eventId}`, { error });
            throw error;
        }
    }

    /**
     * Handle COURSE_COMPLETED event
     */
    private async handleCourseCompleted(eventId: string, payload: ICourseCompletedPayload) {
        await notificationService.sendCourseCompletedNotification(payload.user_id, {
            course_id: payload.course_id,
            recognition_mc: payload.recognition_mc
        });

        logger.info(`[NotificationHandler] Sent COURSE_COMPLETED notification for user ${payload.user_id}`);
    }

    /**
     * Handle QUALIFICATION_PROPOSED event
     * 
     * CANON: This is triggered AFTER proposal creation,
     * NOT directly by PHOTOCOMPANY_RESULT
     */
    private async handleQualificationProposed(eventId: string, payload: any) {
        await notificationService.sendQualificationProposedNotification(payload.user_id, {
            new_grade: payload.new_grade,
            proposal_id: payload.proposal_id
        });

        logger.info(`[NotificationHandler] Sent QUALIFICATION_PROPOSED notification for user ${payload.user_id}`);
    }
}

export const notificationHandler = new NotificationHandler();
