import type { BranchResultContract } from "../rai-chat/branch-trust.types";
import type {
  TechMapAssumption,
  TechMapGap,
} from "./tech-map-governed-clarify.types";
import type { TechMapConflictRecord } from "./tech-map-governed-conflict.types";
import type { TechMapWorkflowVerdict } from "./tech-map-governed-state.types";

export const TECH_MAP_BRANCH_TYPES = [
  "context_intake",
  "agronomic",
  "soil_input",
  "finance",
  "risk_scenario",
  "compliance_methodology",
  "execution_feasibility",
  "evidence_reference",
  "forecast",
  "comparison",
] as const;

export type TechMapBranchType = (typeof TECH_MAP_BRANCH_TYPES)[number];

export interface TechMapBranchResultContract extends BranchResultContract {
  workflow_id: string;
  variant_id: string;
  branch_type: TechMapBranchType;
  publication_critical: boolean;
  assumptions_detail: TechMapAssumption[];
  gaps_detail: TechMapGap[];
  conflicts?: TechMapConflictRecord[];
}

export type TechMapExpertReviewVerdict =
  | "APPROVE_WITH_NOTES"
  | "REVISE"
  | "BLOCK";

export type TechMapExpertReviewTrigger =
  | "trust_trigger"
  | "assumption_trigger"
  | "novelty_trigger"
  | "risk_trigger"
  | "human_requested"
  | "dispute_trigger";

export interface TechMapExpertReviewFinding {
  finding_id: string;
  severity: "note" | "warning" | "blocking";
  area:
    | "agronomy"
    | "assumptions"
    | "methodology"
    | "feasibility"
    | "risk"
    | "compliance";
  statement_ref?: string;
  summary: string;
  recommended_action: string;
}

export interface TechMapExpertReviewResult {
  workflow_id: string;
  variant_id: string;
  reviewer_role: "chief_agronomist";
  trigger: TechMapExpertReviewTrigger;
  verdict: TechMapExpertReviewVerdict;
  summary: string;
  findings: TechMapExpertReviewFinding[];
  challenged_assumption_ids: string[];
  required_revisions: string[];
  alternative_requests: string[];
  evidence_refs: string[];
  confidence: number;
  can_proceed_to_human_review: boolean;
}

export type TechMapAggregationArtifactKind =
  | "workflow_draft"
  | "comparison_report"
  | "review_packet"
  | "publication_packet";

export interface TechMapWorkflowVerdictAggregationInput {
  requested_artifact: TechMapAggregationArtifactKind;
  selected_variant_verdict?: TechMapWorkflowVerdict;
  publication_critical_branch_verdicts: readonly TechMapWorkflowVerdict[];
  primary_artifact_branch_verdict?: TechMapWorkflowVerdict;
  advisory_branch_verdicts: readonly TechMapWorkflowVerdict[];
  expert_review_verdict?: TechMapExpertReviewVerdict | "SKIPPED";
  unresolved_blocking_gaps: number;
  unresolved_hard_blocks: number;
}
