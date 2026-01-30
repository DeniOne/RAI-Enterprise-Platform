import { Request, Response } from 'express';
import { growthMatrixService } from '../services/growth-matrix.service';

export class GrowthMatrixController {
    async getMyPulse(req: Request, res: Response) {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const pulse = await growthMatrixService.getGrowthPulse(userId);
            res.json(pulse);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const growthMatrixController = new GrowthMatrixController();
