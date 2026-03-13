import { RaiToolName } from "../tools/rai-tools.types";
import {
  buildAutoToolCallFromContracts,
  buildResponsibilityBinding,
  buildPendingClarificationItems,
  buildResumeExecutionPlan,
  classifyByAgentContracts,
  detectClarificationContract,
  getFocusContract,
  getIntentCatalog,
  resolveContextValues,
  resolveMissingContextKeys,
  validateResponsibilityProfileCompatibility,
} from "../../../shared/rai-chat/agent-interaction-contracts";

describe("agent interaction contracts", () => {
  it("классифицирует техкарту через единый contract source", () => {
    const result = classifyByAgentContracts("Составь техкарту по озимому рапсу", {
      route: "/consulting/dashboard",
    });

    expect(result.targetRole).toBe("agronomist");
    expect(result.intent).toBe("tech_map_draft");
    expect(result.toolName).toBe(RaiToolName.GenerateTechMapDraft);
  });

  it("классифицирует регистрацию контрагента в CRM", () => {
    const result = classifyByAgentContracts(
      "Давай зарегистрируем в системе контрагента с ИНН 2610000615",
      {
        route: "/consulting/crm",
      },
    );

    expect(result.targetRole).toBe("crm_agent");
    expect(result.intent).toBe("register_counterparty");
    expect(result.toolName).toBe(RaiToolName.RegisterCounterparty);
  });

  it("классифицирует создание договора в contracts agent", () => {
    const result = classifyByAgentContracts(
      "Давай заключим новый договор с Казьминский",
      {
        route: "/commerce/contracts",
      },
    );

    expect(result.targetRole).toBe("contracts_agent");
    expect(result.intent).toBe("create_commerce_contract");
    expect(result.toolName).toBe(RaiToolName.CreateCommerceContract);
  });

  it("строит auto tool call для просмотра дебиторки по invoice", () => {
    const classification = classifyByAgentContracts("покажи дебиторку по счету", {
      route: "/commerce/invoices",
      selectedRowSummary: {
        kind: "invoice",
        id: "invoice-1",
        title: "Счет INV-001",
      },
    } as any);

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "покажи дебиторку по счету",
        workspaceContext: {
          route: "/commerce/invoices",
          selectedRowSummary: {
            kind: "invoice",
            id: "invoice-1",
            title: "Счет INV-001",
          },
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.GetArBalance,
      payload: {
        invoiceId: "invoice-1",
      },
    });
  });

  it("строит auto tool call для план-факта из workspace filters", () => {
    const classification = classifyByAgentContracts("покажи план-факт", {
      route: "/finance/cashflow",
      filters: { seasonId: "season-2026", planId: "plan-77" },
    });

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "покажи план-факт",
        workspaceContext: {
          route: "/finance/cashflow",
          filters: { seasonId: "season-2026", planId: "plan-77" },
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.ComputePlanFact,
      payload: {
        scope: {
          planId: "plan-77",
          seasonId: "season-2026",
        },
      },
    });
  });

  it("строит auto tool call для регистрации контрагента по ИНН", () => {
    const classification = classifyByAgentContracts(
      "зарегистрируй контрагента по ИНН 2610000615",
      {
        route: "/consulting/crm",
      },
    );

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "зарегистрируй контрагента по ИНН 2610000615",
        workspaceContext: {
          route: "/consulting/crm",
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.RegisterCounterparty,
      payload: {
        inn: "2610000615",
        jurisdictionCode: "RU",
        partyType: "LEGAL_ENTITY",
      },
    });
  });

  it("классифицирует создание контакта в CRM", () => {
    const result = classifyByAgentContracts(
      'добавь контакт "Иван Петров" в карточку клиента',
      {
        route: "/consulting/crm",
      },
    );

    expect(result.targetRole).toBe("crm_agent");
    expect(result.intent).toBe("create_crm_contact");
    expect(result.toolName).toBe(RaiToolName.CreateCrmContact);
  });

  it("классифицирует front-office разбор диалога", () => {
    const result = classifyByAgentContracts(
      "Определи, это задача или просто общение",
      {
        route: "/front-office",
      },
    );

    expect(result.targetRole).toBe("front_office_agent");
    expect(result.intent).toBe("classify_dialog_thread");
    expect(result.toolName).toBe(RaiToolName.ClassifyDialogThread);
  });

  it("строит auto tool call для front-office эскалации", () => {
    const classification = classifyByAgentContracts(
      "Срочно передай это в работу и эскалируй",
      {
        route: "/front-office",
      },
    );

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "Срочно передай это в работу и эскалируй",
        threadId: "thread-front-1",
        workspaceContext: {
          route: "/front-office",
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.CreateFrontOfficeEscalation,
      payload: {
        channel: "web_chat",
        messageText: "Срочно передай это в работу и эскалируй",
        threadExternalId: "thread-front-1",
        route: "/front-office",
      },
    });
  });

  it("строит auto tool call для обновления обязательства по selected row", () => {
    const classification = classifyByAgentContracts(
      "обнови обязательство и поставь статус выполнено",
      {
        route: "/consulting/crm",
      },
    );

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "обнови обязательство и поставь статус выполнено",
        workspaceContext: {
          route: "/consulting/crm",
          selectedRowSummary: {
            kind: "obligation",
            id: "obl-1",
            title: "Follow-up по клиенту",
          },
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.UpdateCrmObligation,
      payload: {
        obligationId: "obl-1",
        description: undefined,
        dueDate: undefined,
        status: "FULFILLED",
      },
    });
  });

  it("строит resume plan и required context для agronomist clarification", () => {
    const request = {
      message: "продолжай",
      threadId: "thread-1",
      clarificationResume: {
        windowId: "win-techmap-thread-1",
        intentId: "tech_map_draft" as const,
        agentRole: "agronomist" as const,
        collectedContext: {
          fieldRef: "field-12",
          seasonRef: "season-2026",
        },
      },
      workspaceContext: {
        route: "/consulting/techmaps/active",
      },
    };

    const plan = buildResumeExecutionPlan(request);
    const context = resolveContextValues(request);
    const contract = detectClarificationContract(
      request,
      {
        executedTools: [],
        runtimeBudget: null,
        agentExecution: {
          role: "agronomist",
          text: "need context",
          fallbackUsed: false,
          validation: { actionAllowed: true, explain: "" },
          outputContractVersion: "v1",
          toolCalls: [{ name: RaiToolName.GenerateTechMapDraft, result: {} }],
          confidence: 0,
          evidence: [],
          structuredOutput: undefined,
          status: "NEEDS_MORE_DATA",
        },
      } as never,
    );

    expect(plan?.classification.intent).toBe("tech_map_draft");
    expect(plan?.requestedToolCalls?.[0]).toEqual({
      name: RaiToolName.GenerateTechMapDraft,
      payload: {
        fieldRef: "field-12",
        seasonRef: "season-2026",
      },
    });
    expect(contract?.intentId).toBe("tech_map_draft");
    expect(resolveMissingContextKeys(contract!, context)).toEqual([]);
    expect(buildPendingClarificationItems(contract!, context)).toEqual([
      expect.objectContaining({ key: "fieldRef", status: "resolved" }),
      expect.objectContaining({ key: "seasonRef", status: "resolved" }),
    ]);
  });

  it("экспортирует focus contract и intent catalog для canonical role", () => {
    const focus = getFocusContract("economist");
    const catalog = getIntentCatalog("economist");

    expect(focus.businessDomain).toBe("finance");
    expect(catalog.map((item) => item.intentId)).toEqual(
      expect.arrayContaining(["compute_plan_fact", "simulate_scenario", "compute_risk_assessment"]),
    );
  });

  it("валидирует responsibility binding для future role", () => {
    const binding = buildResponsibilityBinding("marketer", "knowledge", {
      role: "marketer",
      inheritsFromRole: "knowledge",
      overrides: {
        allowedIntents: ["query_knowledge"],
      },
    });

    const result = validateResponsibilityProfileCompatibility({
      role: "marketer",
      tools: [RaiToolName.QueryKnowledge],
      runtimeAdapterRole: "knowledge",
      responsibilityBinding: binding,
    });

    expect(result.valid).toBe(true);
    expect(result.effectiveRole).toBe("knowledge");
    expect(result.allowedIntentIds).toEqual(["query_knowledge"]);
  });

  it("отклоняет tool binding вне responsibility profile", () => {
    const result = validateResponsibilityProfileCompatibility({
      role: "marketer",
      tools: [RaiToolName.EmitAlerts],
      runtimeAdapterRole: "knowledge",
    });

    expect(result.valid).toBe(false);
    expect(result.missingRequirements).toContain(
      "tool_not_allowed_by_responsibility_profile:emit_alerts",
    );
  });
});
