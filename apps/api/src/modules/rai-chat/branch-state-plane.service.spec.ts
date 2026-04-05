import { BranchStatePlaneService } from "./branch-state-plane.service";

describe("BranchStatePlaneService", () => {
  it("round-trip snapshot сохраняет lifecycle и branchId", () => {
    const svc = new BranchStatePlaneService();
    const surface = {
      version: "v1" as const,
      branches: [
        {
          branchId: "a",
          lifecycle: "PLANNED" as const,
          mutationState: "PENDING" as const,
        },
      ],
    };
    svc.recordSnapshot("tr-1", surface);
    const got = svc.getSnapshot("tr-1");
    expect(got?.branches[0].branchId).toBe("a");
    expect(got?.branches[0].lifecycle).toBe("PLANNED");
    expect(got?.branches[0].mutationState).toBe("PENDING");
  });
});
