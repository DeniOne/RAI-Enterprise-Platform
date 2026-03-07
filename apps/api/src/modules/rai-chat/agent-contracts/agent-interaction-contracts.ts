import { RaiChatRequestDto, PendingClarificationItemDto, RaiWorkWindowActionDto } from "../dto/rai-chat.dto";
import { IntentClassification, WorkspaceContextForIntent } from "../intent-router/intent-router.types";
import { ExecutionResult } from "../runtime/agent-runtime.service";
import { RaiToolCall, RaiToolName } from "../tools/rai-tools.types";

export type AgentContractRole = "agronomist" | "economist" | "knowledge" | "monitoring";
export type AgentContractIntentId =
  | "tech_map_draft"
  | "compute_deviations"
  | "compute_plan_fact"
  | "simulate_scenario"
  | "compute_risk_assessment"
  | "query_knowledge"
  | "emit_alerts";
export type ContextKey = "fieldRef" | "seasonRef" | "seasonId" | "planId";

interface RouteHintMatcher {
  includesAny?: string[];
}

interface ClarificationUiContract {
  windowIdPrefix: string;
  pendingSummary: string;
  chatText: string;
  title: string;
  hintTitle: string;
  resultTitle: string;
  hintSummary: (missingKeys: ContextKey[]) => string;
  resultSummary: string;
  resultHintSummary: string;
  requiredContext: Array<{
    key: ContextKey;
    label: string;
    reason: string;
  }>;
  buildClarificationActions: (resolvedContext: Record<ContextKey, string | undefined>) => RaiWorkWindowActionDto[];
  buildHintActions: (windowId: string) => RaiWorkWindowActionDto[];
  buildResultHintActions: (windowId: string, resolvedContext: Record<ContextKey, string | undefined>) => RaiWorkWindowActionDto[];
}

interface AgentIntentContract {
  role: AgentContractRole;
  intentId: AgentContractIntentId;
  toolName: RaiToolName | null;
  keywordsPattern?: RegExp;
  routeHints?: RouteHintMatcher;
  classificationReason: string;
  classificationConfidence: number;
  clarification?: ClarificationUiContract;
}

const AGENT_INTENT_CONTRACTS: AgentIntentContract[] = [
  {
    role: "economist",
    intentId: "compute_plan_fact",
    toolName: RaiToolName.ComputePlanFact,
    keywordsPattern: /план[ .-]?факт|plan[ .-]?fact|cash flow|cashflow|денежн|ликвид|бюджет|марж|риск|kpi/i,
    routeHints: { includesAny: ["finance", "econom", "yield"] },
    classificationReason: "match: finance|plan-fact|cash-flow|budget|risk|kpi",
    classificationConfidence: 0.75,
    clarification: {
      windowIdPrefix: "win-planfact",
      pendingSummary: "Чтобы показать план-факт, нужен хотя бы сезон.",
      chatText: "Чтобы показать план-факт, мне нужен сезон. Я открыл справа панель добора контекста.",
      title: "Добор контекста для план-факта",
      hintTitle: "Что ещё нужно для план-факта",
      resultTitle: "План-факт готов",
      hintSummary: () => "Откройте финансовый экран или выберите сезон. После этого расчёт продолжится автоматически.",
      resultSummary: "План-факт рассчитан.",
      resultHintSummary: "План-факт готов. Можно открыть результат или перейти в финансовый экран.",
      requiredContext: [
        {
          key: "seasonId",
          label: "Сезон",
          reason: "Нужно понять, в рамках какого сезона искать актуальный план.",
        },
      ],
      buildClarificationActions: () => [
        {
          id: "refresh_context",
          kind: "refresh_context",
          label: "Обновить контекст",
          enabled: true,
        },
        {
          id: "open_finance_route",
          kind: "open_route",
          label: "Перейти к финансам",
          enabled: true,
          targetRoute: "/consulting/yield",
        },
      ],
      buildHintActions: (windowId) => [
        {
          id: "focus_planfact_clarification",
          kind: "focus_window",
          label: "Открыть панель добора",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          id: "open_finance_route_hint",
          kind: "open_route",
          label: "Перейти к финансам",
          enabled: true,
          targetRoute: "/consulting/yield",
        },
      ],
      buildResultHintActions: (windowId) => [
        {
          id: "focus_planfact_result",
          kind: "focus_window",
          label: "Открыть результат",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          id: "open_finance_route_result",
          kind: "open_route",
          label: "Перейти к финансам",
          enabled: true,
          targetRoute: "/consulting/yield",
        },
      ],
    },
  },
  {
    role: "agronomist",
    intentId: "compute_deviations",
    toolName: RaiToolName.ComputeDeviations,
    keywordsPattern: /отклонени|deviation/i,
    routeHints: { includesAny: ["techmaps", "field"] },
    classificationReason: "match: отклонени|deviation",
    classificationConfidence: 0.7,
  },
  {
    role: "monitoring",
    intentId: "emit_alerts",
    toolName: RaiToolName.EmitAlerts,
    keywordsPattern: /алерт|эскалац|alert/i,
    routeHints: { includesAny: ["monitor", "alert"] },
    classificationReason: "match: алерт|alert",
    classificationConfidence: 0.7,
  },
  {
    role: "agronomist",
    intentId: "tech_map_draft",
    toolName: RaiToolName.GenerateTechMapDraft,
    keywordsPattern: /техкарт|techmap|сделай карту/i,
    routeHints: { includesAny: ["techmaps", "field"] },
    classificationReason: "match: техкарт|techmap",
    classificationConfidence: 0.7,
    clarification: {
      windowIdPrefix: "win-techmap",
      pendingSummary: "Чтобы подготовить техкарту, нужны поле и сезон.",
      chatText: "Чтобы подготовить техкарту, мне нужны поле и сезон. Я открыл справа панель добора контекста.",
      title: "Добор контекста для техкарты",
      hintTitle: "Что ещё нужно для техкарты",
      resultTitle: "Добор контекста для техкарты",
      hintSummary: (missingKeys) =>
        missingKeys.length === 2
          ? "Проверьте поле и сезон в рабочем контексте или откройте карточку поля."
          : "Осталось уточнить только один параметр. После этого агент продолжит автоматически.",
      resultSummary: "Техкарта подготовлена.",
      resultHintSummary: "Техкарта готова. Можно открыть основное окно с результатом и продолжить работу по полю.",
      requiredContext: [
        {
          key: "fieldRef",
          label: "Поле",
          reason: "Нужно понять, для какого поля готовить техкарту.",
        },
        {
          key: "seasonRef",
          label: "Сезон",
          reason: "Нужно понять, для какого сезона готовить техкарту.",
        },
      ],
      buildClarificationActions: (resolvedContext) => [
        {
          id: "use_workspace_field",
          kind: "use_workspace_field",
          label: "Взять поле из текущего контекста",
          enabled: Boolean(resolvedContext.fieldRef),
        },
        {
          id: "open_field_card",
          kind: "open_field_card",
          label: "Открыть карточку поля",
          enabled: Boolean(resolvedContext.fieldRef),
        },
        {
          id: "open_season_picker",
          kind: "open_season_picker",
          label: "Выбрать сезон",
          enabled: false,
        },
        {
          id: "refresh_context",
          kind: "refresh_context",
          label: "Обновить контекст",
          enabled: true,
        },
      ],
      buildHintActions: (windowId) => [
        {
          id: "focus_context_acquisition",
          kind: "focus_window",
          label: "Открыть панель добора",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          id: "refresh_context_hint",
          kind: "refresh_context",
          label: "Обновить контекст",
          enabled: true,
        },
      ],
      buildResultHintActions: (windowId, resolvedContext) => [
        {
          id: "focus_result_window",
          kind: "focus_window",
          label: "Открыть результат",
          enabled: true,
          targetWindowId: windowId,
        },
        {
          id: "open_field_card_result",
          kind: "open_field_card",
          label: "Открыть поле",
          enabled: Boolean(resolvedContext.fieldRef),
        },
        {
          id: "go_to_techmap_result",
          kind: "go_to_techmap",
          label: "Перейти к техкартам",
          enabled: true,
          targetRoute: "/consulting/techmaps/active",
        },
      ],
    },
  },
  {
    role: "knowledge",
    intentId: "query_knowledge",
    toolName: RaiToolName.QueryKnowledge,
    keywordsPattern: /знан|knowledge|документ|регламент|что известно/i,
    routeHints: { includesAny: ["knowledge"] },
    classificationReason: "match: знан|knowledge|документ|регламент",
    classificationConfidence: 0.6,
  },
  {
    role: "economist",
    intentId: "simulate_scenario",
    toolName: RaiToolName.SimulateScenario,
    keywordsPattern: /сценари|scenario|what if/i,
    routeHints: { includesAny: ["finance", "econom", "yield"] },
    classificationReason: "match: scenario",
    classificationConfidence: 0.72,
  },
  {
    role: "economist",
    intentId: "compute_risk_assessment",
    toolName: RaiToolName.ComputeRiskAssessment,
    keywordsPattern: /риск|risk/i,
    routeHints: { includesAny: ["finance", "econom", "yield"] },
    classificationReason: "match: risk",
    classificationConfidence: 0.7,
  },
];

function inferRoleFromRoute(
  workspaceContext?: WorkspaceContextForIntent,
): AgentContractRole | null {
  const route = workspaceContext?.route?.toLowerCase() ?? "";
  if (route.includes("knowledge")) return "knowledge";
  if (route.includes("techmaps") || route.includes("field")) return "agronomist";
  if (route.includes("finance") || route.includes("econom") || route.includes("yield")) return "economist";
  if (route.includes("monitor") || route.includes("alert")) return "monitoring";
  return "knowledge";
}

export function getIntentContract(intentId: string | null | undefined): AgentIntentContract | null {
  return AGENT_INTENT_CONTRACTS.find((contract) => contract.intentId === intentId) ?? null;
}

export function getIntentContractByToolName(toolName: RaiToolName | null | undefined): AgentIntentContract | null {
  return AGENT_INTENT_CONTRACTS.find((contract) => contract.toolName === toolName) ?? null;
}

export function classifyByAgentContracts(
  message: string,
  workspaceContext?: WorkspaceContextForIntent,
): IntentClassification {
  const normalized = message.toLowerCase();

  for (const contract of AGENT_INTENT_CONTRACTS) {
    if (contract.keywordsPattern?.test(normalized)) {
      return {
        targetRole: contract.role,
        intent: contract.intentId,
        toolName: contract.toolName,
        confidence: contract.classificationConfidence,
        method: "regex",
        reason: contract.classificationReason,
      };
    }
  }

  const inferredRole = inferRoleFromRoute(workspaceContext);
  return {
    targetRole: inferredRole,
    intent: null,
    toolName: null,
    confidence: 0,
    method: "regex",
    reason: "no_match",
  };
}

export function buildAutoToolCallFromContracts(
  request: RaiChatRequestDto,
  classification: IntentClassification,
): RaiToolCall | null {
  const intentContract = getIntentContractByToolName(classification.toolName);
  if (!intentContract?.toolName) {
    return null;
  }

  const activeRefs = request.workspaceContext?.activeEntityRefs ?? [];
  const filters = request.workspaceContext?.filters ?? {};

  switch (intentContract.intentId) {
    case "compute_deviations":
      return {
        name: intentContract.toolName,
        payload: {
          scope: {
            seasonId: typeof filters.seasonId === "string" ? filters.seasonId : undefined,
            fieldId: activeRefs.find((item) => item.kind === "field")?.id,
          },
        },
      };
    case "compute_plan_fact":
      return {
        name: intentContract.toolName,
        payload: {
          scope: {
            planId: typeof filters.planId === "string" ? filters.planId : undefined,
            seasonId: typeof filters.seasonId === "string" ? filters.seasonId : undefined,
          },
        },
      };
    case "simulate_scenario":
      return {
        name: intentContract.toolName,
        payload: {
          scope: {
            planId: typeof filters.planId === "string" ? filters.planId : undefined,
            seasonId: typeof filters.seasonId === "string" ? filters.seasonId : undefined,
          },
        },
      };
    case "compute_risk_assessment":
      return {
        name: intentContract.toolName,
        payload: {
          scope: {
            planId: typeof filters.planId === "string" ? filters.planId : undefined,
            seasonId: typeof filters.seasonId === "string" ? filters.seasonId : undefined,
          },
        },
      };
    case "emit_alerts":
      return {
        name: intentContract.toolName,
        payload: {
          severity: /s4/i.test(request.message) ? "S4" : "S3",
        },
      };
    case "tech_map_draft": {
      const fieldRef = activeRefs.find((item) => item.kind === "field")?.id;
      const seasonRef = typeof filters.seasonId === "string" ? filters.seasonId : undefined;

      if (!fieldRef || !seasonRef) {
        return null;
      }

      return {
        name: intentContract.toolName,
        payload: {
          fieldRef,
          seasonRef,
          crop: /подсолнеч|sunflower/i.test(request.message) ? "sunflower" : "rapeseed",
        },
      };
    }
    default:
      return null;
  }
}

export function buildResumeExecutionPlan(request: RaiChatRequestDto): {
  classification: IntentClassification;
  requestedToolCalls: RaiChatRequestDto["toolCalls"];
} | null {
  if (!request.clarificationResume) {
    return null;
  }

  const contract = getIntentContract(request.clarificationResume.intentId);
  if (!contract?.toolName) {
    return null;
  }

  const context = resolveContextValues(request);
  if (contract.intentId === "compute_plan_fact") {
    return {
      classification: {
        targetRole: "economist",
        intent: "compute_plan_fact",
        toolName: contract.toolName,
        confidence: 1,
        method: "regex",
        reason: "resume:compute_plan_fact",
      },
      requestedToolCalls: [
        {
          name: contract.toolName,
          payload: {
            scope: {
              ...(context.planId ? { planId: context.planId } : {}),
              ...(context.seasonId ? { seasonId: context.seasonId } : {}),
            },
          },
        },
      ],
    };
  }

  return {
    classification: {
      targetRole: "agronomist",
      intent: "tech_map_draft",
      toolName: contract.toolName,
      confidence: 1,
      method: "regex",
      reason: "resume:tech_map_draft",
    },
    requestedToolCalls: [
      {
        name: contract.toolName,
        payload: {
          ...(context.fieldRef ? { fieldRef: context.fieldRef } : {}),
          ...(context.seasonRef ? { seasonRef: context.seasonRef } : {}),
        },
      },
    ],
  };
}

export function detectClarificationContract(
  request: RaiChatRequestDto,
  executionResult: ExecutionResult,
): AgentIntentContract | null {
  const agentExecution = executionResult.agentExecution;
  if (!agentExecution) {
    return null;
  }

  if (request.clarificationResume?.intentId) {
    const contract = getIntentContract(request.clarificationResume.intentId);
    if (contract?.role === agentExecution.role && contract.clarification) {
      return contract;
    }
  }

  for (const tool of executionResult.executedTools) {
    const contract = getIntentContractByToolName(tool.name);
    if (contract?.role === agentExecution.role && contract.clarification) {
      return contract;
    }
  }

  for (const tool of agentExecution.toolCalls) {
    const contract = getIntentContractByToolName(tool.name as RaiToolName);
    if (contract?.role === agentExecution.role && contract.clarification) {
      return contract;
    }
  }

  const classified = classifyByAgentContracts(request.message, request.workspaceContext);
  const contract = getIntentContract(classified.intent);
  return contract?.role === agentExecution.role && contract.clarification ? contract : null;
}

export function resolveContextValues(request: RaiChatRequestDto): Record<ContextKey, string | undefined> {
  return {
    fieldRef:
      request.clarificationResume?.collectedContext.fieldRef ??
      request.workspaceContext?.activeEntityRefs?.find((item) => item.kind === "field")?.id,
    seasonRef:
      typeof (
        request.clarificationResume?.collectedContext.seasonRef ??
        request.workspaceContext?.filters?.seasonId
      ) === "string"
        ? String(
            request.clarificationResume?.collectedContext.seasonRef ??
              request.workspaceContext?.filters?.seasonId,
          )
        : undefined,
    seasonId:
      typeof (
        request.clarificationResume?.collectedContext.seasonId ??
        request.workspaceContext?.filters?.seasonId
      ) === "string"
        ? String(
            request.clarificationResume?.collectedContext.seasonId ??
              request.workspaceContext?.filters?.seasonId,
          )
        : undefined,
    planId:
      typeof (
        request.clarificationResume?.collectedContext.planId ??
        request.workspaceContext?.filters?.planId
      ) === "string"
        ? String(
            request.clarificationResume?.collectedContext.planId ??
              request.workspaceContext?.filters?.planId,
          )
        : undefined,
  };
}

export function resolveMissingContextKeys(
  contract: AgentIntentContract,
  context: Record<ContextKey, string | undefined>,
): ContextKey[] {
  return (contract.clarification?.requiredContext ?? [])
    .map((item) => item.key)
    .filter((key) => !context[key]);
}

export function buildPendingClarificationItems(
  contract: AgentIntentContract,
  context: Record<ContextKey, string | undefined>,
): PendingClarificationItemDto[] {
  return (contract.clarification?.requiredContext ?? []).map((item) => ({
    key: item.key,
    label: item.label,
    required: true,
    reason: item.reason,
    sourcePriority: ["workspace", "record", "user"],
    status: context[item.key] ? "resolved" : "missing",
    resolvedFrom: context[item.key] ? "workspace" : undefined,
    value: context[item.key],
  }));
}
