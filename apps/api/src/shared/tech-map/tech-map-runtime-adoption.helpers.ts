import type {
  BranchResultContract,
  BranchTrustAssessment,
  EvidenceReference,
} from "../rai-chat/rai-chat.dto";
import type { TechMapConflictRecord } from "./tech-map-governed-conflict.types";
import {
  buildTechMapExpertReviewResult,
} from "./tech-map-governed-expert-review.helpers";
import type { TechMapExpertReviewResult } from "./tech-map-governed-branch.types";
import type { TechMapWorkflowVerdict } from "./tech-map-governed-state.types";
import type {
  TechMapCanonicalDraft,
  TechMapGovernedComposition,
  TechMapStatement,
} from "./tech-map-governed-artifact.types";
import {
  buildTechMapGovernedTrustSpecialization,
  type TechMapGovernedTrustSpecialization,
  type TechMapVariantComparisonReport,
} from "./tech-map-governed-trust.helpers";
import type { TechMapWorkflowOrchestrationTrace } from "./tech-map-workflow-orchestrator.types";
import type {
  TechMapAuthoritySourceCandidate,
  TechMapSlotFamily,
} from "./tech-map-conflict-authority.helpers";
import { selectTechMapAuthorityWinner } from "./tech-map-conflict-authority.helpers";
import type { TechMapCanonicalDraftSource } from "./tech-map-canonical-draft.helpers";
import { aggregateTechMapWorkflowVerdict } from "./tech-map-governed-verdict.helpers";
import type { TechMapWorkflowVerdictAggregationInput } from "./tech-map-governed-branch.types";

export interface TechMapRuntimeAuthorityResolution {
  slot_family: TechMapSlotFamily;
  candidates: TechMapAuthoritySourceCandidate[];
  winner: TechMapAuthoritySourceCandidate | null;
  conflict?: TechMapConflictRecord;
}

export interface TechMapRuntimeAdoptionSnapshot {
  workflow_id: string;
  canonical_draft: TechMapCanonicalDraft;
  branch_results: BranchResultContract[];
  branch_trust_assessments: BranchTrustAssessment[];
  source_authority_resolutions: TechMapRuntimeAuthorityResolution[];
  conflict_records: TechMapConflictRecord[];
  workflow_verdict: TechMapWorkflowVerdict;
  composition: TechMapGovernedComposition;
  workflow_orchestration?: TechMapWorkflowOrchestrationTrace | null;
  expert_review?: TechMapExpertReviewResult | null;
  trust_specialization?: TechMapGovernedTrustSpecialization | null;
  variant_comparison_report?: TechMapVariantComparisonReport | null;
}

function toEvidenceReference(
  claim: string,
  sourceType: EvidenceReference["sourceType"],
  sourceId: string,
  confidenceScore: number,
): EvidenceReference {
  return {
    claim,
    sourceType,
    sourceId,
    confidenceScore,
  };
}

function buildAuthorityCandidates(
  map: TechMapCanonicalDraftSource,
): Record<TechMapSlotFamily, TechMapAuthoritySourceCandidate[]> {
  return {
    identity_scope: [
      {
        source_ref: `harvest-plan:${map.harvestPlanId}`,
        authority_class: "APPROVED_INTERNAL_MASTER",
        verified_at: map.harvestPlan.updatedAt.toISOString(),
        scope_level: "company",
      },
      {
        source_ref: `crop-zone:${map.cropZoneId}`,
        authority_class: "PREVIOUS_TECH_MAP",
        verified_at: map.cropZone.updatedAt.toISOString(),
        scope_level: "farm",
      },
    ],
    agronomic_measurement: [
      {
        source_ref: `crop-zone:${map.cropZoneId}:target-yield`,
        authority_class: "VERIFIED_MEASUREMENT",
        verified_at: map.cropZone.updatedAt.toISOString(),
        scope_level: "field",
      },
      {
        source_ref: `season:${map.seasonId ?? map.cropZone.seasonId}:expected-yield`,
        authority_class: "PREVIOUS_TECH_MAP",
        verified_at: map.season?.updatedAt?.toISOString() ?? map.updatedAt.toISOString(),
        scope_level: "farm",
      },
      {
        source_ref: `generation:${map.id}:estimate`,
        authority_class: "MODEL_ESTIMATE",
        verified_at: map.updatedAt.toISOString(),
        scope_level: "company",
      },
    ],
    economic_basis: [
      {
        source_ref: `techmap:${map.id}:budget-cap`,
        authority_class: "APPROVED_INTERNAL_MASTER",
        verified_at: map.updatedAt.toISOString(),
        scope_level: "company",
      },
      {
        source_ref: `harvest-plan:${map.harvestPlanId}:baseline-value`,
        authority_class: "EXECUTION_FACT",
        verified_at: map.harvestPlan.updatedAt.toISOString(),
        scope_level: "company",
      },
    ],
    methodology_and_compliance: [
      {
        source_ref: `generation-metadata:${map.id}`,
        authority_class: "REGULATORY_OR_SIGNED",
        verified_at: map.updatedAt.toISOString(),
        scope_level: "company",
      },
      {
        source_ref: `performance-contract:${map.harvestPlanId}`,
        authority_class: "APPROVED_INTERNAL_MASTER",
        verified_at: map.harvestPlan.updatedAt.toISOString(),
        scope_level: "company",
      },
    ],
  };
}

function buildConflictRecord(
  slotFamily: TechMapSlotFamily,
  candidates: TechMapAuthoritySourceCandidate[],
  winner: TechMapAuthoritySourceCandidate | null,
): TechMapConflictRecord | undefined {
  if (candidates.length < 2) {
    return undefined;
  }

  const summary = winner
    ? `Для семейства ${slotFamily} выбран источник ${winner.source_ref}.`
    : `Для семейства ${slotFamily} не удалось выбрать победителя.`;

  return {
    conflict_id: `conflict:${slotFamily}`,
    category:
      slotFamily === "economic_basis"
        ? "budget_conflict"
        : slotFamily === "methodology_and_compliance"
          ? "policy_conflict"
          : "scope_conflict",
    source_refs: candidates.map((candidate) => candidate.source_ref),
    authority_winner_ref: winner?.source_ref,
    resolution_class: winner ? "AUTO_RESOLVED" : "REVIEW_REQUIRED",
    status: winner ? "RESOLVED" : "OPEN",
    summary,
    resolution_reason: winner
      ? `Победил более высокий класс authority ${winner.authority_class}.`
      : "Требуется ручная проверка authority resolution.",
  };
}

function buildBranchResult(
  workflowId: string,
  variantId: string,
  slotFamily: TechMapSlotFamily,
  candidates: TechMapAuthoritySourceCandidate[],
  winner: TechMapAuthoritySourceCandidate | null,
  conflict?: TechMapConflictRecord,
): BranchResultContract {
  const branchId = `techmap:${workflowId}:variant:${variantId}:branch:${slotFamily}`;
  const branchType =
    slotFamily === "identity_scope"
      ? "context_intake"
      : slotFamily === "agronomic_measurement"
        ? "agronomic"
        : slotFamily === "economic_basis"
          ? "finance"
          : "compliance_methodology";
  const verdict =
    !winner || candidates.length === 0
      ? "UNVERIFIED"
      : conflict
        ? "CONFLICTED"
        : candidates.length > 1
          ? "PARTIAL"
          : "VERIFIED";

  return {
    branch_id: branchId,
    source_agent: "techmap-runtime-adoption",
    domain: "tech-map",
    variant_id: variantId,
    branch_type: branchType,
    publication_critical: slotFamily !== "identity_scope",
    summary: winner
      ? `Победитель authority для ${slotFamily}: ${winner.source_ref}`
      : `Authority для ${slotFamily} не определён`,
    scope: {
      domain: "tech-map",
      company_id: undefined,
      entity_type: "techmap",
      entity_id: workflowId,
    },
    facts: {
      slot_family: slotFamily,
      branch_type: branchType,
      publication_critical:
        slotFamily === "agronomic_measurement" ||
        slotFamily === "economic_basis" ||
        slotFamily === "methodology_and_compliance",
      winner_ref: winner?.source_ref ?? null,
      candidate_count: candidates.length,
    },
    metrics: {
      authority_rank: winner ? 0 : null,
    },
    derived_from: candidates.map((candidate) => ({
      kind: "manual",
      source_id: candidate.source_ref,
      label: candidate.authority_class,
    })),
    evidence_refs: candidates.map((candidate) =>
      toEvidenceReference(
        `Authority source ${candidate.source_ref}`,
        "DB",
        candidate.source_ref,
        winner?.source_ref === candidate.source_ref ? 0.98 : 0.72,
      ),
    ),
    assumptions: winner ? [] : [`Authority for ${slotFamily} unresolved`],
    data_gaps: winner ? [] : [`No winner for ${slotFamily}`],
    freshness: {
      status: candidates.length > 0 ? "FRESH" : "UNKNOWN",
      checked_at: new Date().toISOString(),
      observed_at: candidates[0]?.verified_at ?? undefined,
    },
    confidence: winner ? 0.92 : 0.45,
  };
}

function buildBranchTrustAssessment(
  branch: BranchResultContract,
  conflict?: TechMapConflictRecord,
): BranchTrustAssessment {
  return {
    branch_id: branch.branch_id,
    source_agent: branch.source_agent,
    verdict:
      branch.data_gaps.length > 0
        ? "UNVERIFIED"
        : conflict
          ? "CONFLICTED"
          : branch.evidence_refs.length > 1
            ? "PARTIAL"
            : "VERIFIED",
    score: branch.confidence,
    reasons: branch.data_gaps.length > 0 ? branch.data_gaps : [branch.summary ?? ""].filter(Boolean),
    checks: [
      {
        name: "source_resolution",
        status: conflict ? "FAILED" : "PASSED",
        details: conflict?.summary,
      },
      {
        name: "cross_branch_consistency",
        status: conflict ? "FAILED" : "PASSED",
        details: conflict?.resolution_reason,
      },
      {
        name: "gap_disclosure",
        status: branch.data_gaps.length > 0 ? "FAILED" : "PASSED",
        details: branch.data_gaps.join("; "),
      },
    ],
    requires_cross_check: Boolean(conflict || branch.data_gaps.length > 0),
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildStatement(params: {
  statement_id: string;
  kind: TechMapStatement["kind"];
  label: string;
  value: unknown;
  verdict: TechMapWorkflowVerdict;
  branch_ids: string[];
  evidence_refs: string[];
  disclosure: string[];
  unit?: string;
}): TechMapStatement {
  return {
    statement_id: params.statement_id,
    kind: params.kind,
    label: params.label,
    value: params.value,
    unit: params.unit,
    branch_ids: params.branch_ids,
    verdict: params.verdict,
    evidence_refs: params.evidence_refs,
    disclosure: params.disclosure,
  };
}

interface RiskStatementSource {
  branch_id: string;
  summary: string;
  reasons: string[];
  evidence_refs: string[];
  verdict?: TechMapWorkflowVerdict;
}

function buildComposition(params: {
  workflowId: string;
  variantId: string;
  publicationState: TechMapCanonicalDraft["publication_state"];
  workflowVerdict: TechMapWorkflowVerdict;
  branchResults: BranchResultContract[];
  branchTrustAssessments: BranchTrustAssessment[];
  trustSpecialization?: TechMapGovernedTrustSpecialization | null;
}): TechMapGovernedComposition {
  const trustSpecialization =
    params.trustSpecialization ??
    buildTechMapGovernedTrustSpecialization({
      workflowId: params.workflowId,
      variantId: params.variantId,
      publicationState: params.publicationState,
      branchResults: params.branchResults,
      branchTrustAssessments: params.branchTrustAssessments,
      workflowVerdict: params.workflowVerdict,
    });
  const assessmentMap = new Map(
    params.branchTrustAssessments.map((assessment) => [
      assessment.branch_id,
      assessment,
    ]),
  );
  const selectedVariantBranchResults = params.branchResults.filter(
    (branch) => branch.variant_id === params.variantId,
  );
  const selectedVariantBranchIds = new Set(
    selectedVariantBranchResults.map((branch) => branch.branch_id),
  );
  const allowedBranchIds = new Set(trustSpecialization.allowed_branch_ids);
  const blockedBranchIds = new Set(trustSpecialization.blocked_branch_ids);
  const branchStatements = selectedVariantBranchResults
    .filter((branch) => allowedBranchIds.has(branch.branch_id))
    .map((branch) => {
      const assessment = assessmentMap.get(branch.branch_id);
      const verdict = assessment
        ? toWorkflowVerdict(assessment.verdict)
        : "UNVERIFIED";
      const disclosure = uniqueStrings([
        branch.summary ?? "",
        ...(assessment?.reasons ?? []),
        ...branch.data_gaps,
      ]);
      return buildStatement({
        statement_id: `branch:${branch.branch_id}`,
        kind: "fact",
        label: branch.summary ?? branch.branch_id,
        value: {
          branch_id: branch.branch_id,
          verdict: assessment?.verdict ?? "UNVERIFIED",
          confidence: assessment?.score ?? branch.confidence,
        },
        verdict,
        branch_ids: [branch.branch_id],
        evidence_refs: branch.evidence_refs.map((item) => item.sourceId),
        disclosure,
      });
    });
  const verifiedCount = params.branchTrustAssessments.filter(
    (assessment) =>
      selectedVariantBranchIds.has(assessment.branch_id) &&
      assessment.verdict === "VERIFIED",
  ).length;
  const partialCount = params.branchTrustAssessments.filter(
    (assessment) =>
      selectedVariantBranchIds.has(assessment.branch_id) &&
      assessment.verdict === "PARTIAL",
  ).length;
  const unresolvedAssessments = params.branchTrustAssessments.filter(
    (assessment) =>
      selectedVariantBranchIds.has(assessment.branch_id) &&
      (assessment.verdict === "UNVERIFIED" ||
        assessment.verdict === "CONFLICTED" ||
        assessment.verdict === "REJECTED"),
  );
  const blockedBranchRisks = params.branchResults
    .filter(
      (branch) =>
        branch.variant_id === params.variantId &&
        blockedBranchIds.has(branch.branch_id),
    )
    .map((branch) => ({
      branch_id: branch.branch_id,
      summary: branch.summary ?? branch.branch_id,
      reasons: branch.data_gaps,
      evidence_refs: branch.evidence_refs.map((item) => item.sourceId),
    }));
  const riskStatements: RiskStatementSource[] = [
    ...unresolvedAssessments.map((assessment) => ({
      branch_id: assessment.branch_id,
      summary: `Branch ${assessment.branch_id} requires review`,
      reasons: assessment.reasons,
      evidence_refs: assessment.checks.map((check) => check.name),
      verdict: toWorkflowVerdict(assessment.verdict),
    })),
    ...blockedBranchRisks,
  ];
  const compositionReady =
    trustSpecialization.composition_gate.can_compose &&
    branchStatements.length > 0;
  const branchIds = branchStatements.flatMap((statement) => statement.branch_ids);

  return {
    workflow_id: params.workflowId,
    variant_id: params.variantId,
    publication_state: compositionReady
      ? "PUBLISHABLE"
      : "REVIEW_REQUIRED",
    overall_verdict: params.workflowVerdict,
    facts: branchStatements,
    derived_metrics: [
      buildStatement({
        statement_id: "metric:branch_coverage",
        kind: "derived_metric",
        label: "Branch coverage",
        value: {
          branch_count: selectedVariantBranchResults.length,
          allowed_branch_count: branchStatements.length,
          blocked_branch_count: blockedBranchIds.size,
          verified_count: verifiedCount,
          partial_count: partialCount,
        },
        verdict: params.workflowVerdict,
        branch_ids: branchIds,
        evidence_refs: selectedVariantBranchResults.flatMap((branch) =>
          branch.evidence_refs.map((item) => item.sourceId),
        ),
        disclosure: uniqueStrings(
          params.branchTrustAssessments.flatMap((assessment) => assessment.reasons),
        ),
      }),
    ],
    assumptions: params.branchResults.flatMap((branch) =>
      branch.variant_id === params.variantId && allowedBranchIds.has(branch.branch_id)
        ? branch.assumptions.map((assumption, index) =>
            buildStatement({
              statement_id: `assumption:${branch.branch_id}:${index}`,
              kind: "assumption",
              label: assumption,
              value: assumption,
              verdict: params.workflowVerdict,
              branch_ids: [branch.branch_id],
              evidence_refs: branch.evidence_refs.map((item) => item.sourceId),
              disclosure: [assumption],
            }),
          )
        : [],
    ),
    recommendations: [
      buildStatement({
        statement_id: "recommendation:trust_gate",
        kind: "recommendation",
        label: compositionReady
          ? "Trust gate passed"
          : "Resolve trust gaps before publication",
        value: compositionReady
          ? "Composition may proceed"
          : "Composition remains gated by unresolved trust or clarify items",
        verdict: params.workflowVerdict,
        branch_ids: branchIds,
        evidence_refs: selectedVariantBranchResults
          .filter((branch) => allowedBranchIds.has(branch.branch_id))
          .flatMap((branch) => branch.evidence_refs.map((item) => item.sourceId)),
        disclosure: uniqueStrings([
          ...trustSpecialization.blocked_disclosure,
          ...params.branchTrustAssessments.flatMap((assessment) => assessment.reasons),
          compositionReady ? "trust_gate_passed" : "trust_gate_pending",
        ]),
      }),
    ],
    alternatives: trustSpecialization.variant_comparison_report.rows.length > 1
      ? trustSpecialization.variant_comparison_report.rows.map((row) =>
          buildStatement({
            statement_id: `alternative:${row.variant_id}`,
            kind: "alternative",
            label: row.selected
              ? `Выбранный вариант ${row.variant_id}`
              : `Альтернативный вариант ${row.variant_id}`,
            value: {
              variant_id: row.variant_id,
              selected: row.selected,
              verdict: row.verdict,
              branch_count: row.branch_count,
            },
            verdict: row.verdict,
            branch_ids: params.branchResults
              .filter((branch) => branch.variant_id === row.variant_id)
              .map((branch) => branch.branch_id),
            evidence_refs: params.branchResults
              .filter((branch) => branch.variant_id === row.variant_id)
              .flatMap((branch) => branch.evidence_refs.map((item) => item.sourceId)),
            disclosure: row.disclosure,
          }),
        )
      : [],
    risks: riskStatements.map((risk, index) =>
      buildStatement({
        statement_id: `risk:${"branch_id" in risk ? risk.branch_id : `trust:${index}`}`,
        kind: "risk",
        label: risk.summary,
        value: risk.reasons,
        verdict: risk.verdict ?? params.workflowVerdict,
        branch_ids: [risk.branch_id],
        evidence_refs: risk.evidence_refs,
        disclosure: uniqueStrings([
          ...(risk.reasons ?? []),
          risk.summary,
        ]),
      }),
    ),
    gaps: params.branchResults.flatMap((branch) =>
      branch.variant_id === params.variantId &&
      allowedBranchIds.has(branch.branch_id)
        ? branch.data_gaps.map((gap, index) =>
            buildStatement({
              statement_id: `gap:${branch.branch_id}:${index}`,
              kind: "gap",
              label: gap,
              value: gap,
              verdict: params.workflowVerdict,
              branch_ids: [branch.branch_id],
              evidence_refs: branch.evidence_refs.map((item) => item.sourceId),
              disclosure: [gap],
            }),
          )
        : [],
    ),
    next_actions: [
      buildStatement({
        statement_id: "next_action:composition",
        kind: "next_action",
        label: compositionReady
          ? "Publish governed composition"
          : "Keep composition blocked until trust gaps close",
        value: compositionReady
          ? "Ready to publish"
          : "Resolve branch verdicts and clarify gaps before publication",
        verdict: compositionReady ? "VERIFIED" : params.workflowVerdict,
        branch_ids: branchIds,
        evidence_refs: selectedVariantBranchResults
          .filter((branch) => allowedBranchIds.has(branch.branch_id))
          .flatMap((branch) => branch.evidence_refs.map((item) => item.sourceId)),
        disclosure: uniqueStrings([
          ...trustSpecialization.blocked_disclosure,
          ...params.branchTrustAssessments.flatMap((assessment) => assessment.reasons),
          compositionReady ? "publication_ready" : "publication_blocked",
        ]),
      }),
    ],
  };
}

function toWorkflowVerdict(verdict: BranchTrustAssessment["verdict"]): TechMapWorkflowVerdict {
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

export function buildTechMapRuntimeAdoptionSnapshot(
  map: TechMapCanonicalDraftSource,
  canonicalDraft: TechMapCanonicalDraft,
): TechMapRuntimeAdoptionSnapshot {
  const authorityCandidates = buildAuthorityCandidates(map);
  const resolutions = (
    Object.keys(authorityCandidates) as TechMapSlotFamily[]
  ).map((slotFamily) => {
    const candidates = authorityCandidates[slotFamily];
    const winner = selectTechMapAuthorityWinner(slotFamily, candidates);
    const conflict = buildConflictRecord(slotFamily, candidates, winner);
    return {
      slot_family: slotFamily,
      candidates,
      winner,
      conflict,
    };
  });

  const conflictRecords = resolutions.flatMap((resolution) =>
    resolution.conflict ? [resolution.conflict] : [],
  );
  const branchResults = resolutions.map((resolution) =>
    buildBranchResult(
      canonicalDraft.header.workflow_id,
      canonicalDraft.selected_variant_id ?? canonicalDraft.header.version_id ?? canonicalDraft.header.workflow_id,
      resolution.slot_family,
      resolution.candidates,
      resolution.winner,
      resolution.conflict,
    ),
  );
  const branchTrustAssessments = branchResults.map((branch, index) =>
    buildBranchTrustAssessment(branch, conflictRecords[index]),
  );

  const workflowVerdict = aggregateTechMapWorkflowVerdict({
    requested_artifact: "workflow_draft",
    selected_variant_verdict: canonicalDraft.workflow_verdict,
    publication_critical_branch_verdicts: branchTrustAssessments
      .filter((assessment, index) => resolutions[index]?.slot_family !== "identity_scope")
      .map((assessment) => toWorkflowVerdict(assessment.verdict)),
    advisory_branch_verdicts: branchTrustAssessments
      .filter((assessment, index) => resolutions[index]?.slot_family === "identity_scope")
      .map((assessment) => toWorkflowVerdict(assessment.verdict)),
    expert_review_verdict: canonicalDraft.review_status === "REVIEW_REJECTED"
      ? "BLOCK"
      : canonicalDraft.review_status === "REVISION_REQUIRED"
        ? "REVISE"
        : "SKIPPED",
    unresolved_blocking_gaps: canonicalDraft.gaps.filter(
      (gap) => gap.severity === "blocking",
    ).length,
    unresolved_hard_blocks: conflictRecords.filter(
      (record) => record.resolution_class === "HARD_BLOCK",
    ).length,
  } satisfies TechMapWorkflowVerdictAggregationInput);
  const trustSpecialization = buildTechMapGovernedTrustSpecialization({
    workflowId: canonicalDraft.header.workflow_id,
    variantId:
      canonicalDraft.selected_variant_id ??
      canonicalDraft.header.version_id ??
      canonicalDraft.header.workflow_id,
    publicationState: canonicalDraft.publication_state,
    branchResults,
    branchTrustAssessments,
    workflowVerdict,
  });
  const expertReview = buildTechMapExpertReviewResult({
    workflow_id: canonicalDraft.header.workflow_id,
    variant_id:
      canonicalDraft.selected_variant_id ??
      canonicalDraft.header.version_id ??
      canonicalDraft.header.workflow_id,
    workflow_verdict: workflowVerdict,
    publication_critical_assessments: branchTrustAssessments.filter(
      (_, index) => resolutions[index]?.slot_family !== "identity_scope",
    ),
    advisory_assessments: branchTrustAssessments.filter(
      (_, index) => resolutions[index]?.slot_family === "identity_scope",
    ),
    unresolved_blocking_gaps: canonicalDraft.gaps.filter(
      (gap) => gap.severity === "blocking",
    ).length,
    unresolved_hard_blocks: conflictRecords.filter(
      (record) => record.resolution_class === "HARD_BLOCK",
    ).length,
  });

  return {
    workflow_id: canonicalDraft.header.workflow_id,
    canonical_draft: canonicalDraft,
    branch_results: branchResults,
    branch_trust_assessments: branchTrustAssessments,
    source_authority_resolutions: resolutions,
    conflict_records: conflictRecords,
    workflow_verdict: workflowVerdict,
    composition: buildComposition({
      workflowId: canonicalDraft.header.workflow_id,
      variantId:
        canonicalDraft.selected_variant_id ??
        canonicalDraft.header.version_id ??
        canonicalDraft.header.workflow_id,
      publicationState: canonicalDraft.publication_state,
      workflowVerdict,
      branchResults,
      branchTrustAssessments,
      trustSpecialization,
    }),
    expert_review: expertReview,
    trust_specialization: trustSpecialization,
    variant_comparison_report: trustSpecialization.variant_comparison_report,
  };
}
