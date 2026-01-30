/**
 * AI Ops Controller (Secure API)
 */

import { Request, Response } from 'express';
import { aiOpsService } from './ai-ops.service';
import { aiFeedbackService } from './ai-feedback.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { logger } from '../config/logger';

export class AIOpsController {

    /**
     * GET /api/ai-ops/:entityType/:id/analyze
     */
    analyze = async (req: Request, res: Response) => {
        const { entityType, id } = req.params;

        try {
            const result = await aiOpsService.analyzeEntity(entityType, id);
            return res.send(result);
        } catch (error: any) {
            logger.error(`[AIOpsController] Error analyzing ${entityType}/${id}`, error);
            if (error.message.includes('not found')) {
                return res.status(404).send({ error: error.message });
            }
            if (error.message.includes('Security')) {
                return res.status(403).send({ error: error.message });
            }
            return res.status(500).send({ error: 'Internal Server Error' });
        }
    }

    /**
     * POST /api/ai-ops/feedback
     * PHASE 4.5 - Submit user feedback on AI recommendation
     */
    submitFeedback = async (req: Request, res: Response) => {
        const userId = (req as any).user?.id; // from auth middleware
        const dto: SubmitFeedbackDto = req.body;

        if (!userId) {
            return res.status(401).send({ error: 'Unauthorized' });
        }

        try {
            const result = await aiFeedbackService.submitFeedback(userId, dto);
            return res.status(201).send(result);
        } catch (error: any) {
            logger.error(`[AIOpsController] Error submitting feedback`, error);

            // 409 Conflict - duplicate feedback
            if (error.status === 409 || error.message.includes('already submitted')) {
                return res.status(409).send({
                    error: 'You have already submitted feedback for this recommendation'
                });
            }

            // 422 Unprocessable Entity - ethics violation (PHASE 4.5)
            if (error.status === 422 || error.message.includes('Feedback should') || error.message.includes('professional')) {
                return res.status(422).send({ error: error.message });
            }

            // 400 Bad Request - validation error
            if (error.status === 400 || error.message.includes('validation')) {
                return res.status(400).send({ error: error.message });
            }

            return res.status(500).send({ error: 'Internal Server Error' });
        }
    }

    /**
     * GET /api/ai-ops/feedback/analytics
     * PHASE 4.5 - Get aggregated feedback analytics (internal only)
     */
    getAnalytics = async (req: Request, res: Response) => {
        try {
            const analytics = await aiFeedbackService.getAnalytics();
            return res.send(analytics);
        } catch (error: any) {
            logger.error(`[AIOpsController] Error getting analytics`, error);
            return res.status(500).send({ error: 'Internal Server Error' });
        }
    }
}

export const aiOpsController = new AIOpsController();

