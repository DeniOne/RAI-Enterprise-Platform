import type {
  TechMapAssumptionKind,
  TechMapMissingSlotSeverity,
} from "./tech-map-governed-clarify.types";
import {
  TECH_MAP_CONTEXT_READINESS_LEVELS,
  type TechMapContextReadiness,
} from "./tech-map-governed-state.types";

export const TECH_MAP_SLOT_GROUPS = [
  "identity_scope",
  "agronomic_basis",
  "resource_feasibility",
  "economic_basis",
  "external_basis",
  "history_and_evidence",
  "methodology_and_governance",
] as const;

export type TechMapSlotGroup = (typeof TECH_MAP_SLOT_GROUPS)[number];

export const TECH_MAP_SLOT_SOURCE_TYPES = [
  "crm_record",
  "field_registry",
  "season_record",
  "crop_zone",
  "harvest_plan",
  "soil_profile_lab",
  "execution_history",
  "previous_tech_map",
  "harvest_result",
  "machinery_registry",
  "contractor_profile",
  "org_default_profile",
  "warehouse_snapshot",
  "procurement_status",
  "company_budget_policy",
  "price_book",
  "company_snapshot",
  "accounting_profile",
  "weather_provider",
  "monitoring_provider",
  "methodology_registry",
  "deterministic_blueprint",
  "input_catalog",
  "contract_profile",
  "company_policy",
  "user_declared",
  "scenario_set",
  "contract_record",
] as const;

export type TechMapSlotSourceType = (typeof TECH_MAP_SLOT_SOURCE_TYPES)[number];

export type TechMapSlotFreshnessMode =
  | "NOT_REQUIRED"
  | "LATEST_VERIFIED"
  | "MAX_AGE_DAYS"
  | "SNAPSHOT_LOCKED";

export interface TechMapSlotFreshnessPolicy {
  mode: TechMapSlotFreshnessMode;
  max_age_days?: number;
  stale_verdict: "ALLOW" | "PARTIAL" | "BLOCKED";
}

export interface TechMapSlotAssumptionPolicy {
  allowed: boolean;
  allowed_kinds: TechMapAssumptionKind[];
  max_until_readiness?: TechMapContextReadiness;
  publishable: boolean;
}

export interface TechMapSlotImpactPolicy {
  blocks_branch_execution: boolean;
  review_impact: "BLOCKING" | "DISCLOSE" | "NONE";
  publication_impact: "BLOCKING" | "DISCLOSE" | "NONE";
  publication_critical: boolean;
}

export interface TechMapSlotRegistryEntry {
  slot_key: string;
  group: TechMapSlotGroup;
  severity: TechMapMissingSlotSeverity;
  stage_required_from: TechMapContextReadiness;
  allowed_sources: TechMapSlotSourceType[];
  freshness_policy: TechMapSlotFreshnessPolicy;
  assumption_policy: TechMapSlotAssumptionPolicy;
  impact: TechMapSlotImpactPolicy;
}

export const TECH_MAP_SLOT_REGISTRY: readonly TechMapSlotRegistryEntry[] = [
  {
    slot_key: "legal_entity_id",
    group: "identity_scope",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S1_SCOPED",
    allowed_sources: ["crm_record", "contract_record", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "farm_id",
    group: "identity_scope",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S1_SCOPED",
    allowed_sources: ["field_registry", "crm_record", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "field_ids[]",
    group: "identity_scope",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S1_SCOPED",
    allowed_sources: ["field_registry", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "season_id",
    group: "identity_scope",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S1_SCOPED",
    allowed_sources: ["season_record", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "crop_code",
    group: "identity_scope",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S1_SCOPED",
    allowed_sources: ["crop_zone", "harvest_plan", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "predecessor_crop",
    group: "agronomic_basis",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["execution_history", "previous_tech_map", "user_declared"],
    freshness_policy: { mode: "LATEST_VERIFIED", stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "DISCLOSE",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "soil_profile",
    group: "agronomic_basis",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["soil_profile_lab"],
    freshness_policy: { mode: "LATEST_VERIFIED", stale_verdict: "BLOCKED" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "target_yield_profile",
    group: "agronomic_basis",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["harvest_plan", "crop_zone", "scenario_set", "user_declared"],
    freshness_policy: { mode: "NOT_REQUIRED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "DISCLOSE",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "field_history",
    group: "agronomic_basis",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["execution_history", "previous_tech_map"],
    freshness_policy: { mode: "LATEST_VERIFIED", stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "DISCLOSE",
      publication_critical: true,
    },
  },
  {
    slot_key: "seed_or_hybrid",
    group: "agronomic_basis",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["user_declared", "input_catalog", "previous_tech_map"],
    freshness_policy: { mode: "LATEST_VERIFIED", stale_verdict: "PARTIAL" },
    assumption_policy: {
      allowed: true,
      allowed_kinds: ["USER_DECLARED", "METHOD_DEFAULT"],
      max_until_readiness: "S3_DRAFT_READY",
      publishable: false,
    },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "machinery_profile",
    group: "resource_feasibility",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["machinery_registry", "contractor_profile", "user_declared"],
    freshness_policy: { mode: "LATEST_VERIFIED", stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "labor_or_contractor_profile",
    group: "resource_feasibility",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["contractor_profile", "org_default_profile", "user_declared"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 90, stale_verdict: "PARTIAL" },
    assumption_policy: {
      allowed: true,
      allowed_kinds: ["METHOD_DEFAULT", "USER_DECLARED"],
      max_until_readiness: "S4_REVIEW_READY",
      publishable: false,
    },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "DISCLOSE",
      publication_critical: false,
    },
  },
  {
    slot_key: "input_availability",
    group: "resource_feasibility",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["warehouse_snapshot", "procurement_status", "user_declared"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 14, stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "budget_policy",
    group: "economic_basis",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["company_budget_policy", "harvest_plan", "user_declared"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "BLOCKED" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "price_book_version",
    group: "economic_basis",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["price_book", "company_snapshot"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 30, stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "currency_tax_mode",
    group: "economic_basis",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["accounting_profile", "company_policy"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "BLOCKED" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "weather_normals",
    group: "external_basis",
    severity: "DERIVED",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["weather_provider"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 365, stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "NONE",
      publication_impact: "DISCLOSE",
      publication_critical: false,
    },
  },
  {
    slot_key: "forecast_window",
    group: "external_basis",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["weather_provider", "monitoring_provider"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 7, stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "DISCLOSE",
      publication_critical: false,
    },
  },
  {
    slot_key: "irrigation_or_water_constraints",
    group: "external_basis",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["field_registry", "company_policy", "user_declared"],
    freshness_policy: { mode: "MAX_AGE_DAYS", max_age_days: 180, stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "previous_tech_map",
    group: "history_and_evidence",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["previous_tech_map"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "NONE",
      publication_critical: false,
    },
  },
  {
    slot_key: "execution_history",
    group: "history_and_evidence",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["execution_history"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "NONE",
      publication_critical: false,
    },
  },
  {
    slot_key: "past_outcomes",
    group: "history_and_evidence",
    severity: "OPTIONAL_ENRICHING",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["harvest_result"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "ALLOW" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "DISCLOSE",
      publication_impact: "NONE",
      publication_critical: false,
    },
  },
  {
    slot_key: "methodology_profile_id",
    group: "methodology_and_governance",
    severity: "REQUIRED_BLOCKING",
    stage_required_from: "S2_MINIMUM_COMPUTABLE",
    allowed_sources: ["methodology_registry", "deterministic_blueprint"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "BLOCKED" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: true,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "allowed_input_catalog_version",
    group: "methodology_and_governance",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S3_DRAFT_READY",
    allowed_sources: ["input_catalog"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "BLOCKED" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "contract_mode",
    group: "methodology_and_governance",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S4_REVIEW_READY",
    allowed_sources: ["contract_profile", "company_policy", "user_declared"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "BLOCKED" },
    assumption_policy: {
      allowed: true,
      allowed_kinds: ["METHOD_DEFAULT", "USER_DECLARED"],
      max_until_readiness: "S4_REVIEW_READY",
      publishable: false,
    },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "BLOCKING",
      publication_critical: true,
    },
  },
  {
    slot_key: "target_kpi_policy",
    group: "methodology_and_governance",
    severity: "REQUIRED_REVIEW",
    stage_required_from: "S4_REVIEW_READY",
    allowed_sources: ["company_policy", "harvest_plan", "user_declared"],
    freshness_policy: { mode: "SNAPSHOT_LOCKED", stale_verdict: "PARTIAL" },
    assumption_policy: { allowed: false, allowed_kinds: [], publishable: false },
    impact: {
      blocks_branch_execution: false,
      review_impact: "BLOCKING",
      publication_impact: "DISCLOSE",
      publication_critical: true,
    },
  },
] as const;

const readinessOrder = new Map(
  TECH_MAP_CONTEXT_READINESS_LEVELS.map((level, index) => [level, index]),
);

export function getTechMapSlotRegistryEntry(
  slotKey: string,
): TechMapSlotRegistryEntry | undefined {
  return TECH_MAP_SLOT_REGISTRY.find((entry) => entry.slot_key === slotKey);
}

export function listTechMapSlotRegistryEntriesRequiredFrom(
  readiness: TechMapContextReadiness,
): TechMapSlotRegistryEntry[] {
  const targetIndex = readinessOrder.get(readiness) ?? Number.MAX_SAFE_INTEGER;
  return TECH_MAP_SLOT_REGISTRY.filter((entry) => {
    const entryIndex =
      readinessOrder.get(entry.stage_required_from) ?? Number.MAX_SAFE_INTEGER;
    return entryIndex <= targetIndex;
  });
}

export function listTechMapPublicationCriticalSlots(): string[] {
  return TECH_MAP_SLOT_REGISTRY.filter(
    (entry) => entry.impact.publication_critical,
  ).map((entry) => entry.slot_key);
}

export function listTechMapPublicationCriticalSlotEntries(): TechMapSlotRegistryEntry[] {
  return TECH_MAP_SLOT_REGISTRY.filter(
    (entry) => entry.impact.publication_critical,
  );
}

export function listTechMapSlotsByGroup(
  group: TechMapSlotGroup,
): TechMapSlotRegistryEntry[] {
  return TECH_MAP_SLOT_REGISTRY.filter((entry) => entry.group === group);
}
