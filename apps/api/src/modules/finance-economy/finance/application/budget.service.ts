import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { BudgetStateMachine, BudgetEvent, BudgetStatus } from '../domain/budget.fsm';
import { BudgetPolicy } from '../domain/policies/budget.policy';

@Injectable()
export class BudgetService {
    private readonly logger = new Logger(BudgetService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Оркестрация бюджетов.
     */
    async createBudget(dto: { name: string; limit: number; companyId: string; periodStart: Date; periodEnd: Date }) {
        return this.prisma.budget.create({
            data: {
                ...dto,
                status: BudgetStatus.DRAFT,
                consumed: 0,
                remaining: dto.limit,
            },
        });
    }

    async transitionBudget(budgetId: string, event: BudgetEvent, companyId: string) {
        const budget = await this.prisma.budget.findFirst({
            where: { id: budgetId, companyId },
        });

        if (!budget) {
            throw new NotFoundException(`Budget ${budgetId} not found`);
        }

        // FSM Transition (Pure)
        const result = BudgetStateMachine.transition(budget as any, event);

        return this.prisma.budget.update({
            where: { id: budgetId },
            data: { status: result.status as BudgetStatus },
        });
    }

    /**
     * Списание из бюджета (по лимиту).
     */
    async consumeBudget(budgetId: string, amount: number, companyId: string) {
        const budget = await this.prisma.budget.findFirst({
            where: { id: budgetId, companyId },
        });

        if (!budget) {
            throw new NotFoundException(`Budget ${budgetId} not found`);
        }

        // Policy check (Pure)
        const policyResult = BudgetPolicy.canConsume(budget as any, amount);
        if (!policyResult.allowed) {
            throw new BadRequestException(policyResult.reason);
        }

        return this.prisma.budget.update({
            where: { id: budgetId },
            data: {
                consumed: { increment: amount },
                remaining: { decrement: amount },
            },
        });
    }

    /**
     * Statistics for CFO View (Projection Aggregation)
     */
    async getStats(companyId: string) {
        const stats = await this.prisma.budget.aggregate({
            where: { companyId },
            _sum: {
                limit: true,
                consumed: true,
                remaining: true,
            },
        });

        const totalLimit = stats._sum.limit || 0;
        const totalConsumed = stats._sum.consumed || 0;
        const totalRemaining = stats._sum.remaining || 0;

        return {
            totalLimit,
            totalConsumed,
            totalRemaining,
            burnRate: totalLimit > 0 ? totalConsumed / totalLimit : 0,
        };
    }
}
