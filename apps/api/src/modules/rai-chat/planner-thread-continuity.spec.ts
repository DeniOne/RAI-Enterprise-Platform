import { BranchStatePlaneService } from "./branch-state-plane.service";
import {
  advanceRunnableRootsToRunning,
  finalizeSurfaceFromExecution,
  promoteSurfaceToPlanned,
  buildPlanBoundSurface,
} from "../../shared/rai-chat/execution-surface-runtime";
import type { ExecutionPlan } from "../../shared/rai-chat/execution-target-state.types";

describe("planner thread continuity (in-memory)", () => {
  const planAb: ExecutionPlan = {
    version: "v1",
    planId: "p_ab",
    strategy: "sequential",
    sourceGraphId: "g_same",
    branches: [
      {
        branchId: "a",
        order: 0,
        dependsOn: [],
        ownerRole: "x",
        toolName: null,
        intent: "i1",
      },
      {
        branchId: "b",
        order: 1,
        dependsOn: ["a"],
        ownerRole: "x",
        toolName: null,
        intent: "i2",
      },
    ],
  };

  it("recordThreadPlannerSlice / getThreadPlannerSlice round-trip", async () => {
    const plane = new BranchStatePlaneService();
    const surface = promoteSurfaceToPlanned(
      buildPlanBoundSurface(planAb, "NOT_REQUIRED"),
    );
    await plane.recordThreadPlannerSlice("co", "th", {
      version: "v1",
      sourceGraphId: "g_same",
      executionPlan: planAb,
      executionSurface: surface,
    });
    const got = await plane.getThreadPlannerSlice("co", "th");
    expect(got?.executionSurface.branches).toHaveLength(2);
  });

  it("после первого «тика» b остаётся PLANNED; carry-forward + advance даёт b RUNNING", async () => {
    let s = promoteSurfaceToPlanned(
      buildPlanBoundSurface(planAb, "NOT_REQUIRED"),
    );
    s = advanceRunnableRootsToRunning(s, planAb);
    s = finalizeSurfaceFromExecution(s, [], "COMPLETED");
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("a")?.lifecycle).toBe("COMPLETED");
    expect(byId.get("b")?.lifecycle).toBe("PLANNED");

    const plane = new BranchStatePlaneService();
    await plane.recordThreadPlannerSlice("c", "t", {
      version: "v1",
      sourceGraphId: "g_same",
      executionPlan: planAb,
      executionSurface: s,
    });
    const prev = (await plane.getThreadPlannerSlice("c", "t"))!;
    const s2 = advanceRunnableRootsToRunning(
      JSON.parse(JSON.stringify(prev.executionSurface)) as typeof s,
      prev.executionPlan,
    );
    const by2 = new Map(s2.branches.map((r) => [r.branchId, r]));
    expect(by2.get("b")?.lifecycle).toBe("RUNNING");
  });
});
