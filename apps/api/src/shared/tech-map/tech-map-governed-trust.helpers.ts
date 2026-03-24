import type {
  BranchResultContract,
  BranchTrustAssessment,
} from "../rai-chat/branch-trust.types";
import type { TechMapBranchType } from "./tech-map-governed-branch.types";
import { aggregateTechMapWorkflowVerdict } from "./tech-map-governed-verdict.helpers";
import type { TechMapWorkflowVerdictAggregationInput } from "./tech-map-governed-branch.types";
import type { TechMapPublicationState } from "./tech-map-governed-state.types";
import type { TechMapWorkflowVerdict } from "./tech-map-governed-state.types";

export interface TechMapGovernedTrustBranchRecord {
  branch_id: string;
  branch_type: TechMapBranchType;
  verdict: TechMapWorkflowVerdict;
  publication_critical: boolean;
  allowed_in_composition: boolean;
  disclosure: string[];
}

export interface TechMapVariantComparisonRow {
  variant_id: string;
  selected: boolean;
  branch_count: number;
  publication_critical_branch_count: number;
  verdict: TechMapWorkflowVerdict;
  disclosure: string[];
}

export interface TechMapVariantComparisonReport {
  selected_variant_id: string;
  selected_variant_verdict: TechMapWorkflowVerdict;
  rows: TechMapVariantComparisonRow[];
  comparison_available: boolean;
  disclosure: string[];
}

export interface TechMapGovernedTrustSpecialization {
  workflow_id: string;
  variant_id: string;
  publication_state: TechMapPublicationState;
  overall_verdict: TechMapWorkflowVerdict;
  publication_critical_branches: TechMapGovernedTrustBranchRecord[];
  advisory_branches: TechMapGovernedTrustBranchRecord[];
  allowed_branch_ids: string[];
  blocked_branch_ids: string[];
  blocked_disclosure: string[];
  composition_gate: {
    can_compose: boolean;
    reason: string;
    disclosure: string[];
  };
  variant_comparison_report: TechMapVariantComparisonReport;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function toWorkflowVerdict(
  verdict: BranchTrustAssessment["verdict"],
): TechMapWorkflowVerdict {
  if (verdict === "CONFLICTED" || verdict === "REJECTED") {
    return "BLOCKED";
  }

  if (verdict === "VERIFIED") {
    return "VERIFIED";
  }

  if (verdict === "PARTIAL") {
    return "PARTIAL";
  }

  return "UNVERIFIED";
}

function buildAggregationInput(params: {
  requestedArtifact: TechMapWorkflowVerdictAggregationInput["requested_artifact"];
  selectedVariantVerdict: TechMapWorkflowVerdict;
  publicationCriticalBranchVerdicts: TechMapWorkflowVerdict[];
  advisoryBranchVerdicts: TechMapWorkflowVerdict[];
  unresolvedBlockingGaps: number;
  unresolvedHardBlocks: number;
}): TechMapWorkflowVerdictAggregationInput {
  return {
    requested_artifact: params.requestedArtifact,
    selected_variant_verdict: params.selectedVariantVerdict,
    publication_critical_branch_verdicts: params.publicationCriticalBranchVerdicts,
    primary_artifact_branch_verdict: params.selectedVariantVerdict,
    advisory_branch_verdicts: params.advisoryBranchVerdicts,
    expert_review_verdict: "SKIPPED",
    unresolved_blocking_gaps: params.unresolvedBlockingGaps,
    unresolved_hard_blocks: params.unresolvedHardBlocks,
  };
}

export function buildTechMapGovernedTrustSpecialization(params: {
  workflowId: string;
  variantId: string;
  publicationState: TechMapPublicationState;
  branchResults: BranchResultContract[];
  branchTrustAssessments: BranchTrustAssessment[];
  workflowVerdict: TechMapWorkflowVerdict;
}): TechMapGovernedTrustSpecialization {
  const assessmentMap = new Map(
    params.branchTrustAssessments.map((assessment) => [
      assessment.branch_id,
      assessment,
    ]),
  );

  const branchRecords = params.branchResults.map((branch) => {
    const assessment = assessmentMap.get(branch.branch_id);
    const verdict = assessment ? toWorkflowVerdict(assessment.verdict) : "UNVERIFIED";
    const allowedInComposition = verdict === "VERIFIED" || verdict === "PARTIAL";
    const disclosure = uniqueStrings([
      branch.summary ?? "",
      ...(assessment?.reasons ?? []),
      ...branch.data_gaps,
      ...(assessment?.requires_cross_check ? ["cross_check_required"] : []),
    ]);

    return {
      branch_id: branch.branch_id,
      branch_type: (branch.branch_type as TechMapBranchType | undefined) ?? "context_intake",
      verdict,
      publication_critical: Boolean(branch.publication_critical),
      allowed_in_composition: allowedInComposition,
      disclosure,
    } satisfies TechMapGovernedTrustBranchRecord;
  });

  const publicationCriticalBranches = branchRecords.filter(
    (record) => record.publication_critical,
  );
  const advisoryBranches = branchRecords.filter(
    (record) => !record.publication_critical,
  );
  const allowedBranchIds = branchRecords
    .filter((record) => record.allowed_in_composition)
    .map((record) => record.branch_id);
  const blockedBranchIds = branchRecords
    .filter((record) => !record.allowed_in_composition)
    .map((record) => record.branch_id);
  const blockedDisclosure = uniqueStrings(
    branchRecords
      .filter((record) => !record.allowed_in_composition)
      .flatMap((record) => record.disclosure),
  );
  const canCompose = blockedBranchIds.length === 0;

  const groupedByVariant = new Map<
    string,
    {
      branchRecords: TechMapGovernedTrustBranchRecord[];
      assessments: BranchTrustAssessment[];
    }
  >();
  for (const branch of params.branchResults) {
    const variantId = branch.variant_id ?? params.variantId;
    const entry =
      groupedByVariant.get(variantId) ??
      ({
        branchRecords: [],
        assessments: [],
      } satisfies {
        branchRecords: TechMapGovernedTrustBranchRecord[];
        assessments: BranchTrustAssessment[];
      });
    entry.branchRecords.push(
      branchRecords.find((record) => record.branch_id === branch.branch_id)!,
    );
    const assessment = assessmentMap.get(branch.branch_id);
    if (assessment) {
      entry.assessments.push(assessment);
    }
    groupedByVariant.set(variantId, entry);
  }

  const comparisonRows = [...groupedByVariant.entries()].map(
    ([variantId, group]) => {
      const publicationCriticalBranchVerdicts = group.branchRecords
        .filter((record) => record.publication_critical)
        .map((record) => record.verdict);
      const advisoryBranchVerdicts = group.branchRecords
        .filter((record) => !record.publication_critical)
        .map((record) => record.verdict);
      const selectedVariantVerdict = aggregateTechMapWorkflowVerdict(
        buildAggregationInput({
          requestedArtifact: "comparison_report",
          selectedVariantVerdict:
            group.branchRecords.some((record) => record.allowed_in_composition)
              ? group.branchRecords.some((record) => record.verdict === "BLOCKED")
                ? "PARTIAL"
                : "VERIFIED"
              : "UNVERIFIED",
          publicationCriticalBranchVerdicts,
          advisoryBranchVerdicts,
          unresolvedBlockingGaps: group.branchRecords.filter(
            (record) => !record.allowed_in_composition,
          ).length,
          unresolvedHardBlocks: 0,
        }),
      );

      return {
        variant_id: variantId,
        selected: variantId === params.variantId,
        branch_count: group.branchRecords.length,
        publication_critical_branch_count: group.branchRecords.filter(
          (record) => record.publication_critical,
        ).length,
        verdict: selectedVariantVerdict,
        disclosure: uniqueStrings(
          group.branchRecords.flatMap((record) => record.disclosure),
        ),
      } satisfies TechMapVariantComparisonRow;
    },
  );

  const selectedVariantRow =
    comparisonRows.find((row) => row.selected) ?? comparisonRows[0];
  const variantComparisonReport: TechMapVariantComparisonReport = {
    selected_variant_id: params.variantId,
    selected_variant_verdict: selectedVariantRow?.verdict ?? params.workflowVerdict,
    rows: comparisonRows,
    comparison_available: comparisonRows.length > 1,
    disclosure: uniqueStrings([
      ...blockedDisclosure,
      ...(comparisonRows.length > 1 ? ["comparison_available"] : []),
    ]),
  };

  return {
    workflow_id: params.workflowId,
    variant_id: params.variantId,
    publication_state: params.publicationState,
    overall_verdict: params.workflowVerdict,
    publication_critical_branches: publicationCriticalBranches,
    advisory_branches: advisoryBranches,
    allowed_branch_ids: allowedBranchIds,
    blocked_branch_ids: blockedBranchIds,
    blocked_disclosure: blockedDisclosure,
    composition_gate: {
      can_compose: canCompose,
      reason: canCompose ? "trust_gate_passed" : "trust_gate_pending",
      disclosure: uniqueStrings([
        ...blockedDisclosure,
        ...(canCompose ? ["trust_gate_passed"] : ["trust_gate_pending"]),
      ]),
    },
    variant_comparison_report: variantComparisonReport,
  };
}
