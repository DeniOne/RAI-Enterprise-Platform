"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationController = exports.FoundationController = void 0;
const foundation_service_1 = require("@/core/flow/foundation.service");
const logger_1 = require("../config/logger");
class FoundationController {
    /**
     * GET /api/foundation/status
     */
    async getStatus(req, res) {
        try {
            const userId = req.user.id;
            const state = await foundation_service_1.foundationService.getImmersionState(userId);
            logger_1.logger.info('Foundation status requested', { userId, status: state.status, blocksCount: state.blocks.length });
            res.json(state);
        }
        catch (error) {
            logger_1.logger.error('Failed to get foundation status', { error: error.message });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    /**
     * POST /api/foundation/block-viewed
     */
    async markBlockViewed(req, res) {
        try {
            const userId = req.user.id;
            const { blockId } = req.body;
            if (!blockId) {
                return res.status(400).json({ error: 'blockId is required' });
            }
            await foundation_service_1.foundationService.registerBlockView(userId, blockId);
            res.json({ success: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to mark block as viewed', { error: error.message });
            res.status(400).json({ error: error.message });
        }
    }
    /**
     * POST /api/foundation/decision
     */
    async submitDecision(req, res) {
        try {
            const userId = req.user.id;
            const { decision } = req.body;
            if (!decision || !['ACCEPT', 'DECLINE'].includes(decision)) {
                return res.status(400).json({ error: 'Valid decision (ACCEPT/DECLINE) is required' });
            }
            const result = await foundation_service_1.foundationService.submitDecision(userId, decision, req.get('User-Agent') || 'WEB_API');
            res.json(result);
        }
        catch (error) {
            logger_1.logger.error('Failed to submit foundation decision', { error: error.message, userId: req.user?.id });
            // Handle specific guard errors with 403 or 400
            if (error.message.includes('FOUNDATION_REQUIRED')) {
                return res.status(403).json({ error: error.message });
            }
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
exports.FoundationController = FoundationController;
exports.foundationController = new FoundationController();
