import { buildTechMapExpertReviewResult } from "./tech-map-governed-expert-review.helpers";

describe("tech-map-governed-expert-review.helpers", () => {
  const baseCriticalAssessment = {
    branch_id: "branch:critical",
    source_agent: "techmap-runtime-adoption",
    verdict: "VERIFIED" as const,
    score: 0.92,
    reasons: ["ok"],
    checks: [],
    requires_cross_check: false,
  };

  const baseAdvisoryAssessment = {
    branch_id: "branch:advisory",
    source_agent: "techmap-runtime-adoption",
    verdict: "VERIFIED" as const,
    score: 0.88,
    reasons: ["ok"],
    checks: [],
    requires_cross_check: false,
  };

  it("возвращает BLOCK при конфликте в publication-critical ветке", () => {
    const packet = buildTechMapExpertReviewResult({
      workflow_id: "techmap:1:v1",
      variant_id: "techmap:1:v1",
      workflow_verdict: "BLOCKED",
      publication_critical_assessments: [
        { ...baseCriticalAssessment, verdict: "CONFLICTED", reasons: ["policy conflict"] },
      ],
      advisory_assessments: [baseAdvisoryAssessment],
      unresolved_blocking_gaps: 0,
      unresolved_hard_blocks: 1,
    });

    expect(packet?.verdict).toBe("BLOCK");
    expect(packet?.trigger).toBe("dispute_trigger");
    expect(packet?.can_proceed_to_human_review).toBe(false);
    expect(packet?.findings).toHaveLength(2);
  });

  it("возвращает REVISE при partial publication-critical ветке", () => {
    const packet = buildTechMapExpertReviewResult({
      workflow_id: "techmap:1:v1",
      variant_id: "techmap:1:v1",
      workflow_verdict: "PARTIAL",
      publication_critical_assessments: [
        { ...baseCriticalAssessment, verdict: "PARTIAL", reasons: ["needs revision"] },
      ],
      advisory_assessments: [baseAdvisoryAssessment],
      unresolved_blocking_gaps: 1,
      unresolved_hard_blocks: 0,
    });

    expect(packet?.verdict).toBe("REVISE");
    expect(packet?.trigger).toBe("trust_trigger");
    expect(packet?.required_revisions.length).toBeGreaterThan(0);
    expect(packet?.can_proceed_to_human_review).toBe(true);
  });

  it("возвращает APPROVE_WITH_NOTES при advisory uncertainty без critical gaps", () => {
    const packet = buildTechMapExpertReviewResult({
      workflow_id: "techmap:1:v1",
      variant_id: "techmap:1:v1",
      workflow_verdict: "VERIFIED",
      publication_critical_assessments: [baseCriticalAssessment],
      advisory_assessments: [
        { ...baseAdvisoryAssessment, verdict: "PARTIAL", reasons: ["advisory note"] },
      ],
      unresolved_blocking_gaps: 0,
      unresolved_hard_blocks: 0,
    });

    expect(packet?.verdict).toBe("APPROVE_WITH_NOTES");
    expect(packet?.trigger).toBe("novelty_trigger");
    expect(packet?.findings.some((finding) => finding.severity === "note")).toBe(true);
    expect(packet?.can_proceed_to_human_review).toBe(true);
    expect(packet?.publication_packet_ref).toContain("publication-packet");
    expect(packet?.human_authority_chain[0]?.role).toBe("chief_agronomist");
    expect(packet?.human_authority_chain[1]?.role).toBe("human_agronomist");
    expect(packet?.audit_refs.length).toBeGreaterThan(0);
  });

  it("возвращает null, если review не нужен", () => {
    expect(
      buildTechMapExpertReviewResult({
        workflow_id: "techmap:1:v1",
        variant_id: "techmap:1:v1",
        workflow_verdict: "VERIFIED",
        publication_critical_assessments: [baseCriticalAssessment],
        advisory_assessments: [baseAdvisoryAssessment],
        unresolved_blocking_gaps: 0,
        unresolved_hard_blocks: 0,
      }),
    ).toBeNull();
  });
});
