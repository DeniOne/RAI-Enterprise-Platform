import { Request, Response } from 'express';
import { registryRelationshipService } from '../services/registry-relationship.service';
import { registryMutationService } from '../services/registry-mutation.service';
import { logger } from '../../config/logger';

export class RegistryRelationshipController {

    async create(req: Request, res: Response): Promise<void> {
        try {
            const result = await registryMutationService.createRelationship(req.body);

            if (result.meta?.override_applied) {
                res.status(200).json(result);
            } else {
                res.status(201).json(result.data);
            }
        } catch (error: any) {
            if (error.message.includes('Cycle detected') || error.message.includes('Cardinality violation') || error.message.includes('already has') || error.message.includes('blocked by Impact Analysis')) {
                res.status(409).json({ error: 'Conflict', message: error.message });
            } else if (error.message.includes('not found') || error.message.includes('does not match')) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
            } else {
                logger.error('Create relationship failed', error);
                res.status(500).json({ error: 'Internal Server Error', message: error.message });
            }
        }
    }

    async list(req: Request, res: Response): Promise<void> {
        try {
            const { definition_urn, from_urn, to_urn } = req.query;
            const relationships = await registryRelationshipService.getRelationships(
                definition_urn as string,
                from_urn as string,
                to_urn as string
            );
            res.json(relationships);
        } catch (error: any) {
            logger.error('List relationships failed', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
}

export const registryRelationshipController = new RegistryRelationshipController();
