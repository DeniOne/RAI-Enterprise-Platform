import { BranchStatePlaneService } from "./branch-state-plane.service";

/**
 * Срез replay/resume: снимок branch-state по traceId для последующего UI.
 * Обход WRITE в replayMode — в rai-tools.registry.spec.ts (vetkai execute).
 */
describe("replay-resume integration (срез)", () => {
  it("сохраняет BLOCKED_ON_CONFIRMATION + PENDING для того же traceId", () => {
    const plane = new BranchStatePlaneService();
    plane.recordSnapshot("trace-resume-1", {
      version: "v1",
      branches: [
        {
          branchId: "primary",
          lifecycle: "BLOCKED_ON_CONFIRMATION",
          mutationState: "PENDING",
        },
      ],
    });
    expect(plane.getSnapshot("trace-resume-1")?.branches[0].lifecycle).toBe(
      "BLOCKED_ON_CONFIRMATION",
    );
  });
});
