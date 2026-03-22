import type {
  TechMapWorkflowVerdictAggregationInput,
} from "./tech-map-governed-branch.types";
import type { TechMapWorkflowVerdict } from "./tech-map-governed-state.types";

function hasVerdict(
  verdicts: readonly TechMapWorkflowVerdict[],
  verdict: TechMapWorkflowVerdict,
): boolean {
  return verdicts.includes(verdict);
}

export function aggregateTechMapWorkflowVerdict(
  input: TechMapWorkflowVerdictAggregationInput,
): TechMapWorkflowVerdict {
  if (input.unresolved_blocking_gaps > 0) {
    return "BLOCKED";
  }

  if (input.unresolved_hard_blocks > 0) {
    return "BLOCKED";
  }

  if (input.expert_review_verdict === "BLOCK") {
    return "BLOCKED";
  }

  if (hasVerdict(input.publication_critical_branch_verdicts, "BLOCKED")) {
    return "BLOCKED";
  }

  if (input.requested_artifact === "comparison_report") {
    if (!input.primary_artifact_branch_verdict) {
      return "UNVERIFIED";
    }
    if (input.primary_artifact_branch_verdict === "UNVERIFIED") {
      return "UNVERIFIED";
    }
  } else if (!input.selected_variant_verdict) {
    return "UNVERIFIED";
  }

  if (
    input.selected_variant_verdict === "UNVERIFIED" ||
    hasVerdict(input.publication_critical_branch_verdicts, "UNVERIFIED")
  ) {
    return "UNVERIFIED";
  }

  if (
    input.expert_review_verdict === "REVISE" ||
    (input.requested_artifact === "comparison_report" &&
      input.primary_artifact_branch_verdict === "PARTIAL") ||
    input.selected_variant_verdict === "PARTIAL" ||
    hasVerdict(input.publication_critical_branch_verdicts, "PARTIAL")
  ) {
    return "PARTIAL";
  }

  return "VERIFIED";
}
