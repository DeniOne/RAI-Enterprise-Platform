"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationHandler = exports.NotificationHandler = void 0;
const prisma_1 = require("../../config/prisma");
const logger_1 = require("../../config/logger");
const notification_service_1 = __importDefault(require("../../services/notification.service"));
class NotificationHandler {
    /**
     * Handle university events and send notifications
     *
     * Supports:
     * - COURSE_COMPLETED
     * - QUALIFICATION_PROPOSED
     */
    async handle(eventId, payload) {
        // 1. Idempotency Check
        const event = await prisma_1.prisma.event.findUnique({
            where: { id: eventId },
        });
        if (!event) {
            logger_1.logger.warn(`[NotificationHandler] Event ${eventId} not found in store`);
            return;
        }
        // Check if notification already sent (using metadata or separate tracking)
        const existingNotification = await prisma_1.prisma.notification.findFirst({
            where: {
                metadata: {
                    path: ['eventId'],
                    equals: eventId
                }
            }
        });
        if (existingNotification) {
            logger_1.logger.info(`[NotificationHandler] Notification already sent for event ${eventId}`);
            return;
        }
        logger_1.logger.info(`[NotificationHandler] Processing ${event.type} for event ${eventId}`);
        try {
            // 2. Route to appropriate notification method
            switch (event.type) {
                case 'COURSE_COMPLETED':
                    await this.handleCourseCompleted(eventId, payload);
                    break;
                case 'QUALIFICATION_PROPOSED':
                    await this.handleQualificationProposed(eventId, payload);
                    break;
                default:
                    logger_1.logger.warn(`[NotificationHandler] No handler for event type: ${event.type}`);
            }
            logger_1.logger.info(`[NotificationHandler] Finished processing ${event.type} ${eventId}`);
        }
        catch (error) {
            logger_1.logger.error(`[NotificationHandler] Error processing event ${eventId}`, { error });
            throw error;
        }
    }
    /**
     * Handle COURSE_COMPLETED event
     */
    async handleCourseCompleted(eventId, payload) {
        await notification_service_1.default.sendCourseCompletedNotification(payload.user_id, {
            course_id: payload.course_id,
            recognition_mc: payload.recognition_mc
        });
        logger_1.logger.info(`[NotificationHandler] Sent COURSE_COMPLETED notification for user ${payload.user_id}`);
    }
    /**
     * Handle QUALIFICATION_PROPOSED event
     *
     * CANON: This is triggered AFTER proposal creation,
     * NOT directly by PHOTOCOMPANY_RESULT
     */
    async handleQualificationProposed(eventId, payload) {
        await notification_service_1.default.sendQualificationProposedNotification(payload.user_id, {
            new_grade: payload.new_grade,
            proposal_id: payload.proposal_id
        });
        logger_1.logger.info(`[NotificationHandler] Sent QUALIFICATION_PROPOSED notification for user ${payload.user_id}`);
    }
}
exports.NotificationHandler = NotificationHandler;
exports.notificationHandler = new NotificationHandler();
