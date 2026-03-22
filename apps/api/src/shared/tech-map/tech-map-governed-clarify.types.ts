import type { TechMapWorkflowPhase } from "./tech-map-governed-state.types";

export const TECH_MAP_MISSING_SLOT_SEVERITIES = [
  "REQUIRED_BLOCKING",
  "REQUIRED_REVIEW",
  "OPTIONAL_ENRICHING",
  "ASSUMPTION_ALLOWED",
  "DERIVED",
] as const;

export type TechMapMissingSlotSeverity =
  (typeof TECH_MAP_MISSING_SLOT_SEVERITIES)[number];

export const TECH_MAP_ASSUMPTION_KINDS = [
  "USER_DECLARED",
  "METHOD_DEFAULT",
  "MODEL_ESTIMATE",
  "TEMP_PLACEHOLDER",
] as const;

export type TechMapAssumptionKind = (typeof TECH_MAP_ASSUMPTION_KINDS)[number];

export const TECH_MAP_CLARIFY_RESOLUTION_TARGETS = [
  "MACHINE_RESOLVABLE",
  "USER_RESOLVABLE",
  "HUMAN_REVIEW_REQUIRED",
] as const;

export type TechMapClarifyResolutionTarget =
  (typeof TECH_MAP_CLARIFY_RESOLUTION_TARGETS)[number];

export const TECH_MAP_CLARIFY_MODES = ["ONE_SHOT", "MULTI_STEP"] as const;

export type TechMapClarifyMode = (typeof TECH_MAP_CLARIFY_MODES)[number];

export const TECH_MAP_CLARIFY_BATCH_STATUSES = [
  "OPEN",
  "PARTIALLY_RESOLVED",
  "WAITING_USER",
  "WAITING_SYSTEM",
  "RESOLVED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type TechMapClarifyBatchStatus =
  (typeof TECH_MAP_CLARIFY_BATCH_STATUSES)[number];

export interface TechMapAssumption {
  assumption_id: string;
  kind: TechMapAssumptionKind;
  label: string;
  value: unknown;
  impact_level: "low" | "medium" | "high";
  publishable: boolean;
  requires_human_review: boolean;
  source_ref?: string;
}

export interface TechMapGap {
  gap_id: string;
  kind:
    | "missing_input"
    | "stale_input"
    | "conflict"
    | "policy_block"
    | "non_deterministic_basis";
  severity: "blocking" | "review" | "informational";
  branch_id?: string;
  slot_key?: string;
  disclosure: string;
}

export interface TechMapClarifyItem {
  slot_key: string;
  label: string;
  group_key: string;
  priority: number;
  severity: TechMapMissingSlotSeverity;
  resolution_target: TechMapClarifyResolutionTarget;
  reason: string;
  blocks_phases: Array<"branch_execution" | "composition" | "publication">;
  acceptable_sources: string[];
  can_be_assumed: boolean;
  assumption_kind?: Extract<
    TechMapAssumptionKind,
    "USER_DECLARED" | "METHOD_DEFAULT"
  >;
}

export interface TechMapClarifyBatch {
  batch_id: string;
  workflow_id: string;
  mode: TechMapClarifyMode;
  status: TechMapClarifyBatchStatus;
  priority: number;
  group_key: string;
  items: TechMapClarifyItem[];
  blocking_for_phase: TechMapWorkflowPhase;
  resume_token: string;
  expires_at: string;
}

export interface TechMapWorkflowResumeState {
  workflow_id: string;
  resume_token: string;
  resume_from_phase: TechMapWorkflowPhase;
  pending_batch_ids: string[];
  baseline_context_hash: string;
  external_recheck_required: boolean;
  expires_at: string;
}

export const TECH_MAP_DEFAULT_CLARIFY_POLICY = {
  clarify_batch_ttl_hours: 72,
  workflow_resume_ttl_days: 30,
  external_recheck_on_resume_hours: 24,
  review_gate_recheck: "always",
} as const;
