import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { HarvestPlanStatus, UserRole } from "@rai/prisma-client";
import { CreateHarvestPlanDto } from "./dto/create-harvest-plan.dto";
import { UpdateDraftPlanDto } from "./dto/update-draft-plan.dto";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";
import { DecisionService } from "../cmr/decision.service";

export interface UserContext {
    userId: string;
    role: UserRole;
    companyId: string;
}

@Injectable()
export class ConsultingService {
    private readonly logger = new Logger(ConsultingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly domainRules: ConsultingDomainRules,
        private readonly decisionService: DecisionService,
    ) { }

    async createPlan(dto: CreateHarvestPlanDto, context: UserContext) {
        return this.prisma.harvestPlan.create({
            data: {
                ...dto,
                companyId: context.companyId,
                status: HarvestPlanStatus.DRAFT,
            },
        });
    }

    async updateDraftPlan(id: string, dto: UpdateDraftPlanDto, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('План уборки не найден');
        }

        if (plan.status !== HarvestPlanStatus.DRAFT) {
            throw new ForbiddenException('Редактировать можно только DRAFT-планы');
        }

        return this.prisma.harvestPlan.update({
            where: { id },
            data: dto,
        });
    }

    async transitionPlanStatus(id: string, targetStatus: HarvestPlanStatus, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id },
            include: { techMaps: true },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('План уборки не найден');
        }

        const currentStatus = plan.status;

        // FSM Guard
        await this.validateTransition(currentStatus, targetStatus, context, plan);

        // Выполнить переход с Optimistic Locking
        let updatedPlan;
        try {
            updatedPlan = await this.prisma.harvestPlan.update({
                where: {
                    id,
                    status: currentStatus // Optimistic Lock: гарантируем, что статус не изменился
                },
                data: { status: targetStatus },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new ConflictException(`Статус плана был изменен другим процессом. Текущий статус: ${currentStatus}`);
            }
            throw error;
        }

        // Иммутабельная запись каждого решения (Audit Trail)
        const seasonId = plan.techMaps?.[0]?.seasonId;
        if (seasonId) {
            await this.decisionService.logDecision({
                action: `PLAN_TRANSITION_${currentStatus}_TO_${targetStatus}`,
                reason: `FSM-переход плана ${id}`,
                actor: context.role,
                seasonId,
                companyId: context.companyId,
                userId: context.userId,
            });
        }

        this.logger.log(`[CONSULTING] Plan ${id}: ${currentStatus} → ${targetStatus} by ${context.role}`);
        return updatedPlan;
    }

    private async validateTransition(
        current: HarvestPlanStatus,
        target: HarvestPlanStatus,
        context: UserContext,
        plan: any,
    ) {
        // 1. DRAFT -> REVIEW (Любой авторизованный пользователь компании)
        if (current === HarvestPlanStatus.DRAFT && target === HarvestPlanStatus.REVIEW) {
            return;
        }

        // 2. REVIEW -> APPROVED (Только CEO/ADMIN)
        if (current === HarvestPlanStatus.REVIEW && target === HarvestPlanStatus.APPROVED) {
            if (context.role !== UserRole.CEO && context.role !== UserRole.ADMIN) {
                throw new ForbiddenException('Только CEO может утверждать планы');
            }
            return;
        }

        // 3. APPROVED -> ACTIVE (Только CEO/ADMIN + DomainRules Guard)
        if (current === HarvestPlanStatus.APPROVED && target === HarvestPlanStatus.ACTIVE) {
            if (context.role !== UserRole.CEO && context.role !== UserRole.ADMIN) {
                throw new ForbiddenException('Только CEO может активировать планы');
            }
            // Строгая проверка через DomainRules
            await this.domainRules.canActivate(plan.id);
            return;
        }

        // 4. ACTIVE -> DONE (Завершение)
        if (current === HarvestPlanStatus.ACTIVE && target === HarvestPlanStatus.DONE) {
            return;
        }

        // 5. DONE -> ARCHIVE (Архивация)
        if (current === HarvestPlanStatus.DONE && target === HarvestPlanStatus.ARCHIVE) {
            await this.domainRules.canArchive(plan.id);
            return;
        }

        throw new BadRequestException(`Недопустимый переход из ${current} в ${target}`);
    }

    async findAll(context: UserContext) {
        return this.prisma.harvestPlan.findMany({
            where: { companyId: context.companyId },
            include: { account: true },
        });
    }

    async findOne(id: string, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id },
            include: { account: true, techMaps: true, deviationReviews: true },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('План уборки не найден');
        }

        return plan;
    }

    /**
     * Открывает контекстный тред для консультации.
     */
    async openConsultationThread(deviationReviewId: string) {
        this.logger.log(`[CONSULTING] Открытие контекстного треда для deviation ${deviationReviewId}`);

        const review = await this.prisma.deviationReview.findUnique({
            where: { id: deviationReviewId },
        });

        if (!review) {
            throw new Error(`DeviationReview ${deviationReviewId} не найден`);
        }

        if (review.telegramThreadId) {
            this.logger.warn(`[CONSULTING] Тред уже существует для deviation ${deviationReviewId}`);
            return review.telegramThreadId;
        }

        const virtualThreadId = `tg_thread_${Date.now()}_${deviationReviewId.substring(0, 8)}`;

        await this.prisma.deviationReview.update({
            where: { id: deviationReviewId },
            data: { telegramThreadId: virtualThreadId },
        });

        this.logger.log(`[CONSULTING] Контекстный тред создан: ${virtualThreadId}`);
        return virtualThreadId;
    }

    /**
     * Логирует сообщение из Telegram как часть контекста системы.
     */
    async logMessage(threadId: string, authorId: string, content: string) {
        const review = await this.prisma.deviationReview.findFirst({
            where: { telegramThreadId: threadId },
        });

        if (!review) {
            this.logger.error(`[LAW-VIOLATION] Сообщение без валидного контекстного треда: ${threadId}`);
            return;
        }

        this.logger.log(`[CONSULTING] Трассировка: Автор ${authorId} → Review ${review.id}`);
    }
}
