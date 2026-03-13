import { Test, TestingModule } from "@nestjs/testing";
import { AgentRuntimeService } from "./agent-runtime.service";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { RaiToolName } from "../tools/rai-tools.types";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentConfigBlockedError } from "../../../shared/rai-chat/security/agent-config-blocked.error";
import { BudgetControllerService } from "../security/budget-controller.service";
import { IncidentOpsService } from "../incident-ops.service";
import { AgentRuntimeConfigService } from "../agent-runtime-config.service";
import { AgronomAgent } from "../agents/agronom-agent.service";
import { EconomistAgent } from "../agents/economist-agent.service";
import { KnowledgeAgent } from "../agents/knowledge-agent.service";
import { MonitoringAgent } from "../agents/monitoring-agent.service";
import { AgentExecutionAdapterService } from "./agent-execution-adapter.service";
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";
import { CrmAgent } from "../agents/crm-agent.service";
import { FrontOfficeAgent } from "../agents/front-office-agent.service";
import { ContractsAgent } from "../agents/contracts-agent.service";
import { ChiefAgronomistAgent } from "../agents/chief-agronomist-agent.service";
import { DataScientistAgent } from "../agents/data-scientist-agent.service";
import { RuntimeGovernanceEventService } from "../runtime-governance/runtime-governance-event.service";
import { RuntimeGovernancePolicyService } from "../runtime-governance/runtime-governance-policy.service";

describe("AgentRuntimeService", () => {
  let service: AgentRuntimeService;
  const toolsRegistryMock = {
    execute: jest.fn().mockResolvedValue({ echoedMessage: "hi", companyId: "c1" }),
  };
  const performanceMetricsMock = {
    recordLatency: jest.fn().mockResolvedValue(undefined),
    recordError: jest.fn().mockResolvedValue(undefined),
  };
  const budgetControllerMock = {
    evaluateRuntimeBudget: jest.fn().mockResolvedValue({
      outcome: "ALLOW",
      reason: "WITHIN_BUDGET",
      source: "agent_registry_max_tokens",
      estimatedTokens: 300,
      budgetLimit: 4000,
      allowedToolNames: [RaiToolName.EchoMessage],
      droppedToolNames: [],
      ownerRoles: ["knowledge"],
      fallbackReason: "NONE",
      fallbackMode: "NONE",
    }),
  };
  const incidentOpsMock = {
    logIncident: jest.fn(),
  };
  const queueMetricsMock = {
    beginRuntimeExecution: jest.fn().mockResolvedValue(undefined),
    endRuntimeExecution: jest.fn().mockResolvedValue(undefined),
    getQueuePressure: jest.fn().mockResolvedValue({
      pressureState: "STABLE",
      signalFresh: true,
      totalBacklog: 1,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [],
    }),
  };
  const agentRuntimeConfigMock = {
    getEffectiveKernel: jest.fn().mockResolvedValue({
      definition: {
        role: "knowledge",
        defaultAutonomyMode: "advisory",
      },
      runtimeProfile: {
        provider: "openrouter",
        model: "openrouter/knowledge",
        responseSchemaVersion: "v1",
      },
      outputContract: {
        contractId: "knowledge-v1",
        responseSchemaVersion: "v1",
        requiresEvidence: true,
        requiresDeterministicValidation: false,
      },
      toolBindings: [
        {
          toolName: RaiToolName.QueryKnowledge,
          isEnabled: true,
        },
      ],
      connectorBindings: [],
      isActive: true,
    }),
  };
  const agronomAgentMock = { run: jest.fn() };
  const economistAgentMock = { run: jest.fn() };
  const knowledgeAgentMock = {
    run: jest.fn().mockResolvedValue({
      status: "COMPLETED",
      explain: "Grounded answer",
      data: { hits: 1, items: [{ content: "doc", score: 0.9 }] },
      evidence: [
        {
          claim: "grounded",
          sourceType: "DOC",
          sourceId: "knowledge_item_1",
          confidenceScore: 0.9,
        },
      ],
      fallbackUsed: false,
    }),
  };
  const monitoringAgentMock = { run: jest.fn() };
  const crmAgentMock = { run: jest.fn() };
  const frontOfficeAgentMock = { run: jest.fn() };
  const contractsAgentMock = { run: jest.fn() };
  const chiefAgronomistAgentMock = { run: jest.fn() };
  const dataScientistAgentMock = { run: jest.fn() };
  const runtimeGovernanceEventsMock = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const runtimeGovernancePolicyMock = {
    getRolePolicy: jest.fn().mockReturnValue({
      concurrency: {
        maxParallelToolCalls: 8,
        maxParallelGroups: 6,
        deadlineMs: 30_000,
      },
      thresholds: {
        queueSaturationThreshold: "SATURATED",
      },
    }),
    resolveFallbackMode: jest.fn().mockReturnValue("READ_ONLY_SUPPORT"),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.RAI_AGENT_RUNTIME_MODE;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRuntimeService,
        { provide: RaiToolsRegistry, useValue: toolsRegistryMock },
        { provide: PerformanceMetricsService, useValue: performanceMetricsMock },
        { provide: QueueMetricsService, useValue: queueMetricsMock },
        { provide: BudgetControllerService, useValue: budgetControllerMock },
        { provide: IncidentOpsService, useValue: incidentOpsMock },
        { provide: AgentRuntimeConfigService, useValue: agentRuntimeConfigMock },
        AgentExecutionAdapterService,
        RuntimeGovernanceControlService,
        { provide: AgronomAgent, useValue: agronomAgentMock },
        { provide: EconomistAgent, useValue: economistAgentMock },
        { provide: KnowledgeAgent, useValue: knowledgeAgentMock },
        { provide: MonitoringAgent, useValue: monitoringAgentMock },
        { provide: CrmAgent, useValue: crmAgentMock },
        { provide: FrontOfficeAgent, useValue: frontOfficeAgentMock },
        { provide: ContractsAgent, useValue: contractsAgentMock },
        { provide: ChiefAgronomistAgent, useValue: chiefAgronomistAgentMock },
        { provide: DataScientistAgent, useValue: dataScientistAgentMock },
        { provide: RuntimeGovernanceEventService, useValue: runtimeGovernanceEventsMock },
        { provide: RuntimeGovernancePolicyService, useValue: runtimeGovernancePolicyMock },
      ],
    }).compile();
    service = module.get(AgentRuntimeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("run returns executedTools array (other)", async () => {
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.EchoMessage, payload: { message: "hi" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(1);
    expect(result.executedTools[0].name).toBe(RaiToolName.EchoMessage);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.EchoMessage,
      { message: "hi" },
      { companyId: "c1", traceId: "tr_1" },
    );
    expect(performanceMetricsMock.recordLatency).toHaveBeenCalledWith(
      "c1",
      expect.any(Number),
      "RuntimeAgent",
      RaiToolName.EchoMessage,
    );
    expect(result.runtimeBudget?.outcome).toBe("ALLOW");
    expect(queueMetricsMock.beginRuntimeExecution).toHaveBeenCalledWith("c1", 1);
    expect(queueMetricsMock.endRuntimeExecution).toHaveBeenCalledWith("c1", 1);
  });

  it("fan-out: agronom и economist вызываются через registry параллельно", async () => {
    toolsRegistryMock.execute
      .mockResolvedValueOnce({ draftId: "d1", status: "DRAFT" })
      .mockResolvedValueOnce({ planId: "p1", roi: 0 });
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.GenerateTechMapDraft, payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" } },
        { name: RaiToolName.ComputePlanFact, payload: { scope: { seasonId: "s1" } } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(2);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.GenerateTechMapDraft,
      expect.objectContaining({ fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" }),
      expect.any(Object),
    );
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.ComputePlanFact,
      expect.objectContaining({ scope: { seasonId: "s1" } }),
      expect.any(Object),
    );
    expect(performanceMetricsMock.recordLatency).toHaveBeenCalledWith(
      "c1",
      expect.any(Number),
      "AgronomAgent",
      RaiToolName.GenerateTechMapDraft,
    );
    expect(performanceMetricsMock.recordLatency).toHaveBeenCalledWith(
      "c1",
      expect.any(Number),
      "EconomistAgent",
      RaiToolName.ComputePlanFact,
    );
  });

  it("fan-out: knowledge вызывается при QueryKnowledge", async () => {
    toolsRegistryMock.execute.mockResolvedValueOnce({ hits: 2, items: [] });
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.QueryKnowledge, payload: { query: "нормы высева рапса" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(1);
    expect(result.executedTools[0].name).toBe(RaiToolName.QueryKnowledge);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.QueryKnowledge,
      { query: "нормы высева рапса" },
      expect.any(Object),
    );
    expect(performanceMetricsMock.recordLatency).toHaveBeenCalledWith(
      "c1",
      expect.any(Number),
      "KnowledgeAgent",
      RaiToolName.QueryKnowledge,
    );
  });

  it("returns blocked result when agent config denies tool", async () => {
    toolsRegistryMock.execute.mockRejectedValueOnce(
      new AgentConfigBlockedError(
        "AGENT_DISABLED",
        RaiToolName.GenerateTechMapDraft,
        "agent disabled",
      ),
    );

    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.GenerateTechMapDraft, payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });

    expect(result.executedTools).toEqual([
      {
        name: RaiToolName.GenerateTechMapDraft,
        result: expect.objectContaining({
          agentConfigBlocked: true,
          reasonCode: "AGENT_DISABLED",
        }),
      },
    ]);
  });

  it("degrades runtime and drops over-budget secondary tools", async () => {
    budgetControllerMock.evaluateRuntimeBudget.mockResolvedValueOnce({
      outcome: "DEGRADE",
      reason: "TOKEN_BUDGET_DEGRADED",
      source: "agent_registry_max_tokens",
      estimatedTokens: 3500,
      budgetLimit: 4000,
      allowedToolNames: [RaiToolName.QueryKnowledge],
      droppedToolNames: [RaiToolName.QueryKnowledge],
      ownerRoles: ["knowledge"],
      fallbackReason: "BUDGET_DEGRADED",
      fallbackMode: "READ_ONLY_SUPPORT",
    });
    toolsRegistryMock.execute.mockResolvedValueOnce({ hits: 1, items: [] });

    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.QueryKnowledge, payload: { query: "A" } },
        { name: RaiToolName.QueryKnowledge, payload: { query: "B" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });

    expect(result.runtimeBudget?.outcome).toBe("DEGRADE");
    expect(result.executedTools).toHaveLength(1);
    expect(toolsRegistryMock.execute).toHaveBeenCalledTimes(1);
    expect(incidentOpsMock.logIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ subtype: "BUDGET_RUNTIME_DEGRADED" }),
      }),
    );
  });

  it("records queue saturation and degrades concurrency envelope before execution", async () => {
    queueMetricsMock.getQueuePressure.mockResolvedValueOnce({
      pressureState: "SATURATED",
      signalFresh: true,
      totalBacklog: 12,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [],
    });
    toolsRegistryMock.execute
      .mockResolvedValueOnce({ echoedMessage: "a" })
      .mockResolvedValueOnce({ echoedMessage: "b" });

    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.EchoMessage, payload: { message: "a" } },
        { name: RaiToolName.EchoMessage, payload: { message: "b" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_sat" },
    });

    expect(result.executedTools).toHaveLength(2);
    expect(queueMetricsMock.getQueuePressure).toHaveBeenCalledWith(
      "c1",
      5 * 60 * 1000,
    );
    expect(runtimeGovernanceEventsMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        traceId: "tr_sat",
        eventType: "QUEUE_SATURATION_DETECTED",
      }),
    );
  });

  it("denies runtime before tool execution when budget controller blocks execution", async () => {
    budgetControllerMock.evaluateRuntimeBudget.mockResolvedValueOnce({
      outcome: "DENY",
      reason: "TOKEN_BUDGET_EXCEEDED:agronomist:generate_tech_map_draft",
      source: "agent_registry_max_tokens",
      estimatedTokens: 9000,
      budgetLimit: 8000,
      allowedToolNames: [],
      droppedToolNames: [RaiToolName.GenerateTechMapDraft],
      ownerRoles: ["agronomist"],
      fallbackReason: "BUDGET_DENIED",
      fallbackMode: "MANUAL_HUMAN_REQUIRED",
    });

    const result = await service.run({
      requestedToolCalls: [
        {
          name: RaiToolName.GenerateTechMapDraft,
          payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" },
        },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });

    expect(result.executedTools).toEqual([]);
    expect(result.runtimeBudget?.outcome).toBe("DENY");
    expect(toolsRegistryMock.execute).not.toHaveBeenCalled();
    expect(incidentOpsMock.logIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ subtype: "BUDGET_RUNTIME_DENIED" }),
      }),
    );
  });

  it("executeAgent returns structured agent execution in hybrid mode", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";

    const result = await service.executeAgent(
      {
        role: "knowledge",
        message: "что известно про рапс",
        memoryContext: { profile: {}, recalledEpisodes: [] },
        requestedTools: [
          { name: RaiToolName.QueryKnowledge, payload: { query: "рапс" } },
        ],
        traceId: "tr_2",
        threadId: "th_2",
      },
      { companyId: "c1", traceId: "tr_2" },
    );

    expect(agentRuntimeConfigMock.getEffectiveKernel).toHaveBeenCalledWith(
      "c1",
      "knowledge",
    );
    expect(knowledgeAgentMock.run).toHaveBeenCalled();
    expect(result.agentExecution).toMatchObject({
      role: "knowledge",
      text: "Grounded answer",
      fallbackUsed: false,
      outputContractVersion: "v1",
      validation: { passed: true, reasons: [] },
    });
    expect(result.executedTools).toEqual([
      {
        name: RaiToolName.QueryKnowledge,
        result: { hits: 1, items: [{ content: "doc", score: 0.9 }] },
      },
    ]);
  });

  it("does not require evidence when agronom agent returns NEEDS_MORE_DATA", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    agentRuntimeConfigMock.getEffectiveKernel.mockResolvedValueOnce({
      definition: {
        role: "agronomist",
        defaultAutonomyMode: "advisory",
      },
      runtimeProfile: {
        provider: "openrouter",
        model: "openrouter/agronom",
        responseSchemaVersion: "v1",
      },
      outputContract: {
        contractId: "agronom-v1",
        responseSchemaVersion: "v1",
        requiresEvidence: true,
        requiresDeterministicValidation: true,
      },
      toolBindings: [
        {
          toolName: RaiToolName.GenerateTechMapDraft,
          isEnabled: true,
        },
      ],
      connectorBindings: [],
      isActive: true,
    });
    agronomAgentMock.run.mockResolvedValueOnce({
      status: "NEEDS_MORE_DATA",
      explain: "Не хватает контекста: fieldRef, seasonRef",
      data: {},
      missingContext: ["fieldRef", "seasonRef"],
      mathBasis: [],
      evidence: [],
      fallbackUsed: false,
      toolCallsCount: 0,
    });

    const result = await service.executeAgent(
      {
        role: "agronomist",
        message: "prepare tech map",
        memoryContext: { profile: {}, recalledEpisodes: [] },
        requestedTools: [],
        traceId: "tr_3",
        threadId: "th_3",
      },
      { companyId: "c1", traceId: "tr_3" },
    );

    expect(result.agentExecution).toMatchObject({
      role: "agronomist",
      validation: { passed: true, reasons: [] },
    });
  });

  it("does not require evidence for knowledge no-hit responses with explicit uncertainty", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    knowledgeAgentMock.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "По запросу ничего не найдено в базе знаний.",
      data: { hits: 0, items: [] },
      evidence: [],
      fallbackUsed: true,
    });

    const result = await service.executeAgent(
      {
        role: "knowledge",
        message: "unknown topic",
        memoryContext: { profile: {}, recalledEpisodes: [] },
        requestedTools: [],
        traceId: "tr_4",
        threadId: "th_4",
      },
      { companyId: "c1", traceId: "tr_4" },
    );

    expect(result.agentExecution).toMatchObject({
      role: "knowledge",
      validation: { passed: true, reasons: [] },
      fallbackUsed: true,
    });
  });

  it("executes future role through executionAdapterRole binding without hardcoded runtime branch", async () => {
    process.env.RAI_AGENT_RUNTIME_MODE = "agent-first-hybrid";
    agentRuntimeConfigMock.getEffectiveKernel.mockResolvedValueOnce({
      definition: {
        role: "marketer",
        defaultAutonomyMode: "advisory",
      },
      runtimeProfile: {
        provider: "openrouter",
        model: "openrouter/marketing",
        executionAdapterRole: "knowledge",
      },
      outputContract: {
        contractId: "marketer-v1",
        responseSchemaVersion: "v1",
        requiresEvidence: true,
        requiresDeterministicValidation: false,
      },
      toolBindings: [],
      connectorBindings: [],
      isActive: true,
    });

    const result = await service.executeAgent(
      {
        role: "marketer",
        message: "подбери идеи для кампании по рапсу",
        memoryContext: { profile: {}, recalledEpisodes: [] },
        requestedTools: [],
        traceId: "tr_5",
        threadId: "th_5",
      },
      { companyId: "c1", traceId: "tr_5" },
    );

    expect(agentRuntimeConfigMock.getEffectiveKernel).toHaveBeenCalledWith("c1", "marketer");
    expect(knowledgeAgentMock.run).toHaveBeenCalled();
    expect(result.agentExecution).toMatchObject({
      role: "marketer",
      text: "Grounded answer",
      outputContractVersion: "v1",
    });
  });
});
