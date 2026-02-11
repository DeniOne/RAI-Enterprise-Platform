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
    async canActivate(planId: string): Promise<void> {
        // Проверка 1: TechMap
        const techMaps = await this.prisma.techMap.findMany({
            where: { harvestPlanId: planId },
        });

        if (techMaps.length === 0) {
            throw new BadRequestException(
                'Невозможно активировать план без привязанной Технологической Карты',
            );
        }

        const hasVerifiedMap = techMaps.some(
            (m) => m.status === TechMapStatus.ACTIVE || m.status === TechMapStatus.CHECKING,
        );

        if (!hasVerifiedMap) {
            throw new BadRequestException(
                'Невозможно активировать план: все TechMaps в статусе PROJECT. Требуется минимум одна в статусе CHECKING или ACTIVE.',
            );
        }

        // Проверка 2: Нет открытых Deviation'ов
        const openDeviations = await this.prisma.deviationReview.count({
            where: {
                harvestPlanId: planId,
                status: { in: [DeviationStatus.DETECTED, DeviationStatus.ANALYZING] },
            },
        });

        if (openDeviations > 0) {
            throw new BadRequestException(
                `Невозможно активировать план: ${openDeviations} незакрытых отклонений. Необходимо закрыть все Deviation перед активацией.`,
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
    async canArchive(planId: string): Promise<void> {
        const unclosedDeviations = await this.prisma.deviationReview.count({
            where: {
                harvestPlanId: planId,
                status: { not: DeviationStatus.CLOSED },
            },
        });

        if (unclosedDeviations > 0) {
            throw new BadRequestException(
                `Невозможно архивировать план: ${unclosedDeviations} незакрытых отклонений.`,
            );
        }
    }
}
