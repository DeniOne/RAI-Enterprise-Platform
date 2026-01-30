import { Request, Response } from 'express';
import { managerToolsService } from '../services/manager-tools.service';

export class ManagerToolsController {
    /**
     * Submit Kaizen (Employee)
     */
    async submitKaizen(req: Request, res: Response) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const { text } = req.body;

            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }

            const kaizen = await managerToolsService.submitKaizen(userId, text);
            res.status(201).json(kaizen);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Review Kaizen (Manager only)
     */
    async reviewKaizen(req: Request, res: Response) {
        try {
            const managerId = req.headers['x-user-id'] as string;
            const { status, comment } = req.body;
            const { id } = req.params;

            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }

            const result = await managerToolsService.reviewKaizen(managerId, id, status, comment);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Get Kaizen Feed
     */
    async getKaizenFeed(req: Request, res: Response) {
        try {
            const { status } = req.query;
            const feed = await managerToolsService.getKaizenFeed(status as string);
            res.json(feed);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Team Happiness Report (Aggregated)
     */
    async getHappinessReport(req: Request, res: Response) {
        try {
            const managerId = req.headers['x-user-id'] as string;
            if (!managerId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const report = await managerToolsService.getTeamHappinessReport(managerId);
            res.json(report);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const managerToolsController = new ManagerToolsController();
