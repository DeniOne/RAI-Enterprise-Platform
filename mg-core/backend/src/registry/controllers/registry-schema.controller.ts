
import { Request, Response, NextFunction } from 'express';
import { registrySchemaService } from '../services/registry-schema.service';

export class RegistrySchemaController {
    async getSchema(req: Request, res: Response, next: NextFunction) {
        try {
            const { entityTypeUrn } = req.params;
            // Decoding URN
            const decodedUrn = decodeURIComponent(entityTypeUrn);
            const schema = await registrySchemaService.getSchema(decodedUrn);
            res.json(schema);
        } catch (error: any) {
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            } else {
                next(error);
            }
        }
    }
}

export const registrySchemaController = new RegistrySchemaController();
