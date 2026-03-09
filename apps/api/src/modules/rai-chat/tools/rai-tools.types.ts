export enum RaiToolName {
  EchoMessage = "echo_message",
  WorkspaceSnapshot = "workspace_snapshot",
  LogDialogMessage = "log_dialog_message",
  ClassifyDialogThread = "classify_dialog_thread",
  CreateFrontOfficeEscalation = "create_front_office_escalation",
  ComputeDeviations = "compute_deviations",
  ComputePlanFact = "compute_plan_fact",
  EmitAlerts = "emit_alerts",
  GenerateTechMapDraft = "generate_tech_map_draft",
  SimulateScenario = "simulate_scenario",
  ComputeRiskAssessment = "compute_risk_assessment",
  GetWeatherForecast = "get_weather_forecast",
  QueryKnowledge = "query_knowledge",
  LookupCounterpartyByInn = "lookup_counterparty_by_inn",
  RegisterCounterparty = "register_counterparty",
  CreateCounterpartyRelation = "create_counterparty_relation",
  CreateCrmAccount = "create_crm_account",
  GetCrmAccountWorkspace = "get_crm_account_workspace",
  UpdateCrmAccount = "update_crm_account",
  CreateCrmContact = "create_crm_contact",
  UpdateCrmContact = "update_crm_contact",
  DeleteCrmContact = "delete_crm_contact",
  CreateCrmInteraction = "create_crm_interaction",
  UpdateCrmInteraction = "update_crm_interaction",
  DeleteCrmInteraction = "delete_crm_interaction",
  CreateCrmObligation = "create_crm_obligation",
  UpdateCrmObligation = "update_crm_obligation",
  DeleteCrmObligation = "delete_crm_obligation",
}

export type ToolRiskLevel = "READ" | "WRITE" | "CRITICAL";

export type ToolRiskDomain =
  | "agro"
  | "finance"
  | "risk"
  | "knowledge"
  | "crm"
  | "front_office";

export interface RaiToolActorContext {
  companyId: string;
  traceId: string;
  /** В автономном контексте (MonitoringAgent) запрещены WRITE/CRITICAL инструменты. */
  isAutonomous?: boolean;
  /** Safe Replay: WRITE/CRITICAL не выполняются, возвращается mock success. */
  replayMode?: boolean;
  /** Для RiskPolicy: кто инициировал (при подтверждении — кто подтвердил). */
  userId?: string;
  userRole?: string;
  /** Прямое пользовательское действие в живом UX считается явным подтверждением на уровне запроса. */
  userConfirmed?: boolean;
}

/** Маппинг инструмент → riskLevel и domain для RiskPolicyEngine. */
export const TOOL_RISK_MAP: Partial<
  Record<RaiToolName, { riskLevel: ToolRiskLevel; domain: ToolRiskDomain }>
> = {
  [RaiToolName.EchoMessage]: { riskLevel: "READ", domain: "knowledge" },
  [RaiToolName.WorkspaceSnapshot]: { riskLevel: "READ", domain: "knowledge" },
  [RaiToolName.LogDialogMessage]: { riskLevel: "READ", domain: "front_office" },
  [RaiToolName.ClassifyDialogThread]: { riskLevel: "READ", domain: "front_office" },
  [RaiToolName.CreateFrontOfficeEscalation]: {
    riskLevel: "WRITE",
    domain: "front_office",
  },
  [RaiToolName.ComputeDeviations]: { riskLevel: "READ", domain: "agro" },
  [RaiToolName.GenerateTechMapDraft]: { riskLevel: "WRITE", domain: "agro" },
  [RaiToolName.ComputePlanFact]: { riskLevel: "READ", domain: "finance" },
  [RaiToolName.SimulateScenario]: { riskLevel: "READ", domain: "finance" },
  [RaiToolName.ComputeRiskAssessment]: { riskLevel: "READ", domain: "finance" },
  [RaiToolName.EmitAlerts]: { riskLevel: "WRITE", domain: "risk" },
  [RaiToolName.GetWeatherForecast]: { riskLevel: "READ", domain: "risk" },
  [RaiToolName.QueryKnowledge]: { riskLevel: "READ", domain: "knowledge" },
  [RaiToolName.LookupCounterpartyByInn]: { riskLevel: "READ", domain: "crm" },
  [RaiToolName.RegisterCounterparty]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.CreateCounterpartyRelation]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.CreateCrmAccount]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.GetCrmAccountWorkspace]: { riskLevel: "READ", domain: "crm" },
  [RaiToolName.UpdateCrmAccount]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.CreateCrmContact]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.UpdateCrmContact]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.DeleteCrmContact]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.CreateCrmInteraction]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.UpdateCrmInteraction]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.DeleteCrmInteraction]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.CreateCrmObligation]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.UpdateCrmObligation]: { riskLevel: "WRITE", domain: "crm" },
  [RaiToolName.DeleteCrmObligation]: { riskLevel: "WRITE", domain: "crm" },
};

/** Контекст для автономного исполнения (без userId/threadId). Блокирует WRITE/CRITICAL в реестрах. */
export function createAutonomousExecutionContext(
  companyId: string,
  traceId: string,
): RaiToolActorContext {
  return { companyId, traceId, isAutonomous: true };
}

export interface EchoMessagePayload {
  message: string;
}

export interface WorkspaceSnapshotPayload {
  route: string;
  lastUserAction?: string;
}

export interface LogDialogMessagePayload {
  channel: "telegram" | "web_chat" | "internal";
  direction: "inbound" | "outbound";
  messageText: string;
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
  recipientExternalId?: string;
  route?: string;
  messageTs?: string;
}

export interface ClassifyDialogThreadPayload {
  channel: "telegram" | "web_chat" | "internal";
  messageText: string;
  threadExternalId?: string;
  route?: string;
  counterpartyHint?: string;
}

export interface CreateFrontOfficeEscalationPayload {
  channel: "telegram" | "web_chat" | "internal";
  messageText: string;
  classification?:
    | "free_chat"
    | "task_process"
    | "client_request"
    | "escalation_signal";
  threadExternalId?: string;
  route?: string;
  targetOwnerRole?: string;
  summary?: string;
}

export interface ComputeDeviationsPayload {
  scope: {
    seasonId?: string;
    fieldId?: string;
  };
}

export interface ComputePlanFactPayload {
  scope: {
    planId?: string;
    seasonId?: string;
  };
}

export interface EmitAlertsPayload {
  severity?: "S3" | "S4";
}

export interface GenerateTechMapDraftPayload {
  fieldRef: string;
  seasonRef: string;
  crop: "rapeseed" | "sunflower";
}

export interface SimulateScenarioPayload {
  scope?: { planId?: string; seasonId?: string };
}

export interface ComputeRiskAssessmentPayload {
  scope?: { planId?: string; seasonId?: string };
}

export interface GetWeatherForecastPayload {
  region?: string;
  days?: number;
}

export interface QueryKnowledgePayload {
  query: string;
}

export interface LookupCounterpartyByInnPayload {
  inn: string;
  jurisdictionCode?: "RU" | "BY" | "KZ";
  partyType?: "LEGAL_ENTITY" | "IP" | "KFH";
}

export interface RegisterCounterpartyPayload {
  inn: string;
  jurisdictionCode?: "RU" | "BY" | "KZ";
  partyType?: "LEGAL_ENTITY" | "IP" | "KFH";
  legalName?: string;
  shortName?: string;
  comment?: string;
}

export interface CreateCounterpartyRelationPayload {
  fromPartyId: string;
  toPartyId: string;
  relationType: "OWNERSHIP" | "MANAGEMENT" | "AFFILIATED" | "AGENCY";
  sharePct?: number;
  validFrom: string;
  validTo?: string;
}

export interface CreateCrmAccountPayload {
  name: string;
  inn?: string;
  type?: string;
  holdingId?: string;
}

export interface GetCrmAccountWorkspacePayload {
  accountId: string;
}

export interface UpdateCrmAccountPayload {
  accountId: string;
  name?: string;
  inn?: string | null;
  type?: string;
  status?: string;
  holdingId?: string | null;
  jurisdiction?: string | null;
  riskCategory?: string;
  strategicValue?: string;
}

export interface CreateCrmContactPayload {
  accountId: string;
  firstName: string;
  lastName?: string;
  role?: string;
  influenceLevel?: number;
  email?: string;
  phone?: string;
  source?: string;
}

export interface UpdateCrmContactPayload {
  contactId: string;
  firstName?: string;
  lastName?: string | null;
  role?: string;
  influenceLevel?: number | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
}

export interface DeleteCrmContactPayload {
  contactId: string;
}

export interface CreateCrmInteractionPayload {
  accountId: string;
  type: string;
  summary: string;
  date?: string;
  contactId?: string | null;
  relatedEventId?: string | null;
}

export interface UpdateCrmInteractionPayload {
  interactionId: string;
  type?: string;
  summary?: string;
  date?: string;
  contactId?: string | null;
  relatedEventId?: string | null;
}

export interface DeleteCrmInteractionPayload {
  interactionId: string;
}

export interface CreateCrmObligationPayload {
  accountId: string;
  description: string;
  dueDate: string;
  responsibleUserId?: string | null;
  status?: string;
}

export interface UpdateCrmObligationPayload {
  obligationId: string;
  description?: string;
  dueDate?: string;
  responsibleUserId?: string | null;
  status?: string;
}

export interface DeleteCrmObligationPayload {
  obligationId: string;
}

export interface RaiToolPayloadMap {
  [RaiToolName.EchoMessage]: EchoMessagePayload;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotPayload;
  [RaiToolName.LogDialogMessage]: LogDialogMessagePayload;
  [RaiToolName.ClassifyDialogThread]: ClassifyDialogThreadPayload;
  [RaiToolName.CreateFrontOfficeEscalation]: CreateFrontOfficeEscalationPayload;
  [RaiToolName.ComputeDeviations]: ComputeDeviationsPayload;
  [RaiToolName.ComputePlanFact]: ComputePlanFactPayload;
  [RaiToolName.EmitAlerts]: EmitAlertsPayload;
  [RaiToolName.GenerateTechMapDraft]: GenerateTechMapDraftPayload;
  [RaiToolName.SimulateScenario]: SimulateScenarioPayload;
  [RaiToolName.ComputeRiskAssessment]: ComputeRiskAssessmentPayload;
  [RaiToolName.GetWeatherForecast]: GetWeatherForecastPayload;
  [RaiToolName.QueryKnowledge]: QueryKnowledgePayload;
  [RaiToolName.LookupCounterpartyByInn]: LookupCounterpartyByInnPayload;
  [RaiToolName.RegisterCounterparty]: RegisterCounterpartyPayload;
  [RaiToolName.CreateCounterpartyRelation]: CreateCounterpartyRelationPayload;
  [RaiToolName.CreateCrmAccount]: CreateCrmAccountPayload;
  [RaiToolName.GetCrmAccountWorkspace]: GetCrmAccountWorkspacePayload;
  [RaiToolName.UpdateCrmAccount]: UpdateCrmAccountPayload;
  [RaiToolName.CreateCrmContact]: CreateCrmContactPayload;
  [RaiToolName.UpdateCrmContact]: UpdateCrmContactPayload;
  [RaiToolName.DeleteCrmContact]: DeleteCrmContactPayload;
  [RaiToolName.CreateCrmInteraction]: CreateCrmInteractionPayload;
  [RaiToolName.UpdateCrmInteraction]: UpdateCrmInteractionPayload;
  [RaiToolName.DeleteCrmInteraction]: DeleteCrmInteractionPayload;
  [RaiToolName.CreateCrmObligation]: CreateCrmObligationPayload;
  [RaiToolName.UpdateCrmObligation]: UpdateCrmObligationPayload;
  [RaiToolName.DeleteCrmObligation]: DeleteCrmObligationPayload;
}

export interface EchoMessageResult {
  echoedMessage: string;
  companyId: string;
}

export interface WorkspaceSnapshotResult {
  route: string;
  hasSelection: boolean;
  lastUserAction?: string;
}

export interface LogDialogMessageResult {
  logged: true;
  auditLogId: string;
  threadKey: string;
  channel: "telegram" | "web_chat" | "internal";
  direction: "inbound" | "outbound";
}

export interface ClassifyDialogThreadResult {
  classification: "free_chat" | "task_process" | "client_request" | "escalation_signal";
  confidence: number;
  reasons: string[];
  targetOwnerRole?: string;
  needsEscalation: boolean;
  threadKey: string;
}

export interface CreateFrontOfficeEscalationResult {
  created: true;
  auditLogId: string;
  classification: "free_chat" | "task_process" | "client_request" | "escalation_signal";
  targetOwnerRole?: string;
  summary: string;
  threadKey: string;
}

export interface ComputeDeviationsResult {
  count: number;
  seasonId?: string;
  fieldId?: string;
  items: Array<{
    id: string;
    status: string;
    harvestPlanId: string;
    budgetPlanId: string | null;
  }>;
}

export interface ComputePlanFactResult {
  planId: string;
  status: string;
  seasonId?: string | null;
  hasData: boolean;
  roi: number;
  ebitda: number;
  revenue: number;
  totalActualCost: number;
  totalPlannedCost: number;
}

export interface EmitAlertsResult {
  count: number;
  severity: "S3" | "S4";
  items: Array<{
    id: string;
    severity: string;
    reason: string;
    status: string;
    references: Record<string, unknown>;
  }>;
}

export interface GenerateTechMapDraftResult {
  draftId: string;
  status: "DRAFT";
  fieldRef: string;
  seasonRef: string;
  crop: "rapeseed" | "sunflower";
  missingMust: string[];
  tasks: [];
  assumptions: [];
}

export interface SimulateScenarioResult {
  scenarioId: string;
  roi: number;
  ebitda: number;
  source: string;
}

export interface ComputeRiskAssessmentResult {
  planId: string;
  riskLevel: string;
  factors: string[];
  source: string;
}

export interface GetWeatherForecastResult {
  forecast: string;
  source: string;
}

export interface QueryKnowledgeResult {
  hits: number;
  items: Array<{ content: string; score: number }>;
}

export interface LookupCounterpartyByInnResult {
  status: "FOUND" | "NOT_FOUND" | "ERROR" | "NOT_SUPPORTED";
  source: string;
  requestKey: string;
  existingPartyId?: string;
  existingPartyName?: string;
  result?: {
    legalName: string;
    shortName?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    ogrnip?: string;
    address?: string;
    managerName?: string;
    registeredAt?: string;
  };
  error?: string;
}

export interface RegisterCounterpartyResult {
  created: boolean;
  source: string;
  partyId: string;
  legalName: string;
  shortName?: string | null;
  inn?: string;
  jurisdictionCode: string;
  lookupStatus: "FOUND" | "NOT_FOUND" | "ERROR" | "NOT_SUPPORTED";
  alreadyExisted: boolean;
}

export interface CreateCounterpartyRelationResult {
  relationId: string;
  fromPartyId: string;
  toPartyId: string;
  relationType: string;
  validFrom: string;
  validTo?: string | null;
}

export interface CreateCrmAccountResult {
  accountId: string;
  name: string;
  inn?: string | null;
  type?: string | null;
  holdingId?: string | null;
  status?: string | null;
}

export interface GetCrmAccountWorkspaceResult {
  account: Record<string, unknown>;
  legalEntities: Array<Record<string, unknown>>;
  contacts: Array<Record<string, unknown>>;
  interactions: Array<Record<string, unknown>>;
  obligations: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  risks: Array<Record<string, unknown>>;
}

export interface UpdateCrmAccountResult {
  accountId: string;
  name?: string;
  inn?: string | null;
  status?: string;
  riskCategory?: string | null;
  strategicValue?: string | null;
  updatedAt?: string;
}

export interface CreateCrmContactResult {
  contactId: string;
  accountId: string;
  firstName: string;
  lastName?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateCrmContactResult {
  contactId: string;
  firstName: string;
  lastName?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DeleteCrmContactResult {
  contactId: string;
  deleted: true;
}

export interface CreateCrmInteractionResult {
  interactionId: string;
  accountId: string;
  type: string;
  summary: string;
  date: string;
}

export interface UpdateCrmInteractionResult {
  interactionId: string;
  accountId: string;
  type: string;
  summary: string;
  date: string;
}

export interface DeleteCrmInteractionResult {
  interactionId: string;
  deleted: true;
}

export interface CreateCrmObligationResult {
  obligationId: string;
  accountId: string;
  description: string;
  dueDate: string;
  status: string;
}

export interface UpdateCrmObligationResult {
  obligationId: string;
  accountId: string;
  description: string;
  dueDate: string;
  status: string;
}

export interface DeleteCrmObligationResult {
  obligationId: string;
  deleted: true;
}

export interface RaiToolResultMap {
  [RaiToolName.EchoMessage]: EchoMessageResult;
  [RaiToolName.WorkspaceSnapshot]: WorkspaceSnapshotResult;
  [RaiToolName.LogDialogMessage]: LogDialogMessageResult;
  [RaiToolName.ClassifyDialogThread]: ClassifyDialogThreadResult;
  [RaiToolName.CreateFrontOfficeEscalation]: CreateFrontOfficeEscalationResult;
  [RaiToolName.ComputeDeviations]: ComputeDeviationsResult;
  [RaiToolName.ComputePlanFact]: ComputePlanFactResult;
  [RaiToolName.EmitAlerts]: EmitAlertsResult;
  [RaiToolName.GenerateTechMapDraft]: GenerateTechMapDraftResult;
  [RaiToolName.SimulateScenario]: SimulateScenarioResult;
  [RaiToolName.ComputeRiskAssessment]: ComputeRiskAssessmentResult;
  [RaiToolName.GetWeatherForecast]: GetWeatherForecastResult;
  [RaiToolName.QueryKnowledge]: QueryKnowledgeResult;
  [RaiToolName.LookupCounterpartyByInn]: LookupCounterpartyByInnResult;
  [RaiToolName.RegisterCounterparty]: RegisterCounterpartyResult;
  [RaiToolName.CreateCounterpartyRelation]: CreateCounterpartyRelationResult;
  [RaiToolName.CreateCrmAccount]: CreateCrmAccountResult;
  [RaiToolName.GetCrmAccountWorkspace]: GetCrmAccountWorkspaceResult;
  [RaiToolName.UpdateCrmAccount]: UpdateCrmAccountResult;
  [RaiToolName.CreateCrmContact]: CreateCrmContactResult;
  [RaiToolName.UpdateCrmContact]: UpdateCrmContactResult;
  [RaiToolName.DeleteCrmContact]: DeleteCrmContactResult;
  [RaiToolName.CreateCrmInteraction]: CreateCrmInteractionResult;
  [RaiToolName.UpdateCrmInteraction]: UpdateCrmInteractionResult;
  [RaiToolName.DeleteCrmInteraction]: DeleteCrmInteractionResult;
  [RaiToolName.CreateCrmObligation]: CreateCrmObligationResult;
  [RaiToolName.UpdateCrmObligation]: UpdateCrmObligationResult;
  [RaiToolName.DeleteCrmObligation]: DeleteCrmObligationResult;
}

export interface RaiToolCall<TName extends RaiToolName = RaiToolName> {
  name: TName;
  payload: RaiToolPayloadMap[TName];
}

export interface RaiSuggestedAction {
  kind: "tool";
  toolName: RaiToolName;
  title: string;
  payload: RaiToolPayloadMap[RaiToolName];
}
