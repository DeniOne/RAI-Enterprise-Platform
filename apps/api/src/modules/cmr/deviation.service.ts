import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { DeviationStatus, ResponsibilityMode, ClientResponseStatus, HarvestPlanStatus } from '@rai/prisma-client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DecisionService } from './decision.service';

@Injectable()
export class DeviationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly decisionService: DecisionService,
    ) { }

    async createReview(data: {
        harvestPlanId?: string;
        companyId: string;
        seasonId: string;
        deviationSummary: string;
        aiImpactAssessment: string;
        userId?: string;
        [key: string]: any;
    }) {
        // Если harvestPlanId не указан — ищем ACTIVE план через сезон
        let harvestPlanId = data.harvestPlanId;

        if (!harvestPlanId) {
            const season = await this.prisma.season.findUnique({
                where: { id: data.seasonId },
                include: { field: true },
            });

            if (!season) {
                throw new NotFoundException('Сезон не найден');
            }

            const activePlan = await this.prisma.harvestPlan.findFirst({
                where: {
                    companyId: data.companyId,
                    accountId: season.field.clientId,
                    status: HarvestPlanStatus.ACTIVE,
                },
            });

            if (activePlan) {
                harvestPlanId = activePlan.id;
            } else {
                throw new NotFoundException('Нет активного плана для данного сезона');
            }
        }

        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: harvestPlanId },
        });

        if (!plan || plan.companyId !== data.companyId) {
            throw new NotFoundException('План уборки не найден');
        }

        if (plan.status !== HarvestPlanStatus.ACTIVE) {
            throw new BadRequestException('Отклонения можно регистрировать только для ACTIVE планов');
        }

        const review = await this.prisma.deviationReview.create({
            data: {
                ...data,
                harvestPlanId,
                status: DeviationStatus.DETECTED,
                responsibilityMode: ResponsibilityMode.SHARED,
                slaExpiration: data.slaExpiration || new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
        });

        // Audit Trail: логируем создание отклонения
        await this.decisionService.logDecision({
            action: 'DEVIATION_CREATED',
            reason: `Зафиксировано отклонение: ${data.deviationSummary.substring(0, 100)}`,
            actor: 'SYSTEM',
            seasonId: data.seasonId,
            companyId: data.companyId,
            userId: data.userId,
        });

        return review;
    }

    /**
     * FSM-переход статуса Deviation.
     * Каждый переход логируется через DecisionService.
     */
    async transitionStatus(
        id: string,
        targetStatus: DeviationStatus,
        companyId: string,
        userId?: string,
    ) {
        const review = await this.prisma.deviationReview.findFirst({
            where: { id, companyId },
        });

        if (!review) {
            throw new NotFoundException('Отклонение не найдено');
        }

        const current = review.status;

        // FSM Guards
        this.validateDeviationTransition(current, targetStatus);

        let updated;
        try {
            updated = await this.prisma.deviationReview.update({
                where: {
                    id,
                    status: current // Optimistic Lock
                },
                data: { status: targetStatus },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new ConflictException(`Статус отклонения был изменен другим процессом. Ожидался: ${current}`);
            }
            throw error;
        }

        // Audit Trail
        await this.decisionService.logDecision({
            action: `DEVIATION_${current}_TO_${targetStatus}`,
            reason: `FSM-переход отклонения ${id}`,
            actor: userId ? 'MANAGER' : 'SYSTEM',
            seasonId: review.seasonId,
            companyId,
            userId,
        });

        return updated;
    }

    private validateDeviationTransition(current: DeviationStatus, target: DeviationStatus) {
        const allowed: Record<string, DeviationStatus[]> = {
            [DeviationStatus.DETECTED]: [DeviationStatus.ANALYZING],
            [DeviationStatus.ANALYZING]: [DeviationStatus.DECIDED],
            [DeviationStatus.DECIDED]: [DeviationStatus.CLOSED],
        };

        if (!allowed[current]?.includes(target)) {
            throw new BadRequestException(
                `Недопустимый переход: ${current} → ${target}`,
            );
        }
    }

    async findAll(companyId: string) {
        return this.prisma.deviationReview.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            include: { harvestPlan: true },
        });
    }

    async findOne(id: string, companyId: string) {
        const review = await this.prisma.deviationReview.findFirst({
            where: { id, companyId },
            include: { harvestPlan: true, risks: true },
        });

        if (!review) {
            throw new NotFoundException('Отклонение не найдено');
        }

        return review;
    }

    async handleSilence(reviewId: string) {
        const review = await this.prisma.deviationReview.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Отклонение не найдено');

        const now = new Date();
        if (review.slaExpiration && review.slaExpiration < now && review.clientResponseStatus === ClientResponseStatus.PENDING) {
            const updated = await this.prisma.deviationReview.update({
                where: { id: reviewId },
                data: {
                    liabilityShiftStatus: 'SHIFTED_TO_CLIENT',
                    responsibilityMode: ResponsibilityMode.CLIENT_ONLY,
                }
            });

            // Audit Trail: SLA violation
            await this.decisionService.logDecision({
                action: 'SLA_VIOLATION_LIABILITY_SHIFT',
                reason: `Клиент не ответил в срок SLA. Ответственность перенесена.`,
                actor: 'SYSTEM',
                seasonId: review.seasonId,
                companyId: review.companyId,
            });

            return updated;
        }
        return review;
    }

    @Cron(CronExpression.EVERY_HOUR)
    async checkSla() {
        const expiredReviews = await this.prisma.deviationReview.findMany({
            where: {
                status: DeviationStatus.DETECTED,
                clientResponseStatus: ClientResponseStatus.PENDING,
                slaExpiration: { lt: new Date() },
                liabilityShiftStatus: null
            }
        });

        for (const review of expiredReviews) {
            await this.handleSilence(review.id);
        }
    }
}
