/**
 * Impact Controller (Secure API)
 */

import { Request, Response } from 'express';
import { impactService } from './impact.service';
import { logger } from '../config/logger';

export class ImpactController {

    /**
     * GET /api/impact/:entityType/:id?view=xxx
     */
    getImpactReport = async (req: Request, res: Response) => {
        const { entityType, id } = req.params;
        const view = req.query.view as string;

        if (!view) {
            return res.status(400).send({ error: 'View parameter is required' });
        }

        try {
            const report = impactService.getImpactReport(entityType, id, view);
            return res.send(report);
        } catch (error: any) {
            logger.error(`[ImpactController] Error fetching impact ${entityType}/${id}`, error);
            if (error.message.includes('not found')) {
                return res.status(404).send({ error: error.message });
            }
            if (error.message.includes('Security Violation')) {
                return res.status(403).send({ error: error.message });
            }
            return res.status(500).send({ error: 'Internal Server Error' });
        }
    }
}

export const impactController = new ImpactController();
