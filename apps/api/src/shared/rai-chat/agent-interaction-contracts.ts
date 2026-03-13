import {
  PendingClarificationItemDto,
  RaiChatRequestDto,
  RaiWorkWindowActionDto,
} from "./rai-chat.dto";
import {
  IntentClassification,
  WorkspaceContextForIntent,
} from "./intent-router.types";
import { ExecutionResult } from "../../modules/rai-chat/runtime/agent-runtime.service";
import { RaiToolCall, RaiToolName } from "./rai-tools.types";

export type AgentContractRole =
  | "agronomist"
  | "economist"
  | "knowledge"
  | "monitoring"
  | "crm_agent"
  | "front_office_agent"
  | "contracts_agent";
export type AgentContractIntentId =
  | "tech_map_draft"
  | "compute_deviations"
  | "compute_plan_fact"
  | "simulate_scenario"
  | "compute_risk_assessment"
  | "query_knowledge"
  | "emit_alerts"
  | "register_counterparty"
  | "create_counterparty_relation"
  | "create_crm_account"
  | "review_account_workspace"
  | "update_account_profile"
  | "create_crm_contact"
  | "update_crm_contact"
  | "delete_crm_contact"
  | "log_crm_interaction"
  | "update_crm_interaction"
  | "delete_crm_interaction"
  | "create_crm_obligation"
  | "update_crm_obligation"
  | "delete_crm_obligation"
  | "create_commerce_contract"
  | "list_commerce_contracts"
  | "review_commerce_contract"
  | "create_contract_obligation"
  | "create_fulfillment_event"
  | "create_invoice_from_fulfillment"
  | "post_invoice"
  | "create_payment"
  | "confirm_payment"
  | "allocate_payment"
  | "review_ar_balance"
  | "log_dialog_message"
  | "classify_dialog_thread"
  | "create_front_office_escalation";
export type ContextKey = "fieldRef" | "seasonRef" | "seasonId" | "planId";

type OutputMode = "answer" | "clarification" | "window" | "comparison" | "analysis";
type DefaultWindowMode = "inline" | "panel" | "takeover";
type ContextSource = "workspace" | "memory" | "record" | "thread" | "user";

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
  buildResultHintActions: (
    windowId: string,
    resolvedContext: Record<ContextKey, string | undefined>,
  ) => RaiWorkWindowActionDto[];
}

export interface AgentFocusContract {
  role: AgentContractRole;
  title: string;
  businessDomain: string;
  responsibilities: string[];
  allowedEntityTypes: string[];
  disallowedEntityTypes?: string[];
  allowedRoutes?: string[];
  forbiddenRoutes?: string[];
}

export interface AgentIntentDefinition {
  id: AgentContractIntentId;
  intentId: AgentContractIntentId;
  role: AgentContractRole;
  description: string;
  taskFamily: string;
  triggerHints: string[];
  toolName?: RaiToolName;
  outputMode: OutputMode;
  requiredContextKeys: ContextKey[];
  optionalContextKeys?: ContextKey[];
  allowedWithoutContext?: boolean;
}

export interface RequiredContextDefinition {
  key: ContextKey;
  label: string;
  entityType?: string;
  required: boolean;
  sourcePriority: ContextSource[];
  reason: string;
}

export interface AgentUiActionDefinition {
  id: string;
  role: AgentContractRole;
  intentId?: AgentContractIntentId;
  kind: "focus_window" | "open_route" | "open_entity" | "refresh_context" | "pick_context";
  label: string;
  targetRoutePattern?: string;
  allowedWindowTypes?: string[];
  allowedEntityTypes?: string[];
}

export interface AgentGuardrailDefinition {
  role: AgentContractRole;
  forbiddenIntentIds?: AgentContractIntentId[];
  forbiddenEntityTypes?: string[];
  forbiddenActions?: string[];
  forbiddenDomains?: string[];
}

export interface ResponsibilityBinding {
  role: string;
  inheritsFromRole: AgentContractRole;
  overrides?: {
    title?: string;
    allowedIntents?: AgentContractIntentId[];
    forbiddenIntents?: AgentContractIntentId[];
    extraUiActions?: string[];
  };
}

export interface ResponsibilityValidationResult {
  valid: boolean;
  effectiveRole: AgentContractRole | null;
  allowedIntentIds: AgentContractIntentId[];
  allowedToolNames: RaiToolName[];
  missingRequirements: string[];
  warnings: string[];
}

interface AgentIntentContract extends AgentIntentDefinition {
  keywordsPattern?: RegExp;
  routeHints?: RouteHintMatcher;
  classificationReason: string;
  classificationConfidence: number;
  clarification?: ClarificationUiContract;
  contextContract: RequiredContextDefinition[];
  optionalContextContract?: RequiredContextDefinition[];
  uiActionSurface: {
    defaultWindowType: string;
    defaultWindowMode: DefaultWindowMode;
    allowedUiActions: string[];
    allowedNavigationTargets?: string[];
  };
}

interface AgentResponsibilityProfile {
  role: AgentContractRole;
  focus: AgentFocusContract;
  guardrails: AgentGuardrailDefinition;
  intents: AgentIntentContract[];
  uiActions: AgentUiActionDefinition[];
}

const CONTEXT_SOURCE_DEFAULT: ContextSource[] = ["workspace", "record", "user"];

const CANONICAL_RESPONSIBILITY_PROFILES: Record<AgentContractRole, AgentResponsibilityProfile> = {
  agronomist: {
    role: "agronomist",
    focus: {
      role: "agronomist",
      title: "Agronomist",
      businessDomain: "agronomy",
      responsibilities: [
        "tech map draft and review",
        "field operation guidance",
        "deviation review",
      ],
      allowedEntityTypes: ["field", "season", "tech_map", "operation"],
      disallowedEntityTypes: ["invoice", "contract", "crm_lead"],
      allowedRoutes: ["/consulting/techmaps", "/consulting/fields", "/consulting/dashboard"],
      forbiddenRoutes: ["/knowledge", "/finance", "/crm"],
    },
    guardrails: {
      role: "agronomist",
      forbiddenIntentIds: ["compute_plan_fact", "simulate_scenario", "compute_risk_assessment", "query_knowledge", "emit_alerts"],
      forbiddenEntityTypes: ["invoice", "regulation", "crm_lead"],
      forbiddenActions: ["open_finance_route", "open_knowledge_route"],
      forbiddenDomains: ["finance", "legal", "crm"],
    },
    intents: [
      {
        id: "tech_map_draft",
        intentId: "tech_map_draft",
        role: "agronomist",
        description: "Prepare a draft technology map for the selected field and season.",
        taskFamily: "tech_map_draft",
        triggerHints: ["техкарт", "techmap", "сделай карту"],
        toolName: RaiToolName.GenerateTechMapDraft,
        outputMode: "clarification",
        requiredContextKeys: ["fieldRef", "seasonRef"],
        optionalContextKeys: [],
        allowedWithoutContext: false,
        keywordsPattern: /техкарт|techmap|сделай карту/i,
        routeHints: { includesAny: ["techmaps", "field"] },
        classificationReason: "responsibility:agronomy:tech_map_draft",
        classificationConfidence: 0.7,
        contextContract: [
          {
            key: "fieldRef",
            label: "Поле",
            entityType: "field",
            required: true,
            sourcePriority: CONTEXT_SOURCE_DEFAULT,
            reason: "Нужно понять, для какого поля готовить техкарту.",
          },
          {
            key: "seasonRef",
            label: "Сезон",
            entityType: "season",
            required: true,
            sourcePriority: CONTEXT_SOURCE_DEFAULT,
            reason: "Нужно понять, для какого сезона готовить техкарту.",
          },
        ],
        optionalContextContract: [
          {
            key: "planId",
            label: "План",
            entityType: "plan",
            required: false,
            sourcePriority: ["workspace", "record"],
            reason: "Если план уже выбран, можно связать техкарту с текущим хозяйственным контуром.",
          },
        ],
        uiActionSurface: {
          defaultWindowType: "context_acquisition",
          defaultWindowMode: "panel",
          allowedUiActions: [
            "focus_window",
            "use_workspace_field",
            "open_field_card",
            "open_season_picker",
            "refresh_context",
            "go_to_techmap",
          ],
          allowedNavigationTargets: ["/consulting/techmaps/active", "/consulting/fields"],
        },
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
        id: "compute_deviations",
        intentId: "compute_deviations",
        role: "agronomist",
        description: "Review agronomic deviations for field execution.",
        taskFamily: "execution_deviation_review",
        triggerHints: ["отклонени", "deviation"],
        toolName: RaiToolName.ComputeDeviations,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: ["fieldRef", "seasonId"],
        allowedWithoutContext: true,
        keywordsPattern: /отклонени|deviation/i,
        routeHints: { includesAny: ["techmaps", "field"] },
        classificationReason: "responsibility:agronomy:deviation_review",
        classificationConfidence: 0.7,
        contextContract: [],
        optionalContextContract: [
          {
            key: "fieldRef",
            label: "Поле",
            entityType: "field",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "Поле помогает сузить выборку отклонений.",
          },
          {
            key: "seasonId",
            label: "Сезон",
            entityType: "season",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "Сезон нужен для релевантного набора отклонений.",
          },
        ],
        uiActionSurface: {
          defaultWindowType: "analysis",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/consulting/techmaps/active"],
        },
      },
    ],
    uiActions: [
      {
        id: "focus_context_acquisition",
        role: "agronomist",
        intentId: "tech_map_draft",
        kind: "focus_window",
        label: "Открыть панель добора",
        allowedWindowTypes: ["context_acquisition"],
      },
      {
        id: "open_techmaps_route",
        role: "agronomist",
        intentId: "tech_map_draft",
        kind: "open_route",
        label: "Перейти к техкартам",
        targetRoutePattern: "/consulting/techmaps/active",
      },
      {
        id: "open_field_entity",
        role: "agronomist",
        intentId: "tech_map_draft",
        kind: "open_entity",
        label: "Открыть поле",
        allowedEntityTypes: ["field"],
      },
      {
        id: "refresh_agro_context",
        role: "agronomist",
        intentId: "tech_map_draft",
        kind: "refresh_context",
        label: "Обновить контекст",
      },
      {
        id: "pick_agro_context",
        role: "agronomist",
        intentId: "tech_map_draft",
        kind: "pick_context",
        label: "Выбрать сезон",
        allowedEntityTypes: ["season"],
      },
    ],
  },
  economist: {
    role: "economist",
    focus: {
      role: "economist",
      title: "Economist",
      businessDomain: "finance",
      responsibilities: ["plan fact analysis", "scenario comparison", "risk assessment"],
      allowedEntityTypes: ["plan", "season", "budget", "kpi"],
      disallowedEntityTypes: ["field_observation", "crm_lead"],
      allowedRoutes: ["/finance", "/consulting/yield"],
      forbiddenRoutes: ["/knowledge", "/crm"],
    },
    guardrails: {
      role: "economist",
      forbiddenIntentIds: ["tech_map_draft", "compute_deviations", "query_knowledge", "emit_alerts"],
      forbiddenEntityTypes: ["field_observation", "crm_lead"],
      forbiddenActions: ["open_field_card"],
      forbiddenDomains: ["agronomy", "crm"],
    },
    intents: [
      {
        id: "compute_plan_fact",
        intentId: "compute_plan_fact",
        role: "economist",
        description: "Compute plan-fact view for the active season or plan.",
        taskFamily: "compute_plan_fact",
        triggerHints: ["план-факт", "plan fact", "cash flow", "budget", "kpi"],
        toolName: RaiToolName.ComputePlanFact,
        outputMode: "clarification",
        requiredContextKeys: ["seasonId"],
        optionalContextKeys: ["planId"],
        allowedWithoutContext: false,
        keywordsPattern: /план[ .-]?факт|plan[ .-]?fact|cash flow|cashflow|денежн|ликвид|бюджет|марж|риск|kpi/i,
        routeHints: { includesAny: ["finance", "econom", "yield"] },
        classificationReason: "responsibility:finance:plan_fact",
        classificationConfidence: 0.75,
        contextContract: [
          {
            key: "seasonId",
            label: "Сезон",
            entityType: "season",
            required: true,
            sourcePriority: CONTEXT_SOURCE_DEFAULT,
            reason: "Нужно понять, в рамках какого сезона искать актуальный план.",
          },
        ],
        optionalContextContract: [
          {
            key: "planId",
            label: "План",
            entityType: "plan",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "Если план уже выбран, расчёт станет точнее и быстрее.",
          },
        ],
        uiActionSurface: {
          defaultWindowType: "context_acquisition",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/consulting/yield", "/finance"],
        },
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
        id: "simulate_scenario",
        intentId: "simulate_scenario",
        role: "economist",
        description: "Compare alternative financial scenarios.",
        taskFamily: "scenario_comparison",
        triggerHints: ["сценари", "scenario", "what if"],
        toolName: RaiToolName.SimulateScenario,
        outputMode: "comparison",
        requiredContextKeys: [],
        optionalContextKeys: ["planId", "seasonId"],
        allowedWithoutContext: true,
        keywordsPattern: /сценари|scenario|what if/i,
        routeHints: { includesAny: ["finance", "econom", "yield"] },
        classificationReason: "responsibility:finance:scenario_comparison",
        classificationConfidence: 0.72,
        contextContract: [],
        optionalContextContract: [
          {
            key: "planId",
            label: "План",
            entityType: "plan",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "План задаёт базовую точку для сценарного сравнения.",
          },
          {
            key: "seasonId",
            label: "Сезон",
            entityType: "season",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "Сезон помогает сопоставить сценарии в одном периоде.",
          },
        ],
        uiActionSurface: {
          defaultWindowType: "comparison",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/consulting/yield", "/finance"],
        },
      },
      {
        id: "compute_risk_assessment",
        intentId: "compute_risk_assessment",
        role: "economist",
        description: "Assess financial risks for the active plan.",
        taskFamily: "risk_assessment",
        triggerHints: ["риск", "risk"],
        toolName: RaiToolName.ComputeRiskAssessment,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: ["planId", "seasonId"],
        allowedWithoutContext: true,
        keywordsPattern: /риск|risk/i,
        routeHints: { includesAny: ["finance", "econom", "yield"] },
        classificationReason: "responsibility:finance:risk_assessment",
        classificationConfidence: 0.7,
        contextContract: [],
        optionalContextContract: [
          {
            key: "planId",
            label: "План",
            entityType: "plan",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "План нужен для привязки оценки риска к конкретной финансовой сущности.",
          },
          {
            key: "seasonId",
            label: "Сезон",
            entityType: "season",
            required: false,
            sourcePriority: ["workspace", "record", "user"],
            reason: "Сезон помогает оценить риск в правильном периоде.",
          },
        ],
        uiActionSurface: {
          defaultWindowType: "analysis",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/consulting/yield", "/finance"],
        },
      },
    ],
    uiActions: [
      {
        id: "focus_planfact_window",
        role: "economist",
        intentId: "compute_plan_fact",
        kind: "focus_window",
        label: "Открыть финансовую панель",
        allowedWindowTypes: ["context_acquisition", "structured_result"],
      },
      {
        id: "open_finance_route",
        role: "economist",
        intentId: "compute_plan_fact",
        kind: "open_route",
        label: "Перейти к финансам",
        targetRoutePattern: "/consulting/yield",
      },
      {
        id: "refresh_finance_context",
        role: "economist",
        intentId: "compute_plan_fact",
        kind: "refresh_context",
        label: "Обновить финансовый контекст",
      },
    ],
  },
  knowledge: {
    role: "knowledge",
    focus: {
      role: "knowledge",
      title: "Knowledge",
      businessDomain: "knowledge",
      responsibilities: ["query knowledge", "policy lookup", "document grounding"],
      allowedEntityTypes: ["document", "policy", "knowledge_article"],
      disallowedEntityTypes: ["invoice", "field_operation"],
      allowedRoutes: ["/knowledge"],
      forbiddenRoutes: ["/finance/critical-write"],
    },
    guardrails: {
      role: "knowledge",
      forbiddenIntentIds: ["tech_map_draft", "compute_deviations", "compute_plan_fact", "simulate_scenario", "compute_risk_assessment", "emit_alerts"],
      forbiddenEntityTypes: ["invoice", "field_operation"],
      forbiddenActions: ["open_field_card", "open_finance_route"],
      forbiddenDomains: ["agronomy", "finance"],
    },
    intents: [
      {
        id: "query_knowledge",
        intentId: "query_knowledge",
        role: "knowledge",
        description: "Ground the answer in available knowledge and policy materials.",
        taskFamily: "query_knowledge",
        triggerHints: ["знан", "knowledge", "документ", "регламент", "что известно"],
        toolName: RaiToolName.QueryKnowledge,
        outputMode: "answer",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /знан|knowledge|документ|регламент|что известно/i,
        routeHints: { includesAny: ["knowledge"] },
        classificationReason: "responsibility:knowledge:query",
        classificationConfidence: 0.6,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "related_signals",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route"],
          allowedNavigationTargets: ["/knowledge"],
        },
      },
    ],
    uiActions: [
      {
        id: "open_knowledge_route",
        role: "knowledge",
        intentId: "query_knowledge",
        kind: "open_route",
        label: "Открыть базу знаний",
        targetRoutePattern: "/knowledge",
      },
    ],
  },
  monitoring: {
    role: "monitoring",
    focus: {
      role: "monitoring",
      title: "Monitoring",
      businessDomain: "monitoring",
      responsibilities: ["signal review", "alert emission"],
      allowedEntityTypes: ["alert", "signal", "incident"],
      disallowedEntityTypes: ["invoice", "crm_lead"],
      allowedRoutes: ["/control-tower", "/monitoring"],
      forbiddenRoutes: ["/crm"],
    },
    guardrails: {
      role: "monitoring",
      forbiddenIntentIds: ["tech_map_draft", "compute_deviations", "compute_plan_fact", "simulate_scenario", "compute_risk_assessment", "query_knowledge"],
      forbiddenEntityTypes: ["invoice", "crm_lead"],
      forbiddenActions: ["open_field_card", "open_finance_route"],
      forbiddenDomains: ["finance", "crm"],
    },
    intents: [
      {
        id: "emit_alerts",
        intentId: "emit_alerts",
        role: "monitoring",
        description: "Review signals and emit governed alerts.",
        taskFamily: "emit_alerts",
        triggerHints: ["алерт", "эскалац", "alert"],
        toolName: RaiToolName.EmitAlerts,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /алерт|эскалац|alert/i,
        routeHints: { includesAny: ["monitor", "alert"] },
        classificationReason: "responsibility:monitoring:alerts",
        classificationConfidence: 0.7,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "signals",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route"],
          allowedNavigationTargets: ["/control-tower", "/monitoring"],
        },
      },
    ],
    uiActions: [
      {
        id: "open_control_tower_route",
        role: "monitoring",
        intentId: "emit_alerts",
        kind: "open_route",
        label: "Открыть Control Tower",
        targetRoutePattern: "/control-tower",
      },
    ],
  },
  crm_agent: {
    role: "crm_agent",
    focus: {
      role: "crm_agent",
      title: "CRM-агент",
      businessDomain: "crm",
      responsibilities: [
        "регистрация контрагентов",
        "управление карточками клиентов",
        "создание и сопровождение CRM-аккаунтов",
        "ведение контактов и контактных ролей",
        "ведение взаимодействий и follow-up",
        "управление связями и структурой контрагентов",
        "управление обязательствами и задачами по клиенту",
      ],
      allowedEntityTypes: ["party", "account", "contact", "interaction", "obligation", "holding", "farm"],
      disallowedEntityTypes: ["tech_map", "field_operation", "budget_plan"],
      allowedRoutes: ["/consulting/crm", "/parties", "/crm", "/commerce/parties"],
      forbiddenRoutes: ["/knowledge", "/consulting/techmaps"],
    },
    guardrails: {
      role: "crm_agent",
      forbiddenIntentIds: ["tech_map_draft", "compute_deviations", "compute_plan_fact", "simulate_scenario", "compute_risk_assessment", "query_knowledge", "emit_alerts"],
      forbiddenEntityTypes: ["tech_map", "field_operation", "budget_plan"],
      forbiddenActions: ["open_finance_route", "open_knowledge_route"],
      forbiddenDomains: ["agronomy", "finance", "monitoring"],
    },
    intents: [
      {
        id: "register_counterparty",
        intentId: "register_counterparty",
        role: "crm_agent",
        description: "Найти контрагента по ИНН и зарегистрировать его в реестре.",
        taskFamily: "crm_counterparty_onboarding",
        triggerHints: ["контрагент", "инн", "зарегистр", "добавь в crm", "реестр"],
        toolName: RaiToolName.RegisterCounterparty,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /контрагент|инн|зарегистр|добав[ьи].*crm|реестр/i,
        routeHints: { includesAny: ["crm", "parties", "counterpart"] },
        classificationReason: "responsibility:crm:register_counterparty",
        classificationConfidence: 0.82,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity", "refresh_context"],
          allowedNavigationTargets: ["/consulting/crm", "/parties"],
        },
      },
      {
        id: "create_counterparty_relation",
        intentId: "create_counterparty_relation",
        role: "crm_agent",
        description: "Создать связь между контрагентами внутри корпоративной структуры.",
        taskFamily: "crm_counterparty_relation",
        triggerHints: ["связь", "структур", "аффили", "владел", "ownership"],
        toolName: RaiToolName.CreateCounterpartyRelation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /связ|структур|аффили|владел|ownership|management/i,
        routeHints: { includesAny: ["crm", "parties", "structure"] },
        classificationReason: "responsibility:crm:create_counterparty_relation",
        classificationConfidence: 0.76,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/parties"],
        },
      },
      {
        id: "create_crm_account",
        intentId: "create_crm_account",
        role: "crm_agent",
        description: "Создать CRM-аккаунт клиента или контрагента.",
        taskFamily: "crm_account_create",
        triggerHints: ["создай аккаунт", "создай карточку клиента", "добавь клиента в crm", "заведи аккаунт"],
        toolName: RaiToolName.CreateCrmAccount,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /созд(ай|ать).*(аккаунт|клиент|карточк)|заведи.*аккаунт|добавь.*клиент.*crm/i,
        routeHints: { includesAny: ["crm", "account", "parties"] },
        classificationReason: "responsibility:crm:create_account",
        classificationConfidence: 0.76,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity", "refresh_context"],
          allowedNavigationTargets: ["/consulting/crm", "/crm"],
        },
      },
      {
        id: "review_account_workspace",
        intentId: "review_account_workspace",
        role: "crm_agent",
        description: "Показать рабочее пространство аккаунта: контакты, взаимодействия, риски и обязательства.",
        taskFamily: "crm_workspace_review",
        triggerHints: ["карточк", "workspace", "профиль клиента", "crm карточк", "контакты"],
        toolName: RaiToolName.GetCrmAccountWorkspace,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /карточк|workspace|профил|контакты|обязательств|истор/i,
        routeHints: { includesAny: ["crm", "account", "parties"] },
        classificationReason: "responsibility:crm:review_account_workspace",
        classificationConfidence: 0.68,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/consulting/crm", "/parties"],
        },
      },
      {
        id: "update_account_profile",
        intentId: "update_account_profile",
        role: "crm_agent",
        description: "Изменить статус, риск, холдинг или иные атрибуты CRM-аккаунта.",
        taskFamily: "crm_account_update",
        triggerHints: ["обнови аккаунт", "измени статус", "измени риск", "обнови карточку"],
        toolName: RaiToolName.UpdateCrmAccount,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /обнови.*аккаунт|измени.*статус|измени.*риск|обнови.*карточк/i,
        routeHints: { includesAny: ["crm", "account"] },
        classificationReason: "responsibility:crm:update_account_profile",
        classificationConfidence: 0.74,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "create_crm_contact",
        intentId: "create_crm_contact",
        role: "crm_agent",
        description: "Создать контакт в CRM-аккаунте.",
        taskFamily: "crm_contact_create",
        triggerHints: ["добавь контакт", "создай контакт", "новый контакт", "контактное лицо", "контакт"],
        toolName: RaiToolName.CreateCrmContact,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /добавь.*контакт|созд(ай|ать).*(контакт|контактное лицо)|новый контакт/i,
        routeHints: { includesAny: ["crm", "account", "contact"] },
        classificationReason: "responsibility:crm:create_contact",
        classificationConfidence: 0.74,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route", "open_entity"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "update_crm_contact",
        intentId: "update_crm_contact",
        role: "crm_agent",
        description: "Обновить контакт клиента: роль, контакты, влияние.",
        taskFamily: "crm_contact_update",
        triggerHints: ["обнови контакт", "измени контакт", "правь контакт"],
        toolName: RaiToolName.UpdateCrmContact,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /обнови.*контакт|измени.*контакт|правь.*контакт/i,
        routeHints: { includesAny: ["crm", "contact"] },
        classificationReason: "responsibility:crm:update_contact",
        classificationConfidence: 0.73,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "delete_crm_contact",
        intentId: "delete_crm_contact",
        role: "crm_agent",
        description: "Удалить устаревший или ошибочный контакт из CRM.",
        taskFamily: "crm_contact_delete",
        triggerHints: ["удали контакт", "убери контакт", "снеси контакт"],
        toolName: RaiToolName.DeleteCrmContact,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /удали.*контакт|убери.*контакт|снеси.*контакт/i,
        routeHints: { includesAny: ["crm", "contact"] },
        classificationReason: "responsibility:crm:delete_contact",
        classificationConfidence: 0.72,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "log_crm_interaction",
        intentId: "log_crm_interaction",
        role: "crm_agent",
        description: "Зафиксировать звонок, встречу или иное клиентское взаимодействие.",
        taskFamily: "crm_activity_logging",
        triggerHints: ["зафиксируй звонок", "создай взаимодействие", "создай звонок", "создай встречу", "новое взаимодействие"],
        toolName: RaiToolName.CreateCrmInteraction,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /(зафикс|созд(ай|ать)|добав(ь|ить)).*(взаимодейств|звонок|встреч|созвон)|новое взаимодействие/i,
        routeHints: { includesAny: ["crm", "account"] },
        classificationReason: "responsibility:crm:log_interaction",
        classificationConfidence: 0.73,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "update_crm_interaction",
        intentId: "update_crm_interaction",
        role: "crm_agent",
        description: "Обновить журнал взаимодействия: тип, summary, привязки.",
        taskFamily: "crm_activity_update",
        triggerHints: ["обнови взаимодействие", "измени взаимодействие", "правь звонок", "правь встречу"],
        toolName: RaiToolName.UpdateCrmInteraction,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /обнови.*взаимодейств|измени.*взаимодейств|правь.*(звонок|встреч)/i,
        routeHints: { includesAny: ["crm", "interaction"] },
        classificationReason: "responsibility:crm:update_interaction",
        classificationConfidence: 0.72,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "delete_crm_interaction",
        intentId: "delete_crm_interaction",
        role: "crm_agent",
        description: "Удалить ошибочно созданное CRM-взаимодействие.",
        taskFamily: "crm_activity_delete",
        triggerHints: ["удали взаимодействие", "убери взаимодействие", "удали звонок", "удали встречу"],
        toolName: RaiToolName.DeleteCrmInteraction,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /удали.*взаимодейств|убери.*взаимодейств|удали.*(звонок|встреч)/i,
        routeHints: { includesAny: ["crm", "interaction"] },
        classificationReason: "responsibility:crm:delete_interaction",
        classificationConfidence: 0.71,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "create_crm_obligation",
        intentId: "create_crm_obligation",
        role: "crm_agent",
        description: "Поставить follow-up обязательство по клиенту или контрагенту.",
        taskFamily: "crm_follow_up",
        triggerHints: ["создай обязательство", "поставь обязательство", "добавь обязательство", "follow up", "поставь задачу"],
        toolName: RaiToolName.CreateCrmObligation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /(созд(ай|ать)|постав(ь|ить)|добав(ь|ить)).*(обязательств|follow up|задач|напомин)|поставь.*дедлайн/i,
        routeHints: { includesAny: ["crm", "account"] },
        classificationReason: "responsibility:crm:create_obligation",
        classificationConfidence: 0.74,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "update_crm_obligation",
        intentId: "update_crm_obligation",
        role: "crm_agent",
        description: "Обновить follow-up обязательство: срок, ответственный, статус.",
        taskFamily: "crm_follow_up_update",
        triggerHints: ["обнови обязательство", "измени обязательство", "перенеси дедлайн", "измени follow up"],
        toolName: RaiToolName.UpdateCrmObligation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /обнови.*обязательств|измени.*обязательств|перенеси.*дедлайн|измени.*follow up/i,
        routeHints: { includesAny: ["crm", "obligation"] },
        classificationReason: "responsibility:crm:update_obligation",
        classificationConfidence: 0.73,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
      {
        id: "delete_crm_obligation",
        intentId: "delete_crm_obligation",
        role: "crm_agent",
        description: "Удалить неактуальное обязательство по клиенту.",
        taskFamily: "crm_follow_up_delete",
        triggerHints: ["удали обязательство", "убери обязательство", "сними обязательство"],
        toolName: RaiToolName.DeleteCrmObligation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /удали.*обязательств|убери.*обязательств|сними.*обязательств/i,
        routeHints: { includesAny: ["crm", "obligation"] },
        classificationReason: "responsibility:crm:delete_obligation",
        classificationConfidence: 0.71,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "refresh_context", "open_route"],
          allowedNavigationTargets: ["/consulting/crm"],
        },
      },
    ],
    uiActions: [
      {
        id: "open_crm_route",
        role: "crm_agent",
        intentId: "review_account_workspace",
        kind: "open_route",
        label: "Открыть CRM",
        targetRoutePattern: "/consulting/crm",
      },
      {
        id: "open_parties_route",
        role: "crm_agent",
        intentId: "register_counterparty",
        kind: "open_route",
        label: "Открыть реестр контрагентов",
        targetRoutePattern: "/parties",
      },
      {
        id: "refresh_context",
        role: "crm_agent",
        kind: "refresh_context",
        label: "Обновить CRM-контекст",
      },
      {
        id: "open_account",
        role: "crm_agent",
        intentId: "review_account_workspace",
        kind: "open_entity",
        label: "Открыть карточку клиента",
        allowedEntityTypes: ["account", "party"],
      },
      {
        id: "open_activity_log",
        role: "crm_agent",
        intentId: "log_crm_interaction",
        kind: "focus_window",
        label: "Открыть журнал активностей",
        allowedWindowTypes: ["structured_result"],
      },
      {
        id: "open_contacts",
        role: "crm_agent",
        intentId: "create_crm_contact",
        kind: "open_entity",
        label: "Открыть контакты клиента",
        allowedEntityTypes: ["contact", "account"],
      },
      {
        id: "open_obligations",
        role: "crm_agent",
        intentId: "create_crm_obligation",
        kind: "focus_window",
        label: "Открыть обязательства",
        allowedWindowTypes: ["structured_result"],
      },
    ],
  },
  contracts_agent: {
    role: "contracts_agent",
    focus: {
      role: "contracts_agent",
      title: "Contracts-агент",
      businessDomain: "commerce",
      responsibilities: [
        "реестр договоров и карточки договора",
        "договорные роли сторон",
        "обязательства по договору",
        "события исполнения",
        "создание и проведение счетов",
        "создание, подтверждение и аллокация платежей",
        "просмотр дебиторского остатка",
      ],
      allowedEntityTypes: ["contract", "party", "obligation", "invoice", "payment", "fulfillment_event"],
      disallowedEntityTypes: ["field", "tech_map", "contact", "agro_signal"],
      allowedRoutes: ["/commerce/contracts", "/commerce/fulfillment", "/commerce/invoices", "/commerce/payments"],
      forbiddenRoutes: ["/consulting/techmaps", "/consulting/crm", "/knowledge"],
    },
    guardrails: {
      role: "contracts_agent",
      forbiddenIntentIds: [
        "tech_map_draft",
        "compute_deviations",
        "compute_plan_fact",
        "simulate_scenario",
        "compute_risk_assessment",
        "query_knowledge",
        "emit_alerts",
        "register_counterparty",
        "create_counterparty_relation",
        "create_crm_account",
        "review_account_workspace",
        "update_account_profile",
        "create_crm_contact",
        "update_crm_contact",
        "delete_crm_contact",
        "log_crm_interaction",
        "update_crm_interaction",
        "delete_crm_interaction",
        "create_crm_obligation",
        "update_crm_obligation",
        "delete_crm_obligation",
      ],
      forbiddenEntityTypes: ["field", "tech_map", "contact", "agro_signal"],
      forbiddenActions: ["open_field_card", "open_knowledge_route"],
      forbiddenDomains: ["agronomy", "crm", "monitoring"],
    },
    intents: [
      {
        id: "create_commerce_contract",
        intentId: "create_commerce_contract",
        role: "contracts_agent",
        description: "Создать новый коммерческий договор.",
        taskFamily: "commerce_contract_create",
        triggerHints: ["заключи договор", "создай договор", "оформи договор", "новый договор", "контракт"],
        toolName: RaiToolName.CreateCommerceContract,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /заключи.*договор|созд(ай|ать).*(договор|контракт)|оформи.*договор|новый договор/i,
        routeHints: { includesAny: ["commerce", "contract"] },
        classificationReason: "responsibility:commerce:create_contract",
        classificationConfidence: 0.84,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity", "refresh_context"],
          allowedNavigationTargets: ["/commerce/contracts", "/commerce/contracts/create"],
        },
      },
      {
        id: "list_commerce_contracts",
        intentId: "list_commerce_contracts",
        role: "contracts_agent",
        description: "Показать реестр договоров.",
        taskFamily: "commerce_contract_registry",
        triggerHints: ["реестр договор", "список договор", "покажи договор", "контракты"],
        toolName: RaiToolName.ListCommerceContracts,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /реестр.*договор|список.*договор|покажи.*договор|контракты/i,
        routeHints: { includesAny: ["commerce", "contract"] },
        classificationReason: "responsibility:commerce:list_contracts",
        classificationConfidence: 0.78,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/commerce/contracts"],
        },
      },
      {
        id: "review_commerce_contract",
        intentId: "review_commerce_contract",
        role: "contracts_agent",
        description: "Открыть карточку конкретного договора.",
        taskFamily: "commerce_contract_review",
        triggerHints: ["карточка договора", "покажи договор", "открой договор", "review contract"],
        toolName: RaiToolName.GetCommerceContract,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /карточк.*договор|покажи.*договор|открой.*договор|review contract/i,
        routeHints: { includesAny: ["commerce", "contract"] },
        classificationReason: "responsibility:commerce:review_contract",
        classificationConfidence: 0.77,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/contracts"],
        },
      },
      {
        id: "create_contract_obligation",
        intentId: "create_contract_obligation",
        role: "contracts_agent",
        description: "Создать обязательство по договору.",
        taskFamily: "commerce_obligation_create",
        triggerHints: ["добавь обязательство", "создай обязательство", "обязательство deliver", "обязательство pay"],
        toolName: RaiToolName.CreateCommerceObligation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /добавь.*обязательств|созд(ай|ать).*(обязательств)|obligation|deliver|perform|pay/i,
        routeHints: { includesAny: ["commerce", "contract"] },
        classificationReason: "responsibility:commerce:create_obligation",
        classificationConfidence: 0.8,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/contracts"],
        },
      },
      {
        id: "create_fulfillment_event",
        intentId: "create_fulfillment_event",
        role: "contracts_agent",
        description: "Зафиксировать событие исполнения по обязательству.",
        taskFamily: "commerce_fulfillment_create",
        triggerHints: ["зафиксируй исполнение", "исполнение", "отгрузка", "shipment"],
        toolName: RaiToolName.CreateFulfillmentEvent,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /зафиксир.*исполн|исполнени|отгрузк|shipment/i,
        routeHints: { includesAny: ["commerce", "fulfillment"] },
        classificationReason: "responsibility:commerce:create_fulfillment",
        classificationConfidence: 0.8,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/fulfillment", "/commerce/contracts"],
        },
      },
      {
        id: "create_invoice_from_fulfillment",
        intentId: "create_invoice_from_fulfillment",
        role: "contracts_agent",
        description: "Сформировать счёт из события исполнения.",
        taskFamily: "commerce_invoice_create",
        triggerHints: ["сформируй счет", "создай счет", "инвойс", "invoice"],
        toolName: RaiToolName.CreateInvoiceFromFulfillment,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /сформир.*счет|созд(ай|ать).*(счет|инвойс)|invoice/i,
        routeHints: { includesAny: ["commerce", "invoice"] },
        classificationReason: "responsibility:commerce:create_invoice",
        classificationConfidence: 0.82,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/invoices", "/commerce/contracts"],
        },
      },
      {
        id: "post_invoice",
        intentId: "post_invoice",
        role: "contracts_agent",
        description: "Провести счёт.",
        taskFamily: "commerce_invoice_post",
        triggerHints: ["проведи счет", "опубликуй счет", "post invoice"],
        toolName: RaiToolName.PostInvoice,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /провед.*счет|опубликуй.*счет|post invoice/i,
        routeHints: { includesAny: ["commerce", "invoice"] },
        classificationReason: "responsibility:commerce:post_invoice",
        classificationConfidence: 0.76,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/invoices"],
        },
      },
      {
        id: "create_payment",
        intentId: "create_payment",
        role: "contracts_agent",
        description: "Создать платёж по договорному контуру.",
        taskFamily: "commerce_payment_create",
        triggerHints: ["создай платеж", "добавь оплату", "зарегистрируй оплату"],
        toolName: RaiToolName.CreatePayment,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /созд(ай|ать).*(платеж|оплат)|добавь.*оплат|зарегистрируй.*оплат/i,
        routeHints: { includesAny: ["commerce", "payment"] },
        classificationReason: "responsibility:commerce:create_payment",
        classificationConfidence: 0.78,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/payments"],
        },
      },
      {
        id: "confirm_payment",
        intentId: "confirm_payment",
        role: "contracts_agent",
        description: "Подтвердить платёж.",
        taskFamily: "commerce_payment_confirm",
        triggerHints: ["подтверди оплату", "подтверди платеж"],
        toolName: RaiToolName.ConfirmPayment,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /подтверд.*(оплат|платеж)/i,
        routeHints: { includesAny: ["commerce", "payment"] },
        classificationReason: "responsibility:commerce:confirm_payment",
        classificationConfidence: 0.78,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/payments"],
        },
      },
      {
        id: "allocate_payment",
        intentId: "allocate_payment",
        role: "contracts_agent",
        description: "Разнести платёж на счёт.",
        taskFamily: "commerce_payment_allocate",
        triggerHints: ["разнеси оплату", "аллокация платежа", "allocate payment"],
        toolName: RaiToolName.AllocatePayment,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /разнеси.*оплат|аллокац|allocate payment/i,
        routeHints: { includesAny: ["commerce", "payment", "invoice"] },
        classificationReason: "responsibility:commerce:allocate_payment",
        classificationConfidence: 0.78,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/payments", "/commerce/invoices"],
        },
      },
      {
        id: "review_ar_balance",
        intentId: "review_ar_balance",
        role: "contracts_agent",
        description: "Показать дебиторский остаток по счёту.",
        taskFamily: "commerce_ar_balance",
        triggerHints: ["покажи дебиторку", "дебиторка", "ar balance", "остаток по счету"],
        toolName: RaiToolName.GetArBalance,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /покажи.*дебитор|дебиторк|ar balance|остаток.*счет/i,
        routeHints: { includesAny: ["commerce", "invoice"] },
        classificationReason: "responsibility:commerce:review_ar_balance",
        classificationConfidence: 0.76,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "open_entity"],
          allowedNavigationTargets: ["/commerce/invoices"],
        },
      },
    ],
    uiActions: [
      {
        id: "open_contracts_route",
        role: "contracts_agent",
        kind: "open_route",
        label: "Открыть реестр договоров",
        targetRoutePattern: "/commerce/contracts",
      },
      {
        id: "open_contract_create_route",
        role: "contracts_agent",
        intentId: "create_commerce_contract",
        kind: "open_route",
        label: "Открыть создание договора",
        targetRoutePattern: "/commerce/contracts/create",
      },
      {
        id: "open_contract",
        role: "contracts_agent",
        intentId: "review_commerce_contract",
        kind: "open_entity",
        label: "Открыть договор",
        allowedEntityTypes: ["contract"],
      },
      {
        id: "open_invoice",
        role: "contracts_agent",
        intentId: "review_ar_balance",
        kind: "open_entity",
        label: "Открыть счёт",
        allowedEntityTypes: ["invoice"],
      },
      {
        id: "open_payment",
        role: "contracts_agent",
        intentId: "create_payment",
        kind: "open_entity",
        label: "Открыть платёж",
        allowedEntityTypes: ["payment"],
      },
      {
        id: "refresh_commerce_context",
        role: "contracts_agent",
        kind: "refresh_context",
        label: "Обновить commerce-контекст",
      },
    ],
  },
  front_office_agent: {
    role: "front_office_agent",
    focus: {
      role: "front_office_agent",
      title: "Front Office",
      businessDomain: "front_office",
      responsibilities: [
        "dialogue logging",
        "communicator message filtering",
        "free chat versus process detection",
        "task and escalation routing",
      ],
      allowedEntityTypes: ["message", "dialog_thread", "task_signal", "escalation"],
      disallowedEntityTypes: ["tech_map", "invoice", "contract", "budget_plan"],
      allowedRoutes: ["/front-office", "/telegram", "/communicator", "/consulting/dashboard"],
      forbiddenRoutes: ["/finance/critical-write", "/consulting/techmaps/active/edit"],
    },
    guardrails: {
      role: "front_office_agent",
      forbiddenIntentIds: [
        "tech_map_draft",
        "compute_deviations",
        "compute_plan_fact",
        "simulate_scenario",
        "compute_risk_assessment",
        "query_knowledge",
        "emit_alerts",
        "register_counterparty",
        "create_counterparty_relation",
        "create_crm_account",
        "review_account_workspace",
        "update_account_profile",
        "create_crm_contact",
        "update_crm_contact",
        "delete_crm_contact",
        "log_crm_interaction",
        "update_crm_interaction",
        "delete_crm_interaction",
        "create_crm_obligation",
        "update_crm_obligation",
        "delete_crm_obligation",
      ],
      forbiddenEntityTypes: ["contract", "account", "field", "budget_plan"],
      forbiddenActions: ["open_finance_route", "open_field_card"],
      forbiddenDomains: ["agronomy", "finance", "contracts", "legal"],
    },
    intents: [
      {
        id: "log_dialog_message",
        intentId: "log_dialog_message",
        role: "front_office_agent",
        description: "Зафиксировать сообщение в журнале коммуникаций.",
        taskFamily: "front_office_dialog_logging",
        triggerHints: ["сохрани переписку", "залогируй сообщение", "запиши диалог", "в журнал"],
        toolName: RaiToolName.LogDialogMessage,
        outputMode: "answer",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /сохрани.*переписк|залогир|запиши.*диалог|в журнал/i,
        routeHints: { includesAny: ["front-office", "telegram", "communicator"] },
        classificationReason: "responsibility:front_office:dialog_logging",
        classificationConfidence: 0.72,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/front-office"],
        },
      },
      {
        id: "classify_dialog_thread",
        intentId: "classify_dialog_thread",
        role: "front_office_agent",
        description: "Определить, является ли диалог свободным общением, процессом или клиентским запросом.",
        taskFamily: "front_office_dialog_classification",
        triggerHints: ["классифицируй диалог", "это задача или общение", "разбери переписку", "это процесс", "свободное общение"],
        toolName: RaiToolName.ClassifyDialogThread,
        outputMode: "analysis",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /классифицируй.*диалог|это задача.*общени|общени.*задач|разбери.*переписк|это процесс|свободное общение/i,
        routeHints: { includesAny: ["front-office", "telegram", "communicator"] },
        classificationReason: "responsibility:front_office:dialog_classification",
        classificationConfidence: 0.78,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/front-office"],
        },
      },
      {
        id: "create_front_office_escalation",
        intentId: "create_front_office_escalation",
        role: "front_office_agent",
        description: "Создать эскалацию из коммуникатора и подготовить handoff в owner-domain.",
        taskFamily: "front_office_escalation",
        triggerHints: ["эскалируй", "передай в работу", "создай эскалацию", "нужно в работу", "срочно"],
        toolName: RaiToolName.CreateFrontOfficeEscalation,
        outputMode: "window",
        requiredContextKeys: [],
        optionalContextKeys: [],
        allowedWithoutContext: true,
        keywordsPattern: /эскалир|передай в работу|создай эскалац|нужно в работу|срочно/i,
        routeHints: { includesAny: ["front-office", "telegram", "communicator"] },
        classificationReason: "responsibility:front_office:create_escalation",
        classificationConfidence: 0.8,
        contextContract: [],
        uiActionSurface: {
          defaultWindowType: "structured_result",
          defaultWindowMode: "panel",
          allowedUiActions: ["focus_window", "open_route", "refresh_context"],
          allowedNavigationTargets: ["/front-office"],
        },
      },
    ],
    uiActions: [
      {
        id: "open_front_office_route",
        role: "front_office_agent",
        kind: "open_route",
        label: "Открыть фронт-офис",
        targetRoutePattern: "/front-office",
      },
      {
        id: "refresh_front_office_context",
        role: "front_office_agent",
        kind: "refresh_context",
        label: "Обновить контекст диалога",
      },
      {
        id: "focus_front_office_result",
        role: "front_office_agent",
        kind: "focus_window",
        label: "Открыть результат front-office",
        allowedWindowTypes: ["structured_result"],
      },
    ],
  },
};

const ALL_INTENT_CONTRACTS = Object.values(CANONICAL_RESPONSIBILITY_PROFILES).flatMap(
  (profile) => profile.intents,
);

function isCanonicalRole(role: string | null | undefined): role is AgentContractRole {
  return (
    role === "agronomist" ||
    role === "economist" ||
    role === "knowledge" ||
    role === "monitoring" ||
    role === "crm_agent" ||
    role === "front_office_agent" ||
    role === "contracts_agent"
  );
}

function normalizeToolName(toolName: string): RaiToolName | null {
  return Object.values(RaiToolName).includes(toolName as RaiToolName)
    ? (toolName as RaiToolName)
    : null;
}

function resolveBaseRole(
  role: string,
  options?: {
    runtimeAdapterRole?: string | null;
    responsibilityBinding?: ResponsibilityBinding | null;
  },
): AgentContractRole | null {
  if (options?.responsibilityBinding?.inheritsFromRole) {
    return options.responsibilityBinding.inheritsFromRole;
  }
  if (options?.runtimeAdapterRole && isCanonicalRole(options.runtimeAdapterRole)) {
    return options.runtimeAdapterRole;
  }
  return isCanonicalRole(role) ? role : null;
}

function buildProfileFromBinding(
  baseRole: AgentContractRole,
  binding?: ResponsibilityBinding | null,
): AgentResponsibilityProfile {
  const baseProfile = CANONICAL_RESPONSIBILITY_PROFILES[baseRole];
  if (!binding) {
    return baseProfile;
  }

  const allowedOverride = binding.overrides?.allowedIntents;
  const forbiddenOverride = new Set(binding.overrides?.forbiddenIntents ?? []);
  const intents = baseProfile.intents.filter((intent) => {
    if (allowedOverride && !allowedOverride.includes(intent.id)) {
      return false;
    }
    return !forbiddenOverride.has(intent.id);
  });

  const allowedIntentIds = new Set(intents.map((intent) => intent.id));
  return {
    ...baseProfile,
    focus: {
      ...baseProfile.focus,
      title: binding.overrides?.title ?? baseProfile.focus.title,
    },
    intents,
    uiActions: baseProfile.uiActions.filter(
      (action) => !action.intentId || allowedIntentIds.has(action.intentId),
    ),
  };
}

function scoreIntentMatch(
  contract: AgentIntentContract,
  normalized: string,
  route: string,
): number {
  let score = 0;
  if (contract.keywordsPattern?.test(normalized)) {
    score += 10;
  }
  const hintMatches = contract.triggerHints.filter((hint) => normalized.includes(hint.toLowerCase())).length;
  score += hintMatches * 2;
  if (contract.routeHints?.includesAny?.some((hint) => route.includes(hint.toLowerCase()))) {
    score += 3;
  }
  const focus = CANONICAL_RESPONSIBILITY_PROFILES[contract.role].focus;
  if (focus.allowedRoutes?.some((allowedRoute) => route.includes(allowedRoute.toLowerCase()))) {
    score += 2;
  }
  if (focus.forbiddenRoutes?.some((forbiddenRoute) => route.includes(forbiddenRoute.toLowerCase()))) {
    score -= 4;
  }
  return score;
}

function inferRoleFromWorkspace(workspaceContext?: WorkspaceContextForIntent): AgentContractRole | null {
  const route = workspaceContext?.route?.toLowerCase() ?? "";
  const scores = (Object.values(CANONICAL_RESPONSIBILITY_PROFILES) as AgentResponsibilityProfile[]).map(
    (profile) => {
      let score = 0;
      if (profile.focus.allowedRoutes?.some((allowedRoute) => route.includes(allowedRoute.toLowerCase()))) {
        score += 4;
      }
      if (route.includes(profile.focus.businessDomain.toLowerCase())) {
        score += 2;
      }
      if (profile.focus.forbiddenRoutes?.some((forbiddenRoute) => route.includes(forbiddenRoute.toLowerCase()))) {
        score -= 2;
      }
      return { role: profile.role, score };
    },
  );
  scores.sort((left, right) => right.score - left.score);
  return scores[0]?.score > 0 ? scores[0].role : "knowledge";
}

export function getAllResponsibilityProfiles(): AgentResponsibilityProfile[] {
  return Object.values(CANONICAL_RESPONSIBILITY_PROFILES);
}

export function getFocusContract(role: AgentContractRole): AgentFocusContract {
  return CANONICAL_RESPONSIBILITY_PROFILES[role].focus;
}

export function getGuardrailContract(
  role: string,
  options?: {
    runtimeAdapterRole?: string | null;
    responsibilityBinding?: ResponsibilityBinding | null;
  },
): AgentGuardrailDefinition | null {
  const baseRole = resolveBaseRole(role, options);
  return baseRole ? CANONICAL_RESPONSIBILITY_PROFILES[baseRole].guardrails : null;
}

export function getIntentCatalog(
  role: string,
  options?: {
    runtimeAdapterRole?: string | null;
    responsibilityBinding?: ResponsibilityBinding | null;
  },
): AgentIntentDefinition[] {
  const baseRole = resolveBaseRole(role, options);
  if (!baseRole) {
    return [];
  }
  return buildProfileFromBinding(baseRole, options?.responsibilityBinding).intents.map(
    ({ keywordsPattern, routeHints, classificationReason, classificationConfidence, clarification, contextContract, optionalContextContract, uiActionSurface, ...intent }) =>
      intent,
  );
}

export function getIntentContract(intentId: string | null | undefined): AgentIntentContract | null {
  return ALL_INTENT_CONTRACTS.find((contract) => contract.id === intentId) ?? null;
}

export function getIntentContractByToolName(toolName: RaiToolName | null | undefined): AgentIntentContract | null {
  return ALL_INTENT_CONTRACTS.find((contract) => contract.toolName === toolName) ?? null;
}

export function getRequiredContextContract(intentId: string): RequiredContextDefinition[] {
  return getIntentContract(intentId)?.contextContract ?? [];
}

export function getUiActionSurfaceContract(intentId: string): AgentIntentContract["uiActionSurface"] | null {
  return getIntentContract(intentId)?.uiActionSurface ?? null;
}

export function buildResponsibilityBinding(
  role: string,
  runtimeAdapterRole?: string | null,
  binding?: Partial<ResponsibilityBinding> | null,
): ResponsibilityBinding | null {
  if (binding?.inheritsFromRole) {
    return {
      role: binding.role ?? role,
      inheritsFromRole: binding.inheritsFromRole,
      overrides: binding.overrides,
    };
  }
  if (runtimeAdapterRole && isCanonicalRole(runtimeAdapterRole) && !isCanonicalRole(role)) {
    return {
      role,
      inheritsFromRole: runtimeAdapterRole,
    };
  }
  return null;
}

export function validateResponsibilityProfileCompatibility(input: {
  role: string;
  tools?: readonly (RaiToolName | string)[] | null;
  runtimeAdapterRole?: string | null;
  responsibilityBinding?: Partial<ResponsibilityBinding> | null;
}): ResponsibilityValidationResult {
  const missingRequirements: string[] = [];
  const warnings: string[] = [];
  const binding = buildResponsibilityBinding(
    input.role,
    input.runtimeAdapterRole,
    input.responsibilityBinding,
  );
  const effectiveRole = resolveBaseRole(input.role, {
    runtimeAdapterRole: input.runtimeAdapterRole,
    responsibilityBinding: binding,
  });

  if (!effectiveRole) {
    missingRequirements.push("responsibility_binding_required_for_noncanonical_role");
    return {
      valid: false,
      effectiveRole: null,
      allowedIntentIds: [],
      allowedToolNames: [],
      missingRequirements,
      warnings,
    };
  }

  if (binding?.role && binding.role !== input.role) {
    missingRequirements.push("responsibility_binding_role_must_match_manifest_role");
  }
  if (
    binding?.inheritsFromRole &&
    input.runtimeAdapterRole &&
    isCanonicalRole(input.runtimeAdapterRole) &&
    binding.inheritsFromRole !== input.runtimeAdapterRole
  ) {
    missingRequirements.push("responsibility_binding_must_match_execution_adapter_role");
  }

  const profile = buildProfileFromBinding(effectiveRole, binding);
  const allowedIntentIds = profile.intents.map((intent) => intent.id);
  const allowedToolNames = profile.intents
    .map((intent) => intent.toolName)
    .filter((toolName): toolName is RaiToolName => Boolean(toolName));

  const knownIntentIds = new Set(profile.intents.map((intent) => intent.id));
  for (const intentId of binding?.overrides?.allowedIntents ?? []) {
    if (!CANONICAL_RESPONSIBILITY_PROFILES[effectiveRole].intents.some((intent) => intent.id === intentId)) {
      missingRequirements.push(`unknown_allowed_intent:${intentId}`);
    }
  }
  for (const intentId of binding?.overrides?.forbiddenIntents ?? []) {
    if (!CANONICAL_RESPONSIBILITY_PROFILES[effectiveRole].intents.some((intent) => intent.id === intentId)) {
      missingRequirements.push(`unknown_forbidden_intent:${intentId}`);
    }
  }
  if (binding?.overrides?.allowedIntents && binding.overrides.allowedIntents.length === 0) {
    missingRequirements.push("responsibility_binding_allowed_intents_cannot_be_empty");
  }
  if (allowedIntentIds.length === 0) {
    missingRequirements.push("responsibility_profile_must_expose_at_least_one_intent");
  }
  for (const actionId of binding?.overrides?.extraUiActions ?? []) {
    const allowed = profile.uiActions.some((action) => action.id === actionId);
    if (!allowed) {
      warnings.push(`extra_ui_action_not_declared:${actionId}`);
    }
  }

  for (const toolName of input.tools ?? []) {
    const normalizedTool = normalizeToolName(String(toolName));
    if (!normalizedTool) {
      warnings.push(`unknown_tool:${String(toolName)}`);
      continue;
    }
    if (!allowedToolNames.includes(normalizedTool)) {
      missingRequirements.push(`tool_not_allowed_by_responsibility_profile:${normalizedTool}`);
    }
  }

  const guardrails = CANONICAL_RESPONSIBILITY_PROFILES[effectiveRole].guardrails;
  for (const intentId of guardrails.forbiddenIntentIds ?? []) {
    if (knownIntentIds.has(intentId)) {
      missingRequirements.push(`forbidden_intent_exposed:${intentId}`);
    }
  }

  return {
    valid: missingRequirements.length === 0,
    effectiveRole,
    allowedIntentIds,
    allowedToolNames,
    missingRequirements,
    warnings,
  };
}

export function classifyByAgentContracts(
  message: string,
  workspaceContext?: WorkspaceContextForIntent,
): IntentClassification {
  const normalized = message.toLowerCase();
  const route = workspaceContext?.route?.toLowerCase() ?? "";
  const scoredContracts = ALL_INTENT_CONTRACTS.map((contract) => ({
    contract,
    score: scoreIntentMatch(contract, normalized, route),
  }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const bestMatch = scoredContracts[0]?.contract;
  if (bestMatch) {
    return {
      targetRole: bestMatch.role,
      intent: bestMatch.id,
      toolName: bestMatch.toolName ?? null,
      confidence: bestMatch.classificationConfidence,
      method: "regex",
      reason: bestMatch.classificationReason,
    };
  }

  return {
    targetRole: inferRoleFromWorkspace(workspaceContext),
    intent: null,
    toolName: null,
    confidence: 0,
    method: "regex",
    reason: "no_match",
  };
}

function extractQuotedFragment(message: string): string | undefined {
  const match = message.match(/[«"]([^"»]+)["»]/);
  return match?.[1]?.trim() || undefined;
}

function extractCrmPersonName(message: string): { firstName?: string; lastName?: string } {
  const explicit = extractQuotedFragment(message);
  if (explicit) {
    const parts = explicit.split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0],
      lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    };
  }

  const contactMatch = message.match(/контакт(?:ное лицо)?\s+([А-ЯЁA-Z][а-яёa-z-]+)(?:\s+([А-ЯЁA-Z][а-яёa-z-]+))?/);
  if (!contactMatch) {
    return {};
  }
  return {
    firstName: contactMatch[1],
    lastName: contactMatch[2],
  };
}

function extractContractNumber(message: string): string | undefined {
  const match = message.match(/\b([A-ZА-Я]{1,4}-?\d{2,4}-?\d{1,6})\b/u);
  return match?.[1];
}

function extractContractType(message: string): string | undefined {
  const normalized = message.toLowerCase();
  if (/аренд/i.test(normalized)) return "LEASE";
  if (/агент/i.test(normalized)) return "AGENCY";
  if (/услуг/i.test(normalized)) return "SERVICE";
  if (/поставк|договор|контракт/i.test(normalized)) return "SUPPLY";
  return undefined;
}

function extractObligationType(message: string): "DELIVER" | "PAY" | "PERFORM" | undefined {
  const normalized = message.toLowerCase();
  if (/оплат/i.test(normalized)) return "PAY";
  if (/исполн|услуг/i.test(normalized)) return "PERFORM";
  if (/постав|отгруз/i.test(normalized)) return "DELIVER";
  return undefined;
}

function resolveRefId(
  activeRefs: Array<{ kind: string; id: string }>,
  filters: Record<string, string | number | boolean | null>,
  selectedRowId: string | undefined,
  selectedRowKind: string | undefined,
  kinds: string[],
  filterKeys: string[],
): string | undefined {
  for (const key of filterKeys) {
    const value = filters[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  if (selectedRowId && selectedRowKind && kinds.includes(selectedRowKind)) {
    return selectedRowId;
  }
  return activeRefs.find((item) => kinds.includes(item.kind))?.id;
}

export function buildAutoToolCallFromContracts(
  request: RaiChatRequestDto,
  classification: IntentClassification,
): RaiToolCall | null {
  const intentContract = getIntentContract(classification.intent);
  if (!intentContract?.toolName) {
    return null;
  }

  const activeRefs = request.workspaceContext?.activeEntityRefs ?? [];
  const filters = request.workspaceContext?.filters ?? {};
  const selectedRowId = request.workspaceContext?.selectedRowSummary?.id;
  const selectedRowKind = request.workspaceContext?.selectedRowSummary?.kind?.toLowerCase();
  const selectedRowTitle = request.workspaceContext?.selectedRowSummary?.title?.trim();
  const normalizedMessage = request.message.toLowerCase();
  const innMatch = request.message.match(/\b\d{10}(\d{2})?\b/);
  const quotedFragment = extractQuotedFragment(request.message);

  switch (intentContract.id) {
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
    case "simulate_scenario":
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
    case "query_knowledge":
      return {
        name: intentContract.toolName,
        payload: {
          query: request.message,
        },
      };
    case "log_dialog_message":
      return {
        name: intentContract.toolName,
        payload: {
          channel: request.workspaceContext?.route?.toLowerCase().includes("telegram")
            ? "telegram"
            : "web_chat",
          direction: "inbound",
          messageText: request.message,
          threadExternalId: request.threadId,
          route: request.workspaceContext?.route,
        },
      };
    case "classify_dialog_thread":
      return {
        name: intentContract.toolName,
        payload: {
          channel: request.workspaceContext?.route?.toLowerCase().includes("telegram")
            ? "telegram"
            : "web_chat",
          messageText: request.message,
          threadExternalId: request.threadId,
          route: request.workspaceContext?.route,
        },
      };
    case "create_front_office_escalation":
      return {
        name: intentContract.toolName,
        payload: {
          channel: request.workspaceContext?.route?.toLowerCase().includes("telegram")
            ? "telegram"
            : "web_chat",
          messageText: request.message,
          threadExternalId: request.threadId,
          route: request.workspaceContext?.route,
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
    case "register_counterparty": {
      const inn = innMatch?.[0];
      if (!inn) {
        return null;
      }

      return {
        name: intentContract.toolName,
        payload: {
          inn,
          jurisdictionCode: "RU",
          partyType:
            inn.length === 10
              ? "LEGAL_ENTITY"
              : /кфх/i.test(request.message)
                ? "KFH"
                : "IP",
        },
      };
    }
    case "create_counterparty_relation": {
      const fromPartyId =
        typeof filters.fromPartyId === "string"
          ? filters.fromPartyId
          : activeRefs.find((item) => item.kind === "party")?.id;
      const toPartyId =
        typeof filters.toPartyId === "string"
          ? filters.toPartyId
          : typeof filters.relatedPartyId === "string"
            ? filters.relatedPartyId
            : undefined;
      const relationType = /владел|ownership/i.test(normalizedMessage)
        ? "OWNERSHIP"
        : /агент|agency/i.test(normalizedMessage)
          ? "AGENCY"
          : /управ|management/i.test(normalizedMessage)
            ? "MANAGEMENT"
            : "AFFILIATED";
      if (!fromPartyId || !toPartyId) {
        return null;
      }
      return {
        name: intentContract.toolName,
        payload: {
          fromPartyId,
          toPartyId,
          relationType,
          validFrom: new Date().toISOString(),
        },
      };
    }
    case "create_crm_account":
      return {
        name: intentContract.toolName,
        payload: {
          name: selectedRowTitle || quotedFragment || (innMatch?.[0] ? `Контрагент ${innMatch[0]}` : undefined),
          inn: innMatch?.[0],
        },
      };
    case "review_account_workspace":
      if (!selectedRowId) {
        return null;
      }
      return {
        name: intentContract.toolName,
        payload: {
          accountId: selectedRowId,
        },
      };
    case "update_account_profile":
      if (!selectedRowId) {
        return null;
      }
      return {
        name: intentContract.toolName,
        payload: {
          accountId: selectedRowId,
          status:
            /замороз|freeze/i.test(normalizedMessage)
              ? "FROZEN"
              : /актив|active/i.test(normalizedMessage)
                ? "ACTIVE"
                : undefined,
          riskCategory:
            /высок.*риск|high risk/i.test(normalizedMessage)
              ? "HIGH"
              : /средн.*риск|medium risk/i.test(normalizedMessage)
                ? "MEDIUM"
                : /низк.*риск|low risk/i.test(normalizedMessage)
                  ? "LOW"
                  : undefined,
        },
      };
    case "create_crm_contact": {
      const accountId = resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["account", "party"], ["accountId"]);
      const person = extractCrmPersonName(request.message);
      return {
        name: intentContract.toolName,
        payload: {
          accountId,
          firstName: person.firstName,
          lastName: person.lastName,
          email:
            typeof filters.email === "string"
              ? filters.email
              : undefined,
          phone:
            typeof filters.phone === "string"
              ? filters.phone
              : undefined,
        },
      };
    }
    case "update_crm_contact": {
      const contactId = resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["contact"], ["contactId"]);
      const person = extractCrmPersonName(request.message);
      return {
        name: intentContract.toolName,
        payload: {
          contactId,
          firstName: person.firstName,
          lastName: person.lastName,
          role:
            /лпр/i.test(normalizedMessage)
              ? "DECISION_MAKER"
              : /агроном/i.test(normalizedMessage)
                ? "AGRONOMIST"
                : undefined,
          email:
            typeof filters.email === "string"
              ? filters.email
              : undefined,
          phone:
            typeof filters.phone === "string"
              ? filters.phone
              : undefined,
        },
      };
    }
    case "delete_crm_contact":
      return {
        name: intentContract.toolName,
        payload: {
          contactId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["contact"], ["contactId"]),
        },
      };
    case "log_crm_interaction":
      if (!selectedRowId) {
        return null;
      }
      return {
        name: intentContract.toolName,
        payload: {
          accountId: selectedRowId,
          type:
            /встреч/i.test(normalizedMessage)
              ? "MEETING"
              : /email|письм/i.test(normalizedMessage)
                ? "EMAIL"
                : "CALL",
          summary: request.message,
          date: new Date().toISOString(),
        },
      };
    case "update_crm_interaction":
      return {
        name: intentContract.toolName,
        payload: {
          interactionId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["interaction"], ["interactionId"]),
          type:
            /встреч/i.test(normalizedMessage)
              ? "MEETING"
              : /email|письм/i.test(normalizedMessage)
                ? "EMAIL"
                : /звон|созвон/i.test(normalizedMessage)
                  ? "CALL"
                  : undefined,
          summary: quotedFragment,
          date:
            typeof filters.date === "string"
              ? filters.date
              : undefined,
        },
      };
    case "delete_crm_interaction":
      return {
        name: intentContract.toolName,
        payload: {
          interactionId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["interaction"], ["interactionId"]),
        },
      };
    case "create_crm_obligation":
      if (!selectedRowId) {
        return null;
      }
      return {
        name: intentContract.toolName,
        payload: {
          accountId: selectedRowId,
          description: request.message,
          dueDate:
            typeof filters.dueDate === "string"
              ? filters.dueDate
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    case "update_crm_obligation":
      return {
        name: intentContract.toolName,
        payload: {
          obligationId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["obligation"], ["obligationId"]),
          description: quotedFragment,
          dueDate:
            typeof filters.dueDate === "string"
              ? filters.dueDate
              : undefined,
          status:
            /выполн/i.test(normalizedMessage)
              ? "FULFILLED"
              : /просроч/i.test(normalizedMessage)
                ? "BREACHED"
                : /в работе|pending/i.test(normalizedMessage)
                  ? "PENDING"
                  : undefined,
        },
      };
    case "delete_crm_obligation":
      return {
        name: intentContract.toolName,
        payload: {
          obligationId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["obligation"], ["obligationId"]),
        },
      };
    case "create_commerce_contract":
      return {
        name: intentContract.toolName,
        payload: {
          number: typeof filters.number === "string" ? filters.number : extractContractNumber(request.message),
          type: typeof filters.type === "string" ? filters.type : extractContractType(request.message),
          validFrom: typeof filters.validFrom === "string" ? filters.validFrom : undefined,
          validTo: typeof filters.validTo === "string" ? filters.validTo : undefined,
          jurisdictionId:
            typeof filters.jurisdictionId === "string" ? filters.jurisdictionId : undefined,
          regulatoryProfileId:
            typeof filters.regulatoryProfileId === "string"
              ? filters.regulatoryProfileId
              : undefined,
          roles:
            Array.isArray(filters.roles) &&
            filters.roles.every(
              (item) =>
                item &&
                typeof item === "object" &&
                typeof (item as { partyId?: unknown }).partyId === "string" &&
                typeof (item as { role?: unknown }).role === "string",
            )
              ? filters.roles
              : undefined,
        },
      };
    case "list_commerce_contracts":
      return {
        name: intentContract.toolName,
        payload: {
          limit: typeof filters.limit === "number" ? filters.limit : 20,
        },
      };
    case "review_commerce_contract":
      return {
        name: intentContract.toolName,
        payload: {
          contractId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["contract"], ["contractId"]),
        },
      };
    case "create_contract_obligation":
      return {
        name: intentContract.toolName,
        payload: {
          contractId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["contract"], ["contractId"]),
          type:
            typeof filters.type === "string" &&
            ["DELIVER", "PAY", "PERFORM"].includes(filters.type)
              ? filters.type
              : extractObligationType(request.message),
          dueDate: typeof filters.dueDate === "string" ? filters.dueDate : undefined,
        },
      };
    case "create_fulfillment_event":
      {
        const eventDomain =
          typeof filters.eventDomain === "string" &&
          ["COMMERCIAL", "PRODUCTION", "LOGISTICS", "FINANCE_ADJ"].includes(filters.eventDomain)
            ? (filters.eventDomain as "COMMERCIAL" | "PRODUCTION" | "LOGISTICS" | "FINANCE_ADJ")
            : "COMMERCIAL";
        const eventType =
          typeof filters.eventType === "string" &&
          [
            "GOODS_SHIPMENT",
            "SERVICE_ACT",
            "LEASE_USAGE",
            "MATERIAL_CONSUMPTION",
            "HARVEST",
            "INTERNAL_TRANSFER",
            "WRITE_OFF",
          ].includes(filters.eventType)
            ? (filters.eventType as
                | "GOODS_SHIPMENT"
                | "SERVICE_ACT"
                | "LEASE_USAGE"
                | "MATERIAL_CONSUMPTION"
                | "HARVEST"
                | "INTERNAL_TRANSFER"
                | "WRITE_OFF")
            : /отгруз|shipment/i.test(normalizedMessage)
              ? "GOODS_SHIPMENT"
              : /аренд/i.test(normalizedMessage)
                ? "LEASE_USAGE"
                : "SERVICE_ACT";
      return {
        name: intentContract.toolName,
        payload: {
          obligationId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["obligation"], ["obligationId"]),
          eventDomain,
          eventType,
          eventDate:
            typeof filters.eventDate === "string"
              ? filters.eventDate
              : new Date().toISOString(),
          batchId: typeof filters.batchId === "string" ? filters.batchId : undefined,
          itemId: typeof filters.itemId === "string" ? filters.itemId : undefined,
          uom: typeof filters.uom === "string" ? filters.uom : undefined,
          qty: typeof filters.qty === "number" ? filters.qty : undefined,
        },
      };
      }
    case "create_invoice_from_fulfillment":
      {
        const supplyType =
          typeof filters.supplyType === "string" &&
          ["GOODS", "SERVICE", "LEASE"].includes(filters.supplyType)
            ? (filters.supplyType as "GOODS" | "SERVICE" | "LEASE")
            : /аренд/i.test(normalizedMessage)
              ? "LEASE"
              : /услуг/i.test(normalizedMessage)
                ? "SERVICE"
                : "GOODS";
        const vatPayerStatus =
          typeof filters.vatPayerStatus === "string" &&
          ["PAYER", "NON_PAYER"].includes(filters.vatPayerStatus)
            ? (filters.vatPayerStatus as "PAYER" | "NON_PAYER")
            : undefined;
      return {
        name: intentContract.toolName,
        payload: {
          fulfillmentEventId:
            resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["fulfillment_event", "fulfillment"], ["fulfillmentEventId"]),
          sellerJurisdiction:
            typeof filters.sellerJurisdiction === "string" ? filters.sellerJurisdiction : undefined,
          buyerJurisdiction:
            typeof filters.buyerJurisdiction === "string" ? filters.buyerJurisdiction : undefined,
          supplyType,
          vatPayerStatus,
          subtotal: typeof filters.subtotal === "number" ? filters.subtotal : undefined,
          productTaxCode:
            typeof filters.productTaxCode === "string" ? filters.productTaxCode : undefined,
        },
      };
      }
    case "post_invoice":
      return {
        name: intentContract.toolName,
        payload: {
          invoiceId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["invoice"], ["invoiceId"]),
        },
      };
    case "create_payment":
      return {
        name: intentContract.toolName,
        payload: {
          payerPartyId:
            typeof filters.payerPartyId === "string" ? filters.payerPartyId : undefined,
          payeePartyId:
            typeof filters.payeePartyId === "string" ? filters.payeePartyId : undefined,
          amount: typeof filters.amount === "number" ? filters.amount : undefined,
          currency: typeof filters.currency === "string" ? filters.currency : undefined,
          paymentMethod:
            typeof filters.paymentMethod === "string" ? filters.paymentMethod : undefined,
          paidAt: typeof filters.paidAt === "string" ? filters.paidAt : undefined,
        },
      };
    case "confirm_payment":
      return {
        name: intentContract.toolName,
        payload: {
          paymentId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["payment"], ["paymentId"]),
        },
      };
    case "allocate_payment":
      return {
        name: intentContract.toolName,
        payload: {
          paymentId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["payment"], ["paymentId"]),
          invoiceId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["invoice"], ["invoiceId"]),
          allocatedAmount:
            typeof filters.allocatedAmount === "number" ? filters.allocatedAmount : undefined,
        },
      };
    case "review_ar_balance":
      return {
        name: intentContract.toolName,
        payload: {
          invoiceId: resolveRefId(activeRefs, filters, selectedRowId, selectedRowKind, ["invoice"], ["invoiceId"]),
        },
      };
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
  if (contract.id === "compute_plan_fact") {
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

  if (contract.role === "contracts_agent") {
    const activeRefs = request.workspaceContext?.activeEntityRefs ?? [];
    const filters = request.workspaceContext?.filters ?? {};
    const collected = request.clarificationResume.collectedContext as Record<string, unknown>;
    const resolveString = (...values: unknown[]): string | undefined => {
      for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
      return undefined;
    };
    const resolveNumber = (...values: unknown[]): number | undefined => {
      for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === "string" && value.trim().length > 0) {
          const parsed = Number(value);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
      return undefined;
    };
    const resolveEntityId = (kinds: string[], filterKeys: string[]): string | undefined => {
      const fromRef = activeRefs.find((item) => kinds.includes(item.kind))?.id;
      const fromFilter = filterKeys
        .map((key) => filters[key])
        .find((value): value is string => typeof value === "string" && value.trim().length > 0);
      return resolveString(fromRef, fromFilter);
    };

    const payloadByIntent: Partial<Record<AgentContractIntentId, Record<string, unknown>>> = {
      create_commerce_contract: {
        number: resolveString(collected.number),
        type: resolveString(collected.type),
        validFrom: resolveString(collected.validFrom),
        validTo: resolveString(collected.validTo),
        jurisdictionId: resolveString(collected.jurisdictionId),
        regulatoryProfileId: resolveString(collected.regulatoryProfileId),
        roles:
          Array.isArray(collected.roles) &&
          collected.roles.every(
            (item) =>
              item &&
              typeof item === "object" &&
              typeof (item as { partyId?: unknown }).partyId === "string" &&
              typeof (item as { role?: unknown }).role === "string",
          )
            ? collected.roles
            : undefined,
      },
      create_contract_obligation: {
        contractId: resolveString(
          collected.contractId,
          resolveEntityId(["contract"], ["contractId"]),
        ),
        type: resolveString(collected.obligationType, collected.type),
        dueDate: resolveString(collected.dueDate),
      },
      create_fulfillment_event: {
        obligationId: resolveString(
          collected.obligationId,
          resolveEntityId(["obligation"], ["obligationId"]),
        ),
        eventDomain: resolveString(collected.eventDomain),
        eventType: resolveString(collected.eventType),
        eventDate: resolveString(collected.eventDate),
        batchId: resolveString(collected.batchId),
        itemId: resolveString(collected.itemId),
        uom: resolveString(collected.uom),
        qty: resolveNumber(collected.qty),
      },
      create_invoice_from_fulfillment: {
        fulfillmentEventId: resolveString(
          collected.fulfillmentEventId,
          resolveEntityId(["fulfillment_event", "fulfillment"], ["fulfillmentEventId"]),
        ),
        sellerJurisdiction: resolveString(collected.sellerJurisdiction),
        buyerJurisdiction: resolveString(collected.buyerJurisdiction),
        supplyType: resolveString(collected.supplyType),
        vatPayerStatus: resolveString(collected.vatPayerStatus),
        subtotal: resolveNumber(collected.subtotal),
      },
      post_invoice: {
        invoiceId: resolveString(
          collected.invoiceId,
          resolveEntityId(["invoice"], ["invoiceId"]),
        ),
      },
      create_payment: {
        payerPartyId: resolveString(collected.payerPartyId),
        payeePartyId: resolveString(collected.payeePartyId),
        amount: resolveNumber(collected.amount),
        currency: resolveString(collected.currency),
        paymentMethod: resolveString(collected.paymentMethod),
      },
      confirm_payment: {
        paymentId: resolveString(
          collected.paymentId,
          resolveEntityId(["payment"], ["paymentId"]),
        ),
      },
      allocate_payment: {
        paymentId: resolveString(
          collected.paymentId,
          resolveEntityId(["payment"], ["paymentId"]),
        ),
        invoiceId: resolveString(
          collected.invoiceId,
          resolveEntityId(["invoice"], ["invoiceId"]),
        ),
        allocatedAmount: resolveNumber(collected.allocatedAmount),
      },
      review_ar_balance: {
        invoiceId: resolveString(
          collected.invoiceId,
          resolveEntityId(["invoice"], ["invoiceId"]),
        ),
      },
    };

    return {
      classification: {
        targetRole: "contracts_agent",
        intent: contract.id,
        toolName: contract.toolName,
        confidence: 1,
        method: "regex",
        reason: `resume:${contract.id}`,
      },
      requestedToolCalls: [
        {
          name: contract.toolName,
          payload: payloadByIntent[contract.id] ?? {},
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
  return contract.contextContract
    .filter((item) => item.required)
    .map((item) => item.key)
    .filter((key) => !context[key]);
}

export function buildPendingClarificationItems(
  contract: AgentIntentContract,
  context: Record<ContextKey, string | undefined>,
): PendingClarificationItemDto[] {
  return contract.contextContract
    .filter((item) => item.required)
    .map((item) => ({
    key: item.key,
    label: item.label,
    required: true,
    reason: item.reason,
    sourcePriority: item.sourcePriority.filter(
      (source): source is "workspace" | "record" | "user" =>
        source === "workspace" || source === "record" || source === "user",
    ),
    status: context[item.key] ? "resolved" : "missing",
    resolvedFrom: context[item.key] ? "workspace" : undefined,
    value: context[item.key],
    }));
}
