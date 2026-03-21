import { Injectable } from "@nestjs/common";
import { CanonicalAgentRuntimeRole } from "../agent-registry.service";
import {
  FALLBACK_REASONS,
  FallbackReason,
  RuntimeGovernanceOverrides,
  RuntimeGovernancePolicy,
  RuntimeGovernanceRolePolicy,
  RuntimeTrustBudgetPolicy,
  RuntimeTrustLatencyProfile,
} from "../../../shared/rai-chat/runtime-governance-policy.types";

function buildFallbackModes(
  overrides: Partial<Record<FallbackReason, RuntimeGovernanceRolePolicy["fallbackModeByReason"][FallbackReason]>> = {},
): RuntimeGovernanceRolePolicy["fallbackModeByReason"] {
  return {
    NONE: "NONE",
    BUDGET_DENIED: "MANUAL_HUMAN_REQUIRED",
    BUDGET_DEGRADED: "READ_ONLY_SUPPORT",
    POLICY_BLOCKED: "MANUAL_HUMAN_REQUIRED",
    PENDING_USER_CONFIRMATION: "MANUAL_HUMAN_REQUIRED",
    DEADLINE_EXCEEDED: "READ_ONLY_SUPPORT",
    TOOL_FAILURE: "READ_ONLY_SUPPORT",
    NO_INTENT_OWNER: "ROUTE_FALLBACK",
    NO_EVIDENCE: "READ_ONLY_SUPPORT",
    LLM_UNAVAILABLE: "READ_ONLY_SUPPORT",
    REPLAY_MODE: "READ_ONLY_SUPPORT",
    NEEDS_MORE_DATA: "MANUAL_HUMAN_REQUIRED",
    ...overrides,
  };
}

function buildTrustBudget(
  overrides: Partial<RuntimeTrustBudgetPolicy> & {
    latencyBudgetMs?: Partial<RuntimeTrustBudgetPolicy["latencyBudgetMs"]>;
  } = {},
): RuntimeTrustBudgetPolicy {
  return {
    maxTrackedBranches: overrides.maxTrackedBranches ?? 4,
    maxCrossCheckBranches: overrides.maxCrossCheckBranches ?? 1,
    latencyBudgetMs: {
      happyPathMs: 300,
      multiSourceReadMs: 800,
      crossCheckTriggeredMs: 1_500,
      ...(overrides.latencyBudgetMs ?? {}),
    },
  };
}

const DEFAULT_POLICY: RuntimeGovernancePolicy = {
  defaults: {
    fallbackModeByReason: buildFallbackModes() as Record<FallbackReason, RuntimeGovernanceRolePolicy["fallbackModeByReason"][FallbackReason]>,
    thresholds: {
      bsReviewThresholdPct: 30,
      bsQuarantineThresholdPct: 45,
      evidenceCoverageMinPct: 60,
      budgetDeniedRateThresholdPct: 15,
      queueSaturationThreshold: "SATURATED",
      toolFailureRateThresholdPct: 10,
    },
    concurrency: {
      maxParallelToolCalls: 8,
      maxParallelGroups: 6,
      deadlineMs: 30_000,
    },
    budget: {
      degradePct: 80,
      denyPct: 100,
    },
    trust: buildTrustBudget(),
  },
  roles: {
    agronomist: {
      role: "agronomist",
      fallbackModeByReason: buildFallbackModes({
        NEEDS_MORE_DATA: "MANUAL_HUMAN_REQUIRED",
      }),
      thresholds: {
        bsReviewThresholdPct: 28,
        bsQuarantineThresholdPct: 40,
        evidenceCoverageMinPct: 65,
        budgetDeniedRateThresholdPct: 12,
        queueSaturationThreshold: "SATURATED",
        toolFailureRateThresholdPct: 8,
      },
      concurrency: {
        maxParallelToolCalls: 4,
        maxParallelGroups: 3,
        deadlineMs: 30_000,
      },
      budget: { degradePct: 80, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 5,
      }),
    },
    economist: {
      role: "economist",
      fallbackModeByReason: buildFallbackModes({
        DEADLINE_EXCEEDED: "READ_ONLY_SUPPORT",
      }),
      thresholds: {
        bsReviewThresholdPct: 24,
        bsQuarantineThresholdPct: 36,
        evidenceCoverageMinPct: 70,
        budgetDeniedRateThresholdPct: 10,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 7,
      },
      concurrency: {
        maxParallelToolCalls: 3,
        maxParallelGroups: 2,
        deadlineMs: 25_000,
      },
      budget: { degradePct: 75, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 5,
      }),
    },
    knowledge: {
      role: "knowledge",
      fallbackModeByReason: buildFallbackModes({
        NO_EVIDENCE: "READ_ONLY_SUPPORT",
      }),
      thresholds: {
        bsReviewThresholdPct: 35,
        bsQuarantineThresholdPct: 50,
        evidenceCoverageMinPct: 45,
        budgetDeniedRateThresholdPct: 18,
        queueSaturationThreshold: "SATURATED",
        toolFailureRateThresholdPct: 12,
      },
      concurrency: {
        maxParallelToolCalls: 10,
        maxParallelGroups: 6,
        deadlineMs: 20_000,
      },
      budget: { degradePct: 85, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 6,
        maxCrossCheckBranches: 2,
      }),
    },
    monitoring: {
      role: "monitoring",
      fallbackModeByReason: buildFallbackModes({
        TOOL_FAILURE: "READ_ONLY_SUPPORT",
      }),
      thresholds: {
        bsReviewThresholdPct: 30,
        bsQuarantineThresholdPct: 45,
        evidenceCoverageMinPct: 55,
        budgetDeniedRateThresholdPct: 15,
        queueSaturationThreshold: "SATURATED",
        toolFailureRateThresholdPct: 10,
      },
      concurrency: {
        maxParallelToolCalls: 10,
        maxParallelGroups: 6,
        deadlineMs: 20_000,
      },
      budget: { degradePct: 85, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 6,
      }),
    },
    crm_agent: {
      role: "crm_agent",
      fallbackModeByReason: buildFallbackModes({
        POLICY_BLOCKED: "MANUAL_HUMAN_REQUIRED",
        PENDING_USER_CONFIRMATION: "MANUAL_HUMAN_REQUIRED",
      }),
      thresholds: {
        bsReviewThresholdPct: 20,
        bsQuarantineThresholdPct: 32,
        evidenceCoverageMinPct: 75,
        budgetDeniedRateThresholdPct: 10,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 6,
      },
      concurrency: {
        maxParallelToolCalls: 4,
        maxParallelGroups: 3,
        deadlineMs: 25_000,
      },
      budget: { degradePct: 75, denyPct: 100 },
      trust: buildTrustBudget(),
    },
    front_office_agent: {
      role: "front_office_agent",
      fallbackModeByReason: buildFallbackModes({
        NO_INTENT_OWNER: "ROUTE_FALLBACK",
        NEEDS_MORE_DATA: "MANUAL_HUMAN_REQUIRED",
      }),
      thresholds: {
        bsReviewThresholdPct: 25,
        bsQuarantineThresholdPct: 38,
        evidenceCoverageMinPct: 70,
        budgetDeniedRateThresholdPct: 12,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 8,
      },
      concurrency: {
        maxParallelToolCalls: 5,
        maxParallelGroups: 4,
        deadlineMs: 20_000,
      },
      budget: { degradePct: 80, denyPct: 100 },
      trust: buildTrustBudget(),
    },
    contracts_agent: {
      role: "contracts_agent",
      fallbackModeByReason: buildFallbackModes({
        POLICY_BLOCKED: "MANUAL_HUMAN_REQUIRED",
        PENDING_USER_CONFIRMATION: "MANUAL_HUMAN_REQUIRED",
        TOOL_FAILURE: "READ_ONLY_SUPPORT",
      }),
      thresholds: {
        bsReviewThresholdPct: 18,
        bsQuarantineThresholdPct: 30,
        evidenceCoverageMinPct: 75,
        budgetDeniedRateThresholdPct: 10,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 6,
      },
      concurrency: {
        maxParallelToolCalls: 4,
        maxParallelGroups: 3,
        deadlineMs: 25_000,
      },
      budget: { degradePct: 75, denyPct: 100 },
      trust: buildTrustBudget(),
    },
    chief_agronomist: {
      role: "chief_agronomist",
      fallbackModeByReason: buildFallbackModes({
        NO_INTENT_OWNER: "ROUTE_FALLBACK",
        NEEDS_MORE_DATA: "MANUAL_HUMAN_REQUIRED",
      }),
      thresholds: {
        bsReviewThresholdPct: 30,
        bsQuarantineThresholdPct: 45,
        evidenceCoverageMinPct: 70,
        budgetDeniedRateThresholdPct: 15,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 10,
      },
      concurrency: {
        maxParallelToolCalls: 4,
        maxParallelGroups: 3,
        deadlineMs: 30_000,
      },
      budget: { degradePct: 80, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 5,
      }),
    },
    data_scientist: {
      role: "data_scientist",
      fallbackModeByReason: buildFallbackModes({
        NO_INTENT_OWNER: "ROUTE_FALLBACK",
        NEEDS_MORE_DATA: "MANUAL_HUMAN_REQUIRED",
      }),
      thresholds: {
        bsReviewThresholdPct: 30,
        bsQuarantineThresholdPct: 45,
        evidenceCoverageMinPct: 70,
        budgetDeniedRateThresholdPct: 15,
        queueSaturationThreshold: "PRESSURED",
        toolFailureRateThresholdPct: 10,
      },
      concurrency: {
        maxParallelToolCalls: 4,
        maxParallelGroups: 3,
        deadlineMs: 30_000,
      },
      budget: { degradePct: 80, denyPct: 100 },
      trust: buildTrustBudget({
        maxTrackedBranches: 5,
      }),
    },
  },
};

@Injectable()
export class RuntimeGovernancePolicyService {
  getPolicy(): RuntimeGovernancePolicy {
    return DEFAULT_POLICY;
  }

  getRolePolicy(
    role?: string | null,
    overrides?: RuntimeGovernanceOverrides | null,
  ): RuntimeGovernanceRolePolicy {
    const policy = this.getPolicy();
    const basePolicy: RuntimeGovernanceRolePolicy =
      role && this.isCanonicalRole(role)
        ? policy.roles[role]
        : {
            role: "knowledge",
            fallbackModeByReason: policy.defaults.fallbackModeByReason,
            thresholds: policy.defaults.thresholds,
            concurrency: policy.defaults.concurrency,
            budget: policy.defaults.budget,
            trust: policy.defaults.trust,
          };
    if (!overrides) {
      return basePolicy;
    }
    return {
      ...basePolicy,
      fallbackModeByReason: {
        ...basePolicy.fallbackModeByReason,
        ...(overrides.fallbackPolicy ?? {}),
      },
      thresholds: {
        ...basePolicy.thresholds,
        ...(overrides.truthfulnessThresholds ?? {}),
        ...(overrides.recommendationThresholds ?? {}),
        ...(typeof overrides.budgetThresholds?.budgetDeniedRateThresholdPct === "number"
          ? {
              budgetDeniedRateThresholdPct:
                overrides.budgetThresholds.budgetDeniedRateThresholdPct,
            }
          : {}),
      },
      concurrency: {
        ...basePolicy.concurrency,
        ...(overrides.concurrencyEnvelope ?? {}),
      },
      budget: {
        ...basePolicy.budget,
        ...(overrides.budgetThresholds ?? {}),
      },
      trust: basePolicy.trust,
    };
  }

  getTrustBudget(role?: string | null): RuntimeTrustBudgetPolicy {
    return this.getRolePolicy(role).trust;
  }

  resolveTrustLatencyBudgetMs(
    role: string | null | undefined,
    profile: RuntimeTrustLatencyProfile,
  ): number {
    const latencyBudget = this.getTrustBudget(role).latencyBudgetMs;
    if (profile === "CROSS_CHECK_TRIGGERED") {
      return latencyBudget.crossCheckTriggeredMs;
    }
    if (profile === "MULTI_SOURCE_READ") {
      return latencyBudget.multiSourceReadMs;
    }
    return latencyBudget.happyPathMs;
  }

  resolveFallbackMode(
    role: string | null | undefined,
    reason: FallbackReason,
    overrides?: RuntimeGovernanceOverrides | null,
  ) {
    const rolePolicy = this.getRolePolicy(role, overrides);
    return (
      rolePolicy.fallbackModeByReason[reason] ??
      this.getPolicy().defaults.fallbackModeByReason[reason]
    );
  }

  listFallbackReasons(): FallbackReason[] {
    return [...FALLBACK_REASONS];
  }

  private isCanonicalRole(value: string): value is CanonicalAgentRuntimeRole {
    return value in DEFAULT_POLICY.roles;
  }
}
