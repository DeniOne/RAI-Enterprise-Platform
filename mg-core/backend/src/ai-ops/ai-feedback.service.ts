/**
 * PHASE 4.5 - AI Feedback Loop
 * Service: AI Feedback Management
 * 
 * Canon: Feedback ≠ Control, Feedback ≠ Learning
 * Purpose: Collect user feedback on AI recommendations (read-only, immutable)
 */

import { PrismaClient } from '@prisma/client';
import { SubmitFeedbackDto, FeedbackType } from './dto/submit-feedback.dto';
import { FeedbackResponseDto } from './dto/feedback-response.dto';
import { feedbackEthicsGuard } from './feedback-ethics.guard';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

// Custom error classes for Express
export class ConflictException extends Error {
    status = 409;
    constructor(message: string) {
        super(message);
        this.name = 'ConflictException';
    }
}

export class UnprocessableEntityException extends Error {
    status = 422;
    constructor(message: string) {
        super(message);
        this.name = 'UnprocessableEntityException';
    }
}

export class AIFeedbackService {
    /**
     * Submit user feedback on AI recommendation
     * 
     * Idempotency: 1 feedback per user per recommendation
     * Ethics: No auto-learning, no control transfer
     */
    async submitFeedback(
        userId: string,
        dto: SubmitFeedbackDto
    ): Promise<FeedbackResponseDto> {
        // 1. Sanitize comment (trim whitespace)
        const sanitizedComment = dto.comment?.trim() || null;

        // 2. PHASE 4.5 - Ethics Guard validation
        if (sanitizedComment) {
            const ethicsResult = feedbackEthicsGuard.validate(sanitizedComment);
            if (!ethicsResult.valid) {
                logger.warn(
                    `[AIFeedbackService] Ethics violation: ${ethicsResult.violationType} - user ${userId}`
                );
                throw new UnprocessableEntityException(ethicsResult.reason || 'Ethics violation');
            }
        }

        // 3. Attempt to create feedback (idempotency via unique constraint)
        try {
            const feedback = await prisma.aIFeedback.create({
                data: {
                    userId,
                    recommendationId: dto.recommendationId,
                    feedbackType: dto.feedbackType as any, // Prisma enum mapping
                    comment: sanitizedComment,
                    // PHASE 4.5 - Context Binding (P45-PR-03)
                    basedOnSnapshotId: dto.basedOnSnapshotId || null,
                    aiVersion: dto.aiVersion || null,
                    ruleSetVersion: dto.ruleSetVersion || null,
                },
            });

            logger.info(
                `[AIFeedbackService] Feedback submitted: ${feedback.id} by user ${userId} on recommendation ${dto.recommendationId}`
            );

            return {
                id: feedback.id,
                recommendationId: feedback.recommendationId,
                feedbackType: feedback.feedbackType as FeedbackType,
                timestamp: feedback.timestamp.toISOString(),
            };
        } catch (error: any) {
            // Prisma P2002 = unique constraint violation (duplicate feedback)
            if (error.code === 'P2002') {
                logger.warn(
                    `[AIFeedbackService] Duplicate feedback attempt: user ${userId} on recommendation ${dto.recommendationId}`
                );
                throw new ConflictException(
                    'You have already submitted feedback for this recommendation'
                );
            }

            // Re-throw other errors
            logger.error('[AIFeedbackService] Error submitting feedback', error);
            throw error;
        }
    }

    /**
     * PHASE 4.5 - Get aggregated feedback analytics
     * 
     * Returns aggregated statistics WITHOUT user-level breakdown
     * For internal AI team use only
     */
    async getAnalytics(): Promise<any> {
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
            HELPFUL: allFeedback.filter((f: any) => f.feedbackType === 'HELPFUL').length,
            NOT_APPLICABLE: allFeedback.filter((f: any) => f.feedbackType === 'NOT_APPLICABLE').length,
            UNSURE: allFeedback.filter((f: any) => f.feedbackType === 'UNSURE').length,
        };

        // Calculate percentages
        const percentages = {
            helpful: total > 0 ? Math.round((byType.HELPFUL / total) * 100) : 0,
            notApplicable: total > 0 ? Math.round((byType.NOT_APPLICABLE / total) * 100) : 0,
            unsure: total > 0 ? Math.round((byType.UNSURE / total) * 100) : 0,
        };

        // Get period range
        const timestamps = allFeedback.map((f: any) => f.timestamp);
        const periodStart = timestamps.length > 0
            ? new Date(Math.min(...timestamps.map((t: Date) => t.getTime()))).toISOString()
            : new Date().toISOString();
        const periodEnd = timestamps.length > 0
            ? new Date(Math.max(...timestamps.map((t: Date) => t.getTime()))).toISOString()
            : new Date().toISOString();

        logger.info(`[AIFeedbackService] Analytics generated: ${total} total feedback entries`);

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

export const aiFeedbackService = new AIFeedbackService();
