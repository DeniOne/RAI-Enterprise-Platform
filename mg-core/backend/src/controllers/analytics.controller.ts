import { Request, Response } from 'express';
import kpiService from '../services/kpi.service';

export class AnalyticsController {
    // GET /api/analytics/personal
    async getPersonalAnalytics(req: Request, res: Response): Promise<void> {
        try {
            // AuthGuard middleware ensures user exists
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const daily = await kpiService.calculateDailyStats();
            const weekly = await kpiService.calculateWeeklyStats();
            const monthly = await kpiService.calculateMonthlyStats();

            res.status(200).json({ success: true, data: { daily, weekly, monthly } });
        } catch (error) {
            console.error('Personal analytics error:', error);
            res.status(500).json({ success: false, error: { message: 'Internal server error' } });
        }
    }

    // GET /api/analytics/executive
    async getExecutiveAnalytics(req: Request, res: Response): Promise<void> {
        try {
            // Guard should ensure admin role; we just return aggregated stats
            const daily = await kpiService.calculateDailyStats();
            const weekly = await kpiService.calculateWeeklyStats();
            const monthly = await kpiService.calculateMonthlyStats();

            res.status(200).json({ success: true, data: { daily, weekly, monthly } });
        } catch (error) {
            console.error('Executive analytics error:', error);
            res.status(500).json({ success: false, error: { message: 'Internal server error' } });
        }
    }
}

export default new AnalyticsController();
