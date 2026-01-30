import { Request, Response } from 'express';
import { foundationService } from '../services/foundation.service';
import { prisma } from '../config/prisma';
import { FOUNDATION_VERSION } from '../config/foundation.constants';
import { logger } from '../config/logger';

export class FoundationController {
    /**
     * GET /api/foundation/status
     */
    async getStatus(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const state = await foundationService.getImmersionState(userId);
            logger.info('Foundation status requested', { userId, status: state.status, blocksCount: state.blocks.length });
            res.json(state);
        } catch (error: any) {
            logger.error('Failed to get foundation status', { error: error.message });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    /**
     * POST /api/foundation/block-viewed
     */
    async markBlockViewed(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { blockId } = req.body;

            if (!blockId) {
                return res.status(400).json({ error: 'blockId is required' });
            }

            await foundationService.registerBlockView(userId, blockId);
            res.json({ success: true });
        } catch (error: any) {
            logger.error('Failed to mark block as viewed', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * POST /api/foundation/decision
     */
    async submitDecision(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { decision } = req.body;

            if (!decision || !['ACCEPT', 'DECLINE'].includes(decision)) {
                return res.status(400).json({ error: 'Valid decision (ACCEPT/DECLINE) is required' });
            }

            const result = await foundationService.submitDecision(
                userId,
                decision as 'ACCEPT' | 'DECLINE',
                req.get('User-Agent') || 'WEB_API'
            );

            res.json(result);
        } catch (error: any) {
            logger.error('Failed to submit foundation decision', { error: error.message, userId: (req as any).user?.id });

            // Handle specific guard errors with 403 or 400
            if (error.message.includes('FOUNDATION_REQUIRED')) {
                return res.status(403).json({ error: error.message });
            }

            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export const foundationController = new FoundationController();
