import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { UserContext } from "./consulting.service";
import { HarvestResultRepository } from "./repositories/harvest-result.repository";
import { HarvestResult, Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { SaveHarvestResultDto } from "./dto/save-harvest-result.dto";

@Injectable()
export class YieldService {
    private readonly logger = new Logger(YieldService.name);

    constructor(
        private readonly repository: HarvestResultRepository,
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    async createOrUpdateHarvestResult(dto: SaveHarvestResultDto, context: UserContext): Promise<HarvestResult> {
        this.logger.log(`[YIELD-SERVICE] Processing harvest result for plan ${dto.planId}`);

        return this.prisma.$transaction(async (tx) => {
            const plan = await tx.harvestPlan.findFirst({
                where: { id: dto.planId, companyId: context.companyId },
                include: {
                    activeBudgetPlan: true,
                    techMaps: { where: { isLatest: true }, take: 1 }
                }
            });

            if (!plan) {
                throw new NotFoundException('План уборки не найден');
            }

            const activeBudget = plan.activeBudgetPlan;
            const costSnapshot = activeBudget?.totalActualAmount ?? 0;
            const budgetPlanId = activeBudget?.id ?? null;
            const budgetVersion = activeBudget?.version ?? null;

            const seasonId = plan.techMaps?.[0]?.seasonId;
            if (!seasonId) {
                throw new BadRequestException('Для сохранения результата сбора необходима привязка к сезону через техкарту');
            }

            const harvestData: Prisma.HarvestResultUncheckedCreateInput = {
                planId: dto.planId,
                fieldId: dto.fieldId,
                crop: dto.crop,
                plannedYield: dto.plannedYield,
                actualYield: dto.actualYield,
                harvestedArea: dto.harvestedArea,
                totalOutput: dto.totalOutput,
                marketPrice: dto.marketPrice,
                qualityClass: dto.qualityClass,
                harvestDate: dto.harvestDate,
                companyId: context.companyId,
                seasonId,
                costSnapshot,
                budgetPlanId,
                budgetVersion,
            };

            const existing = await tx.harvestResult.findFirst({
                where: { planId: dto.planId, companyId: context.companyId }
            });

            let savedResult: HarvestResult;
            if (existing) {
                const updated = await tx.harvestResult.updateMany({
                    where: { id: existing.id, companyId: context.companyId },
                    data: harvestData
                });
                if (updated.count !== 1) {
                    throw new NotFoundException('Результат сбора урожая не найден');
                }
                savedResult = await tx.harvestResult.findFirstOrThrow({
                    where: { id: existing.id, companyId: context.companyId }
                });
            } else {
                savedResult = await tx.harvestResult.create({
                    data: {
                        companyId: context.companyId,
                        seasonId,
                        planId: dto.planId,
                        fieldId: dto.fieldId,
                        crop: dto.crop,
                        plannedYield: dto.plannedYield,
                        actualYield: dto.actualYield,
                        harvestedArea: dto.harvestedArea,
                        totalOutput: dto.totalOutput,
                        marketPrice: dto.marketPrice,
                        qualityClass: dto.qualityClass,
                        harvestDate: dto.harvestDate,
                        costSnapshot,
                        budgetPlanId,
                        budgetVersion,
                    }
                });
            }

            await this.auditService.log({
                action: 'HARVEST_RESULT_RECORDED',
                companyId: context.companyId,
                userId: context.userId,
                metadata: {
                    planId: dto.planId,
                    fieldId: dto.fieldId,
                    actualYield: dto.actualYield,
                    marketPrice: dto.marketPrice,
                    costSnapshot,
                    budgetVersion
                }
            });

            this.logger.log(`[YIELD-SERVICE] Harvest result recorded successfully for plan ${dto.planId}`);
            return savedResult;
        });
    }

    async getHarvestResultByPlan(planId: string, context: UserContext): Promise<HarvestResult> {
        const result = await this.repository.findByPlanId(planId, context.companyId);

        if (!result) {
            throw new NotFoundException('Результат сбора урожая не найден');
        }

        return result;
    }

    async getCompanyYieldSummary(context: UserContext, seasonId: string): Promise<HarvestResult[]> {
        return this.repository.findManyBySeason(seasonId, context.companyId);
    }
}
