import { aggregateTechMapWorkflowVerdict } from "./tech-map-governed-verdict.helpers";

describe("tech-map-governed-verdict.helpers", () => {
  const baseInput = {
    requested_artifact: "workflow_draft" as const,
    selected_variant_verdict: "VERIFIED" as const,
    publication_critical_branch_verdicts: ["VERIFIED"] as const,
    advisory_branch_verdicts: [] as const,
    expert_review_verdict: "SKIPPED" as const,
    unresolved_blocking_gaps: 0,
    unresolved_hard_blocks: 0,
  };

  it("блокирует workflow при BLOCKED publication-critical branch", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        publication_critical_branch_verdicts: ["VERIFIED", "BLOCKED"],
      }),
    ).toBe("BLOCKED");
  });

  it("не понижает workflow verdict только из-за advisory PARTIAL branches", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        advisory_branch_verdicts: ["PARTIAL"],
      }),
    ).toBe("VERIFIED");
  });

  it("понижает workflow verdict до UNVERIFIED при UNVERIFIED selected variant", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        selected_variant_verdict: "UNVERIFIED",
      }),
    ).toBe("UNVERIFIED");
  });

  it("понижает workflow verdict до PARTIAL при expert review REVISE", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        expert_review_verdict: "REVISE",
      }),
    ).toBe("PARTIAL");
  });

  it("использует primary artifact verdict для comparison report", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        requested_artifact: "comparison_report",
        primary_artifact_branch_verdict: "PARTIAL",
      }),
    ).toBe("PARTIAL");
  });

  it("игнорирует comparison branch для workflow_draft", () => {
    expect(
      aggregateTechMapWorkflowVerdict({
        ...baseInput,
        primary_artifact_branch_verdict: "PARTIAL",
      }),
    ).toBe("VERIFIED");
  });
});
