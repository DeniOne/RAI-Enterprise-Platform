import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  MaxLength,
  ArrayMaxSize,
  IsEnum,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { RaiSuggestedAction, RaiToolName } from "../tools/rai-tools.types";
import { RaiChatWidget } from "../widgets/rai-chat-widgets.types";

export enum WorkspaceEntityKind {
  farm = "farm",
  field = "field",
  party = "party",
  account = "account",
  contact = "contact",
  interaction = "interaction",
  obligation = "obligation",
  holding = "holding",
  techmap = "techmap",
  task = "task",
  contract = "contract",
  operation = "operation",
}

export class WorkspaceEntityRefDto {
  @IsEnum(WorkspaceEntityKind)
  kind: WorkspaceEntityKind;

  @IsString()
  @MaxLength(128)
  id: string;
}

export class SelectedRowSummaryDto {
  @IsString()
  @MaxLength(64)
  kind: string;

  @IsString()
  @MaxLength(128)
  id: string;

  @IsString()
  @MaxLength(160)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  subtitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  status?: string;
}

export class WorkspaceContextDto {
  @IsString()
  @MaxLength(256)
  route: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(10)
  @Type(() => WorkspaceEntityRefDto)
  activeEntityRefs?: WorkspaceEntityRefDto[];

  @IsObject()
  @IsOptional()
  filters?: Record<string, string | number | boolean | null>;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SelectedRowSummaryDto)
  selectedRowSummary?: SelectedRowSummaryDto;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  lastUserAction?: string;
}

export enum ExternalSignalKind {
  Ndvi = "ndvi",
  Weather = "weather",
}

export enum ExternalSignalSource {
  Sentinel2 = "sentinel2",
  Landsat8 = "landsat8",
  Landsat9 = "landsat9",
  OpenWeather = "openweather",
}

export enum WeatherSignalMetric {
  TemperatureC = "temperature_c",
  PrecipitationMm = "precipitation_mm",
}

export class ExternalSignalDto {
  @IsString()
  @MaxLength(128)
  id: string;

  @IsEnum(ExternalSignalKind)
  kind: ExternalSignalKind;

  @IsEnum(ExternalSignalSource)
  source: ExternalSignalSource;

  @IsString()
  @MaxLength(128)
  observedAt: string;

  @IsString()
  @MaxLength(128)
  entityRef: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  geoRef?: string;

  @Type(() => Number)
  value: number;

  @Type(() => Number)
  confidence: number;

  @IsString()
  @MaxLength(160)
  provenance: string;

  @IsEnum(WeatherSignalMetric)
  @IsOptional()
  metric?: WeatherSignalMetric;

  @Type(() => Number)
  @IsOptional()
  resolution?: number;

  @Type(() => Number)
  @IsOptional()
  cloudCoverage?: number;
}

export class ExternalAdvisoryFeedbackDto {
  @IsString()
  @MaxLength(16)
  decision: "accept" | "reject";

  @IsString()
  @IsOptional()
  @MaxLength(240)
  reason?: string;
}

export class ClarificationResumeCollectedContextDto {
  @IsString()
  @IsOptional()
  @MaxLength(128)
  fieldRef?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  seasonRef?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  seasonId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  planId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  validFrom?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  validTo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  jurisdictionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  regulatoryProfileId?: string;

  @IsArray()
  @IsOptional()
  roles?: Array<{
    partyId: string;
    role: string;
    isPrimary?: boolean;
  }>;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  contractId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  obligationType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  dueDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  obligationId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  eventDomain?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  eventType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  eventDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  fulfillmentEventId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  sellerJurisdiction?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  buyerJurisdiction?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  supplyType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  vatPayerStatus?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  payerPartyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  payeePartyId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(16)
  currency?: string;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  paymentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  invoiceId?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  allocatedAmount?: number;
}

export class ClarificationResumeDto {
  @IsString()
  @MaxLength(128)
  windowId: string;

  @IsString()
  @MaxLength(64)
  intentId:
    | "tech_map_draft"
    | "compute_plan_fact"
    | "create_commerce_contract"
    | "create_contract_obligation"
    | "create_fulfillment_event"
    | "create_invoice_from_fulfillment"
    | "create_payment"
    | "allocate_payment"
    | "review_ar_balance";

  @IsString()
  @MaxLength(64)
  agentRole: "agronomist" | "economist" | "contracts_agent";

  @IsObject()
  @ValidateNested()
  @Type(() => ClarificationResumeCollectedContextDto)
  collectedContext: ClarificationResumeCollectedContextDto;
}

export interface ExternalAdvisoryDto {
  traceId: string;
  recommendation: "ALLOW" | "REVIEW";
  confidence: number;
  summary: string;
  explainability: {
    traceId: string;
    why: string;
    factors: Array<{
      name: string;
      value: number | string;
      direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    }>;
    sources: Array<{
      kind: ExternalSignalKind;
      source: ExternalSignalSource;
      observedAt: string;
      entityRef: string;
      provenance: string;
    }>;
  };
}

export interface RaiMemoryUsedDto {
  kind: "episode" | "profile" | "engram" | "active_alert" | "hot_engram";
  label: string;
  confidence: number;
  source?: string;
}

export interface RaiMemorySummaryDto {
  primaryHint: string;
  primaryKind: RaiMemoryUsedDto["kind"];
  detailsAvailable: boolean;
}

export interface EvidenceReference {
  claim: string;
  sourceType: "TOOL_RESULT" | "DB" | "DOC";
  sourceId: string;
  confidenceScore: number;
}

export interface RuntimeBudgetDto {
  outcome: "ALLOW" | "DEGRADE" | "DENY";
  reason: string;
  source: "agent_registry_max_tokens" | "replay_bypass";
  estimatedTokens: number;
  budgetLimit: number | null;
  allowedToolNames: RaiToolName[];
  droppedToolNames: RaiToolName[];
  ownerRoles: string[];
  fallbackReason?: string;
  fallbackMode?: string;
}

export interface RuntimeGovernanceDto {
  fallbackReason: string;
  fallbackMode: string;
  degraded: boolean;
  recommendation?: string;
}

export interface PendingClarificationItemDto {
  key:
    | "fieldRef"
    | "seasonRef"
    | "seasonId"
    | "planId"
    | "number"
    | "type"
    | "validFrom"
    | "jurisdictionId"
    | "roles"
    | "contractId"
    | "obligationId"
    | "eventDomain"
    | "eventType"
    | "eventDate"
    | "fulfillmentEventId"
    | "sellerJurisdiction"
    | "buyerJurisdiction"
    | "supplyType"
    | "vatPayerStatus"
    | "subtotal"
    | "payerPartyId"
    | "payeePartyId"
    | "amount"
    | "currency"
    | "paymentMethod"
    | "paymentId"
    | "invoiceId"
    | "allocatedAmount";
  label: string;
  required: true;
  reason: string;
  sourcePriority: Array<"workspace" | "record" | "user">;
  status: "missing" | "resolved";
  resolvedFrom?: "workspace" | "record" | "user";
  value?: string;
}

export interface PendingClarificationDto {
  kind: "missing_context";
  agentRole: string;
  intentId:
    | "tech_map_draft"
    | "compute_plan_fact"
    | "query_knowledge"
    | "emit_alerts"
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
  summary: string;
  autoResume: boolean;
  items: PendingClarificationItemDto[];
}

export interface RaiWorkWindowActionDto {
  id: string;
  kind:
    | "use_workspace_field"
    | "open_field_card"
    | "open_season_picker"
    | "refresh_context"
    | "focus_window"
    | "go_to_techmap"
    | "open_route"
    | "open_entity";
  label: string;
  enabled: boolean;
  targetWindowId?: string;
  targetRoute?: string;
  entityType?: string;
  entityId?: string;
}

export interface RaiWorkWindowDto {
  windowId: string;
  originMessageId: string | null;
  agentRole: string;
  type:
    | "context_acquisition"
    | "context_hint"
    | "structured_result"
    | "related_signals"
    | "comparison";
  parentWindowId?: string | null;
  relatedWindowIds?: string[];
  category: "clarification" | "result" | "analysis" | "signals";
  priority: number;
  mode: "inline" | "panel" | "takeover";
  title: string;
  status: "needs_user_input" | "resolved" | "completed" | "informational";
  payload: {
    intentId:
      | "tech_map_draft"
      | "compute_plan_fact"
      | "query_knowledge"
      | "emit_alerts"
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
      | "create_front_office_escalation"
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
      | "delete_crm_obligation";
    summary: string;
    fieldRef?: string;
    seasonRef?: string;
    seasonId?: string;
    planId?: string;
    missingKeys: PendingClarificationItemDto["key"][];
    resultText?: string;
    sections?: Array<{
      id: string;
      title: string;
      items: Array<{
        label: string;
        value: string;
        tone?: "neutral" | "positive" | "warning" | "critical";
      }>;
    }>;
    signalItems?: Array<{
      id: string;
      tone: "critical" | "warning" | "info";
      text: string;
      targetWindowId?: string;
      targetRoute?: string;
    }>;
    columns?: string[];
    rows?: Array<{
      id: string;
      label: string;
      values: string[];
      emphasis?: "neutral" | "best" | "risk";
    }>;
  };
  actions: RaiWorkWindowActionDto[];
  isPinned: boolean;
}

export class RaiChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkspaceContextDto)
  workspaceContext?: WorkspaceContextDto;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  threadId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  clientTraceId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  audience?: "internal" | "client_front_office";

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(5)
  @Type(() => RaiToolCallDto)
  toolCalls?: RaiToolCallDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(4)
  @Type(() => ExternalSignalDto)
  externalSignals?: ExternalSignalDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ExternalAdvisoryFeedbackDto)
  advisoryFeedback?: ExternalAdvisoryFeedbackDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ClarificationResumeDto)
  clarificationResume?: ClarificationResumeDto;
}

export class RaiToolCallDto {
  @IsEnum(RaiToolName)
  name: RaiToolName;

  @IsObject()
  payload: Record<string, unknown>;
}

export class RaiChatResponseDto {
  @IsString()
  text: string;

  @IsObject({ each: true })
  widgets: RaiChatWidget[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RaiToolCallDto)
  toolCalls?: RaiToolCallDto[];

  @IsString()
  @IsOptional()
  traceId?: string;

  @IsString()
  @IsOptional()
  threadId?: string;

  @IsOptional()
  suggestedActions?: RaiSuggestedAction[];

  @IsString()
  @IsOptional()
  @MaxLength(128)
  openUiToken?: string;

  @IsOptional()
  advisory?: ExternalAdvisoryDto;

  @IsOptional()
  memoryUsed?: RaiMemoryUsedDto[];

  @IsOptional()
  memorySummary?: RaiMemorySummaryDto;

  @IsOptional()
  evidence?: EvidenceReference[];

  @IsOptional()
  runtimeBudget?: RuntimeBudgetDto;

  @IsOptional()
  runtimeGovernance?: RuntimeGovernanceDto;

  @IsString()
  @IsOptional()
  @MaxLength(64)
  agentRole?: string;

  @IsOptional()
  fallbackUsed?: boolean;

  @IsOptional()
  validation?: {
    passed: boolean;
    reasons: string[];
  };

  @IsString()
  @IsOptional()
  @MaxLength(32)
  outputContractVersion?: string;

  @IsOptional()
  pendingClarification?: PendingClarificationDto | null;

  @IsOptional()
  workWindows?: RaiWorkWindowDto[];

  @IsString()
  @IsOptional()
  @MaxLength(128)
  activeWindowId?: string | null;
}
