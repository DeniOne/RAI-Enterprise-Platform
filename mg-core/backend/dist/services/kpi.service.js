"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KpiService = void 0;
const startOfDay_1 = require("date-fns/startOfDay");
const startOfWeek_1 = require("date-fns/startOfWeek");
const startOfMonth_1 = require("date-fns/startOfMonth");
const endOfDay_1 = require("date-fns/endOfDay");
const endOfWeek_1 = require("date-fns/endOfWeek");
const endOfMonth_1 = require("date-fns/endOfMonth");
const prisma_1 = require("../config/prisma");
const analytics_registry_bridge_1 = require("./analytics-registry.bridge");
/**
 * Service responsible for calculating KPI statistics based on wallet transactions and task rewards.
 * The methods return simple aggregated numbers; they can be extended to return richer DTOs.
 */
class KpiService {
    /**
     * Calculate daily statistics for the current day.
     * Returns total transaction amount, total task rewards, and count of transactions.
     */
    async calculateDailyStats() {
        const now = new Date();
        const dayStart = (0, startOfDay_1.startOfDay)(now);
        const dayEnd = (0, endOfDay_1.endOfDay)(now);
        const [transactions, rewards] = await Promise.all([
            prisma_1.prisma.transaction.findMany({
                where: {
                    created_at: { gte: dayStart, lte: dayEnd },
                },
                select: { amount: true },
            }),
            prisma_1.prisma.task.findMany({
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
        const weekStart = (0, startOfWeek_1.startOfWeek)(now, { weekStartsOn: 1 }); // Monday
        const weekEnd = (0, endOfWeek_1.endOfWeek)(now, { weekStartsOn: 1 });
        const [transactions, rewards] = await Promise.all([
            prisma_1.prisma.transaction.findMany({
                where: { created_at: { gte: weekStart, lte: weekEnd } },
                select: { amount: true },
            }),
            prisma_1.prisma.task.findMany({
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
        const monthStart = (0, startOfMonth_1.startOfMonth)(now);
        const monthEnd = (0, endOfMonth_1.endOfMonth)(now);
        const [transactions, rewards] = await Promise.all([
            prisma_1.prisma.transaction.findMany({
                where: { created_at: { gte: monthStart, lte: monthEnd } },
                select: { amount: true },
            }),
            prisma_1.prisma.task.findMany({
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
    async getDepartmentPerformance(departmentId, period = 'monthly') {
        const now = new Date();
        const startDate = period === 'weekly' ? (0, startOfWeek_1.startOfWeek)(now, { weekStartsOn: 1 }) : (0, startOfMonth_1.startOfMonth)(now);
        const endDate = period === 'weekly' ? (0, endOfWeek_1.endOfWeek)(now, { weekStartsOn: 1 }) : (0, endOfMonth_1.endOfMonth)(now);
        // 1. Structural Resolution via Registry (Canonical)
        // We do NOT use departments.parent_id or path column.
        // We ask the Bridge: "Who is in this organization?"
        const scopeIds = await analytics_registry_bridge_1.analyticsRegistryBridge.getDepartmentSubtreeIds(departmentId);
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
        const records = await prisma_1.prisma.kPIRecord.findMany({
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
exports.KpiService = KpiService;
exports.default = new KpiService();
