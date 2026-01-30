/**
 * Entity Card Controller
 * 
 * API endpoint for Entity Cards.
 * Read-only - no mutations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { entityCardService } from './entity-card.service';
import { logger } from '../config/logger';

const router = Router();

// =============================================================================
// GET /api/entity-cards/:entityType
// =============================================================================

router.get('/:entityType', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityType } = req.params;

        if (!entityCardService.hasCard(entityType)) {
            return res.status(404).json({
                error: 'NOT_FOUND',
                message: `Entity card not found: ${entityType}`
            });
        }

        const response = entityCardService.getCard(entityType);

        return res.json(response);

    } catch (error) {
        logger.error('[EntityCardController] Error getting card', { error });
        next(error);
    }
});

// =============================================================================
// GET /api/entity-cards
// =============================================================================

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { domain } = req.query;

        let response;
        if (domain && typeof domain === 'string') {
            response = entityCardService.getCardsByDomain(domain);
        } else {
            response = entityCardService.getAllCards();
        }

        return res.json(response);

    } catch (error) {
        logger.error('[EntityCardController] Error getting cards', { error });
        next(error);
    }
});

// =============================================================================
// GET /api/entity-cards/:entityType/validate
// =============================================================================

router.post('/:entityType/validate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityType } = req.params;
        const { operation = 'create', data, existingData } = req.body;

        if (!entityCardService.hasCard(entityType)) {
            return res.status(404).json({
                error: 'NOT_FOUND',
                message: `Entity card not found: ${entityType}`
            });
        }

        const result = entityCardService.validate(
            entityType,
            data || {},
            operation,
            existingData
        );

        return res.json(result);

    } catch (error) {
        logger.error('[EntityCardController] Error validating', { error });
        next(error);
    }
});

// =============================================================================
// GET /api/entity-cards/stats
// =============================================================================

router.get('/stats/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = entityCardService.getStats();
        return res.json(stats);
    } catch (error) {
        logger.error('[EntityCardController] Error getting stats', { error });
        next(error);
    }
});

export default router;
