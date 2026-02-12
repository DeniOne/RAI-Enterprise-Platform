import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { BudgetStatus, UserRole, BudgetCategory, DeviationType } from "@rai/prisma-client";
import { DeviationService } from "../cmr/deviation.service";

export interface UserContext {
    userId: string;
    role: UserRole;
    companyId: string;
}

export enum BudgetTransitionEvent {
    APPROVE = 'APPROVE',
    LOCK = 'LOCK',
    CLOSE = 'CLOSE',
}

@Injectable()
export class BudgetPlanService {
    private readonly logger = new Logger(BudgetPlanService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly deviationService: DeviationService,
    ) { }

    /**
     * Создает новый BudgetPlan на основе активной техкарты.
     */
    async createBudget(harvestPlanId: string, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: harvestPlanId },
            include: { activeTechMap: { include: { stages: { include: { operations: { include: { resources: true } } } } } } },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('План уборки не найден');
        }

        if (!plan.activeTechMap) {
            throw new BadRequestException('Для создания бюджета необходима активная технологическая карта');
        }

        // Версионирование
        const lastVersion = await this.prisma.budgetPlan.findFirst({
            where: { harvestPlanId },
            orderBy: { version: 'desc' },
        });
        const newVersion = (lastVersion?.version || 0) + 1;

        // Агрегация ресурсов по категориям
        const resources = plan.activeTechMap.stages.flatMap(s => s.operations.flatMap(o => o.resources));
        const categoryMap = new Map<BudgetCategory, number>();

        for (const res of resources) {
            // Маппинг строкового типа ресурса на BudgetCategory
            const category = this.mapResourceToCategory(res.type);
            const cost = (res.amount || 0) * (res.costPerUnit || 0);
            categoryMap.set(category, (categoryMap.get(category) || 0) + cost);
        }

        const totalPlannedAmount = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0);

        return this.prisma.budgetPlan.create({
            data: {
                harvestPlanId,
                version: newVersion,
                status: BudgetStatus.DRAFT,
                totalPlannedAmount,
                techMapSnapshotId: plan.activeTechMapId,
                companyId: context.companyId,
                seasonId: plan.activeTechMap.seasonId,
                items: {
                    create: Array.from(categoryMap.entries()).map(([category, amount]) => ({
                        category,
                        plannedAmount: amount,
                    })),
                },
            },
            include: { items: true },
        });
    }

    /**
     * Управляет переходами состояний бюджета (FSM).
     */
    async transitionStatus(budgetId: string, event: BudgetTransitionEvent, context: UserContext) {
        const budget = await this.prisma.budgetPlan.findUnique({
            where: { id: budgetId },
        });

        if (!budget || budget.companyId !== context.companyId) {
            throw new NotFoundException('Бюджет не найден');
        }

        const currentStatus = budget.status;
        let targetStatus: BudgetStatus;

        // FSM Logic
        switch (event) {
            case BudgetTransitionEvent.APPROVE:
                if (currentStatus !== BudgetStatus.DRAFT) throw new BadRequestException('Бюджет должен быть в статусе DRAFT для утверждения');
                targetStatus = BudgetStatus.APPROVED;
                break;
            case BudgetTransitionEvent.LOCK:
                if (currentStatus !== BudgetStatus.APPROVED) throw new BadRequestException('Бюджет должен быть APPROVED для блокировки (LOCK)');
                targetStatus = BudgetStatus.LOCKED;
                break;
            case BudgetTransitionEvent.CLOSE:
                if (currentStatus !== BudgetStatus.LOCKED) throw new BadRequestException('Только LOCKED бюджет можно закрыть');
                targetStatus = BudgetStatus.CLOSED;
                break;
            default:
                throw new BadRequestException(`Неизвестное событие перехода: ${event}`);
        }

        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.budgetPlan.update({
                where: { id: budgetId, status: currentStatus },
                data: { status: targetStatus },
            });

            // Side-effects
            if (targetStatus === BudgetStatus.LOCKED) {
                // Устанавливаем текущий LOCKED бюджет как активный для плана
                await tx.harvestPlan.update({
                    where: { id: budget.harvestPlanId },
                    data: { activeBudgetPlanId: updated.id },
                });
            }

            if (targetStatus === BudgetStatus.CLOSED) {
                // Если закрываем ACTIVE бюджет — отвязываем его от плана
                const plan = await tx.harvestPlan.findUnique({ where: { id: budget.harvestPlanId } });
                if (plan?.activeBudgetPlanId === budgetId) {
                    await tx.harvestPlan.update({
                        where: { id: budget.harvestPlanId },
                        data: { activeBudgetPlanId: null },
                    });
                }
            }

            return updated;
        });
    }

    /**
     * Синхронизирует фактические затраты и проверяет на перерасход (Deviation Trigger).
     */
    async syncActuals(budgetId: string, context: UserContext) {
        const budget = await this.prisma.budgetPlan.findUnique({
            where: { id: budgetId },
            include: { items: true },
        });

        if (!budget || budget.companyId !== context.companyId) {
            throw new NotFoundException('Бюджет не найден');
        }

        if (budget.status !== BudgetStatus.LOCKED) {
            throw new BadRequestException('Синхронизация факта возможна только для LOCKED бюджета');
        }

        const items = budget.items;
        let totalActual = 0;
        let hasOverflow = false;
        let overflowSummary = '';

        for (const item of items) {
            // В реальном сценарии здесь будет запрос к LedgerEntry или TaskResourceActual
            // Для MVP Track 2 логика агрегации подразумевается внешней или заглушкой
            totalActual += item.actualAmount;

            if (item.actualAmount > item.plannedAmount) {
                hasOverflow = true;
                overflowSummary += `Перерасход в категории ${item.category}: ${item.actualAmount.toFixed(2)} > ${item.plannedAmount.toFixed(2)}\n`;
            }
        }

        // Обновляем общий факт
        await this.prisma.budgetPlan.update({
            where: { id: budgetId },
            data: { totalActualAmount: totalActual },
        });

        if (hasOverflow) {
            await this.deviationService.createReview({
                harvestPlanId: budget.harvestPlanId,
                budgetPlanId: budget.id,
                companyId: budget.companyId,
                seasonId: budget.seasonId,
                type: 'FINANCIAL',
                deviationSummary: `Бюджетный перерасход (v${budget.version}):\n${overflowSummary}`,
                aiImpactAssessment: 'Финансовые риски: превышение запланированных лимитов производства. Требуется анализ эффективности операций.',
            });
        }

        return { totalActual, hasOverflow };
    }

    private mapResourceToCategory(type: string): BudgetCategory {
        const t = type.toUpperCase();
        if (t.includes('SEED')) return BudgetCategory.SEEDS;
        if (t.includes('FERT')) return BudgetCategory.FERTILIZER;
        if (t.includes('FUEL')) return BudgetCategory.FUEL;
        if (t.includes('LABOR')) return BudgetCategory.LABOR;
        if (t.includes('MACH')) return BudgetCategory.MACHINERY;
        return BudgetCategory.OTHER;
    }
}
