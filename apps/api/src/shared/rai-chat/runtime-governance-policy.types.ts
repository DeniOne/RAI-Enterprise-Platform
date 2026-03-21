export type CanonicalAgentRuntimeRole =
  | "agronomist"
  | "economist"
  | "knowledge"
  | "monitoring"
  | "crm_agent"
  | "front_office_agent"
  | "contracts_agent"
  | "chief_agronomist"
  | "data_scientist";

export const FALLBACK_REASONS = [
  "NONE",
  "BUDGET_DENIED",
  "BUDGET_DEGRADED",
  "POLICY_BLOCKED",
  "PENDING_USER_CONFIRMATION",
  "DEADLINE_EXCEEDED",
  "TOOL_FAILURE",
  "NO_INTENT_OWNER",
  "NO_EVIDENCE",
  "LLM_UNAVAILABLE",
  "REPLAY_MODE",
  "NEEDS_MORE_DATA",
] as const;

export type FallbackReason = (typeof FALLBACK_REASONS)[number];

export const FALLBACK_MODES = [
  "NONE",
  "ROUTE_FALLBACK",
  "BACKLOG_ONLY",
  "READ_ONLY_SUPPORT",
  "MANUAL_HUMAN_REQUIRED",
] as const;

export type FallbackMode = (typeof FALLBACK_MODES)[number];

export const GOVERNANCE_RECOMMENDATION_TYPES = [
  "NONE",
  "REVIEW_REQUIRED",
  "QUARANTINE_RECOMMENDED",
  "ROLLBACK_RECOMMENDED",
  "BUDGET_TUNING_RECOMMENDED",
  "CONCURRENCY_TUNING_RECOMMENDED",
] as const;

export type GovernanceRecommendationType =
  (typeof GOVERNANCE_RECOMMENDATION_TYPES)[number];

export interface RuntimeGovernanceMeta {
  fallbackReason: FallbackReason;
  fallbackMode: FallbackMode;
  degraded: boolean;
  recommendation?: GovernanceRecommendationType;
}

export interface RuntimeGovernanceThresholds {
  bsReviewThresholdPct: number;
  bsQuarantineThresholdPct: number;
  evidenceCoverageMinPct: number;
  budgetDeniedRateThresholdPct: number;
  queueSaturationThreshold: "PRESSURED" | "SATURATED";
  toolFailureRateThresholdPct: number;
}

export interface RuntimeConcurrencyEnvelope {
  maxParallelToolCalls: number;
  maxParallelGroups: number;
  deadlineMs: number;
}

export interface RuntimeBudgetThresholds {
  degradePct: number;
  denyPct: number;
}

export const TRUST_LATENCY_PROFILES = [
  "HAPPY_PATH",
  "MULTI_SOURCE_READ",
  "CROSS_CHECK_TRIGGERED",
] as const;

export type RuntimeTrustLatencyProfile =
  (typeof TRUST_LATENCY_PROFILES)[number];

export interface RuntimeTrustLatencyBudget {
  happyPathMs: number;
  multiSourceReadMs: number;
  crossCheckTriggeredMs: number;
}

export interface RuntimeTrustBudgetPolicy {
  maxTrackedBranches: number;
  maxCrossCheckBranches: number;
  latencyBudgetMs: RuntimeTrustLatencyBudget;
}

export interface RuntimeTruthfulnessThresholdOverrides {
  bsReviewThresholdPct?: number;
  bsQuarantineThresholdPct?: number;
  evidenceCoverageMinPct?: number;
}

export interface RuntimeRecommendationThresholdOverrides {
  bsReviewThresholdPct?: number;
  bsQuarantineThresholdPct?: number;
  budgetDeniedRateThresholdPct?: number;
  queueSaturationThreshold?: "PRESSURED" | "SATURATED";
  toolFailureRateThresholdPct?: number;
}

export interface RuntimeGovernanceOverrides {
  concurrencyEnvelope?: Partial<RuntimeConcurrencyEnvelope>;
  truthfulnessThresholds?: RuntimeTruthfulnessThresholdOverrides;
  budgetThresholds?: Partial<RuntimeBudgetThresholds> & {
    budgetDeniedRateThresholdPct?: number;
  };
  fallbackPolicy?: Partial<Record<FallbackReason, FallbackMode>>;
  recommendationThresholds?: RuntimeRecommendationThresholdOverrides;
}

export interface RuntimeGovernanceRolePolicy {
  role: CanonicalAgentRuntimeRole;
  fallbackModeByReason: Partial<Record<FallbackReason, FallbackMode>>;
  thresholds: RuntimeGovernanceThresholds;
  concurrency: RuntimeConcurrencyEnvelope;
  budget: RuntimeBudgetThresholds;
  trust: RuntimeTrustBudgetPolicy;
}

export interface RuntimeGovernancePolicy {
  defaults: {
    fallbackModeByReason: Record<FallbackReason, FallbackMode>;
    thresholds: RuntimeGovernanceThresholds;
    concurrency: RuntimeConcurrencyEnvelope;
    budget: RuntimeBudgetThresholds;
    trust: RuntimeTrustBudgetPolicy;
  };
  roles: Record<CanonicalAgentRuntimeRole, RuntimeGovernanceRolePolicy>;
}

export interface GovernanceRecommendationRecord {
  type: GovernanceRecommendationType;
  reason: string;
  agentRole?: string | null;
  score?: number | null;
  traceId?: string | null;
  metadata?: Record<string, unknown>;
}
