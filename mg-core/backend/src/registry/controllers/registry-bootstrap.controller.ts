import { Request, Response } from 'express';
import { registryBootstrapService } from '../services/registry-bootstrap.service';
import { logger } from '../../config/logger';

export class RegistryBootstrapController {

    async bootstrap(req: Request, res: Response): Promise<void> {
        // Double check admin role? Already handled by middleware in routes?
        // We will assume middleware handles auth.

        try {
            await registryBootstrapService.run();
            res.status(201).json({ message: 'Registry bootstrapped successfully.' });
        } catch (error: any) {
            if (error.message.includes('Registry is not empty')) {
                res.status(409).json({ error: 'Conflict', message: error.message });
            } else {
                logger.error('Bootstrap failed', error);
                res.status(500).json({ error: 'Internal Server Error', message: error.message });
            }
        }
    }
}

export const registryBootstrapController = new RegistryBootstrapController();
