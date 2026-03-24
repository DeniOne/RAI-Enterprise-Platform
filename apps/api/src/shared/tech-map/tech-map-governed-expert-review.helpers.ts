import type { BranchTrustAssessment } from "../rai-chat/branch-trust.types";
import type {
  TechMapExpertReviewAuthorityStep,
  TechMapExpertReviewFinding,
  TechMapExpertReviewResult,
  TechMapExpertReviewTrigger,
  TechMapExpertReviewVerdict,
} from "./tech-map-governed-branch.types";
import type { TechMapWorkflowVerdict } from "./tech-map-governed-state.types";

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function buildFinding(params: {
  branchId?: string;
  area: TechMapExpertReviewFinding["area"];
  severity: TechMapExpertReviewFinding["severity"];
  summary: string;
  recommendedAction: string;
}): TechMapExpertReviewFinding {
  return {
    finding_id: `finding:${params.branchId ?? params.area}:${Buffer.from(
      `${params.summary}:${params.recommendedAction}`,
    ).toString("base64url")}`,
    severity: params.severity,
    area: params.area,
    summary: params.summary,
    recommended_action: params.recommendedAction,
    ...(params.branchId ? { statement_ref: `branch:${params.branchId}` } : {}),
  };
}

function resolveTrigger(
  criticalAssessments: BranchTrustAssessment[],
  advisoryAssessments: BranchTrustAssessment[],
  unresolvedBlockingGaps: number,
  unresolvedHardBlocks: number,
  requestedHumanReview: boolean,
): TechMapExpertReviewTrigger {
  if (requestedHumanReview) {
    return "human_requested";
  }

  if (unresolvedHardBlocks > 0 || criticalAssessments.some((assessment) => assessment.verdict === "CONFLICTED" || assessment.verdict === "REJECTED")) {
    return "dispute_trigger";
  }

  if (
    unresolvedBlockingGaps > 0 ||
    criticalAssessments.some((assessment) => assessment.verdict === "PARTIAL" || assessment.verdict === "UNVERIFIED")
  ) {
    return "trust_trigger";
  }

  if (
    advisoryAssessments.some((assessment) => assessment.verdict === "PARTIAL" || assessment.verdict === "UNVERIFIED")
  ) {
    return "novelty_trigger";
  }

  return "assumption_trigger";
}

function resolveChiefAgronomistStatus(
  verdict: TechMapExpertReviewVerdict,
): TechMapExpertReviewAuthorityStep["status"] {
  switch (verdict) {
    case "APPROVE_WITH_NOTES":
      return "approved";
    case "REVISE":
      return "needs_revision";
    case "BLOCK":
      return "blocked";
    default:
      return "pending";
  }
}

export function buildTechMapExpertReviewResult(params: {
  workflow_id: string;
  variant_id: string;
  workflow_verdict: TechMapWorkflowVerdict;
  publication_critical_assessments: BranchTrustAssessment[];
  advisory_assessments: BranchTrustAssessment[];
  unresolved_blocking_gaps: number;
  unresolved_hard_blocks: number;
  requested_human_review?: boolean;
}): TechMapExpertReviewResult | null {
  const criticalAssessments = params.publication_critical_assessments;
  const advisoryAssessments = params.advisory_assessments;
  const hasHardBlock =
    params.unresolved_hard_blocks > 0 ||
    criticalAssessments.some(
      (assessment) => assessment.verdict === "CONFLICTED" || assessment.verdict === "REJECTED",
    );
  const hasCriticalReviewGap = criticalAssessments.some(
    (assessment) => assessment.verdict === "PARTIAL" || assessment.verdict === "UNVERIFIED",
  );
  const hasAdvisoryNote = advisoryAssessments.some(
    (assessment) => assessment.verdict === "PARTIAL" || assessment.verdict === "UNVERIFIED",
  );

  if (
    !params.requested_human_review &&
    !hasHardBlock &&
    !hasCriticalReviewGap &&
    !hasAdvisoryNote &&
    params.unresolved_blocking_gaps === 0
  ) {
    return null;
  }

  const trigger = resolveTrigger(
    criticalAssessments,
    advisoryAssessments,
    params.unresolved_blocking_gaps,
    params.unresolved_hard_blocks,
    Boolean(params.requested_human_review),
  );

  const findings = [
    ...criticalAssessments.flatMap((assessment) =>
      assessment.verdict === "VERIFIED"
        ? []
        : [
            buildFinding({
              branchId: assessment.branch_id,
              area:
                assessment.reasons.some((reason) => /budget|cost|roi|ebitda/i.test(reason))
                  ? "feasibility"
                  : assessment.reasons.some((reason) => /policy|compliance|method/i.test(reason))
                    ? "compliance"
                    : "agronomy",
              severity:
                assessment.verdict === "CONFLICTED" || assessment.verdict === "REJECTED"
                  ? "blocking"
                  : "warning",
              summary: `Publication-critical branch ${assessment.branch_id} requires expert review because verdict is ${assessment.verdict}.`,
              recommendedAction:
                assessment.verdict === "CONFLICTED" || assessment.verdict === "REJECTED"
                  ? "Block publication until human review resolves the conflict."
                  : "Revise the draft before human approval.",
            }),
          ],
    ),
    ...(params.unresolved_blocking_gaps > 0
      ? [
          buildFinding({
            area: "assumptions",
            severity: "blocking",
            summary: `Draft still has ${params.unresolved_blocking_gaps} blocking gap(s).`,
            recommendedAction: "Resolve blocking gaps before publication.",
          }),
        ]
      : []),
    ...(params.unresolved_hard_blocks > 0
      ? [
          buildFinding({
            area: "risk",
            severity: "blocking",
            summary: `Draft has ${params.unresolved_hard_blocks} hard block(s) in authority resolution.`,
            recommendedAction: "Resolve hard blocks before sending to human approval.",
          }),
        ]
      : []),
    ...(hasAdvisoryNote && !hasCriticalReviewGap && !hasHardBlock
      ? [
          buildFinding({
            area: "risk",
            severity: "note",
            summary: "Advisory branches contain non-blocking uncertainty, so expert review should annotate the publication path.",
            recommendedAction: "Keep human approval, but publish with annotated notes.",
          }),
        ]
      : []),
  ];

  const verdict: TechMapExpertReviewVerdict = hasHardBlock
    ? "BLOCK"
    : hasCriticalReviewGap || params.unresolved_blocking_gaps > 0
      ? "REVISE"
      : "APPROVE_WITH_NOTES";
  const publicationPacketRef = `techmap:${params.workflow_id}:publication-packet:${params.variant_id}`;
  const auditRefs = uniqueStrings([
    `expert-review:${params.workflow_id}:${params.variant_id}`,
    publicationPacketRef,
    ...findings.map((finding) => `finding:${finding.finding_id}`),
    ...findings.flatMap((finding) => (finding.statement_ref ? [finding.statement_ref] : [])),
    ...params.publication_critical_assessments.flatMap((assessment) => [
      ...assessment.reasons,
      ...assessment.checks.flatMap((check) => (check.details ? [check.details] : [])),
    ]),
    ...params.advisory_assessments.flatMap((assessment) => [
      ...assessment.reasons,
      ...assessment.checks.flatMap((check) => (check.details ? [check.details] : [])),
    ]),
  ]);
  const humanAuthorityChain: TechMapExpertReviewAuthorityStep[] = [
    {
      role: "chief_agronomist",
      required: true,
      status: resolveChiefAgronomistStatus(verdict),
      reason:
        verdict === "BLOCK"
          ? "Chief agronomist blocked publication until hard blocks are resolved."
          : verdict === "REVISE"
            ? "Chief agronomist requested revisions before human agronomy approval."
            : "Chief agronomist approved the draft with notes before human agronomy approval.",
    },
    {
      role: "human_agronomist",
      required: true,
      status: "pending",
      reason: "Human agronomy review remains mandatory before publication.",
    },
  ];

  return {
    workflow_id: params.workflow_id,
    variant_id: params.variant_id,
    reviewer_role: "chief_agronomist",
    trigger,
    verdict,
    summary:
      verdict === "BLOCK"
        ? "Expert review blocked publication because publication-critical branches still contain hard blocks."
        : verdict === "REVISE"
          ? "Expert review requests revisions before human approval."
          : "Expert review approves the draft with notes for human approval.",
    findings,
    challenged_assumption_ids: uniqueStrings(
      findings.flatMap((finding) => (finding.statement_ref ? [finding.statement_ref] : [])),
    ),
    required_revisions:
      verdict === "APPROVE_WITH_NOTES"
        ? []
        : findings.map((finding) => finding.recommended_action),
    alternative_requests:
      verdict === "APPROVE_WITH_NOTES"
        ? ["Annotate publication notes during human approval."]
        : [
            "Re-run publication-critical branches with fresher evidence.",
            "Request human agronomy review after revisions.",
          ],
    evidence_refs: uniqueStrings(
      criticalAssessments.flatMap((assessment) => [
        ...assessment.reasons,
        ...assessment.checks.flatMap((check) => (check.details ? [check.details] : [])),
      ]),
    ),
    audit_refs: auditRefs,
    publication_packet_ref: publicationPacketRef,
    human_authority_chain: humanAuthorityChain,
    confidence:
      verdict === "BLOCK"
        ? 0.35
        : verdict === "REVISE"
          ? 0.62
          : 0.84,
    can_proceed_to_human_review: verdict !== "BLOCK",
  };
}
