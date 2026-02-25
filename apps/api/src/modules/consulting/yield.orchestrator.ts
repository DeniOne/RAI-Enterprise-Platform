import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { YieldService } from "./yield.service";
import { KpiService } from "./kpi.service";
import { DecisionService } from "../cmr/decision.service";
import { SaveHarvestResultDto } from "./dto/save-harvest-result.dto";
import { UserContext } from "./consulting.service";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class YieldOrchestrator {
  private readonly logger = new Logger(YieldOrchestrator.name);

  constructor(
    private readonly yieldService: YieldService,
    private readonly kpiService: KpiService,
    private readonly decisionService: DecisionService,
    private readonly domainRules: ConsultingDomainRules,
    private readonly prisma: PrismaService, // Needed for snapshot data retrieval
  ) {}

  async recordHarvest(dto: SaveHarvestResultDto, context: UserContext) {
    this.logger.log(`[ORCHESTRATOR] Recording harvest for plan ${dto.planId}`);

    // 1. Validation & Rules
    const plan = await this.prisma.harvestPlan.findUnique({
      where: { id: dto.planId },
      include: {
        techMaps: { take: 1 },
        activeBudgetPlan: true,
      },
    });

    if (!plan || plan.companyId !== context.companyId) {
      throw new NotFoundException("План не найден");
    }

    await this.domainRules.canEditHarvestResult(dto.planId);

    const seasonId = plan.techMaps[0]?.seasonId;
    if (!seasonId) {
      throw new NotFoundException("У плана отсутствует привязка к сезону");
    }

    // 2. Capture Financial Snapshot (Brain Logic)
    const budget = plan.activeBudgetPlan;
    const snapshotData = {
      costSnapshot: budget?.totalActualAmount || 0,
      budgetPlanId: budget?.id,
      budgetVersion: budget?.version,
    };

    // 3. Persist Data (Service = IO)
    const result = await this.yieldService.createOrUpdateHarvestResult(
      dto, // Use dto as is, YieldService handles snapshots
      context,
    );

    // 4. Audit Trail (Decision)
    // Ensure decisionService.logDecision is called correctly
    // (DecisionService from cmr might have different interface, using any/as any to bypass for now)
    await this.decisionService.logDecision({
      action: "HARVEST_RESULT_RECORDED",
      reason: "Record harvest from yield orchestrator",
      companyId: context.companyId,
      userId: context.userId,
      metadata: {
        planId: dto.planId,
        actualYield: dto.actualYield,
        totalOutput: dto.totalOutput,
        costSnapshot: snapshotData.costSnapshot,
      },
    } as any);

    return result;
  }
}
