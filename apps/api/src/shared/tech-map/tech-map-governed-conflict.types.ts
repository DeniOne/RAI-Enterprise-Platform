export const TECH_MAP_CONFLICT_CATEGORIES = [
  "scope_conflict",
  "measurement_conflict",
  "freshness_conflict",
  "policy_conflict",
  "budget_conflict",
  "version_conflict",
  "user_override_conflict",
] as const;

export type TechMapConflictCategory =
  (typeof TECH_MAP_CONFLICT_CATEGORIES)[number];

export const TECH_MAP_CONFLICT_RESOLUTION_CLASSES = [
  "AUTO_RESOLVED",
  "REVIEW_REQUIRED",
  "HARD_BLOCK",
] as const;

export type TechMapConflictResolutionClass =
  (typeof TECH_MAP_CONFLICT_RESOLUTION_CLASSES)[number];

export const TECH_MAP_CONFLICT_STATUSES = [
  "OPEN",
  "RESOLVED",
  "ESCALATED",
  "BLOCKED",
] as const;

export type TechMapConflictStatus = (typeof TECH_MAP_CONFLICT_STATUSES)[number];

export interface TechMapConflictRecord {
  conflict_id: string;
  category: TechMapConflictCategory;
  slot_key?: string;
  source_refs: string[];
  authority_winner_ref?: string;
  resolution_class: TechMapConflictResolutionClass;
  status: TechMapConflictStatus;
  summary: string;
  resolution_reason?: string;
}
