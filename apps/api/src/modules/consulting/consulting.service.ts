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
        const plan = await this.prisma.harvestPlan.findFirst({
            where: { id, companyId: context.companyId },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('РџР»Р°РЅ СѓР±РѕСЂРєРё РЅРµ РЅР°Р№РґРµРЅ');
        }

        if (plan.status !== HarvestPlanStatus.DRAFT) {
            throw new ForbiddenException('Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ DRAFT-РїР»Р°РЅС‹');
        }

        const updated = await this.prisma.harvestPlan.updateMany({
            where: { id, companyId: context.companyId, status: HarvestPlanStatus.DRAFT },
            data: dto,
        });
        if (updated.count !== 1) {
            throw new ConflictException('Harvest plan update conflict');
        }
        return this.prisma.harvestPlan.findFirstOrThrow({
            where: { id, companyId: context.companyId },
        });
    }

    async transitionPlanStatus(id: string, targetStatus: HarvestPlanStatus, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findFirst({
            where: { id, companyId: context.companyId },
            include: { techMaps: true },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('РџР»Р°РЅ СѓР±РѕСЂРєРё РЅРµ РЅР°Р№РґРµРЅ');
        }

        const currentStatus = plan.status;

        // FSM Guard
        await this.validateTransition(currentStatus, targetStatus, context, plan);

        // Р’С‹РїРѕР»РЅРёС‚СЊ РїРµСЂРµС…РѕРґ СЃ Optimistic Locking
        let updatedPlan;
        try {
            const updateResult = await this.prisma.harvestPlan.updateMany({
                where: {
                    id,
                    companyId: context.companyId,
                    status: currentStatus // Optimistic Lock: РіР°СЂР°РЅС‚РёСЂСѓРµРј, С‡С‚Рѕ СЃС‚Р°С‚СѓСЃ РЅРµ РёР·РјРµРЅРёР»СЃСЏ
                },
                data: { status: targetStatus },
            });
            if (updateResult.count !== 1) {
                throw new ConflictException(`РЎС‚Р°С‚СѓСЃ РїР»Р°РЅР° Р±С‹Р» РёР·РјРµРЅРµРЅ РґСЂСѓРіРёРј РїСЂРѕС†РµСЃСЃРѕРј. РўРµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ: ${currentStatus}`);
            }
            updatedPlan = await this.prisma.harvestPlan.findFirstOrThrow({
                where: { id, companyId: context.companyId },
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new ConflictException(`РЎС‚Р°С‚СѓСЃ РїР»Р°РЅР° Р±С‹Р» РёР·РјРµРЅРµРЅ РґСЂСѓРіРёРј РїСЂРѕС†РµСЃСЃРѕРј. РўРµРєСѓС‰РёР№ СЃС‚Р°С‚СѓСЃ: ${currentStatus}`);
            }
            throw error;
        }

        // РРјРјСѓС‚Р°Р±РµР»СЊРЅР°СЏ Р·Р°РїРёСЃСЊ РєР°Р¶РґРѕРіРѕ СЂРµС€РµРЅРёСЏ (Audit Trail)
        const seasonId = plan.techMaps?.[0]?.seasonId;
        if (seasonId) {
            await this.decisionService.logDecision({
                action: `PLAN_TRANSITION_${currentStatus}_TO_${targetStatus}`,
                reason: `FSM-РїРµСЂРµС…РѕРґ РїР»Р°РЅР° ${id}`,
                actor: context.role,
                seasonId,
                companyId: context.companyId,
                userId: context.userId,
            });
        }

        this.logger.log(`[CONSULTING] Plan ${id}: ${currentStatus} в†’ ${targetStatus} by ${context.role}`);
        return updatedPlan;
    }

    private async validateTransition(
        current: HarvestPlanStatus,
        target: HarvestPlanStatus,
        context: UserContext,
        plan: any,
    ) {
        // 1. DRAFT -> REVIEW (Р›СЋР±РѕР№ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РєРѕРјРїР°РЅРёРё)
        if (current === HarvestPlanStatus.DRAFT && target === HarvestPlanStatus.REVIEW) {
            return;
        }

        // 2. REVIEW -> APPROVED (РўРѕР»СЊРєРѕ CEO/ADMIN)
        if (current === HarvestPlanStatus.REVIEW && target === HarvestPlanStatus.APPROVED) {
            if (context.role !== UserRole.CEO && context.role !== UserRole.ADMIN) {
                throw new ForbiddenException('РўРѕР»СЊРєРѕ CEO РјРѕР¶РµС‚ СѓС‚РІРµСЂР¶РґР°С‚СЊ РїР»Р°РЅС‹');
            }
            return;
        }

        // 3. APPROVED -> ACTIVE (РўРѕР»СЊРєРѕ CEO/ADMIN + DomainRules Guard)
        if (current === HarvestPlanStatus.APPROVED && target === HarvestPlanStatus.ACTIVE) {
            if (context.role !== UserRole.CEO && context.role !== UserRole.ADMIN) {
                throw new ForbiddenException('РўРѕР»СЊРєРѕ CEO РјРѕР¶РµС‚ Р°РєС‚РёРІРёСЂРѕРІР°С‚СЊ РїР»Р°РЅС‹');
            }
            // РЎС‚СЂРѕРіР°СЏ РїСЂРѕРІРµСЂРєР° С‡РµСЂРµР· DomainRules
            await this.domainRules.canActivate(plan.id, context.companyId);
            return;
        }

        // 4. ACTIVE -> DONE (Р—Р°РІРµСЂС€РµРЅРёРµ)
        if (current === HarvestPlanStatus.ACTIVE && target === HarvestPlanStatus.DONE) {
            return;
        }

        // 5. DONE -> ARCHIVE (РђСЂС…РёРІР°С†РёСЏ)
        if (current === HarvestPlanStatus.DONE && target === HarvestPlanStatus.ARCHIVE) {
            await this.domainRules.canArchive(plan.id, context.companyId);
            return;
        }

        throw new BadRequestException(`РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ РїРµСЂРµС…РѕРґ РёР· ${current} РІ ${target}`);
    }

    async findAll(context: UserContext) {
        return this.prisma.harvestPlan.findMany({
            where: { companyId: context.companyId },
            include: { account: true },
        });
    }

    async findOne(id: string, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findFirst({
            where: { id, companyId: context.companyId },
            include: { account: true, techMaps: true, deviationReviews: true },
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('РџР»Р°РЅ СѓР±РѕСЂРєРё РЅРµ РЅР°Р№РґРµРЅ');
        }

        return plan;
    }

    /**
     * РћС‚РєСЂС‹РІР°РµС‚ РєРѕРЅС‚РµРєСЃС‚РЅС‹Р№ С‚СЂРµРґ РґР»СЏ РєРѕРЅСЃСѓР»СЊС‚Р°С†РёРё.
     */
    async openConsultationThread(deviationReviewId: string, companyId: string) {
        this.logger.log(`[CONSULTING] РћС‚РєСЂС‹С‚РёРµ РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ С‚СЂРµРґР° РґР»СЏ deviation ${deviationReviewId}`);

        const review = await this.prisma.deviationReview.findFirst({
            where: { id: deviationReviewId, companyId },
        });

        if (!review) {
            throw new Error(`DeviationReview ${deviationReviewId} РЅРµ РЅР°Р№РґРµРЅ`);
        }

        if (review.telegramThreadId) {
            this.logger.warn(`[CONSULTING] РўСЂРµРґ СѓР¶Рµ СЃСѓС‰РµСЃС‚РІСѓРµС‚ РґР»СЏ deviation ${deviationReviewId}`);
            return review.telegramThreadId;
        }

        const virtualThreadId = `tg_thread_${Date.now()}_${deviationReviewId.substring(0, 8)}`;

        const updated = await this.prisma.deviationReview.updateMany({
            where: { id: deviationReviewId, companyId },
            data: { telegramThreadId: virtualThreadId },
        });
        if (updated.count !== 1) {
            throw new ConflictException(`DeviationReview ${deviationReviewId} update conflict`);
        }

        this.logger.log(`[CONSULTING] РљРѕРЅС‚РµРєСЃС‚РЅС‹Р№ С‚СЂРµРґ СЃРѕР·РґР°РЅ: ${virtualThreadId}`);
        return virtualThreadId;
    }

    /**
     * Р›РѕРіРёСЂСѓРµС‚ СЃРѕРѕР±С‰РµРЅРёРµ РёР· Telegram РєР°Рє С‡Р°СЃС‚СЊ РєРѕРЅС‚РµРєСЃС‚Р° СЃРёСЃС‚РµРјС‹.
     */
    async logMessage(threadId: string, authorId: string, content: string, companyId: string) {
        const review = await this.prisma.deviationReview.findFirst({
            where: { telegramThreadId: threadId, companyId },
        });

        if (!review) {
            this.logger.error(`[LAW-VIOLATION] РЎРѕРѕР±С‰РµРЅРёРµ Р±РµР· РІР°Р»РёРґРЅРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚РЅРѕРіРѕ С‚СЂРµРґР°: ${threadId}`);
            return;
        }

        this.logger.log(`[CONSULTING] РўСЂР°СЃСЃРёСЂРѕРІРєР°: РђРІС‚РѕСЂ ${authorId} в†’ Review ${review.id}`);
    }
}

