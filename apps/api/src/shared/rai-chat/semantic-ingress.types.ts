import { RaiToolName } from "./rai-tools.types";
import {
  ConfidenceBand,
  DecisionType,
  RoutingDomain,
} from "./semantic-routing.types";
import { CompositeWorkflowPlan } from "./composite-orchestration.types";

export type SemanticIngressInteractionMode =
  | "free_chat"
  | "information_request"
  | "task_request"
  | "workflow_resume";

export type SemanticIngressRequestShape =
  | "single_intent"
  | "clarification_resume"
  | "composite"
  | "unknown";

export type SemanticIngressRiskClass =
  | "safe_read"
  | "write_candidate"
  | "high_risk_write"
  | "unknown";

export type SemanticIngressFrameSource =
  | "clarification_resume"
  | "explicit_tool_call"
  | "legacy_contracts"
  | "semantic_router_primary"
  | "semantic_router_shadow";

export type SemanticIngressOperationAuthority =
  | "direct_user_command"
  | "workflow_resume"
  | "delegated_or_autonomous"
  | "unknown";

export type SemanticIngressWritePolicyDecision =
  | "execute"
  | "confirm"
  | "clarify"
  | "block";

export interface SemanticIngressWritePolicy {
  decision: SemanticIngressWritePolicyDecision;
  reason: string;
}

export type TechMapWorkflowIntent =
  | "create_new"
  | "rebuild_existing"
  | "compare_variants"
  | "review_draft"
  | "approve_publish"
  | "resume_clarify"
  | "explain_block";

export type TechMapWorkflowStageHint =
  | "intake"
  | "clarify"
  | "assemble"
  | "compare"
  | "review"
  | "approval"
  | "publication";

export type TechMapRequestedArtifact =
  | "workflow_draft"
  | "persisted_draft"
  | "comparison_report"
  | "review_packet"
  | "publication_packet"
  | "block_explanation";

export type TechMapContextReadiness =
  | "S0_UNSCOPED"
  | "S1_SCOPED"
  | "S2_MINIMUM_COMPUTABLE"
  | "S3_DRAFT_READY"
  | "S4_REVIEW_READY"
  | "S5_PUBLISHABLE";

export type TechMapPolicyPosture = "open" | "governed" | "blocked";

export interface TechMapComparisonMode {
  enabled: boolean;
  variantCount: number;
}

export interface TechMapScope {
  legalEntityId?: string;
  farmId?: string;
  fieldIds: string[];
  seasonId?: string;
  cropCode?: string;
  existingTechMapId?: string;
}

export interface TechMapSemanticFrame {
  workflowKind: "tech_map";
  userIntent: TechMapWorkflowIntent;
  workflowStageHint: TechMapWorkflowStageHint;
  requestedArtifact: TechMapRequestedArtifact;
  scope: TechMapScope;
  contextReadiness: TechMapContextReadiness;
  requiredActions: Array<
    "clarify" | "execute" | "confirm" | "human_review" | "block"
  >;
  policyPosture: TechMapPolicyPosture;
  policyConstraints: string[];
  resultConstraints: string[];
  comparisonMode?: TechMapComparisonMode;
}

export interface SemanticIngressDomainCandidate {
  domain: RoutingDomain | "unknown";
  ownerRole: string | null;
  score: number;
  source: "legacy" | "semantic";
  reason: string;
}

export interface SemanticIngressEntity {
  kind:
    | "semantic_entity"
    | "workspace_route"
    | "workspace_selection"
    | "active_entity"
    | "inn";
  value: string;
  source: "semantic" | "workspace" | "message" | "tool_payload";
}

export interface SemanticIngressRequestedOperation {
  ownerRole: string | null;
  intent: string | null;
  toolName: RaiToolName | null;
  decisionType: DecisionType;
  source: SemanticIngressFrameSource;
}

export interface SemanticIngressFrame {
  version: "v1";
  interactionMode: SemanticIngressInteractionMode;
  requestShape: SemanticIngressRequestShape;
  domainCandidates: SemanticIngressDomainCandidate[];
  goal: string | null;
  entities: SemanticIngressEntity[];
  requestedOperation: SemanticIngressRequestedOperation;
  operationAuthority: SemanticIngressOperationAuthority;
  missingSlots: string[];
  riskClass: SemanticIngressRiskClass;
  requiresConfirmation: boolean;
  confidenceBand: ConfidenceBand;
  explanation: string;
  writePolicy: SemanticIngressWritePolicy;
  proofSliceId?: string | null;
  compositePlan?: CompositeWorkflowPlan | null;
  techMapFrame?: TechMapSemanticFrame | null;
}
