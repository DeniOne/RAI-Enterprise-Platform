/**
 * Economy Analytics Controller
 * PHASE 4 — Analytics, Observability & Governance
 * Refactored to Express (no NestJS)
 */

import { Request, Response } from 'express';
import { economyAnalyticsService } from '../services/analytics.service';
// @ts-ignore
import { Controller, UseGuards, Get, Req, Res } from '@nestjs/common';
// @ts-ignore
import { MVPLearningContourGuard } from '../../guards/mvp-learning-contour.guard';

// @ts-ignore
@Controller('api/economy/analytics')
// @ts-ignore
@UseGuards(MVPLearningContourGuard)
export class EconomyAnalyticsController {

    /**
     * GET /api/economy/analytics/overview
     * Глобальные показатели системы. Доступно ролям MANAGER, EXECUTIVE (ADMIN).
     */
    @Get('overview')
    async getOverview(@Req() req: Request, @Res() res: Response) {
        try {
            const role = req.headers['x-user-role'] as string;
            this.checkRole(role, ['ADMIN', 'HR_MANAGER', 'BRANCH_MANAGER'], res);
            if (res.headersSent) return;

            const overview = await economyAnalyticsService.getGlobalOverview();
            res.json(overview);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/economy/analytics/store
     * Статистика востребованности магазина. Доступно всем.
     */
    @Get('store')
    async getStoreActivity(@Req() req: Request, @Res() res: Response) {
        try {
            const activity = await economyAnalyticsService.getStoreActivity();
            res.json(activity);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/economy/analytics/wallet/my
     * Персональный тренд и баланс.
     */
    @Get('wallet/my')
    async getMyTrend(@Req() req: Request, @Res() res: Response) {
        try {
            const userId = req.headers['x-user-id'] as string;
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const trend = await economyAnalyticsService.getUserWalletTrend(userId);
            res.json(trend);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/economy/analytics/wallet/:userId
     * Просмотр аудита сотрудника. Доступно HEAD_OF_DEPT (DEPARTMENT_HEAD).
     */
    @Get('wallet/:userId')
    async getUserTrend(@Req() req: Request, @Res() res: Response) {
        try {
            const role = req.headers['x-user-role'] as string;
            this.checkRole(role, ['ADMIN', 'DEPARTMENT_HEAD'], res);
            if (res.headersSent) return;

            const targetUserId = req.params.userId;
            const trend = await economyAnalyticsService.getUserWalletTrend(targetUserId);
            res.json(trend);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * GET /api/economy/analytics/audit
     * Журнал аудита. Для админов - весь, для юзеров - свой.
     */
    @Get('audit')
    async getAudit(@Req() req: Request, @Res() res: Response) {
        try {
            const userId = req.headers['x-user-id'] as string;
            const role = req.headers['x-user-role'] as string;

            if (role === 'ADMIN') {
                const audit = await economyAnalyticsService.getAuditTrail();
                return res.json(audit);
            }
            if (!userId) {
                return res.status(400).json({ message: 'User-Id header missing' });
            }
            const audit = await economyAnalyticsService.getAuditTrail(userId);
            res.json(audit);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    /**
     * Helper for basic RBAC checks (Phase 4 Testing Mode)
     */
    private checkRole(role: string, allowedRoles: string[], res: Response): void {
        if (!role || !allowedRoles.includes(role)) {
            res.status(403).json({ message: `Access denied for role: ${role || 'anonymous'}` });
        }
    }
}

export const economyAnalyticsController = new EconomyAnalyticsController();
