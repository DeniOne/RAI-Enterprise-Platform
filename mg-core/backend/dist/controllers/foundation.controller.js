"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationController = exports.FoundationController = void 0;
const foundation_service_1 = require("../services/foundation.service");
const prisma_1 = require("../config/prisma");
const foundation_constants_1 = require("../config/foundation.constants");
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
            // Create acceptance record
            await prisma_1.prisma.foundationAcceptance.upsert({
                where: { person_id: userId },
                create: {
                    person_id: userId,
                    decision: decision === 'ACCEPT' ? 'ACCEPTED' : 'NOT_ACCEPTED',
                    version: foundation_constants_1.FOUNDATION_VERSION,
                    accepted_at: new Date()
                },
                update: {
                    decision: decision === 'ACCEPT' ? 'ACCEPTED' : 'NOT_ACCEPTED',
                    version: foundation_constants_1.FOUNDATION_VERSION,
                    accepted_at: new Date()
                }
            });
            // Sync User status
            // @ts-ignore
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    // @ts-ignore
                    foundation_status: decision === 'ACCEPT' ? 'ACCEPTED' : 'IN_PROGRESS'
                }
            });
            // Audit log
            await prisma_1.prisma.foundationAuditLog.create({
                data: {
                    user_id: userId,
                    event_type: decision === 'ACCEPT' ? 'FOUNDATION_ACCEPTED' : 'FOUNDATION_DECLINED',
                    foundation_version: foundation_constants_1.FOUNDATION_VERSION,
                    timestamp: new Date(),
                    metadata: {
                        userAgent: req.get('User-Agent')
                    }
                }
            });
            res.json({ success: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to submit foundation decision', { error: error.message });
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
exports.FoundationController = FoundationController;
exports.foundationController = new FoundationController();
