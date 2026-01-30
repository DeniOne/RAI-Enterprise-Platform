import { prisma } from '../../config/prisma';
import { ProductionOrderStatus, WorkOrderStatus, QualityResult } from '@prisma/client';
import { PRODUCT_RATES, QUALITY_MODIFIERS, SHIFT_CONFIG } from '../config/mes-rates';

export class MesService {
    /**
     * Helper to get explicit shift window for a given date (default today)
     */
    private getShiftWindow(date: Date = new Date()) {
        const start = new Date(date);
        start.setHours(SHIFT_CONFIG.START_HOUR, 0, 0, 0);

        const end = new Date(date);
        end.setHours(SHIFT_CONFIG.END_HOUR, 0, 0, 0);

        return { start, end };
    }

    /**
     * Get real-time shift progress for a specific employee
     */
    async getMyShiftProgress(userId: string) {
        const { start, end } = this.getShiftWindow();

        // 1. Fetch all production orders created within THIS shift window
        const orders = await prisma.productionOrder.findMany({
            where: {
                created_by_id: userId,
                created_at: { gte: start, lte: end }
            },
            include: {
                quality_checks: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        });

        // 2. Aggregate stats
        const createdCount = orders.length;
        const soldCount = orders.filter(o => o.status === ProductionOrderStatus.COMPLETED).length;

        // 3. Calculate Earnings (Deterministic Logic)
        let totalEarnings = 0;
        for (const order of orders) {
            const rates = PRODUCT_RATES[order.product_type] || PRODUCT_RATES['DEFAULT'];
            let orderEarnings = rates.baseRate;

            // Add sale bonus if completed
            if (order.status === ProductionOrderStatus.COMPLETED) {
                orderEarnings += (rates.saleBonus || 0);
            }

            // Apply Quality Modifier (latest check)
            const latestCheck = order.quality_checks[0];
            if (latestCheck && latestCheck.result === QualityResult.FAIL) {
                orderEarnings *= QUALITY_MODIFIERS.FAIL;
            }

            totalEarnings += orderEarnings;
        }

        // 4. Get active work orders (pending retouching)
        const activeWorkOrdersCount = await prisma.workOrder.count({
            where: {
                assigned_to_id: userId,
                status: WorkOrderStatus.IN_PROGRESS
            }
        });

        // 5. Calculate Conversion
        const conversion = createdCount > 0 ? Math.round((soldCount / createdCount) * 100) : 0;

        return {
            employeeId: userId,
            shiftStart: start.toISOString(),
            shiftEnd: end.toISOString(),
            companiesCreated: createdCount,
            companiesSold: soldCount,
            activeTasks: activeWorkOrdersCount,
            conversion,
            forecastEarnings: totalEarnings
        };
    }

    /**
     * Get detailed earnings forecast
     */
    async getEarningsForecast(userId: string) {
        const progress = await this.getMyShiftProgress(userId);

        // Standard base salary (static for now, could move to config if needed)
        const baseSalary = 2500;

        return {
            employeeId: userId,
            shiftWindow: { start: progress.shiftStart, end: progress.shiftEnd },
            baseSalary,
            bonusPool: progress.forecastEarnings,
            totalProjected: baseSalary + progress.forecastEarnings,
            breakdown: {
                createdCount: progress.companiesCreated,
                soldCount: progress.companiesSold,
                // Note: accurate rate display in UI would need per-product breakdown
                message: "Calculated based on canonical PRODUCT_RATES and latest QualityChecks"
            }
        };
    }

    /**
     * Get aggregated earnings for the current month (for Growth Matrix)
     * READ-ONLY aggregation.
     */
    async getMonthlyEarnings(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const orders = await prisma.productionOrder.findMany({
            where: {
                created_by_id: userId,
                created_at: { gte: startOfMonth },
                status: ProductionOrderStatus.COMPLETED // Only completed count for monthly progress
            },
            include: {
                quality_checks: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        });

        let total = 0;
        for (const order of orders) {
            const rates = PRODUCT_RATES[order.product_type] || PRODUCT_RATES['DEFAULT'];
            let orderEarnings = rates.baseRate + (rates.saleBonus || 0);

            const latestCheck = order.quality_checks[0];
            if (latestCheck && latestCheck.result === QualityResult.FAIL) {
                orderEarnings *= QUALITY_MODIFIERS.FAIL;
            }
            total += orderEarnings;
        }

        return total;
    }
}

export const mesService = new MesService();
