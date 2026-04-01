import type { BranchTrustAssessment } from "../rai-chat/branch-trust.types";
import type { TechMapClarifyItem } from "./tech-map-governed-clarify.types";
import type {
  TechMapContextReadiness,
  TechMapPublicationState,
  TechMapWorkflowVerdict,
} from "./tech-map-governed-state.types";
import type { TechMapBranchType } from "./tech-map-governed-branch.types";
import type { TechMapExpertReviewResult } from "./tech-map-governed-branch.types";
import type { TechMapGovernedTrustSpecialization } from "./tech-map-governed-trust.helpers";

export const TECH_MAP_WORKFLOW_ORCHESTRATION_PHASES = [
  "INTAKE",
  "TRIAGE",
  "BRANCHING",
  "TRUST",
  "COMPOSITION",
] as const;

export type TechMapWorkflowOrchestrationPhase =
  (typeof TECH_MAP_WORKFLOW_ORCHESTRATION_PHASES)[number];

export const TECH_MAP_WORKFLOW_ORCHESTRATION_PHASE_STATUSES = [
  "completed",
  "planned",
  "blocked",
  "skipped",
] as const;

export type TechMapWorkflowOrchestrationPhaseStatus =
  (typeof TECH_MAP_WORKFLOW_ORCHESTRATION_PHASE_STATUSES)[number];

export const TECH_MAP_WORKFLOW_BRANCH_EXECUTION_MODES = [
  "parallel",
  "sequential",
  "blocking",
] as const;

export type TechMapWorkflowBranchExecutionMode =
  (typeof TECH_MAP_WORKFLOW_BRANCH_EXECUTION_MODES)[number];

export const TECH_MAP_WORKFLOW_BRANCH_STATUSES = [
  "planned",
  "ready",
  "blocked",
  "skipped",
] as const;

export type TechMapWorkflowBranchStatus =
  (typeof TECH_MAP_WORKFLOW_BRANCH_STATUSES)[number];

export const TECH_MAP_WORKFLOW_POLICY_GATES = [
  "handoff",
  "branching",
  "trust",
  "expert_review",
  "composition",
] as const;

export type TechMapWorkflowPolicyGate =
  (typeof TECH_MAP_WORKFLOW_POLICY_GATES)[number];

export const TECH_MAP_WORKFLOW_POLICY_DECISIONS = [
  "allow",
  "defer",
  "block",
] as const;

export type TechMapWorkflowPolicyDecision =
  (typeof TECH_MAP_WORKFLOW_POLICY_DECISIONS)[number];

export interface TechMapWorkflowPhaseTrace {
  phase: TechMapWorkflowOrchestrationPhase;
  status: TechMapWorkflowOrchestrationPhaseStatus;
  owner_role: string;
  summary: string;
  depends_on: TechMapWorkflowOrchestrationPhase[];
}

export interface TechMapWorkflowBranchScheduleItem {
  branch_id: string;
  branch_type: TechMapBranchType;
  agent_role: string;
  execution_mode: TechMapWorkflowBranchExecutionMode;
  status: TechMapWorkflowBranchStatus;
  depends_on: string[];
  publication_critical: boolean;
  summary: string;
}

export interface TechMapWorkflowPolicyDecisionRecord {
  gate: TechMapWorkflowPolicyGate;
  decision: TechMapWorkflowPolicyDecision;
  reason: string;
}

export interface TechMapWorkflowOrchestrationTrace {
  workflow_id: string;
  draft_id: string;
  lead_owner_agent: string;
  readiness: TechMapContextReadiness;
  publication_state: TechMapPublicationState;
  workflow_verdict: TechMapWorkflowVerdict;
  current_phase: TechMapWorkflowOrchestrationPhase;
  next_phase: TechMapWorkflowOrchestrationPhase | null;
  phase_engine: TechMapWorkflowOrchestrationPhase[];
  phase_trace: TechMapWorkflowPhaseTrace[];
  branch_schedule: TechMapWorkflowBranchScheduleItem[];
  policy_decisions: TechMapWorkflowPolicyDecisionRecord[];
  expert_review?: TechMapExpertReviewResult | null;
  trust_gate_required: boolean;
  composition_gate: {
    can_compose: boolean;
    reason: string;
  };
  audit_refs: string[];
  summary: string;
}

export interface TechMapWorkflowOrchestrationInput {
  workflow_id: string;
  draft_id: string;
  lead_owner_agent: string;
  readiness: TechMapContextReadiness;
  publication_state: TechMapPublicationState;
  workflow_verdict: TechMapWorkflowVerdict;
  clarify_items: TechMapClarifyItem[];
  missing_must: string[];
  has_budget_policy: boolean;
  has_execution_history: boolean;
  has_past_outcomes: boolean;
  has_allowed_input_catalog_version: boolean;
  has_target_kpi_policy: boolean;
  has_weather_normals: boolean;
  branch_trust_assessments?: BranchTrustAssessment[];
  trust_specialization?: TechMapGovernedTrustSpecialization | null;
  expert_review?: TechMapExpertReviewResult | null;
  resume_requested?: boolean;
}
