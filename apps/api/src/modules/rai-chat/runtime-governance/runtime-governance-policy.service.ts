import { Injectable } from "@nestjs/common";
import { CanonicalAgentRuntimeRole } from "../agent-registry.service";
import {
  FALLBACK_REASONS,
  FallbackReason,
  RuntimeGovernanceOverrides,
  RuntimeGovernancePolicy,
  RuntimeGovernanceRolePolicy,
} from "./runtime-governance-policy.types";

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
    };
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
