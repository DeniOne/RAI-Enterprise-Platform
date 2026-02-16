import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { KpiService } from './kpi.service';
import { StrategicGoalService } from './strategic-goal.service';
import { UserContext } from './consulting.service';
import { GoalType, Prisma } from '@rai/prisma-client';

@Injectable()
export class StrategicDecompositionService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly kpiService: KpiService,
        private readonly goalService: StrategicGoalService
    ) { }

    /**
     * Декомпозиция стратегической цели до операционных ограничений
     * 
     * МАТЕМАТИЧЕСКАЯ МОДЕЛЬ (Симметрия с KpiService):
     * EBITDA = Revenue - Cost
     * Revenue = Yield * Area * Price
     * Cost = TotalActualCost (Ledger)
     * 
     * СЛЕДОВАТЕЛЬНО:
     * MaxAllowedCost = Revenue_projected - TargetEBITDA
     * MinRequiredYield = (TargetEBITDA + Cost_projected) / (Area * Price_market)
     */
    async decomposeGoal(goalId: string, context: UserContext) {
        const goal = await this.prisma.strategicGoal.findFirst({
            where: { id: goalId, companyId: context.companyId },
            include: { season: true },
        });

        if (!goal) throw new BadRequestException('Цель не найдена');

        // Получаем текущий Baseline KPI для сезона
        const baselineKpi = await this.kpiService.calculateStrategicKPIs(goal.seasonId, context);

        const result: any = {
            goalId: goal.id,
            goalType: goal.goalType,
            targetValue: goal.targetValue,
            currentValue: this.getCurrentValue(goal.goalType, baselineKpi),
            recommendations: [],
        };

        const targetValue = new Prisma.Decimal(goal.targetValue);
        const revenue = new Prisma.Decimal(baselineKpi.revenue);
        const cost = new Prisma.Decimal(baselineKpi.actualCost);

        if (goal.goalType === GoalType.EBITDA_TARGET) {
            // 1. Расчет допустимых затрат при текущей выручке
            const maxCost = revenue.minus(targetValue);
            // 2. Расчет необходимой урожайности при текущих затратах (упрощенная модель для демонстрации)
            // В реальности MinYield рассчитывается сложнее через средневзвешенную цену культур сезона

            result.maxAllowedCost = maxCost.toNumber();

            if (cost.gt(maxCost)) {
                result.recommendations.push({
                    type: 'COST_REDUCTION',
                    severity: 'HIGH',
                    message: `Для достижения EBITDA ${targetValue} необходимо снизить затраты на ${cost.minus(maxCost).toFixed(2)}`,
                    linkedKpi: 'EBITDA',
                });
            }
        }

        if (goal.goalType === GoalType.ROI_TARGET) {
            // ROI = (EBITDA / Cost) * 100
            // TargetEBITDA = (TargetROI / 100) * Cost
            const targetEbitda = targetValue.div(100).mul(cost);
            const requiredRevenue = targetEbitda.plus(cost);

            result.requiredRevenue = requiredRevenue.toNumber();

            if (revenue.lt(requiredRevenue)) {
                result.recommendations.push({
                    type: 'REVENUE_BOOST',
                    severity: 'MEDIUM',
                    message: `Для ROI ${targetValue}% требуется выручка ${requiredRevenue.toFixed(2)} (текущая: ${revenue})`,
                    linkedKpi: 'ROI',
                });
            }
        }

        return result;
    }

    private getCurrentValue(type: GoalType, kpi: any): number {
        switch (type) {
            case GoalType.EBITDA_TARGET: return kpi.ebitda;
            case GoalType.ROI_TARGET: return kpi.roi;
            case GoalType.COST_LIMIT: return kpi.actualCost;
            case GoalType.YIELD_TARGET: return 0; // Требует агрегации по культурам
            default: return 0;
        }
    }
}
