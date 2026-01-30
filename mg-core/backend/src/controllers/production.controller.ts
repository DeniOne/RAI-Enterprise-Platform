/**
 * Production Controller
 * 
 * Read-only endpoints for production data from PSEE read-model.
 * NO business logic, NO SLA calculations here.
 */

import { Request, Response } from 'express';
import { getPseeReadModel } from '../psee/psee.service';
import { ProductionSessionDto, ProductionSessionsResponse, SlaLevel } from '../dto/production/production-session.dto';
import { SessionMetrics } from '../psee/read-model';
import { logger } from '../config/logger';

class ProductionController {
    /**
     * GET /api/production/sessions
     * Returns all production sessions from PSEE read-model.
     */
    async getSessions(req: Request, res: Response): Promise<void> {
        try {
            const readModel = getPseeReadModel();

            if (!readModel) {
                logger.warn('PSEE read-model not initialized');
                res.json({ data: [], total: 0 } as ProductionSessionsResponse);
                return;
            }

            const sessions = readModel.getAllSessions();
            const data = sessions.map(session => this.mapToDto(session));

            const response: ProductionSessionsResponse = {
                data,
                total: data.length,
            };

            res.json(response);
        } catch (error) {
            logger.error('Failed to get production sessions', { error });
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Map SessionMetrics to ProductionSessionDto.
     * Pure mapping, no business logic.
     */
    private mapToDto(session: SessionMetrics): ProductionSessionDto {
        const now = Date.now();
        const lastEventTime = session.lastEventAt.getTime();
        const timeInStatusSec = Math.floor((now - lastEventTime) / 1000);

        // Simple SLA level based on time in status
        // TODO: This should come from read-model, not calculated here
        let slaLevel: SlaLevel = 'OK';
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
    private extractRoleFromStatus(status: string): string {
        const roleMap: Record<string, string> = {
            'PENDING_PHOTOGRAPHER': 'Фотограф',
            'PENDING_RETOUCHER': 'Ретушёр',
            'PENDING_REVIEW': 'Менеджер',
            'APPROVED': 'Завершено',
            'REJECTED': 'Отклонено',
        };
        return roleMap[status] || status;
    }
}

export default new ProductionController();
