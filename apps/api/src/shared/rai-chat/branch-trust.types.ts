import type { EvidenceReference } from "./rai-chat.dto";

export type BranchVerdict =
  | "VERIFIED"
  | "PARTIAL"
  | "UNVERIFIED"
  | "CONFLICTED"
  | "REJECTED";

export type BranchFreshnessStatus = "FRESH" | "STALE" | "UNKNOWN";

export type BranchDerivedFromKind =
  | "tool_call"
  | "structured_output"
  | "workspace_context"
  | "cross_check"
  | "manual";

export type BranchTrustCheckName =
  | "schema_check"
  | "source_resolution"
  | "ownership_check"
  | "deterministic_recompute"
  | "cross_branch_consistency"
  | "freshness_check"
  | "gap_disclosure";

export type BranchTrustCheckStatus = "PASSED" | "FAILED" | "SKIPPED";

export interface BranchScopeContract {
  domain: string;
  route?: string;
  company_id?: string;
  entity_type?: string;
  entity_id?: string;
  workspace_entity_refs?: string[];
  [key: string]: unknown;
}

export interface BranchDerivedFromRef {
  kind: BranchDerivedFromKind;
  source_id: string;
  label?: string;
  field_path?: string;
}

export interface BranchFreshnessContract {
  status: BranchFreshnessStatus;
  checked_at?: string;
  observed_at?: string;
  expires_at?: string;
}

export interface BranchResultContract {
  branch_id: string;
  source_agent: string;
  domain: string;
  summary?: string;
  scope: BranchScopeContract;
  facts?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
  money?: Record<string, unknown>;
  derived_from: BranchDerivedFromRef[];
  evidence_refs: EvidenceReference[];
  assumptions: string[];
  data_gaps: string[];
  freshness: BranchFreshnessContract;
  confidence: number;
}

export interface BranchTrustCheck {
  name: BranchTrustCheckName;
  status: BranchTrustCheckStatus;
  details?: string;
}

export interface BranchTrustAssessment {
  branch_id: string;
  source_agent: string;
  verdict: BranchVerdict;
  score: number;
  reasons: string[];
  checks: BranchTrustCheck[];
  requires_cross_check: boolean;
}

export interface UserFacingBranchCompositionPayload {
  branch_id: string;
  verdict: BranchVerdict;
  include_in_response: boolean;
  summary?: string;
  disclosure: string[];
}

export type UserFacingTrustTone = "critical" | "warning" | "info";

export interface UserFacingTrustSummaryBranch {
  branchId: string;
  sourceAgent: string;
  verdict: BranchVerdict;
  label: string;
  summary?: string;
  disclosure: string[];
}

export interface UserFacingTrustSummary {
  verdict: BranchVerdict;
  label: string;
  tone: UserFacingTrustTone;
  summary: string;
  disclosure: string[];
  branchCount: number;
  verifiedCount: number;
  partialCount: number;
  unverifiedCount: number;
  conflictedCount: number;
  rejectedCount: number;
  crossCheckCount: number;
  branches: UserFacingTrustSummaryBranch[];
}
