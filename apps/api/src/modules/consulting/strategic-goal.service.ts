import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { GoalType, GoalStatus, Prisma, BudgetStatus } from '@rai/prisma-client';
import { UserContext } from './consulting.service';

@Injectable()
export class StrategicGoalService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Создание черновика стратегической цели
     */
    async createDraft(
        dto: { seasonId: string; type: GoalType; targetValue: number | string | Prisma.Decimal; description?: string },
        context: UserContext
    ) {
        return this.prisma.strategicGoal.create({
            data: {
                companyId: context.companyId,
                seasonId: dto.seasonId,
                goalType: dto.type,
                targetValue: new Prisma.Decimal(dto.targetValue),
                description: dto.description,
                status: GoalStatus.DRAFT,
                version: 1,
            },
        });
    }

    /**
     * Активация цели с проверкой Baseline
     */
    async activate(goalId: string, context: UserContext) {
        const goal = await this.ensureGoalAccess(goalId, context);

        if (goal.status !== GoalStatus.DRAFT) {
            throw new BadRequestException('Можно активировать только цели в статусе DRAFT');
        }

        // [GUARD] Проверка Baseline: наличие бюджета и зафиксированного сезона
        await this.validateBaseline(goal.seasonId, context);

        return this.prisma.$transaction(async (tx) => {
            // 1. Деактивируем предыдущую активную версию того же типа
            await tx.strategicGoal.updateMany({
                where: {
                    companyId: context.companyId,
                    seasonId: goal.seasonId,
                    goalType: goal.goalType,
                    isActive: true,
                },
                data: {
                    isActive: null,
                    status: GoalStatus.ARCHIVED,
                    archivedAt: new Date(),
                },
            });

            // 2. Активируем текущую
            return tx.strategicGoal.update({
                where: { id: goalId },
                data: {
                    status: GoalStatus.ACTIVE,
                    isActive: true,
                    activatedAt: new Date(),
                },
            });
        });
    }

    /**
     * Создание новой версии цели (Supersede)
     */
    async supersede(
        oldGoalId: string,
        dto: { targetValue: number | string | Prisma.Decimal; description?: string },
        context: UserContext
    ) {
        const oldGoal = await this.ensureGoalAccess(oldGoalId, context);

        return this.prisma.$transaction(async (tx) => {
            // 1. Деактивируем старую
            await tx.strategicGoal.update({
                where: { id: oldGoalId },
                data: {
                    isActive: null,
                    status: GoalStatus.ARCHIVED,
                    archivedAt: new Date(),
                },
            });

            // 2. Создаем новую версию
            return tx.strategicGoal.create({
                data: {
                    companyId: context.companyId,
                    seasonId: oldGoal.seasonId,
                    goalType: oldGoal.goalType,
                    targetValue: new Prisma.Decimal(dto.targetValue),
                    description: dto.description || oldGoal.description,
                    version: oldGoal.version + 1,
                    supersedesId: oldGoal.id,
                    status: GoalStatus.ACTIVE,
                    isActive: true,
                    activatedAt: new Date(),
                },
            });
        });
    }

    /**
     * Получение активных целей сезона
     */
    async getActiveGoals(seasonId: string, context: UserContext) {
        return this.prisma.strategicGoal.findMany({
            where: {
                companyId: context.companyId,
                seasonId,
                isActive: true,
            },
            orderBy: { goalType: 'asc' },
        });
    }

    private async ensureGoalAccess(goalId: string, context: UserContext) {
        const goal = await this.prisma.strategicGoal.findUnique({
            where: { id: goalId },
        });

        if (!goal || goal.companyId !== context.companyId) {
            throw new ForbiddenException('Цель не найдена или доступ запрещен');
        }

        return goal;
    }

    private async validateBaseline(seasonId: string, context: UserContext) {
        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
            include: { harvestPlans: { include: { budgetPlans: { where: { status: BudgetStatus.LOCKED } } } } },
        });

        if (!season) throw new BadRequestException('Сезон не найден');

        // [REFINEMENT] Для активации стратегии должен быть хотя бы один подтвержденный бюджет или зафиксированный план
        const hasConfirmedBudget = season.harvestPlans.some(hp => hp.budgetPlans.length > 0);
        if (!hasConfirmedBudget) {
            throw new BadRequestException('Нельзя активировать стратегическую цель без подтвержденного Baseline бюджета');
        }
    }
}
