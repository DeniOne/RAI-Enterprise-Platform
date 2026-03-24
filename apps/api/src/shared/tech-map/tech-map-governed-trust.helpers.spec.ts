import {
  buildTechMapGovernedTrustSpecialization,
} from "./tech-map-governed-trust.helpers";

describe("tech-map-governed-trust.helpers", () => {
  it("строит trust specialization и variant comparison report поверх tech-map branches", () => {
    const specialization = buildTechMapGovernedTrustSpecialization({
      workflowId: "workflow-1",
      variantId: "variant-a",
      publicationState: "REVIEW_REQUIRED",
      workflowVerdict: "PARTIAL",
      branchResults: [
        {
          branch_id: "branch-a",
          source_agent: "agronomist",
          domain: "tech-map",
          variant_id: "variant-a",
          branch_type: "agronomic",
          publication_critical: true,
          summary: "Agronomic branch",
          scope: { domain: "tech-map" },
          facts: {},
          derived_from: [],
          evidence_refs: [
            {
              claim: "agronomic evidence",
              sourceType: "DB",
              sourceId: "source-a",
              confidenceScore: 0.9,
            },
          ],
          assumptions: [],
          data_gaps: [],
          freshness: { status: "FRESH" },
          confidence: 0.93,
        } as any,
        {
          branch_id: "branch-b",
          source_agent: "economist",
          domain: "tech-map",
          variant_id: "variant-b",
          branch_type: "finance",
          publication_critical: true,
          summary: "Finance branch",
          scope: { domain: "tech-map" },
          facts: {},
          derived_from: [],
          evidence_refs: [
            {
              claim: "finance evidence",
              sourceType: "DB",
              sourceId: "source-b",
              confidenceScore: 0.9,
            },
          ],
          assumptions: [],
          data_gaps: [],
          freshness: { status: "FRESH" },
          confidence: 0.91,
        } as any,
      ],
      branchTrustAssessments: [
        {
          branch_id: "branch-a",
          source_agent: "agronomist",
          verdict: "VERIFIED",
          score: 0.93,
          reasons: ["confirmed"],
          checks: [],
          requires_cross_check: false,
        },
        {
          branch_id: "branch-b",
          source_agent: "economist",
          verdict: "VERIFIED",
          score: 0.91,
          reasons: ["confirmed"],
          checks: [],
          requires_cross_check: false,
        },
      ],
    });

    expect(specialization.allowed_branch_ids).toEqual([
      "branch-a",
      "branch-b",
    ]);
    expect(specialization.blocked_branch_ids).toHaveLength(0);
    expect(specialization.composition_gate.can_compose).toBe(true);
    expect(specialization.variant_comparison_report.comparison_available).toBe(
      true,
    );
    expect(specialization.variant_comparison_report.rows).toHaveLength(2);
    expect(specialization.variant_comparison_report.rows[0]?.selected).toBe(
      true,
    );
  });
});
