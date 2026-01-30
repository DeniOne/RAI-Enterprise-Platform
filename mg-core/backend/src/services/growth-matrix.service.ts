/**
 * Growth Matrix Service (READ-ONLY AGGREGATOR)
 * 
 * CRITICAL RULE: This service ONLY aggregates data. 
 * It DOES NOT calculate KPIs or write to any database tables.
 */

import { prisma } from '../config/prisma';
import { mesService } from '../mes/services/mes.service';

export interface GrowthPulse {
    axis: string;
    value: number; // 0-100 normalized score
    fullMark: number;
}

export class GrowthMatrixService {
    /**
     * Aggregates normalized scores for the 5-6 growth axes.
     * Values are for the user to see THEIR OWN progress.
     */
    async getGrowthPulse(userId: string): Promise<GrowthPulse[]> {
        // 1. Competencies (Corporate University)
        const courses = await prisma.enrollment.findMany({
            where: { user_id: userId }
        });
        const completedCourses = courses.filter(c => c.status === 'COMPLETED').length;
        const competencyScore = courses.length > 0 ? (completedCourses / courses.length) * 100 : 0;

        // 2. Earnings (Production MES - READ ONLY) 
        const monthlyEarnings = await mesService.getMonthlyEarnings(userId);
        const monthlyTarget = 50000; // Example target for normalization
        const earningsScore = Math.min((monthlyEarnings / monthlyTarget) * 100, 100);

        // 3. Status (Gamification)
        const gamification = await prisma.userGamificationStatus.findFirst({
            where: { user_id: userId },
            include: { status: true },
            orderBy: { status: { level: 'desc' } }
        });
        const statusScore = gamification ? (gamification.status.level / 5) * 100 : 20;

        // 4. Activity (Task Execution)
        const tasks = await prisma.task.findMany({
            where: { assignee_id: userId }
        });
        const completedTasks = tasks.filter(t => t.status === 'DONE').length;
        const activityScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

        // 5. MC Capital (Current Wallet)
        const wallet = await prisma.wallet.findUnique({
            where: { user_id: userId }
        });
        const mcBalance = wallet ? Number(wallet.mc_balance) : 0;
        const capitalScore = Math.min((mcBalance / 5000) * 100, 100); // 5000 MC as a soft-cap per level

        return [
            { axis: 'Качество', value: Math.round(activityScore), fullMark: 100 },
            { axis: 'Скорость', value: Math.round(earningsScore), fullMark: 100 },
            { axis: 'Продажи', value: Math.round(capitalScore), fullMark: 100 },
            { axis: 'Команда', value: Math.round(statusScore), fullMark: 100 }
        ];
    }
}

export const growthMatrixService = new GrowthMatrixService();
