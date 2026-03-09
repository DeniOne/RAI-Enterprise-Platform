import { Module } from "@nestjs/common";
import { ExplainabilityPanelController } from "./explainability-panel.controller";
import { AgentsConfigController } from "./agents-config.controller";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { CostAnalyticsService } from "./cost-analytics.service";
import { TraceTopologyService } from "./trace-topology.service";
import { AgentManagementService } from "./agent-management.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { AgentConfigGuardService } from "./agent-config-guard.service";
import { AdaptiveLearningModule } from "../adaptive-learning/adaptive-learning.module";
import { AgentPromptGovernanceService } from "./agent-prompt-governance.service";
import { RuntimeGovernanceReadModelService } from "./runtime-governance-read-model.service";

@Module({
  imports: [
    AuthModule,
    TenantContextModule,
    PrismaModule,
    RaiChatModule,
    AdaptiveLearningModule,
  ],
  controllers: [ExplainabilityPanelController, AgentsConfigController],
  providers: [
    ExplainabilityPanelService,
    CostAnalyticsService,
    TraceTopologyService,
    SensitiveDataFilterService,
    AgentManagementService,
    AgentConfigGuardService,
    AgentPromptGovernanceService,
    RuntimeGovernanceReadModelService,
  ],
})
export class ExplainabilityPanelModule {}
