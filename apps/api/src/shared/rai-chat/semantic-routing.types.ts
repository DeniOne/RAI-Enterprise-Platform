import { WorkspaceContextDto } from "./rai-chat.dto";
import { RaiToolCallDto } from "./rai-chat.dto";
import { RaiToolName } from "./rai-tools.types";
import { IntentClassification } from "./intent-router.types";

export enum RoutingDomain {
  Agro = "agro",
  Finance = "finance",
  Knowledge = "knowledge",
  Crm = "crm",
  Contracts = "contracts",
  FrontOffice = "front_office",
  Monitoring = "monitoring",
  Unknown = "unknown",
}

export enum RoutingEntity {
  Techmap = "techmap",
  PlanFact = "plan_fact",
  Scenario = "scenario",
  RiskAssessment = "risk_assessment",
  Account = "account",
  Field = "field",
  Season = "season",
  Deviation = "deviation",
  Contract = "contract",
  Counterparty = "counterparty",
  Knowledge = "knowledge",
  Unknown = "unknown",
}

export enum RoutingAction {
  List = "list",
  Open = "open",
  Create = "create",
  Update = "update",
  Delete = "delete",
  Analyze = "analyze",
  Search = "search",
  Unknown = "unknown",
}

export enum InteractionMode {
  ReadOnly = "read_only",
  WriteCandidate = "write_candidate",
  Navigation = "navigation",
  Analysis = "analysis",
  Unknown = "unknown",
}

export enum MutationRisk {
  SafeRead = "safe_read",
  SideEffectingWrite = "side_effecting_write",
  IrreversibleWrite = "irreversible_write",
  Unknown = "unknown",
}

export enum Resolvability {
  Resolved = "resolved",
  Partial = "partial",
  Missing = "missing",
  Ambiguous = "ambiguous",
}

export enum AmbiguityType {
  None = "none",
  MissingContext = "missing_context",
  MultipleCandidates = "multiple_candidates",
  FlowConflict = "flow_conflict",
  NoMatchingRoute = "no_matching_route",
}

export enum DecisionType {
  Execute = "execute",
  Navigate = "navigate",
  Clarify = "clarify",
  Confirm = "confirm",
  Block = "block",
  Abstain = "abstain",
}

export enum RecommendedExecutionMode {
  DirectExecute = "direct_execute",
  OpenRoute = "open_route",
  AskClarification = "ask_clarification",
  AskConfirmation = "ask_confirmation",
  Deny = "deny",
  DryRun = "dry_run",
  NoOp = "no_op",
}

export enum ConfidenceBand {
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum RoutingOutcomeType {
  Completed = "completed",
  NeedsMoreData = "needs_more_data",
  Failed = "failed",
  RateLimited = "rate_limited",
  Denied = "denied",
  Unknown = "unknown",
}

export enum RoutingCaseMemoryLifecycleStatus {
  NotCaptured = "not_captured",
  Captured = "captured",
  Active = "active",
  Expired = "expired",
}

export interface FocusObject {
  kind: string;
  id?: string;
}

export interface DialogStateSnapshot {
  activeFlow?: string | null;
  pendingClarificationKeys?: string[];
  lastUserAction?: string | null;
}

export interface SemanticIntent {
  domain: RoutingDomain;
  entity: RoutingEntity;
  action: RoutingAction;
  interactionMode: InteractionMode;
  mutationRisk: MutationRisk;
  filters: Record<string, string | number | boolean | null>;
  requiredContext: string[];
  focusObject?: FocusObject | null;
  dialogState: DialogStateSnapshot;
  resolvability: Resolvability;
  ambiguityType: AmbiguityType;
  confidenceBand: ConfidenceBand;
  reason: string;
}

export interface RouteDecision {
  decisionType: DecisionType;
  recommendedExecutionMode: RecommendedExecutionMode;
  eligibleTools: RaiToolName[];
  eligibleFlows: string[];
  requiredContextMissing: string[];
  policyChecksRequired: string[];
  needsConfirmation: boolean;
  needsClarification: boolean;
  abstainReason?: string | null;
  policyBlockReason?: string | null;
}

export interface RoutingCandidate {
  id: string;
  label: string;
  targetRole: string | null;
  intent: string | null;
  toolName: RaiToolName | null;
  decisionType: DecisionType;
  score: number;
  reason: string;
}

export interface RoutingVersionInfo {
  routerVersion: string;
  promptVersion: string;
  toolsetVersion: string;
  workspaceStateDigest: string;
}

export interface RoutingDivergence {
  isMismatch: boolean;
  mismatchKinds: string[];
  summary: string;
  legacyRouteKey: string;
  semanticRouteKey: string;
}

export interface RoutingCaseMemoryRetrievedCase {
  key: string;
  sliceId: string | null;
  targetRole: string;
  decisionType: DecisionType;
  mismatchKinds: string[];
  routerVersion: string;
  promptVersion: string;
  toolsetVersion: string;
  traceCount: number;
  semanticPrimaryCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  ttlExpiresAt: string;
  sampleTraceId: string | null;
  sampleQuery: string | null;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  similarityScore: number;
  lifecycleStatus: RoutingCaseMemoryLifecycleStatus;
  captureAuditLogId: string | null;
  activatedAt?: string | null;
  activationAuditLogId?: string | null;
}

export interface RoutingTelemetryEvent {
  traceId: string;
  threadId: string;
  routerVersion: string;
  promptVersion: string;
  toolsetVersion: string;
  workspaceRoute: string | null;
  workspaceStateDigest: string;
  activeFlow: string | null;
  userQueryRedacted: string;
  legacyClassification: IntentClassification;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  candidateRoutes: RoutingCandidate[];
  divergence: RoutingDivergence;
  executionPath: string;
  fallbackReason?: string | null;
  abstainReason?: string | null;
  policyBlockReason?: string | null;
  requiredContextMissing: string[];
  finalOutcome: RoutingOutcomeType;
  userCorrection?: {
    decision: string;
    reason?: string | null;
  } | null;
  latencyMs: number;
  sliceId?: string | null;
  promotedPrimary: boolean;
  retrievedCaseMemory?: RoutingCaseMemoryRetrievedCase[];
}

export interface SemanticRoutingContext {
  source: "shadow" | "primary";
  promotedPrimary: boolean;
  enforceCapabilityGating: boolean;
  sliceId?: string | null;
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  candidateRoutes: RoutingCandidate[];
  retrievedCaseMemory?: RoutingCaseMemoryRetrievedCase[];
}

export interface SemanticRoutingEvaluation {
  semanticIntent: SemanticIntent;
  routeDecision: RouteDecision;
  candidateRoutes: RoutingCandidate[];
  divergence: RoutingDivergence;
  versionInfo: RoutingVersionInfo;
  latencyMs: number;
  sliceId?: string | null;
  promotedPrimary: boolean;
  executionPath: "semantic_router_shadow" | "semantic_router_primary";
  requestedToolCalls: RaiToolCallDto[];
  classification: IntentClassification;
  routingContext: SemanticRoutingContext;
  llmUsed: boolean;
  llmError?: string | null;
  retrievedCaseMemory?: RoutingCaseMemoryRetrievedCase[];
}

export interface SemanticRoutingRequest {
  companyId: string;
  message: string;
  workspaceContext?: WorkspaceContextDto;
  traceId: string;
  threadId: string;
  legacyClassification: IntentClassification;
  requestedToolCalls: RaiToolCallDto[];
  allowPrimaryPromotion?: boolean;
}
