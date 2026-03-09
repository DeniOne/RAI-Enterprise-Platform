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
import { CrmToolsRegistry } from "./tools/crm-tools.registry";
import { FrontOfficeToolsRegistry } from "./tools/front-office-tools.registry";
import { ContractsToolsRegistry } from "./tools/contracts-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { EconomistAgent } from "./agents/economist-agent.service";
import { KnowledgeAgent } from "./agents/knowledge-agent.service";
import { CrmAgent } from "./agents/crm-agent.service";
import { FrontOfficeAgent } from "./agents/front-office-agent.service";
import { ContractsAgent } from "./agents/contracts-agent.service";
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
import { AutonomyPolicyService } from "./autonomy-policy.service";
import { AgentReputationService } from "./agent-reputation.service";
import { FeedbackCredibilityService } from "./feedback-credibility.service";
import { IncidentOpsService } from "./incident-ops.service";
import { IncidentsGovernanceController } from "./incidents-governance.controller";
import { PerformanceMetricsService } from "./performance/performance-metrics.service";
import { QueueMetricsService } from "./performance/queue-metrics.service";
import { SafeReplayService } from "./safe-replay.service";
import { AgentRuntimeConfigService } from "./agent-runtime-config.service";
import { AgentRegistryService } from "./agent-registry.service";
import { MemoryModule } from "../../shared/memory/memory.module";
import { OpenRouterGatewayService } from "./agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "./agent-platform/agent-prompt-assembly.service";
import { AgentExecutionAdapterService } from "./runtime/agent-execution-adapter.service";
import { CrmModule } from "../crm/crm.module";
import { CommerceModule } from "../commerce/commerce.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { RuntimeGovernancePolicyService } from "./runtime-governance/runtime-governance-policy.service";
import { RuntimeGovernanceEventService } from "./runtime-governance/runtime-governance-event.service";
import { AgentReliabilityService } from "./runtime-governance/agent-reliability.service";
import { RuntimeGovernanceRecommendationService } from "./runtime-governance/runtime-governance-recommendation.service";
import { RuntimeGovernanceFeatureFlagsService } from "./runtime-governance/runtime-governance-feature-flags.service";
import { RuntimeGovernanceAutomationService } from "./runtime-governance/runtime-governance-automation.service";
import { RuntimeGovernanceOverrideService } from "./runtime-governance/runtime-governance-override.service";

@Module({
  imports: [
    AuthModule,
    TenantContextModule,
    MemoryModule,
    SatelliteModule,
    TechMapModule,
    ConsultingModule,
    AgroEventsModule,
    PrismaModule,
    CrmModule,
    CommerceModule,
    AuditModule,
  ],
  controllers: [RaiChatController, IncidentsGovernanceController],
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
    CrmToolsRegistry,
    FrontOfficeToolsRegistry,
    ContractsToolsRegistry,
    AgronomAgent,
    EconomistAgent,
    KnowledgeAgent,
    CrmAgent,
    FrontOfficeAgent,
    ContractsAgent,
    MemoryCoordinatorService,
    AgentRuntimeService,
    AgentExecutionAdapterService,
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
    AutonomyPolicyService,
    AgentReputationService,
    FeedbackCredibilityService,
    IncidentOpsService,
    PerformanceMetricsService,
    QueueMetricsService,
    SafeReplayService,
    AgentRegistryService,
    AgentRuntimeConfigService,
    OpenRouterGatewayService,
    AgentPromptAssemblyService,
    RuntimeGovernancePolicyService,
    RuntimeGovernanceFeatureFlagsService,
    RuntimeGovernanceEventService,
    RuntimeGovernanceOverrideService,
    AgentReliabilityService,
    RuntimeGovernanceRecommendationService,
    RuntimeGovernanceAutomationService,
  ],
  exports: [
    FrontOfficeToolsRegistry,
    FrontOfficeAgent,
    SafeReplayService,
    PerformanceMetricsService,
    QueueMetricsService,
    GoldenTestRunnerService,
    AgentRegistryService,
    IncidentOpsService,
    AutonomyPolicyService,
    RuntimeGovernancePolicyService,
    RuntimeGovernanceFeatureFlagsService,
    RuntimeGovernanceEventService,
    RuntimeGovernanceOverrideService,
    AgentReliabilityService,
    RuntimeGovernanceRecommendationService,
    RuntimeGovernanceAutomationService,
  ],
})
export class RaiChatModule {}
