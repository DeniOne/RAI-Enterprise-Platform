import { Module } from "@nestjs/common";
import { LearningEventService } from "./services/learning-event.service";
import { DriftAnalysisService } from "./services/drift-analysis.service";
import { ModelRegistryService } from "./services/model-registry.service";
import { CooldownManager } from "./services/cooldown-manager";
import { RetrainingOrchestrator } from "./services/retraining-orchestrator.service";
import { CanaryService } from "./services/canary.service";
import { K8sJobService } from "./services/k8s-job.service";
import { KeyRegistryService } from "./services/key-registry.service";
import { GovernanceService } from "./services/governance.service";
import { AdaptiveLearningController } from "./adaptive-learning.controller";

@Module({
  controllers: [AdaptiveLearningController],
  providers: [
    LearningEventService,
    DriftAnalysisService,
    ModelRegistryService,
    CooldownManager,
    RetrainingOrchestrator,
    CanaryService,
    K8sJobService,
    KeyRegistryService,
    GovernanceService,
  ],
  exports: [
    LearningEventService,
    DriftAnalysisService,
    ModelRegistryService,
    CooldownManager,
    RetrainingOrchestrator,
    CanaryService,
    K8sJobService,
    KeyRegistryService,
    GovernanceService,
  ],
})
export class AdaptiveLearningModule {}
