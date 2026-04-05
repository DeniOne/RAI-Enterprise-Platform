import type { SemanticIngressFrame } from "./semantic-ingress.types";
import {
  EXECUTION_BRANCH_LIFECYCLE_VALUES,
  MUTATION_CONFIRMATION_STATE_VALUES,
} from "./execution-branch-lifecycle";

export interface BranchPlannerTelemetryOptions {
  /** Эффективный лимит параллельных RUNNING-веток (trust + опционально env). */
  maxConcurrentBranches?: number;
  /** Решение promote / canary / rollback (`planner-promotion-policy`). */
  plannerPromotion?: { enabled: boolean; mode: string };
}

/** Снимок для operator-plane / control tower (ветки планировщика). */
export function buildBranchPlannerTelemetrySnapshot(
  frame: SemanticIngressFrame,
  options?: BranchPlannerTelemetryOptions | null,
): Record<string, unknown> | null {
  if (!frame.executionPlan && !frame.executionSurface) {
    return null;
  }
  const rows = frame.executionSurface?.branches ?? [];
  const base: Record<string, unknown> = {
    planId: frame.executionPlan?.planId ?? null,
    workflowId: frame.compositePlan?.workflowId ?? null,
    sourceGraphId: frame.executionPlan?.sourceGraphId ?? frame.subIntentGraph?.graphId ?? null,
    strategy: frame.executionPlan?.strategy ?? null,
    branches: rows.map((r) => ({
      branchId: r.branchId,
      lifecycle: r.lifecycle,
      mutationState: r.mutationState,
    })),
  };
  const pam = frame.executionSurface?.plannerAdvanceMeta;
  if (pam && pam.deferredRunnableBranchIds.length > 0) {
    base.plannerConcurrencyDeferredBranchIds = pam.deferredRunnableBranchIds;
    base.plannerConcurrencyCap = pam.concurrencyCap;
  }
  if (
    typeof options?.maxConcurrentBranches === "number" &&
    Number.isFinite(options.maxConcurrentBranches)
  ) {
    base.maxConcurrentBranches = options.maxConcurrentBranches;
  }
  if (options?.plannerPromotion) {
    base.plannerPromotion = options.plannerPromotion;
  }
  return base;
}

export function parseExecutionSurfaceBranchLifecycle(
  raw: string,
): (typeof EXECUTION_BRANCH_LIFECYCLE_VALUES)[number] | null {
  return (
    EXECUTION_BRANCH_LIFECYCLE_VALUES.find((v) => v === raw) ?? null
  );
}

export function parseMutationConfirmationState(
  raw: string,
): (typeof MUTATION_CONFIRMATION_STATE_VALUES)[number] | null {
  return MUTATION_CONFIRMATION_STATE_VALUES.find((v) => v === raw) ?? null;
}
