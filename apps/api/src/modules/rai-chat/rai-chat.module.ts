import { Module } from "@nestjs/common";
import { RaiChatController } from "./rai-chat.controller";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { AgroToolsRegistry } from "./tools/agro-tools.registry";
import { FinanceToolsRegistry } from "./tools/finance-tools.registry";
import { RiskToolsRegistry } from "./tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "./tools/knowledge-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { EconomistAgent } from "./agents/economist-agent.service";
import { KnowledgeAgent } from "./agents/knowledge-agent.service";
import { AgroDeterministicEngineFacade } from "./deterministic/agro-deterministic.facade";
import { BudgetControllerService } from "./security/budget-controller.service";
import { RiskPolicyEngineService } from "./security/risk-policy-engine.service";
import { PendingActionService } from "./security/pending-action.service";
import { SensitiveDataFilterService } from "./security/sensitive-data-filter.service";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { SatelliteModule } from "../satellite/satellite.module";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { SupervisorAgent } from "./supervisor-agent.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { TechMapModule } from "../tech-map/tech-map.module";
import { ConsultingModule } from "../consulting/consulting.module";
import { AgroEventsModule } from "../agro-events/agro-events.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AgentScoreCardService } from "./eval/agent-scorecard.service";
import { GoldenTestRunnerService } from "./eval/golden-test-runner.service";
import { MonitoringAgent } from "./agents/monitoring-agent.service";
import { MonitoringTriggerService } from "./monitoring-trigger.service";
import { TraceSummaryService } from "./trace-summary.service";
import { TruthfulnessEngineService } from "./truthfulness-engine.service";
import { QualityAlertingService } from "./quality-alerting.service";

@Module({
  imports: [
    AuthModule,
    TenantContextModule,
    SatelliteModule,
    TechMapModule,
    ConsultingModule,
    AgroEventsModule,
    PrismaModule,
  ],
  controllers: [RaiChatController],
  providers: [
    IntentRouterService,
    AgroDeterministicEngineFacade,
    BudgetControllerService,
    RiskPolicyEngineService,
    PendingActionService,
    SensitiveDataFilterService,
    AgroToolsRegistry,
    FinanceToolsRegistry,
    RiskToolsRegistry,
    KnowledgeToolsRegistry,
    AgronomAgent,
    EconomistAgent,
    KnowledgeAgent,
    MemoryCoordinatorService,
    AgentRuntimeService,
    ResponseComposerService,
    RaiChatService,
    SupervisorAgent,
    RaiToolsRegistry,
    ExternalSignalsService,
    RaiChatWidgetBuilder,
    AgentScoreCardService,
    GoldenTestRunnerService,
    MonitoringAgent,
    MonitoringTriggerService,
    TraceSummaryService,
    TruthfulnessEngineService,
    QualityAlertingService,
  ],
})
export class RaiChatModule {}
