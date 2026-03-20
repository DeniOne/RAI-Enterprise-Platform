import { SemanticRouterService } from "./semantic-router.service";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";

describe("SemanticRouterService", () => {
  const openRouterGatewayMock = {
    generate: jest.fn(),
  };
  const routingCaseMemoryMock = {
    retrieveRelevantCases: jest.fn(),
  };

  let service: SemanticRouterService;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.RAI_SEMANTIC_ROUTER_LLM_ENABLED;
    routingCaseMemoryMock.retrieveRelevantCases.mockResolvedValue([]);
    service = new SemanticRouterService(
      openRouterGatewayMock as any,
      routingCaseMemoryMock as any,
    );
  });

  it("строит navigate decision для read-only запроса по техкартам", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи все созданные техкарты",
      workspaceContext: {
        route: "/consulting/techmaps",
      } as any,
      traceId: "tr-1",
      threadId: "th-1",
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: RaiToolName.GenerateTechMapDraft,
        confidence: 0.7,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [
        {
          name: RaiToolName.GenerateTechMapDraft,
          payload: {},
        },
      ],
      allowPrimaryPromotion: true,
    });

    expect(result.promotedPrimary).toBe(true);
    expect(result.routeDecision.decisionType).toBe("navigate");
    expect(result.classification.method).toBe("semantic_router_primary");
    expect(result.requestedToolCalls).toEqual([]);
    expect(result.divergence.isMismatch).toBe(true);
    expect(result.divergence.mismatchKinds).toContain(
      "legacy_write_vs_semantic_read",
    );
  });

  it("строит execute decision для create запроса по техкарте при полном контексте", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "составь техкарту по озимому рапсу",
      workspaceContext: {
        route: "/consulting/techmaps",
        activeEntityRefs: [{ kind: "field", id: "field-1" }],
        filters: {
          seasonId: "season-1",
        },
      } as any,
      traceId: "tr-2",
      threadId: "th-2",
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: RaiToolName.GenerateTechMapDraft,
        confidence: 0.7,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.promotedPrimary).toBe(true);
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.GenerateTechMapDraft,
        payload: {
          fieldRef: "field-1",
          seasonRef: "season-1",
          crop: "rapeseed",
        },
      },
    ]);
  });

  it("переводит deviations slice в primary и выдаёт compute_deviations", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи отклонения по этому полю",
      workspaceContext: {
        route: "/consulting/deviations/detected",
        activeEntityRefs: [{ kind: "field", id: "field-1" }],
        filters: {
          seasonId: "season-1",
        },
      } as any,
      traceId: "tr-dev-1",
      threadId: "th-dev-1",
      legacyClassification: {
        targetRole: "agronomist",
        intent: "compute_deviations",
        toolName: RaiToolName.ComputeDeviations,
        confidence: 0.68,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("agro.deviations.review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.method).toBe("semantic_router_primary");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.ComputeDeviations,
        payload: {
          scope: {
            fieldId: "field-1",
            seasonId: "season-1",
          },
        },
      },
    ]);
  });

  it("переводит plan-fact slice в primary и выдаёт compute_plan_fact по выбранному плану", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи план-факт по выбранному плану",
      workspaceContext: {
        route: "/consulting/yield",
        selectedRowSummary: {
          kind: "yield",
          id: "plan-7",
          title: "План уборки plan-7",
        },
        activeEntityRefs: [
          { kind: "techmap", id: "tm-7" },
          { kind: "field", id: "field-7" },
        ],
      } as any,
      traceId: "tr-planfact-1",
      threadId: "th-planfact-1",
      legacyClassification: {
        targetRole: "economist",
        intent: "compute_plan_fact",
        toolName: RaiToolName.ComputePlanFact,
        confidence: 0.76,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("finance.plan-fact.read");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.method).toBe("semantic_router_primary");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.ComputePlanFact,
        payload: {
          scope: {
            planId: "plan-7",
          },
        },
      },
    ]);
  });

  it("для plan-fact в пустом yield-контуре уходит в clarify, а не в silent fallback", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи план-факт",
      workspaceContext: {
        route: "/consulting/yield",
        filters: {
          domain: "yield",
          hasSelectedPlan: false,
        },
      } as any,
      traceId: "tr-planfact-2",
      threadId: "th-planfact-2",
      legacyClassification: {
        targetRole: "economist",
        intent: "compute_plan_fact",
        toolName: RaiToolName.ComputePlanFact,
        confidence: 0.7,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("finance.plan-fact.read");
    expect(result.promotedPrimary).toBe(true);
    expect(result.routeDecision.decisionType).toBe("clarify");
    expect(result.routeDecision.requiredContextMissing).toEqual(["seasonId"]);
    expect(result.requestedToolCalls).toEqual([]);
  });

  it("переводит scenario slice в primary и выдаёт simulate_scenario по выбранному плану", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "смоделируй сценарий по выбранному плану",
      workspaceContext: {
        route: "/finance",
        selectedRowSummary: {
          kind: "yield",
          id: "plan-8",
          title: "План plan-8",
        },
      } as any,
      traceId: "tr-scenario-1",
      threadId: "th-scenario-1",
      legacyClassification: {
        targetRole: "economist",
        intent: "simulate_scenario",
        toolName: RaiToolName.SimulateScenario,
        confidence: 0.72,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("finance.scenario.analysis");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("simulate_scenario");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.SimulateScenario,
        payload: {
          scope: {
            planId: "plan-8",
          },
        },
      },
    ]);
  });

  it("переводит risk slice в primary и выдаёт compute_risk_assessment по сезону", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "оцени риск по сезону",
      workspaceContext: {
        route: "/consulting/yield",
        filters: {
          seasonId: "season-risk-1",
        },
      } as any,
      traceId: "tr-risk-1",
      threadId: "th-risk-1",
      legacyClassification: {
        targetRole: "economist",
        intent: "compute_risk_assessment",
        toolName: RaiToolName.ComputeRiskAssessment,
        confidence: 0.71,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("finance.risk.analysis");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("compute_risk_assessment");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.ComputeRiskAssessment,
        payload: {
          scope: {
            seasonId: "season-risk-1",
          },
        },
      },
    ]);
  });

  it("переводит crm workspace slice в primary и использует selected account context", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "открой карточку контрагента",
      workspaceContext: {
        route: "/parties",
        selectedRowSummary: {
          kind: "party",
          id: "party-77",
          title: 'ООО "СЫСОИ"',
        },
      } as any,
      traceId: "tr-crm-1",
      threadId: "th-crm-1",
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "review_account_workspace",
        toolName: RaiToolName.GetCrmAccountWorkspace,
        confidence: 0.68,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("crm.account.workspace-review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("review_account_workspace");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.GetCrmAccountWorkspace,
        payload: {
          accountId: "party-77",
        },
      },
    ]);
  });

  it("переводит crm workspace slice в primary и извлекает query из вопроса о директоре", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "как зовут директора Сысои",
      workspaceContext: {
        route: "/parties",
      } as any,
      traceId: "tr-crm-2",
      threadId: "th-crm-2",
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "review_account_workspace",
        toolName: RaiToolName.GetCrmAccountWorkspace,
        confidence: 0.67,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("crm.account.workspace-review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("review_account_workspace");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.GetCrmAccountWorkspace,
        payload: {
          query: "Сысои",
        },
      },
    ]);
  });

  it("для crm workspace без selected row и query уходит в clarify, а не в silent fallback", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи карточку",
      workspaceContext: {
        route: "/parties",
      } as any,
      traceId: "tr-crm-3",
      threadId: "th-crm-3",
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "review_account_workspace",
        toolName: RaiToolName.GetCrmAccountWorkspace,
        confidence: 0.63,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("crm.account.workspace-review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.routeDecision.decisionType).toBe("clarify");
    expect(result.routeDecision.requiredContextMissing).toEqual(["accountId"]);
    expect(result.requestedToolCalls).toEqual([]);
  });

  it("переводит crm counterparty lookup slice в primary и извлекает ИНН из запроса", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "проверь контрагента по ИНН 2610000615",
      workspaceContext: {
        route: "/parties",
      } as any,
      traceId: "tr-crm-inn-1",
      threadId: "th-crm-inn-1",
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.6,
        method: "regex",
        reason: "legacy:crm-register",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("crm.counterparty.lookup");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("lookup_counterparty_by_inn");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.LookupCounterpartyByInn,
        payload: {
          inn: "2610000615",
        },
      },
    ]);
  });

  it("для crm counterparty lookup без ИНН уходит в clarify, а не в ложный create", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "проверь контрагента по ИНН",
      workspaceContext: {
        route: "/parties",
      } as any,
      traceId: "tr-crm-inn-2",
      threadId: "th-crm-inn-2",
      legacyClassification: {
        targetRole: "crm_agent",
        intent: "register_counterparty",
        toolName: RaiToolName.RegisterCounterparty,
        confidence: 0.6,
        method: "regex",
        reason: "legacy:crm-register",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("crm.counterparty.lookup");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("lookup_counterparty_by_inn");
    expect(result.routeDecision.decisionType).toBe("clarify");
    expect(result.routeDecision.requiredContextMissing).toEqual(["inn"]);
    expect(result.requestedToolCalls).toEqual([]);
  });

  it("использует active case memory для safe read override при abstain", async () => {
    routingCaseMemoryMock.retrieveRelevantCases.mockResolvedValue([
      {
        key: "case-1",
        sliceId: "agro.techmaps.list-open-create",
        targetRole: "agronomist",
        decisionType: "navigate",
        mismatchKinds: ["legacy_write_vs_semantic_read"],
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        traceCount: 4,
        semanticPrimaryCount: 3,
        firstSeenAt: "2026-03-20T09:00:00.000Z",
        lastSeenAt: "2026-03-20T10:00:00.000Z",
        ttlExpiresAt: "2026-03-27T10:00:00.000Z",
        sampleTraceId: "tr-case",
        sampleQuery: "покажи все созданные техкарты",
        semanticIntent: {
          domain: "agro",
          entity: "techmap",
          action: "list",
          interactionMode: "navigation",
          mutationRisk: "safe_read",
          filters: {},
          requiredContext: [],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "partial",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "captured_case",
        },
        routeDecision: {
          decisionType: "navigate",
          recommendedExecutionMode: "open_route",
          eligibleTools: [],
          eligibleFlows: ["techmaps_registry"],
          requiredContextMissing: [],
          policyChecksRequired: [],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        similarityScore: 0.91,
        lifecycleStatus: "active",
        captureAuditLogId: "capture-1",
        activatedAt: "2026-03-20T11:00:00.000Z",
        activationAuditLogId: "activation-1",
      },
    ]);

    const result = await service.evaluate({
      companyId: "c1",
      message: "где у меня список готовых техкарт",
      workspaceContext: {
        route: "/consulting/techmaps",
      } as any,
      traceId: "tr-3",
      threadId: "th-3",
      legacyClassification: {
        targetRole: "knowledge",
        intent: null,
        toolName: null,
        confidence: 0.2,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.routeDecision.decisionType).toBe("navigate");
    expect(result.classification.intent).toBe("open_techmaps_registry");
    expect(result.retrievedCaseMemory?.[0]?.lifecycleStatus).toBe("active");
  });

  it("не использует case memory для write override, если кейс ведёт в create path", async () => {
    routingCaseMemoryMock.retrieveRelevantCases.mockResolvedValue([
      {
        key: "case-create-1",
        sliceId: "agro.techmaps.list-open-create",
        targetRole: "agronomist",
        decisionType: "execute",
        mismatchKinds: ["legacy_missing_tool"],
        routerVersion: "semantic-router-v1",
        promptVersion: "semantic-router-prompt-v1",
        toolsetVersion: "toolset",
        traceCount: 5,
        semanticPrimaryCount: 4,
        firstSeenAt: "2026-03-20T09:00:00.000Z",
        lastSeenAt: "2026-03-20T10:00:00.000Z",
        ttlExpiresAt: "2026-03-27T10:00:00.000Z",
        sampleTraceId: "tr-case-create",
        sampleQuery: "составь техкарту по рапсу",
        semanticIntent: {
          domain: "agro",
          entity: "techmap",
          action: "create",
          interactionMode: "write_candidate",
          mutationRisk: "side_effecting_write",
          filters: {},
          requiredContext: ["fieldRef", "seasonRef"],
          focusObject: null,
          dialogState: {
            activeFlow: null,
            pendingClarificationKeys: [],
            lastUserAction: null,
          },
          resolvability: "resolved",
          ambiguityType: "none",
          confidenceBand: "high",
          reason: "captured_create_case",
        },
        routeDecision: {
          decisionType: "execute",
          recommendedExecutionMode: "direct_execute",
          eligibleTools: [RaiToolName.GenerateTechMapDraft],
          eligibleFlows: ["tech_map_draft"],
          requiredContextMissing: [],
          policyChecksRequired: ["agronomist_write_guard"],
          needsConfirmation: false,
          needsClarification: false,
          abstainReason: null,
          policyBlockReason: null,
        },
        similarityScore: 0.95,
        lifecycleStatus: "active",
        captureAuditLogId: "capture-create-1",
        activatedAt: "2026-03-20T11:00:00.000Z",
        activationAuditLogId: "activation-create-1",
      },
    ]);

    const result = await service.evaluate({
      companyId: "c1",
      message: "что у нас по техкартам вообще",
      workspaceContext: {
        route: "/dashboard",
      } as any,
      traceId: "tr-4",
      threadId: "th-4",
      legacyClassification: {
        targetRole: "knowledge",
        intent: null,
        toolName: null,
        confidence: 0.1,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.routeDecision.decisionType).toBe("abstain");
    expect(result.requestedToolCalls).toEqual([]);
    expect(result.classification.intent).toBeNull();
    expect(result.retrievedCaseMemory?.[0]?.decisionType).toBe("execute");
  });

  it("переводит knowledge slice в primary и не отдаёт техкартный запрос в agronomist внутри knowledge route", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "как составить техкарту по рапсу",
      workspaceContext: {
        route: "/knowledge/base",
      } as any,
      traceId: "tr-knowledge-1",
      threadId: "th-knowledge-1",
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: RaiToolName.GenerateTechMapDraft,
        confidence: 0.71,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("knowledge.base.query");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("query_knowledge");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.QueryKnowledge,
        payload: { query: "как составить техкарту по рапсу" },
      },
    ]);
    expect(result.divergence.mismatchKinds).toEqual(
      expect.arrayContaining(["domain", "tool_name"]),
    );
  });

  it("не переводит knowledge query в primary вне knowledge route", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "что известно про озимый рапс",
      workspaceContext: {
        route: "/consulting/dashboard",
      } as any,
      traceId: "tr-knowledge-2",
      threadId: "th-knowledge-2",
      legacyClassification: {
        targetRole: "knowledge",
        intent: "query_knowledge",
        toolName: RaiToolName.QueryKnowledge,
        confidence: 0.69,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBeNull();
    expect(result.promotedPrimary).toBe(false);
    expect(result.executionPath).toBe("semantic_router_shadow");
    expect(result.classification.intent).toBe("query_knowledge");
    expect(result.routeDecision.decisionType).toBe("abstain");
    expect(result.requestedToolCalls).toEqual([]);
    expect(result.divergence.mismatchKinds).toContain("abstain_vs_execute");
  });

  it("переводит contracts list slice в primary и выдаёт list_commerce_contracts", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи все договоры",
      workspaceContext: {
        route: "/commerce/contracts",
      } as any,
      traceId: "tr-contracts-list-1",
      threadId: "th-contracts-list-1",
      legacyClassification: {
        targetRole: "contracts_agent",
        intent: "create_commerce_contract",
        toolName: RaiToolName.CreateCommerceContract,
        confidence: 0.62,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("contracts.registry-review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("list_commerce_contracts");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.ListCommerceContracts,
        payload: { limit: 20 },
      },
    ]);
    expect(result.divergence.mismatchKinds).toContain("tool_name");
  });

  it("переводит contracts review slice в primary и прокидывает query по номеру договора", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "открой договор DOG-077",
      workspaceContext: {
        route: "/commerce/contracts",
      } as any,
      traceId: "tr-contracts-review-1",
      threadId: "th-contracts-review-1",
      legacyClassification: {
        targetRole: "contracts_agent",
        intent: "list_commerce_contracts",
        toolName: RaiToolName.ListCommerceContracts,
        confidence: 0.66,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("contracts.registry-review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("review_commerce_contract");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.GetCommerceContract,
        payload: { query: "DOG-077" },
      },
    ]);
  });

  it("переводит contracts ar balance slice в primary и использует selected invoice", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи дебиторский остаток по счету",
      workspaceContext: {
        route: "/commerce/contracts",
        selectedRowSummary: {
          kind: "invoice",
          id: "invoice-77",
          title: "Счёт INV-77",
        },
      } as any,
      traceId: "tr-contracts-ar-1",
      threadId: "th-contracts-ar-1",
      legacyClassification: {
        targetRole: "contracts_agent",
        intent: "list_commerce_contracts",
        toolName: RaiToolName.ListCommerceContracts,
        confidence: 0.65,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("contracts.ar-balance.review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("review_ar_balance");
    expect(result.routeDecision.decisionType).toBe("execute");
    expect(result.requestedToolCalls).toEqual([
      {
        name: RaiToolName.GetArBalance,
        payload: { invoiceId: "invoice-77" },
      },
    ]);
  });

  it("для contracts ar balance без invoice уходит в clarify", async () => {
    const result = await service.evaluate({
      companyId: "c1",
      message: "покажи дебиторский остаток",
      workspaceContext: {
        route: "/commerce/contracts",
      } as any,
      traceId: "tr-contracts-ar-2",
      threadId: "th-contracts-ar-2",
      legacyClassification: {
        targetRole: "contracts_agent",
        intent: "review_ar_balance",
        toolName: RaiToolName.GetArBalance,
        confidence: 0.63,
        method: "regex",
        reason: "legacy",
      },
      requestedToolCalls: [],
      allowPrimaryPromotion: true,
    });

    expect(result.sliceId).toBe("contracts.ar-balance.review");
    expect(result.promotedPrimary).toBe(true);
    expect(result.executionPath).toBe("semantic_router_primary");
    expect(result.classification.intent).toBe("review_ar_balance");
    expect(result.routeDecision.decisionType).toBe("clarify");
    expect(result.routeDecision.requiredContextMissing).toEqual(["invoiceId"]);
    expect(result.requestedToolCalls).toEqual([]);
  });
});
