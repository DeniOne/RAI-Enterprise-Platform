import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { UserContext } from "./consulting.service";
import { HarvestResultRepository } from "./repositories/harvest-result.repository";

@Injectable()
export class KpiService {
    private readonly logger = new Logger(KpiService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly repository: HarvestResultRepository
    ) { }

    private d(val: any): Prisma.Decimal {
        return new Prisma.Decimal(val || 0);
    }

    /**
     * РАССЧЕТ KPI КАК ЧИСТОЙ ПРОЕКЦИИ ЦИФРОВОГО СЛЕДА (LEDGER).
     * Использует Prisma.Decimal для финансовой точности (Decimal.js).
     */
    async calculatePlanKPI(planId: string, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: planId, companyId: context.companyId },
            include: { activeBudgetPlan: true }
        });

        if (!plan) {
            throw new NotFoundException('План уборки не найден');
        }

        const result = await this.repository.findByPlanId(planId, context.companyId);
        const budget = plan.activeBudgetPlan;

        // 1. Извлекаем фактические затраты НАПРЯМУЮ из Леджера (Source of Truth)
        const ledgerSummary = await this.prisma.ledgerEntry.aggregate({
            where: {
                companyId: context.companyId,
                execution: { budgetPlanId: budget?.id || 'NO_BUDGET' }
            },
            _sum: { amount: true }
        });

        const totalActualCost = ledgerSummary._sum.amount ? this.d(ledgerSummary._sum.amount) : this.d(result?.costSnapshot);
        const totalPlannedCost = this.d(budget?.totalPlannedAmount);

        // 2. Доходная часть (Revenue)
        const totalOutput = this.d(result?.totalOutput);
        const marketPrice = this.d(result?.marketPrice);
        const revenue = totalOutput.mul(marketPrice);

        // 3. EBITDA (Revenue - OPEX/ActualCost)
        const ebitda = revenue.minus(totalActualCost);

        // 4. ROI: (Earnings / Investment) * 100
        const roi = totalActualCost.greaterThan(0)
            ? ebitda.div(totalActualCost).mul(100)
            : this.d(0);

        // 5. Себестоимость единицы (Cost per unit): Total Cost / Total Output (тонн)
        const costPerUnit = totalOutput.greaterThan(0)
            ? totalActualCost.div(totalOutput)
            : this.d(0);

        // 6. Затраты на гектар (Cost per Hectare)
        const harvestedArea = this.d(result?.harvestedArea);
        const costPerHa = harvestedArea.greaterThan(0)
            ? totalActualCost.div(harvestedArea)
            : this.d(0);

        // Deterministic Mapping with Rounding Policy (Applying ONLY in final DTO)
        return {
            hasData: !!result,
            planId: plan.id,
            roi: this.round(roi, 2),
            ebitda: this.round(ebitda, 2),
            costPerUnit: this.round(costPerUnit, 4),
            costPerHa: this.round(costPerHa, 4),
            revenue: this.round(revenue, 2),
            totalActualCost: this.round(totalActualCost, 2),
            totalPlannedCost: this.round(totalPlannedCost, 2),
            actualYield: this.round(this.d(result?.actualYield), 2),
            plannedYield: this.round(this.d(result?.plannedYield || plan.optValue), 2),
            qualityClass: result?.qualityClass,
            harvestDate: result?.harvestDate,
        };
    }

    /**
     * Агрегированные KPI уровня Компании / Сезона (STRATEGIC READ-MODEL).
     * Оптимизировано для предотвращения N+1 запросов через батч-агрегацию.
     */
    async calculateStrategicKPIs(seasonId: string, context: UserContext) {
        this.logger.log(`[KPI] Calculating strategic batch for season ${seasonId}`);

        // 1. Агрегация Фактических затрат (Ledger) за весь сезон одним запросом
        const ledgerSummary = await this.prisma.ledgerEntry.aggregate({
            where: {
                companyId: context.companyId,
                execution: { operation: { mapStage: { techMap: { seasonId: seasonId } } } }
            },
            _sum: { amount: true }
        });
        const totalActualCost = this.d(ledgerSummary._sum.amount);

        // 2. Агрегация Плановых затрат (Budget) за весь сезон одним запросом
        const budgetSummary = await this.prisma.budgetPlan.aggregate({
            where: {
                companyId: context.companyId,
                harvestPlan: { techMaps: { some: { seasonId } } }
            },
            _sum: { totalPlannedAmount: true }
        });
        const totalPlannedCost = this.d(budgetSummary._sum.totalPlannedAmount);

        // 3. Расчет Выручки (Revenue) по всем результатам сезона
        // Prisma не поддерживает SUM(A * B), поэтому суммируем в памяти (результатов обычно < 1000)
        const results = await this.prisma.harvestResult.findMany({
            where: {
                companyId: context.companyId,
                seasonId: seasonId
            },
            select: { totalOutput: true, marketPrice: true }
        });

        const totalRevenue = results.reduce(
            (acc, r) => acc.plus(this.d(r.totalOutput).mul(this.d(r.marketPrice))),
            this.d(0)
        );

        // 4. Расчет итоговых метрик
        const ebitda = totalRevenue.minus(totalActualCost);
        const roi = totalActualCost.greaterThan(0)
            ? ebitda.div(totalActualCost).mul(100)
            : this.d(0);

        return {
            seasonId,
            revenue: this.round(totalRevenue, 2),
            actualCost: this.round(totalActualCost, 2),
            plannedCost: this.round(totalPlannedCost, 2),
            ebitda: this.round(ebitda, 2),
            roi: this.round(roi, 2),
            activeReportingCount: results.length
        };
    }

    private round(value: Prisma.Decimal | number, decimals: number): number {
        const dVal = value instanceof Prisma.Decimal ? value : new Prisma.Decimal(value);
        return dVal.toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP).toNumber();
    }
}
