"use strict";
/**
 * Entity Card Controller
 *
 * API endpoint for Entity Cards.
 * Read-only - no mutations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const entity_card_service_1 = require("./entity-card.service");
const logger_1 = require("../config/logger");
const router = (0, express_1.Router)();
// =============================================================================
// GET /api/entity-cards/:entityType
// =============================================================================
router.get('/:entityType', async (req, res, next) => {
    try {
        const { entityType } = req.params;
        if (!entity_card_service_1.entityCardService.hasCard(entityType)) {
            return res.status(404).json({
                error: 'NOT_FOUND',
                message: `Entity card not found: ${entityType}`
            });
        }
        const response = entity_card_service_1.entityCardService.getCard(entityType);
        return res.json(response);
    }
    catch (error) {
        logger_1.logger.error('[EntityCardController] Error getting card', { error });
        next(error);
    }
});
// =============================================================================
// GET /api/entity-cards
// =============================================================================
router.get('/', async (req, res, next) => {
    try {
        const { domain } = req.query;
        let response;
        if (domain && typeof domain === 'string') {
            response = entity_card_service_1.entityCardService.getCardsByDomain(domain);
        }
        else {
            response = entity_card_service_1.entityCardService.getAllCards();
        }
        return res.json(response);
    }
    catch (error) {
        logger_1.logger.error('[EntityCardController] Error getting cards', { error });
        next(error);
    }
});
// =============================================================================
// GET /api/entity-cards/:entityType/validate
// =============================================================================
router.post('/:entityType/validate', async (req, res, next) => {
    try {
        const { entityType } = req.params;
        const { operation = 'create', data, existingData } = req.body;
        if (!entity_card_service_1.entityCardService.hasCard(entityType)) {
            return res.status(404).json({
                error: 'NOT_FOUND',
                message: `Entity card not found: ${entityType}`
            });
        }
        const result = entity_card_service_1.entityCardService.validate(entityType, data || {}, operation, existingData);
        return res.json(result);
    }
    catch (error) {
        logger_1.logger.error('[EntityCardController] Error validating', { error });
        next(error);
    }
});
// =============================================================================
// GET /api/entity-cards/stats
// =============================================================================
router.get('/stats/summary', async (req, res, next) => {
    try {
        const stats = entity_card_service_1.entityCardService.getStats();
        return res.json(stats);
    }
    catch (error) {
        logger_1.logger.error('[EntityCardController] Error getting stats', { error });
        next(error);
    }
});
exports.default = router;
