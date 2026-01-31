"use strict";
/**
 * Production Controller
 *
 * Read-only endpoints for production data from PSEE read-model.
 * NO business logic, NO SLA calculations here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const psee_service_1 = require("@/core/flow/psee/psee.service");
const logger_1 = require("@/config/logger");
class ProductionController {
    /**
     * GET /api/production/sessions
     * Returns all production sessions from PSEE read-model.
     */
    async getSessions(req, res) {
        try {
            const readModel = (0, psee_service_1.getPseeReadModel)();
            if (!readModel) {
                logger_1.logger.warn('PSEE read-model not initialized');
                res.json({ data: [], total: 0 });
                return;
            }
            const sessions = readModel.getAllSessions();
            const data = sessions.map(session => this.mapToDto(session));
            const response = {
                data,
                total: data.length,
            };
            res.json(response);
        }
        catch (error) {
            logger_1.logger.error('Failed to get production sessions', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Map SessionMetrics to ProductionSessionDto.
     * Pure mapping, no business logic.
     */
    mapToDto(session) {
        const now = Date.now();
        const lastEventTime = session.lastEventAt.getTime();
        const timeInStatusSec = Math.floor((now - lastEventTime) / 1000);
        // Simple SLA level based on time in status
        // TODO: This should come from read-model, not calculated here
        let slaLevel = 'OK';
        if (timeInStatusSec > 3600) { // > 1 hour
            slaLevel = 'WARNING';
        }
        if (timeInStatusSec > 7200) { // > 2 hours
            slaLevel = 'BREACH';
        }
        // Extract role from status (simplified for v1)
        const role = this.extractRoleFromStatus(session.currentStatus);
        return {
            id: session.sessionId,
            status: session.currentStatus,
            role,
            assignedUser: undefined, // Not available in current read-model
            timeInStatusSec,
            slaLevel,
            createdAt: session.createdAt.toISOString(),
            lastEventAt: session.lastEventAt.toISOString(),
        };
    }
    /**
     * Extract role from status string.
     * Simplified mapping for v1.
     */
    extractRoleFromStatus(status) {
        const roleMap = {
            'PENDING_PHOTOGRAPHER': 'Фотограф',
            'PENDING_RETOUCHER': 'Ретушёр',
            'PENDING_REVIEW': 'Менеджер',
            'APPROVED': 'Завершено',
            'REJECTED': 'Отклонено',
        };
        return roleMap[status] || status;
    }
}
exports.default = new ProductionController();
