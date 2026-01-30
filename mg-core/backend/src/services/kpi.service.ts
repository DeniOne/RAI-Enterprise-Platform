import { startOfDay } from 'date-fns/startOfDay';
import { startOfWeek } from 'date-fns/startOfWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfDay } from 'date-fns/endOfDay';
import { endOfWeek } from 'date-fns/endOfWeek';
import { endOfMonth } from 'date-fns/endOfMonth';

import { prisma } from '../config/prisma';
import { analyticsRegistryBridge } from './analytics-registry.bridge';

/**
 * Service responsible for calculating KPI statistics based on wallet transactions and task rewards.
 * The methods return simple aggregated numbers; they can be extended to return richer DTOs.
 */
export class KpiService {
    /**
     * Calculate daily statistics for the current day.
     * Returns total transaction amount, total task rewards, and count of transactions.
     */
    async calculateDailyStats() {
        const now = new Date();
        const dayStart = startOfDay(now);
        const dayEnd = endOfDay(now);

        const [transactions, rewards] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    created_at: { gte: dayStart, lte: dayEnd },
                },
                select: { amount: true },
            }),
            prisma.task.findMany({
                where: {
                    created_at: { gte: dayStart, lte: dayEnd },
                    mc_reward: { not: null },
                },
                select: { mc_reward: true },
            }),
        ]);

        const totalTransaction = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalReward = rewards.reduce((sum, r) => sum + Number(r.mc_reward ?? 0), 0);

        return {
            period: 'daily',
            date: now.toISOString().split('T')[0],
            totalTransaction,
            totalReward,
            transactionCount: transactions.length,
        };
    }

    /**
     * Calculate weekly statistics for the current week (Monday‑Sunday).
     */
    async calculateWeeklyStats() {
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        const [transactions, rewards] = await Promise.all([
            prisma.transaction.findMany({
                where: { created_at: { gte: weekStart, lte: weekEnd } },
                select: { amount: true },
            }),
            prisma.task.findMany({
                where: { created_at: { gte: weekStart, lte: weekEnd }, mc_reward: { not: null } },
                select: { mc_reward: true },
            }),
        ]);

        const totalTransaction = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalReward = rewards.reduce((sum, r) => sum + Number(r.mc_reward ?? 0), 0);

        return {
            period: 'weekly',
            weekStart: weekStart.toISOString().split('T')[0],
            weekEnd: weekEnd.toISOString().split('T')[0],
            totalTransaction,
            totalReward,
            transactionCount: transactions.length,
        };
    }

    /**
     * Calculate monthly statistics for the current month.
     */
    async calculateMonthlyStats() {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const [transactions, rewards] = await Promise.all([
            prisma.transaction.findMany({
                where: { created_at: { gte: monthStart, lte: monthEnd } },
                select: { amount: true },
            }),
            prisma.task.findMany({
                where: { created_at: { gte: monthStart, lte: monthEnd }, mc_reward: { not: null } },
                select: { mc_reward: true },
            }),
        ]);

        const totalTransaction = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const totalReward = rewards.reduce((sum, r) => sum + Number(r.mc_reward ?? 0), 0);

        return {
            period: 'monthly',
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            totalTransaction,
            totalReward,
            transactionCount: transactions.length,
        };
    }

    /**
     * Get Department Performance (Registry Integrated)
     * Demonstrates Step 8: Analytics as Read-Only Registry Consumer.
     * 
     * Uses Analytics Registry Bridge to find the *true* structural scope (subtree)
     * of the department, then aggregates KPI records for that scope.
     */
    async getDepartmentPerformance(departmentId: string, period: 'weekly' | 'monthly' = 'monthly') {
        const now = new Date();
        const startDate = period === 'weekly' ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
        const endDate = period === 'weekly' ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

        // 1. Structural Resolution via Registry (Canonical)
        // We do NOT use departments.parent_id or path column.
        // We ask the Bridge: "Who is in this organization?"
        const scopeIds = await analyticsRegistryBridge.getDepartmentSubtreeIds(departmentId);

        if (scopeIds.length === 0) {
            return {
                departmentId,
                scopeSize: 0,
                totalKpiValue: 0,
                message: 'No structural trace found in Registry'
            };
        }

        // 2. Data Aggregation (Domain)
        // Now we query the domain facts (KPI Records) for these resolved IDs.
        // Assuming KPIRecord has department_id.
        const records = await prisma.kPIRecord.findMany({
            where: {
                department_id: { in: scopeIds },
                period_start: { gte: startDate },
                period_end: { lte: endDate }
            },
            select: { value: true }
        });

        const totalValue = records.reduce((sum, r) => sum + Number(r.value), 0);

        return {
            departmentId,
            period,
            scopeSize: scopeIds.length,
            scopeIds: scopeIds, // Audit/Explainability
            totalKpiValue: totalValue,
            registrySnapshotHash: 'current' // Placeholder, ideally fetched from Bridge
        };
    }
}

export default new KpiService();

