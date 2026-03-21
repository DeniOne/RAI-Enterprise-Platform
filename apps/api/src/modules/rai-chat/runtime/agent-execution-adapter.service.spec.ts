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

  it("в primary semantic routing выбирает safe draft default для agronomist без ingress intent", async () => {
    agronomAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "draft ok",
      data: { draftId: "draft-1" },
      missingContext: [],
      mathBasis: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        message: "подготовь техкарту",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "agro.techmaps.draft",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: baseKernel as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(agronomAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "generate_tech_map_draft",
      }),
      expect.anything(),
    );
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GenerateTechMapDraft,
        }),
      ]),
    );
  });

  it("в primary semantic routing сохраняет read-only techmap registry path", async () => {
    const result = await service.execute({
      request: {
        ...baseRequest,
        message: "покажи все техкарты",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "agro.techmaps.list-open-create",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
          } as any,
          candidateRoutes: [],
        },
      } as any,
      actorContext: {
        companyId: "company-1",
        traceId: "tr-1",
      },
      kernel: baseKernel as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(agronomAgent.run).not.toHaveBeenCalled();
    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("heuristic_fallback");
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

  it("использует semantic ingress frame как источник intent для crm.register_counterparty", async () => {
    crmAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "crm register ok",
      data: { partyId: "party-1" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "crm_agent",
        message: "помоги с контрагентом",
        semanticIngressFrame: {
          version: "v1",
          interactionMode: "task_request",
          requestShape: "single_intent",
          domainCandidates: [],
          goal: "register_counterparty",
          entities: [
            {
              kind: "inn",
              value: "2636041493",
              source: "tool_payload",
            },
          ],
          requestedOperation: {
            ownerRole: "crm_agent",
            intent: "register_counterparty",
            toolName: RaiToolName.RegisterCounterparty,
            decisionType: "execute",
            source: "legacy_contracts",
          },
          operationAuthority: "direct_user_command",
          missingSlots: [],
          riskClass: "write_candidate",
          requiresConfirmation: false,
          confidenceBand: "high",
          explanation:
            "Свободная фраза нормализована в CRM-регистрацию контрагента по ИНН как прямое действие пользователя.",
          proofSliceId: "crm.register_counterparty",
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
    expect(crmAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "register_counterparty",
      }),
      expect.anything(),
    );
  });

  it("в primary semantic routing выбирает safe read default для crm_agent без ingress intent", async () => {
    crmAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "workspace ok",
      data: { accountId: "acc-1" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "crm_agent",
        message: "что по клиенту",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "crm.unspecified",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
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
      }),
      expect.anything(),
    );
  });

  it("берет intent для front_office_agent из semantic ingress frame", async () => {
    frontOfficeAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "Принял: привет",
      data: { classification: "free_chat" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "front_office_agent",
        message: "привет",
        semanticIngressFrame: {
          version: "v1",
          interactionMode: "free_chat",
          requestShape: "single_intent",
          domainCandidates: [],
          goal: "Привет",
          entities: [],
          requestedOperation: {
            ownerRole: "front_office_agent",
            intent: "classify_dialog_thread",
            toolName: RaiToolName.ClassifyDialogThread,
            decisionType: "execute",
            source: "legacy_contracts",
          },
          operationAuthority: "unknown",
          missingSlots: [],
          riskClass: "safe_read",
          requiresConfirmation: false,
          confidenceBand: "medium",
          explanation: "semantic-front-office",
          proofSliceId: null,
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
          executionAdapterRole: "front_office_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(frontOfficeAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "classify_dialog_thread",
      }),
      expect.anything(),
    );
  });

  it("в primary semantic routing выбирает classify_dialog_thread для front_office_agent без ingress intent", async () => {
    frontOfficeAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "Принял: привет",
      data: { classification: "free_chat" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "front_office_agent",
        message: "привет",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "front_office.free_chat",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
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
          executionAdapterRole: "front_office_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(frontOfficeAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "classify_dialog_thread",
      }),
      expect.anything(),
    );
  });

  it("в primary semantic routing выбирает classify_dialog_thread для front_office_agent без ingress intent", async () => {
    frontOfficeAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "Принял: привет",
      data: { classification: "free_chat" },
      missingContext: [],
      toolCallsCount: 1,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "front_office_agent",
        message: "привет",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "front_office.free_chat",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
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
          executionAdapterRole: "front_office_agent",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(frontOfficeAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "classify_dialog_thread",
      }),
      expect.anything(),
    );
  });

  it("гейтит phrase fallback для chief_agronomist в primary semantic routing", async () => {
    chiefAgronomistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "chief ok",
      data: { opinion: "ok" },
      confidence: 0.9,
      traceId: "tr-1",
      evidence: [],
      recommendations: [],
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "chief_agronomist",
        message: "нужен совет по полю",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "agro.techmaps.list-open-create",
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
          executionAdapterRole: "chief_agronomist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(chiefAgronomistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "expert_opinion",
      }),
      expect.anything(),
    );
  });

  it("гейтит phrase fallback для chief_agronomist в alert semantic path", async () => {
    chiefAgronomistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "chief alert ok",
      data: { tips: [] },
      confidence: 0.9,
      traceId: "tr-1",
      evidence: [],
      recommendations: [],
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "chief_agronomist",
        message: "алерт по полю",
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
      kernel: {
        ...baseKernel,
        runtimeProfile: {
          ...baseKernel.runtimeProfile,
          executionAdapterRole: "chief_agronomist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(chiefAgronomistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "expert_opinion",
      }),
      expect.anything(),
    );
  });

  it("гейтит phrase fallback для data_scientist в primary semantic routing", async () => {
    dataScientistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "data ok",
      data: { forecast: 1 },
      confidence: 0.8,
      traceId: "tr-1",
      evidence: [],
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "data_scientist",
        message: "что если снизить дозу удобрений",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "finance.scenario.analysis",
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
          executionAdapterRole: "data_scientist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(dataScientistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "what_if",
      }),
      expect.anything(),
    );
  });

  it("гейтит phrase fallback для data_scientist в strategy forecast default path", async () => {
    dataScientistAgent.run.mockResolvedValueOnce({
      status: "COMPLETED",
      explain: "data forecast ok",
      data: { forecast: 1 },
      confidence: 0.8,
      traceId: "tr-1",
      evidence: [],
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "data_scientist",
        message: "покажи общую динамику по сезону",
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
          executionAdapterRole: "data_scientist",
        },
      } as any,
      allowedToolCalls: [] as any,
      budgetDecision: { outcome: "ALLOW" } as any,
    });

    expect(result.status).toBe("COMPLETED");
    expect(dataScientistAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "seasonal_report",
      }),
      expect.anything(),
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

  it("в primary semantic routing выбирает safe read default для contracts_agent без ingress intent", async () => {
    contractsAgent.run.mockResolvedValueOnce({
      status: "NEEDS_MORE_DATA",
      explain: "need contract context",
      data: {},
      missingContext: ["contractId"],
      toolCallsCount: 0,
      evidence: [],
      fallbackUsed: false,
    });

    const result = await service.execute({
      request: {
        ...baseRequest,
        role: "contracts_agent",
        message: "что по договору",
        semanticRouting: {
          source: "primary",
          promotedPrimary: true,
          enforceCapabilityGating: true,
          sliceId: "contracts.unspecified",
          semanticIntent: {} as any,
          routeDecision: {
            eligibleTools: [],
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

    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(contractsAgent.run).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: "review_commerce_contract",
      }),
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
