import { RaiToolName } from "./rai-tools.types";
import {
  ConfidenceBand,
  DecisionType,
  RoutingDomain,
} from "./semantic-routing.types";

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
  proofSliceId?: string | null;
}
