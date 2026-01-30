import { Request, Response } from 'express';
import { adaptationService } from '../services/adaptation.service';

export class AdaptationController {
    async getMyStatus(req: Request, res: Response) {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const status = await adaptationService.getMyAdaptationStatus(userId);
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async create1on1(req: Request, res: Response) {
        try {
            const { employeeId, scheduledAt } = req.body;
            const managerId = req.headers['x-user-id'] as string;

            const session = await adaptationService.create1on1({
                managerId,
                employeeId,
                scheduledAt: new Date(scheduledAt)
            });
            res.status(201).json(session);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async complete1on1(req: Request, res: Response) {
        try {
            const { notes, actionItems, mood } = req.body;
            const { id } = req.params;

            const session = await adaptationService.complete1on1(id, notes, actionItems, mood);
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getTeamStatus(req: Request, res: Response) {
        try {
            const managerId = req.headers['x-user-id'] as string;
            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const status = await adaptationService.getTeamStatus(managerId);
            res.json(status);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const adaptationController = new AdaptationController();
