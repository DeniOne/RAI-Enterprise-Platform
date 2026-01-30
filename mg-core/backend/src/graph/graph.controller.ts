/**
 * Graph Controller (Secure API)
 * 
 * Exposes GraphService via secure endpoint.
 */

import { Request, Response } from 'express';
import { graphService } from './graph.service';
import { logger } from '../config/logger';

export class GraphController {

    /**
     * GET /api/graph/:entityType/:id?view=xxx
     */
    getGraph = async (req: Request, res: Response) => {
        const { entityType, id } = req.params;
        const view = req.query.view as string;

        if (!view) {
            return res.status(400).send({ error: 'View parameter is required' });
        }

        try {
            const graph = graphService.getGraph(entityType, id, view);
            return res.send(graph);
        } catch (error: any) {
            logger.error(`[GraphController] Error fetching graph ${entityType}/${id}`, error);
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

export const graphController = new GraphController();
