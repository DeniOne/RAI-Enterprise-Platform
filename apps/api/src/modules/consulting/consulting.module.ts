import { Module } from "@nestjs/common";
import { ConsultingService } from "./consulting.service";
import { ConsultingController } from "./consulting.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";
import { BudgetPlanService } from "./budget-plan.service";
import { ExecutionService } from "./execution.service";
import { ConsultingOrchestrator } from "./consulting.orchestrator";
import { YieldService } from "./yield.service";
import { KpiService } from "./kpi.service";
import { HarvestResultRepository } from "./repositories/harvest-result.repository";
import { YieldOrchestrator } from "./yield.orchestrator";
import { BudgetGeneratorService } from "./budget-generator.service";
import { DeviationService } from "./deviation.service";
import { TechMapService } from "./tech-map.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import { EconomyModule } from "../finance-economy/economy/economy.module";
import { ManagementDecisionService } from "./management-decision.service";
import { StrategicViewService } from "./strategic-view.service";
import { StrategicGoalService } from "./strategic-goal.service";
import { StrategicDecompositionService } from "./strategic-decomposition.service";
import { ScenarioSimulationService } from "./scenario-simulation.service";
import { StrategicAdvisoryService } from "./strategic-advisory.service";
import { CashFlowService } from "./cash-flow.service";
import { LiquidityRiskService } from "./liquidity-risk.service";
import { OutboxModule } from "../../shared/outbox/outbox.module";

@Module({
  imports: [PrismaModule, CmrModule, EconomyModule, OutboxModule],
  controllers: [ConsultingController],
  providers: [
    ConsultingService,
    BudgetPlanService,
    ConsultingDomainRules,
    ExecutionService,
    ConsultingOrchestrator,
    YieldService,
    KpiService,
    HarvestResultRepository,
    YieldOrchestrator,
    UnitNormalizationService,
    TechMapValidator,
    TechMapService,
    BudgetGeneratorService,
    DeviationService,
    ManagementDecisionService,
    StrategicViewService,
    StrategicGoalService,
    StrategicDecompositionService,
    ScenarioSimulationService,
    StrategicAdvisoryService,
    CashFlowService,
    LiquidityRiskService,
  ],
  exports: [
    ConsultingService,
    BudgetPlanService,
    ExecutionService,
    ManagementDecisionService,
    StrategicViewService,
    StrategicGoalService,
    StrategicDecompositionService,
    ScenarioSimulationService,
    StrategicAdvisoryService,
    CashFlowService,
    LiquidityRiskService,
  ],
})
export class ConsultingModule {}
