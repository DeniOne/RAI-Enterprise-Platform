import { AgentExecutionAdapterService } from "./agent-execution-adapter.service";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";

describe("AgentExecutionAdapterService", () => {
  const agronomAgent = { run: jest.fn() };
  const economistAgent = { run: jest.fn() };
  const knowledgeAgent = { run: jest.fn() };
  const monitoringAgent = { run: jest.fn() };
  const crmAgent = { run: jest.fn() };
  const frontOfficeAgent = { run: jest.fn() };
  const contractsAgent = { run: jest.fn() };
  const chiefAgronomistAgent = { run: jest.fn() };
  const dataScientistAgent = { run: jest.fn() };

  const service = new AgentExecutionAdapterService(
    agronomAgent as any,
    economistAgent as any,
    knowledgeAgent as any,
    monitoringAgent as any,
    crmAgent as any,
    frontOfficeAgent as any,
    contractsAgent as any,
    chiefAgronomistAgent as any,
    dataScientistAgent as any,
  );

  const baseKernel = {
    definition: { defaultAutonomyMode: "advisory" },
    runtimeProfile: {
      model: "openrouter/test",
      provider: "openrouter",
      executionAdapterRole: "agronomist",
    },
    toolBindings: [],
    connectorBindings: [],
    outputContract: {
      contractId: "agronom-v1",
      responseSchemaVersion: "v1",
      requiresEvidence: false,
      requiresDeterministicValidation: false,
    },
  };

  const baseRequest = {
    role: "agronomist",
    message: "",
    memoryContext: {
      profile: {},
      recalledEpisodes: [],
    },
    traceId: "tr-1",
    threadId: "th-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("не форсит generate_tech_map_draft для read-only запроса", async () => {
    const result = await service.execute({
      request: {
        ...baseRequest,
        message: "покажи все техкарты",
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: baseKernel as any,
      allowedToolCalls: [],
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(agronomAgent.run).not.toHaveBeenCalled();
    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.executionPath).toBe("heuristic_fallback");
    expect(result.toolCalls).toEqual([]);
  });

  it("использует tool_call_primary при explicit compute_deviations", async () => {
    agronomAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "ok",
      data: { items: [] },
      missingContext: [],
      mathBasis: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        message: "покажи отклонения",
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: baseKernel as any,
      allowedToolCalls: [
        {
          name: RaiToolName.ComputeDeviations,
          payload: { scope: { seasonId: "season-1" } },
        },
      ] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("tool_call_primary");
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputeDeviations,
        }),
      ]),
    );
  });
});
