import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { BudgetCategory } from '@rai/prisma-client';

export interface DeviationResult {
    category: BudgetCategory;
    planned: number;
    actual: number;
    deviation: number;
    deviationPercentage: number;
}

export interface BudgetDeviationReport {
    budgetPlanId: string;
    totalPlanned: number;
    totalActual: number;
    totalDeviation: number;
    items: DeviationResult[];
}

@Injectable()
export class DeviationService {
    private readonly logger = new Logger(DeviationService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculates deviations for a specific budget plan.
     * Logic: Deviation = Planned - Actual.
     * Follows Phase 2.4 "Calculated, not Stored" principle.
     */
    async calculateBudgetDeviations(budgetPlanId: string): Promise<BudgetDeviationReport> {
        const budget = await this.prisma.budgetPlan.findUnique({
            where: { id: budgetPlanId },
            include: { items: true }
        });

        if (!budget) {
            throw new NotFoundException(`Budget Plan ${budgetPlanId} not found`);
        }

        const items: DeviationResult[] = budget.items.map(item => {
            const planned = Number(item.plannedAmount) || 0;
            const actual = Number(item.actualAmount) || 0;
            const deviation = planned - actual;
            const deviationPercentage = planned !== 0 ? (deviation / planned) * 100 : 0;

            return {
                category: item.category,
                planned,
                actual,
                deviation,
                deviationPercentage
            };
        });

        const totalPlanned = Number(budget.totalPlannedAmount) || 0;
        const totalActual = Number(budget.totalActualAmount) || 0;
        const totalDeviation = totalPlanned - totalActual;

        return {
            budgetPlanId,
            totalPlanned,
            totalActual,
            totalDeviation,
            items
        };
    }

    async getActiveDeviations(context: any) {
        return this.prisma.deviationReview.findMany({
            where: {
                companyId: context.companyId,
                status: { not: 'CLOSED' }
            },
            include: {
                harvestPlan: true,
                budgetPlan: true
            }
        });
    }
}
