import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { UserContext } from "./consulting.service";
import { SaveHarvestResultDto } from "./dto/save-harvest-result.dto";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";

@Injectable()
export class YieldService {
    private readonly logger = new Logger(YieldService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly domainRules: ConsultingDomainRules,
    ) { }

    async createOrUpdateHarvestResult(dto: SaveHarvestResultDto, context: UserContext) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: dto.planId },
            include: {
                techMaps: { take: 1 },
                activeBudgetPlan: true
            }
        });

        if (!plan || plan.companyId !== context.companyId) {
            throw new NotFoundException('План не найден');
        }

        // Domain Protection: План не должен быть ARCHIVED
        await this.domainRules.canEditHarvestResult(dto.planId);

        const seasonId = plan.techMaps[0]?.seasonId;
        if (!seasonId) {
            this.logger.error(`[YIELD] Plan ${dto.planId} has no season linked via techMap`);
            throw new NotFoundException('У плана отсутствует привязка к сезону через техкарту');
        }

        // Снимаем финансовый снепшот (Fix: Determinism)
        const budget = plan.activeBudgetPlan;
        const snapshotData = {
            costSnapshot: budget?.totalActualAmount || 0,
            budgetPlanId: budget?.id,
            budgetVersion: budget?.version
        };

        // UPSERT logic: один результат на план
        const existing = await this.prisma.harvestResult.findFirst({
            where: { planId: dto.planId }
        });

        if (existing) {
            return this.prisma.harvestResult.update({
                where: { id: existing.id },
                data: {
                    ...dto,
                    ...snapshotData,
                    seasonId,
                }
            });
        }

        return this.prisma.harvestResult.create({
            data: {
                ...dto,
                ...snapshotData,
                seasonId,
                companyId: context.companyId,
            }
        });
    }

    async getHarvestResultByPlan(planId: string, context: UserContext) {
        const result = await this.prisma.harvestResult.findFirst({
            where: { planId, companyId: context.companyId }
        });

        if (!result) {
            throw new NotFoundException('Результат сбора урожая не найден');
        }

        return result;
    }

    async getCompanyYieldSummary(context: UserContext, seasonId: string) {
        return this.prisma.harvestResult.findMany({
            where: { companyId: context.companyId, seasonId }
        });
    }
}
