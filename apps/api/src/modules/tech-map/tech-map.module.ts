import { Module } from "@nestjs/common";
import { TechMapService } from "./tech-map.service";
import { TechMapController } from "./tech-map.controller";
import { IntegrityModule } from "../integrity/integrity.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { DAGValidationService } from "./validation/dag-validation.service";
import { TechMapValidationEngine } from "./validation/techmap-validation.engine";
import { TankMixCompatibilityService } from "./validation/tank-mix-compatibility.service";
import { EvidenceService } from "./evidence/evidence.service";
import { ChangeOrderService } from "./change-order/change-order.service";
import { TriggerEvaluationService } from "./adaptive-rules/trigger-evaluation.service";
import { RegionProfileService } from "./adaptive-rules/region-profile.service";
import { HybridPhenologyService } from "./adaptive-rules/hybrid-phenology.service";
import { TechMapBudgetService } from "./economics/tech-map-budget.service";
import { TechMapKPIService } from "./economics/tech-map-kpi.service";
import { ContractCoreService } from "./economics/contract-core.service";
import { RecalculationEngine } from "./economics/recalculation.engine";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [PrismaModule, IntegrityModule, IdempotencyModule],
  controllers: [TechMapController],
  providers: [
    TechMapService,
    TechMapStateMachine,
    DAGValidationService,
    TechMapValidationEngine,
    TankMixCompatibilityService,
    EvidenceService,
    ChangeOrderService,
    TriggerEvaluationService,
    RegionProfileService,
    HybridPhenologyService,
    TechMapBudgetService,
    TechMapKPIService,
    ContractCoreService,
    RecalculationEngine,
    UnitNormalizationService,
    TechMapValidator,
    TechMapWorkflowOrchestratorService,
  ],
  exports: [
    TechMapService,
    EvidenceService,
    ChangeOrderService,
    TriggerEvaluationService,
    TechMapBudgetService,
    TechMapKPIService,
    ContractCoreService,
    UnitNormalizationService,
    TechMapValidator,
    TechMapWorkflowOrchestratorService,
  ],
})
export class TechMapModule { }
