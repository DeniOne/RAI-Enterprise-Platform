"use strict";
/**
 * PHASE 4.5 - AI Feedback Loop
 * Service: AI Feedback Management
 *
 * Canon: Feedback ≠ Control, Feedback ≠ Learning
 * Purpose: Collect user feedback on AI recommendations (read-only, immutable)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiFeedbackService = exports.AIFeedbackService = exports.UnprocessableEntityException = exports.ConflictException = void 0;
const client_1 = require("@prisma/client");
const feedback_ethics_guard_1 = require("./feedback-ethics.guard");
const logger_1 = require("../config/logger");
const prisma = new client_1.PrismaClient();
// Custom error classes for Express
class ConflictException extends Error {
    status = 409;
    constructor(message) {
        super(message);
        this.name = 'ConflictException';
    }
}
exports.ConflictException = ConflictException;
class UnprocessableEntityException extends Error {
    status = 422;
    constructor(message) {
        super(message);
        this.name = 'UnprocessableEntityException';
    }
}
exports.UnprocessableEntityException = UnprocessableEntityException;
class AIFeedbackService {
    /**
     * Submit user feedback on AI recommendation
     *
     * Idempotency: 1 feedback per user per recommendation
     * Ethics: No auto-learning, no control transfer
     */
    async submitFeedback(userId, dto) {
        // 1. Sanitize comment (trim whitespace)
        const sanitizedComment = dto.comment?.trim() || null;
        // 2. PHASE 4.5 - Ethics Guard validation
        if (sanitizedComment) {
            const ethicsResult = feedback_ethics_guard_1.feedbackEthicsGuard.validate(sanitizedComment);
            if (!ethicsResult.valid) {
                logger_1.logger.warn(`[AIFeedbackService] Ethics violation: ${ethicsResult.violationType} - user ${userId}`);
                throw new UnprocessableEntityException(ethicsResult.reason || 'Ethics violation');
            }
        }
        // 3. Attempt to create feedback (idempotency via unique constraint)
        try {
            const feedback = await prisma.aIFeedback.create({
                data: {
                    userId,
                    recommendationId: dto.recommendationId,
                    feedbackType: dto.feedbackType, // Prisma enum mapping
                    comment: sanitizedComment,
                    // PHASE 4.5 - Context Binding (P45-PR-03)
                    basedOnSnapshotId: dto.basedOnSnapshotId || null,
                    aiVersion: dto.aiVersion || null,
                    ruleSetVersion: dto.ruleSetVersion || null,
                },
            });
            logger_1.logger.info(`[AIFeedbackService] Feedback submitted: ${feedback.id} by user ${userId} on recommendation ${dto.recommendationId}`);
            return {
                id: feedback.id,
                recommendationId: feedback.recommendationId,
                feedbackType: feedback.feedbackType,
                timestamp: feedback.timestamp.toISOString(),
            };
        }
        catch (error) {
            // Prisma P2002 = unique constraint violation (duplicate feedback)
            if (error.code === 'P2002') {
                logger_1.logger.warn(`[AIFeedbackService] Duplicate feedback attempt: user ${userId} on recommendation ${dto.recommendationId}`);
                throw new ConflictException('You have already submitted feedback for this recommendation');
            }
            // Re-throw other errors
            logger_1.logger.error('[AIFeedbackService] Error submitting feedback', error);
            throw error;
        }
    }
    /**
     * PHASE 4.5 - Get aggregated feedback analytics
     *
     * Returns aggregated statistics WITHOUT user-level breakdown
     * For internal AI team use only
     */
    async getAnalytics() {
        // Get all feedback (no user filtering - aggregated only)
        const allFeedback = await prisma.aIFeedback.findMany({
            select: {
                feedbackType: true,
                timestamp: true,
                // Explicitly exclude userId and comment for privacy
            },
        });
        const total = allFeedback.length;
        // Count by type
        const byType = {
            HELPFUL: allFeedback.filter((f) => f.feedbackType === 'HELPFUL').length,
            NOT_APPLICABLE: allFeedback.filter((f) => f.feedbackType === 'NOT_APPLICABLE').length,
            UNSURE: allFeedback.filter((f) => f.feedbackType === 'UNSURE').length,
        };
        // Calculate percentages
        const percentages = {
            helpful: total > 0 ? Math.round((byType.HELPFUL / total) * 100) : 0,
            notApplicable: total > 0 ? Math.round((byType.NOT_APPLICABLE / total) * 100) : 0,
            unsure: total > 0 ? Math.round((byType.UNSURE / total) * 100) : 0,
        };
        // Get period range
        const timestamps = allFeedback.map((f) => f.timestamp);
        const periodStart = timestamps.length > 0
            ? new Date(Math.min(...timestamps.map((t) => t.getTime()))).toISOString()
            : new Date().toISOString();
        const periodEnd = timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((t) => t.getTime()))).toISOString()
            : new Date().toISOString();
        logger_1.logger.info(`[AIFeedbackService] Analytics generated: ${total} total feedback entries`);
        return {
            totalFeedback: total,
            byType,
            percentages,
            periodStart,
            periodEnd,
            generatedAt: new Date().toISOString(),
        };
    }
}
exports.AIFeedbackService = AIFeedbackService;
exports.aiFeedbackService = new AIFeedbackService();
