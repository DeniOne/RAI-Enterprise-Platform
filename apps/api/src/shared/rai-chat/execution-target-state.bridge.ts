import type { BranchVerdict } from "./branch-trust.types";
import type { CompositeWorkflowStageStatus } from "./composite-orchestration.types";
import type {
  ExecutionBranchLifecycle,
  MutationConfirmationState,
} from "./execution-branch-lifecycle";
import type { TargetPolicyDecision } from "./execution-target-state.types";

export function compositeWorkflowStageStatusToLifecycle(
  status: CompositeWorkflowStageStatus,
): ExecutionBranchLifecycle {
  switch (status) {
    case "planned":
      return "PLANNED";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
    case "blocked":
      return "BLOCKED_ON_CONFIRMATION";
    default:
      return "PLANNED";
  }
}

export function branchVerdictToLifecycleHint(
  verdict: BranchVerdict,
): ExecutionBranchLifecycle | null {
  switch (verdict) {
    case "VERIFIED":
      return "COMPLETED";
    case "REJECTED":
      return "FAILED";
    case "CONFLICTED":
      return "FAILED";
    case "PARTIAL":
    case "UNVERIFIED":
      return "RUNNING";
    default:
      return null;
  }
}

export function mapWritePolicyToMutationState(params: {
  decision: TargetPolicyDecision;
  requiresConfirmation: boolean;
}): MutationConfirmationState {
  if (params.decision === "confirm" || params.requiresConfirmation) {
    return "PENDING";
  }
  if (params.decision === "block") {
    return "REJECTED";
  }
  return "NOT_REQUIRED";
}
