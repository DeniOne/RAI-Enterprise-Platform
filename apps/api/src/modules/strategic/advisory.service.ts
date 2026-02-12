import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AdvisorySignalDto, AdvisorySignalType, AdvisoryLevel, AdvisoryTrend } from './dto/advisory-signal.dto';
// Native Date math
const subDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
};

@Injectable()
export class AdvisoryService {
    constructor(private readonly prisma: PrismaService) { }

    async getCompanyHealth(companyId: string): Promise<AdvisorySignalDto> {
        const activePlans = await this.prisma.harvestPlan.count({
            where: { companyId, status: 'ACTIVE' }
        });

        if (activePlans === 0) {
            return {
                type: AdvisorySignalType.HEALTH,
                level: AdvisoryLevel.LOW,
                score: 0,
                message: 'No active plans found for this company',
                confidence: 0,
                trend: AdvisoryTrend.STABLE,
                sources: ['NO_ACTIVE_PLANS']
            };
        }

        const openDeviations = await this.prisma.deviationReview.count({
            where: { companyId, status: 'DETECTED' }
        });

        const closedDeviations = await this.prisma.deviationReview.findMany({
            where: { companyId, status: 'CLOSED', updatedAt: { gte: subDays(new Date(), 30) } },
            select: { createdAt: true, updatedAt: true }
        });

        const avgClosureDays = closedDeviations.length > 0
            ? closedDeviations.reduce((acc, d) => acc + (d.updatedAt.getTime() - d.createdAt.getTime()), 0) / (closedDeviations.length * 1000 * 60 * 60 * 24)
            : 0;

        const lockedBudgets = await this.prisma.budgetPlan.count({
            where: {
                companyId,
                status: 'LOCKED',
                harvestPlanActive: { status: 'ACTIVE' }
            }
        });

        const overspendingBudgets = await this.prisma.budgetItem.aggregate({
            _sum: {
                plannedAmount: true,
                actualAmount: true
            },
            where: {
                budgetPlan: { companyId, status: 'LOCKED' },
                actualAmount: { gt: 0 }
            }
        });

        const totalPlanned = overspendingBudgets._sum.plannedAmount || 0;
        const totalActual = overspendingBudgets._sum.actualAmount || 0;
        const overrunRate = totalPlanned > 0 ? Math.max(0, (totalActual - totalPlanned) / totalPlanned) : 0;

        // --- FORMULAS ---
        const D_ratio = openDeviations / activePlans;
        const score_D = Math.max(0, Math.min(100, 100 - (D_ratio * 100)));
        const score_C = Math.max(0, Math.min(100, 100 - (avgClosureDays * 10)));
        const score_B = (lockedBudgets / activePlans) * 100;
        const score_F = Math.max(0, Math.min(100, 100 - (overrunRate * 100)));

        const finalScore = (score_D * 0.3) + (score_C * 0.3) + (score_B * 0.2) + (score_F * 0.2);

        // --- CONFIDENCE ---
        const conf_deviations = Math.min(1, (openDeviations + closedDeviations.length) / 5);
        const conf_budgets = Math.min(1, lockedBudgets / 3);
        const confidence = Math.min(conf_deviations, conf_budgets);

        // --- TREND (Simplified for MVP, would normally compare with a snapshot) ---
        const trend = AdvisoryTrend.STABLE;

        const sources = [];
        if (D_ratio > 0.5) sources.push('HIGH_DEVIATION_RATIO');
        if (avgClosureDays > 5) sources.push('SLOW_DEVIATION_CLOSURE');
        if (score_B < 80) sources.push('LOW_BUDGET_LOCK_RATE');
        if (overrunRate > 0.1) sources.push('BUDGET_OVERRUN_DETECTED');

        return {
            type: AdvisorySignalType.HEALTH,
            level: finalScore > 70 ? AdvisoryLevel.HIGH : (finalScore > 30 ? AdvisoryLevel.MEDIUM : AdvisoryLevel.LOW),
            score: Math.round(finalScore),
            message: `Company health indexed at ${Math.round(finalScore)}%`,
            confidence,
            trend,
            sources
        };
    }

    async getPlanVolatility(planId: string): Promise<AdvisorySignalDto> {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: planId },
            include: {
                _count: {
                    select: {
                        deviationReviews: true,
                        budgetPlans: true // used as proxy for adjustments here
                    }
                }
            }
        });

        if (!plan) throw new Error('Plan not found');

        const decisionsCount = await this.prisma.cmrDecision.count({
            where: { season: { techMaps: { some: { harvestPlanId: planId } } } }
        });

        // Scale-Invariant Index (simplified for single plan)
        const volatility = Math.min(100, (plan._count.deviationReviews * 20) + (plan._count.budgetPlans * 10) + (decisionsCount * 10));

        return {
            type: AdvisorySignalType.STABILITY,
            level: volatility > 70 ? AdvisoryLevel.HIGH : (volatility > 30 ? AdvisoryLevel.MEDIUM : AdvisoryLevel.LOW),
            score: Math.round(volatility),
            message: `Plan stability risk is ${volatility > 70 ? 'CRITICAL' : (volatility > 30 ? 'ELEVATED' : 'LOW')}`,
            confidence: 1, // Direct data
            trend: AdvisoryTrend.STABLE,
            sources: plan._count.deviationReviews > 2 ? ['HIGH_DEVIATION_COUNT'] : []
        };
    }
}
