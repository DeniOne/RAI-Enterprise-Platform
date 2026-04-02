import type { TechMapConflictRecord } from "./tech-map-governed-conflict.types";
import type {
  TechMapAssumption,
  TechMapGap,
} from "./tech-map-governed-clarify.types";
import type {
  TechMapApprovalStatus,
  TechMapContextReadiness,
  TechMapPersistenceStatus,
  TechMapPublicationState,
  TechMapReviewStatus,
  TechMapWorkflowVerdict,
} from "./tech-map-governed-state.types";

export const TECH_MAP_VARIANT_OBJECTIVES = [
  "base",
  "economy",
  "intensive",
  "risk_min",
  "custom",
] as const;

export type TechMapVariantObjective =
  (typeof TECH_MAP_VARIANT_OBJECTIVES)[number];

export interface TechMapArtifactHeader {
  workflow_id: string;
  tech_map_id?: string;
  version_id?: string;
  legal_entity_id: string;
  farm_id: string;
  field_ids: string[];
  season_id: string;
  crop_code: string;
  crop_form?: string;
  canonical_branch?: string;
  methodology_profile_id: string;
  baseline_context_hash: string;
  generation_trace_id?: string;
  source_workflow_mode: "new_draft" | "rebuild" | "comparison";
}

export interface TechMapOperation {
  operation_id: string;
  stage_code: string;
  operation_code: string;
  title: string;
  sequence_no: number;
  planned_window: {
    start_date?: string;
    end_date?: string;
    agronomic_trigger?: string;
  };
  dependencies: string[];
  input_plan_refs: string[];
  machinery_requirement_refs: string[];
  basis_statement_refs: string[];
  publication_critical: boolean;
}

export interface TechMapInputPlan {
  input_plan_id: string;
  input_code: string;
  category:
    | "seed"
    | "fertilizer"
    | "crop_protection"
    | "fuel"
    | "service"
    | "other";
  rate_per_ha?: number;
  total_quantity?: number;
  unit: string;
  operation_ref: string;
  allowed_by_catalog: boolean;
  evidence_refs: string[];
}

export interface TechMapFinancialSummary {
  currency: string;
  area_ha: number;
  direct_cost_total: number;
  indirect_cost_total?: number;
  total_cost: number;
  cost_per_ha: number;
  target_yield: number;
  break_even_yield?: number;
  expected_revenue?: number;
  expected_margin?: number;
  roi_pct?: number;
  budget_fit: "WITHIN_POLICY" | "OVERRIDE_REQUIRED" | "OUT_OF_POLICY";
}

export interface TechMapRiskRegisterItem {
  risk_id: string;
  title: string;
  category: "agronomic" | "weather" | "financial" | "compliance" | "execution";
  severity: "low" | "medium" | "high" | "critical";
  probability: "low" | "medium" | "high";
  mitigation: string[];
  evidence_refs: string[];
}

export interface TechMapEvidenceBundle {
  bundle_id: string;
  source_refs: string[];
  coverage_pct: number;
  publication_critical_coverage_pct: number;
  unresolved_refs: string[];
  freshness_summary: Array<{
    source_ref: string;
    status: "fresh" | "stale" | "unknown";
  }>;
}

export interface TechMapApprovalPacket {
  packet_id: string;
  draft_version_id: string;
  immutable_snapshot_ref: string;
  required_reviews: Array<{
    role: string;
    status: "pending" | "approved" | "rejected";
    reason?: string;
  }>;
  required_signoffs: Array<{
    role: string;
    mandatory: boolean;
    status: "pending" | "approved" | "rejected";
  }>;
  locked_fields: string[];
  publication_basis_refs: string[];
}

export interface TechMapVariant {
  variant_id: string;
  label: string;
  objective: TechMapVariantObjective;
  overrides: Record<string, unknown>;
  operations: TechMapOperation[];
  input_plan: TechMapInputPlan[];
  financial_summary: TechMapFinancialSummary;
  risk_register: TechMapRiskRegisterItem[];
  evidence_bundle: TechMapEvidenceBundle;
  overall_verdict: TechMapWorkflowVerdict;
}

export interface TechMapCanonicalDraft {
  header: TechMapArtifactHeader;
  readiness: TechMapContextReadiness;
  workflow_verdict: TechMapWorkflowVerdict;
  publication_state: TechMapPublicationState;
  review_status: TechMapReviewStatus;
  approval_status: TechMapApprovalStatus;
  persistence_status: TechMapPersistenceStatus;
  slot_ledger_ref: string;
  assumptions: TechMapAssumption[];
  gaps: TechMapGap[];
  conflicts: TechMapConflictRecord[];
  variants: TechMapVariant[];
  selected_variant_id?: string;
  approval_packet?: TechMapApprovalPacket;
  audit_refs: string[];
}

export interface TechMapStatement {
  statement_id: string;
  kind:
    | "fact"
    | "derived_metric"
    | "assumption"
    | "recommendation"
    | "alternative"
    | "risk"
    | "gap"
    | "next_action";
  label: string;
  value: unknown;
  unit?: string;
  branch_ids: string[];
  verdict: TechMapWorkflowVerdict;
  evidence_refs: string[];
  disclosure: string[];
}

export interface TechMapGovernedComposition {
  workflow_id: string;
  variant_id: string;
  publication_state: TechMapPublicationState;
  overall_verdict: TechMapWorkflowVerdict;
  facts: TechMapStatement[];
  derived_metrics: TechMapStatement[];
  assumptions: TechMapStatement[];
  recommendations: TechMapStatement[];
  alternatives: TechMapStatement[];
  risks: TechMapStatement[];
  gaps: TechMapStatement[];
  next_actions: TechMapStatement[];
}
