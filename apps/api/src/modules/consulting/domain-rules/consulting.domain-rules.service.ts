import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { TechMapStatus, DeviationStatus } from '@rai/prisma-client';

/**
 * ConsultingDomainRules — кросс-доменные бизнес-правила.
 * Инкапсулирует проверки, которые выходят за рамки одного сервиса.
 * Паттерн: Orchestrator = Brain (ARCHITECTURAL_AXIOM).
 */
@Injectable()
export class ConsultingDomainRules {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Может ли план быть активирован?
     * Требования:
     * 1. Привязана хотя бы одна TechMap со статусом ACTIVE или CHECKING
     * 2. Нет критических (незакрытых) Deviation'ов
     */
    async canActivate(planId: string, companyId?: string): Promise<void> {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: planId, ...(companyId ? { companyId } : {}) },
        });

        if (!plan) {
            throw new BadRequestException('План уборки не найден');
        }

        if (!plan.activeTechMapId) {
            throw new BadRequestException(
                'Production Gate: Невозможно активировать план. Требуется привязанная и активная Технологическая Карта (activeTechMapId is empty).',
            );
        }
        // Проверка 2: Нет открытых Deviation'ов (Track 1)
        const openDeviations = await this.prisma.deviationReview.count({
            where: {
                harvestPlanId: planId,
                ...(companyId ? { companyId } : {}),
                status: { in: [DeviationStatus.DETECTED, DeviationStatus.ANALYZING] },
            },
        });

        if (openDeviations > 0) {
            throw new BadRequestException(
                `Невозможно активировать план: ${openDeviations} незакрытых отклонений. Необходимо закрыть все Deviation перед активацией.`,
            );
        }

        // Проверка 3: Финансовый Гейт (Track 2)
        const planWithBudget = await this.prisma.harvestPlan.findUnique({
            where: { id: planId, ...(companyId ? { companyId } : {}) },
            include: { activeBudgetPlan: true },
        });

        if (!planWithBudget?.activeBudgetPlanId || planWithBudget.activeBudgetPlan?.status !== 'LOCKED') {
            throw new BadRequestException(
                'Financial Gate: Невозможно активировать план. Требуется привязанный и заблокированный бюджет (status: LOCKED).',
            );
        }
    }

    /**
     * Можно ли создать Deviation для данного плана?
     * Deviation допустимы ТОЛЬКО для ACTIVE планов.
     */
    async canCreateDeviation(planId: string, companyId: string): Promise<void> {
        const plan = await this.prisma.harvestPlan.findFirst({
            where: { id: planId, companyId },
        });

        if (!plan) {
            throw new BadRequestException('План уборки не найден');
        }

        if (plan.status !== 'ACTIVE') {
            throw new BadRequestException(
                `Отклонения можно регистрировать только для ACTIVE планов. Текущий статус: ${plan.status}`,
            );
        }
    }

    /**
     * Можно ли архивировать план?
     * Все Deviations должны быть в статусе CLOSED.
     */
    async canArchive(planId: string, companyId?: string): Promise<void> {
        const unclosedDeviations = await this.prisma.deviationReview.count({
            where: {
                harvestPlanId: planId,
                ...(companyId ? { companyId } : {}),
                status: { not: DeviationStatus.CLOSED },
            },
        });

        if (unclosedDeviations > 0) {
            throw new BadRequestException(
                `Невозможно архивировать план: ${unclosedDeviations} незакрытых отклонений.`,
            );
        }
    }

    /**
     * Можно ли редактировать данные об урожае?
     * План не должен быть в статусе ARCHIVE.
     */
    async canEditHarvestResult(planId: string, companyId?: string): Promise<void> {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: planId, ...(companyId ? { companyId } : {}) },
        });

        if (!plan) {
            throw new BadRequestException('План уборки не найден');
        }

        if (plan.status === 'ARCHIVE') {
            throw new BadRequestException('Невозможно редактировать урожай для архивного плана');
        }
    }
}
