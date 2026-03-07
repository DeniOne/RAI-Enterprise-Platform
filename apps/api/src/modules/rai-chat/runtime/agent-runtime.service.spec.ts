import { Test, TestingModule } from "@nestjs/testing";
import { AgentRuntimeService } from "./agent-runtime.service";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { RaiToolName } from "../tools/rai-tools.types";
import { PerformanceMetricsService } from "../performance/performance-metrics.service";
import { QueueMetricsService } from "../performance/queue-metrics.service";
import { AgentConfigBlockedError } from "../security/agent-config-blocked.error";
import { BudgetControllerService } from "../security/budget-controller.service";
import { IncidentOpsService } from "../incident-ops.service";

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
    }),
  };
  const incidentOpsMock = {
    logIncident: jest.fn(),
  };
  const queueMetricsMock = {
    beginRuntimeExecution: jest.fn().mockResolvedValue(undefined),
    endRuntimeExecution: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRuntimeService,
        { provide: RaiToolsRegistry, useValue: toolsRegistryMock },
        { provide: PerformanceMetricsService, useValue: performanceMetricsMock },
        { provide: QueueMetricsService, useValue: queueMetricsMock },
        { provide: BudgetControllerService, useValue: budgetControllerMock },
        { provide: IncidentOpsService, useValue: incidentOpsMock },
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
});
