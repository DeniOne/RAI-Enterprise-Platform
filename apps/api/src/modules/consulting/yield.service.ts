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

    /**
     * Сохраняет результат сбора урожая с фиксацией снапшотов для детерминированного KPI.
     */
    async createOrUpdateHarvestResult(dto: SaveHarvestResultDto, context: UserContext): Promise<HarvestResult> {
        this.logger.log(`[YIELD-SERVICE] Processing harvest result for plan ${dto.planId}`);

        return this.prisma.$transaction(async (tx) => {
            // 1. Получаем активный бюджетный план для снятия снапшота затрат
            const plan = await tx.harvestPlan.findUnique({
                where: { id: dto.planId },
                include: {
                    activeBudgetPlan: true,
                    techMaps: { where: { isLatest: true }, take: 1 }
                }
            });

            if (!plan || plan.companyId !== context.companyId) {
                throw new NotFoundException('План уборки не найден');
            }

            const activeBudget = plan.activeBudgetPlan;
            const costSnapshot = activeBudget?.totalActualAmount ?? 0;
            const budgetPlanId = activeBudget?.id ?? null;
            const budgetVersion = activeBudget?.version ?? null;

            // 2. Подготовка данных с учетом снапшотов
            const seasonId = plan.techMaps?.[0]?.seasonId;
            if (!seasonId) {
                throw new BadRequestException('Для сохранения результата сбора необходима привязка к сезону через техкарту');
            }

            const harvestData: Prisma.HarvestResultUncheckedCreateInput = {
                ...dto,
                companyId: context.companyId,
                seasonId,
                costSnapshot,
                budgetPlanId,
                budgetVersion,
            };

            // 3. Сохранение (Upsert через репозиторий, используя транзакционный клиент)
            // Примечание: Мы используем tx для всех операций внутри транзакции
            const existing = await tx.harvestResult.findFirst({
                where: { planId: dto.planId, companyId: context.companyId }
            });

            let savedResult: HarvestResult;
            if (existing) {
                savedResult = await tx.harvestResult.update({
                    where: { id: existing.id },
                    data: harvestData
                });
            } else {
                savedResult = await tx.harvestResult.create({
                    data: harvestData
                });
            }

            // 4. Логирование аудита внутри транзакции
            await this.auditService.log({
                action: 'HARVEST_RESULT_RECORDED',
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
