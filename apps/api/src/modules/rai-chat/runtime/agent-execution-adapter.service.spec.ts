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

  it("не форсит generate_tech_map_draft для read-only запроса и предлагает открыть реестр", async () => {
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
    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("heuristic_fallback");
    expect(result.toolCalls).toEqual([]);
    expect(result.text).toContain("Понял запрос по техкартам");
    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "route",
          title: "Открыть реестр техкарт",
          href: "/consulting/techmaps/active",
        }),
      ]),
    );
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

  it("сохраняет semantic_router_primary для compute_deviations при первичном semantic routing", async () => {
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
        message: "покажи отклонения по сезону",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "agro.deviations.review",
          semanticIntent: {} as any,
          routeDecision: {} as any,
          candidateRoutes: [],
        },
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
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(agronomAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "compute_deviations",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для compute_plan_fact при первичном semantic routing", async () => {
    economistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "ok",
      data: { planId: "plan-7" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "economist",
        message: "покажи план-факт по выбранному плану",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "finance.plan-fact.read",
          semanticIntent: {} as any,
          routeDecision: {} as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "economist",
        },
      } as any,
      allowedToolCalls: [
        {
          name: RaiToolName.ComputePlanFact,
          payload: { scope: { planId: "plan-7" } },
        },
      ] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(economistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "compute_plan_fact",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для simulate_scenario при первичном semantic routing", async () => {
    economistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "scenario ok",
      data: { scenarioId: "scenario-1" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "economist",
        message: "смоделируй сценарий",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "finance.scenario.analysis",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.SimulateScenario],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "economist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.SimulateScenario,
        }),
      ]),
    );
    expect(economistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "simulate_scenario",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для compute_risk_assessment при первичном semantic routing", async () => {
    economistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "risk ok",
      data: { planId: "plan-9", riskLevel: "LOW" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "economist",
        message: "оцени риск",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "finance.risk.analysis",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.ComputeRiskAssessment],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "economist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputeRiskAssessment,
        }),
      ]),
    );
    expect(economistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "compute_risk_assessment",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для review_account_workspace и прокидывает query", async () => {
    crmAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "crm ok",
      data: { account: { id: "acc-77", name: "ООО СЫСОИ" } },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "crm_agent",
        message: "как зовут директора Сысои",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "crm.account.workspace-review",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.GetCrmAccountWorkspace],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "crm_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(crmAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "review_account_workspace",
        query: "Сысои",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для lookup_counterparty_by_inn и прокидывает ИНН из запроса", async () => {
    crmAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "crm inn ok",
      data: { inn: "2610000615", lookupStatus: "FOUND" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "crm_agent",
        message: "проверь контрагента по ИНН 2610000615",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "crm.counterparty.lookup",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.LookupCounterpartyByInn],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "crm_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(crmAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "lookup_counterparty_by_inn",
        inn: "2610000615",
      }),
      expect.anything(),
    );
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.LookupCounterpartyByInn,
        }),
      ]),
    );
  });

  it("сохраняет semantic_router_primary для query_knowledge и прокидывает исходный запрос", async () => {
    knowledgeAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "knowledge ok",
      data: { hits: 1, items: [{ content: "ok", score: 0.9 }] },
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "knowledge",
        message: "как составить техкарту по рапсу",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "knowledge.base.query",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.QueryKnowledge],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "knowledge",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.QueryKnowledge,
        }),
      ]),
    );
    expect(knowledgeAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "как составить техкарту по рапсу",
      }),
      expect.anything(),
    );
  });

  it("сохраняет semantic_router_primary для review_commerce_contract и прокидывает query", async () => {
    contractsAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "contract ok",
      data: { id: "contract-77", number: "DOG-077" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "contracts_agent",
        message: "открой договор DOG-077",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "contracts.registry-review",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.GetCommerceContract],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "contracts_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(contractsAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "review_commerce_contract",
        query: "DOG-077",
      }),
    );
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GetCommerceContract,
        }),
      ]),
    );
  });

  it("сохраняет semantic_router_primary для review_ar_balance и прокидывает invoiceId", async () => {
    contractsAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "ar ok",
      data: { invoiceId: "invoice-77", balance: 125000 },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "contracts_agent",
        message: "покажи дебиторский остаток по счёту",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "contracts.ar-balance.review",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [RaiToolName.GetArBalance],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "contracts_agent",
        },
      } as any,
      allowedToolCalls: [
        {
          name: RaiToolName.GetArBalance,
          payload: { invoiceId: "invoice-77" },
        },
      ] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(contractsAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "review_ar_balance",
        invoiceId: "invoice-77",
      }),
    );
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GetArBalance,
        }),
      ]),
    );
  });
});
