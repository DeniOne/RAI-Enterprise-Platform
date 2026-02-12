import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { UserContext } from "./consulting.service";

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(private readonly prisma: PrismaService) { }

    async calculatePlanKPI(planId: string, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: planId, companyId: context.companyId },
            include: {
                harvestResults: { take: 1 },
                activeBudgetPlan: true,
            }
        });

        if (!plan) {
            throw new NotFoundException('План не найден');
        }

        const result = plan.harvestResults[0];
        const budget = plan.activeBudgetPlan;

        if (!result) {
            return {
                hasData: false,
                message: 'Нет данных по урожаю',
                plannedYield: plan.optValue || 0, // Fallback to plan opt value
                actualYield: 0,
                yieldDelta: 0,
                totalPlannedCost: budget?.totalPlannedAmount || 0,
                totalActualCost: budget?.totalActualAmount || 0,
                costPerTon: 0,
                profitPerHectare: 0,
                roi: 0
            };
        }

        const plannedYield = result.plannedYield || plan.optValue || 0;
        const actualYield = result.actualYield || 0;
        const totalOutput = result.totalOutput || 0;
        const harvestedArea = result.harvestedArea || 1; // avoid div by zero

        // Use snapshot if available, fallback to live budget (Fix: Determinism)
        const totalActualCost = result.costSnapshot ?? budget?.totalActualAmount ?? 0;
        const totalPlannedCost = budget?.totalPlannedAmount || 0;
        const marketPrice = result.marketPrice || 0;

        // Formulas
        const yieldDelta = plannedYield > 0 ? ((actualYield - plannedYield) / plannedYield) * 100 : 0;
        const costPerTon = totalOutput > 0 ? totalActualCost / totalOutput : 0;

        const revenue = totalOutput * marketPrice;
        const profit = revenue - totalActualCost;
        const profitPerHectare = harvestedArea > 0 ? profit / harvestedArea : 0;
        const roi = totalActualCost > 0 ? (profit / totalActualCost) * 100 : 0;

        return {
            hasData: true,
            plannedYield,
            actualYield,
            yieldDelta,
            totalPlannedCost,
            totalActualCost,
            costPerTon,
            profitPerHectare,
            roi,
            revenue,
            profit,
            qualityClass: result.qualityClass,
            harvestDate: result.harvestDate,
        };
    }

    async calculateCompanyKPI(context: UserContext, seasonId: string) {
        const results = await this.prisma.harvestResult.findMany({
            where: { companyId: context.companyId, seasonId },
            include: { plan: { include: { activeBudgetPlan: true } } }
        });

        if (results.length === 0) return null;

        let totalRevenue = 0;
        let totalCost = 0;
        let totalOutput = 0;
        let totalPlannedCost = 0;

        for (const res of results) {
            const output = res.totalOutput || 0;
            const price = res.marketPrice || 0;
            totalRevenue += output * price;

            // Use snapshot with fallback
            totalCost += res.costSnapshot ?? res.plan.activeBudgetPlan?.totalActualAmount ?? 0;
            totalPlannedCost += res.plan.activeBudgetPlan?.totalPlannedAmount || 0;
            totalOutput += output;
        }

        const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;
        const profit = totalRevenue - totalCost;

        return {
            totalRevenue,
            totalCost,
            totalPlannedCost,
            totalOutput,
            profit,
            roi,
            planCount: results.length,
        };
    }
}
