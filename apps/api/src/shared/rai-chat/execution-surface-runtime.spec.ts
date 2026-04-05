import type {
  ExecutionPlan,
  ExecutionSurfaceState,
} from "./execution-target-state.types";
import {
  advanceRunnableRootsToRunning,
  applyPlannerMutationApprovalToSurface,
  buildPlanBoundSurface,
  finalizeSurfaceFromExecution,
  isPlannerSliceFullyTerminal,
  promoteSurfaceToPlanned,
} from "./execution-surface-runtime";
import { RaiToolName } from "./rai-tools.types";

function planLinear(ab: boolean): ExecutionPlan {
  if (!ab) {
    return {
      version: "v1",
      planId: "p1",
      strategy: "sequential",
      sourceGraphId: "g",
      branches: [
        {
          branchId: "primary",
          order: 0,
          dependsOn: [],
          ownerRole: "x",
          toolName: null,
          intent: "i",
        },
      ],
    };
  }
  return {
    version: "v1",
    planId: "p2",
    strategy: "sequential",
    sourceGraphId: "g",
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
}

describe("execution-surface-runtime", () => {
  it("CREATED → promoteSurfaceToPlanned → PLANNED", () => {
    const p = planLinear(false);
    const s0 = buildPlanBoundSurface(p, "NOT_REQUIRED");
    expect(s0.branches[0].lifecycle).toBe("CREATED");
    const s1 = promoteSurfaceToPlanned(s0);
    expect(s1.branches[0].lifecycle).toBe("PLANNED");
  });

  it("advanceRunnableRootsToRunning: только корни без зависимостей", () => {
    const p = planLinear(true);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("a")?.lifecycle).toBe("RUNNING");
    expect(byId.get("b")?.lifecycle).toBe("PLANNED");
  });

  it("advanceRunnableRootsToRunning: FAILED у зависимости не открывает downstream", () => {
    const p = planLinear(true);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(s, [], "FAILED", p);
    const byIdAfterFail = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byIdAfterFail.get("a")?.lifecycle).toBe("FAILED");
    expect(byIdAfterFail.get("b")?.lifecycle).toBe("CANCELLED");
    s = advanceRunnableRootsToRunning(s, p);
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("b")?.lifecycle).toBe("CANCELLED");
  });

  it("finalizeSurfaceFromExecution: FAILED отменяет транзитивный PLANNED-хвост по плану", () => {
    const p: ExecutionPlan = {
      version: "v1",
      planId: "p-chain",
      strategy: "sequential",
      sourceGraphId: "g",
      branches: [
        {
          branchId: "a",
          order: 0,
          dependsOn: [],
          ownerRole: "x",
          toolName: null,
          intent: null,
        },
        {
          branchId: "b",
          order: 1,
          dependsOn: ["a"],
          ownerRole: "x",
          toolName: null,
          intent: null,
        },
        {
          branchId: "c",
          order: 2,
          dependsOn: ["b"],
          ownerRole: "x",
          toolName: null,
          intent: null,
        },
      ],
    };
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(s, [], "FAILED", p);
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("a")?.lifecycle).toBe("FAILED");
    expect(byId.get("b")?.lifecycle).toBe("CANCELLED");
    expect(byId.get("c")?.lifecycle).toBe("CANCELLED");
  });

  it("advanceRunnableRootsToRunning: maxConcurrentRunning откладывает лишние корни", () => {
    const p: ExecutionPlan = {
      version: "v1",
      planId: "p-par3",
      strategy: "parallel",
      sourceGraphId: "g",
      branches: [
        { branchId: "r0", order: 0, dependsOn: [], ownerRole: "x", toolName: null, intent: null },
        { branchId: "r1", order: 1, dependsOn: [], ownerRole: "x", toolName: null, intent: null },
        { branchId: "r2", order: 2, dependsOn: [], ownerRole: "x", toolName: null, intent: null },
      ],
    };
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p, { maxConcurrentRunning: 2 });
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("r0")?.lifecycle).toBe("RUNNING");
    expect(byId.get("r1")?.lifecycle).toBe("RUNNING");
    expect(byId.get("r2")?.lifecycle).toBe("PLANNED");
    expect(s.plannerAdvanceMeta).toEqual({
      concurrencyCap: 2,
      deferredRunnableBranchIds: ["r2"],
    });
  });

  it("advanceRunnableRootsToRunning: при заполненном лимите не поднимает следующий корень", () => {
    const p: ExecutionPlan = {
      version: "v1",
      planId: "p-par2",
      strategy: "parallel",
      sourceGraphId: "g",
      branches: [
        { branchId: "r0", order: 0, dependsOn: [], ownerRole: "x", toolName: null, intent: null },
        { branchId: "r1", order: 1, dependsOn: [], ownerRole: "x", toolName: null, intent: null },
      ],
    };
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p, { maxConcurrentRunning: 1 });
    expect(s.branches.find((b) => b.branchId === "r0")?.lifecycle).toBe("RUNNING");
    expect(s.branches.find((b) => b.branchId === "r1")?.lifecycle).toBe("PLANNED");
    s = advanceRunnableRootsToRunning(s, p, { maxConcurrentRunning: 1 });
    expect(s.branches.find((b) => b.branchId === "r1")?.lifecycle).toBe("PLANNED");
    expect(s.plannerAdvanceMeta?.deferredRunnableBranchIds).toEqual(["r1"]);
  });

  it("finalizeSurfaceFromExecution сохраняет plannerAdvanceMeta", () => {
    const p: ExecutionPlan = {
      version: "v1",
      planId: "p-meta",
      strategy: "parallel",
      sourceGraphId: "g",
      branches: [
        { branchId: "x", order: 0, dependsOn: [], ownerRole: "a", toolName: null, intent: null },
      ],
    };
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p, { maxConcurrentRunning: 1 });
    expect(s.plannerAdvanceMeta).toBeDefined();
    s = finalizeSurfaceFromExecution(s, [], "COMPLETED", p);
    expect(s.plannerAdvanceMeta).toEqual({
      concurrencyCap: 1,
      deferredRunnableBranchIds: [],
    });
  });

  it("finalizeSurfaceFromExecution: успех → COMPLETED", () => {
    const p = planLinear(false);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(s, [], "COMPLETED");
    expect(s.branches[0].lifecycle).toBe("COMPLETED");
  });

  it("finalizeSurfaceFromExecution: riskPolicyBlocked → BLOCKED_ON_CONFIRMATION + PENDING + pendingActionId", () => {
    const p = planLinear(false);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(
      s,
      [
        {
          name: RaiToolName.GenerateTechMapDraft,
          result: { riskPolicyBlocked: true, actionId: "pa-42" },
        },
      ],
      "COMPLETED",
    );
    expect(s.branches[0].lifecycle).toBe("BLOCKED_ON_CONFIRMATION");
    expect(s.branches[0].mutationState).toBe("PENDING");
    expect(s.branches[0].pendingActionId).toBe("pa-42");
  });

  it("finalizeSurfaceFromExecution: с планом — блокирует только ветку с заблокированным toolName", () => {
    const p: ExecutionPlan = {
      version: "v1",
      planId: "p-par",
      strategy: "parallel",
      sourceGraphId: "g",
      branches: [
        {
          branchId: "a",
          order: 0,
          dependsOn: [],
          ownerRole: "x",
          toolName: RaiToolName.GenerateTechMapDraft,
          intent: null,
        },
        {
          branchId: "b",
          order: 1,
          dependsOn: [],
          ownerRole: "x",
          toolName: RaiToolName.EchoMessage,
          intent: null,
        },
      ],
    };
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(
      s,
      [
        {
          name: RaiToolName.GenerateTechMapDraft,
          result: { riskPolicyBlocked: true, actionId: "pa-99" },
        },
        { name: RaiToolName.EchoMessage, result: { ok: true } },
      ],
      "COMPLETED",
      p,
    );
    const byId = new Map(s.branches.map((r) => [r.branchId, r]));
    expect(byId.get("a")?.lifecycle).toBe("BLOCKED_ON_CONFIRMATION");
    expect(byId.get("a")?.pendingActionId).toBe("pa-99");
    expect(byId.get("b")?.lifecycle).toBe("COMPLETED");
  });

  it("finalizeSurfaceFromExecution: NEEDS_MORE_DATA оставляет RUNNING", () => {
    const p = planLinear(false);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(s, [], "NEEDS_MORE_DATA");
    expect(s.branches[0].lifecycle).toBe("RUNNING");
  });

  it("isPlannerSliceFullyTerminal: false пока ветка в RUNNING", () => {
    const p = planLinear(false);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    expect(isPlannerSliceFullyTerminal(s)).toBe(false);
  });

  it("isPlannerSliceFullyTerminal: true когда единственная ветка COMPLETED", () => {
    const p = planLinear(false);
    let s = promoteSurfaceToPlanned(buildPlanBoundSurface(p, "NOT_REQUIRED"));
    s = advanceRunnableRootsToRunning(s, p);
    s = finalizeSurfaceFromExecution(s, [], "COMPLETED");
    expect(isPlannerSliceFullyTerminal(s)).toBe(true);
  });

  it("applyPlannerMutationApprovalToSurface: BLOCKED+PENDING → RUNNING+APPROVED", () => {
    const s: ExecutionSurfaceState = {
      version: "v1",
      branches: [
        {
          branchId: "x",
          lifecycle: "BLOCKED_ON_CONFIRMATION",
          mutationState: "PENDING",
        },
      ],
    };
    const out = applyPlannerMutationApprovalToSurface(s);
    expect(out.branches[0].lifecycle).toBe("RUNNING");
    expect(out.branches[0].mutationState).toBe("APPROVED");
  });

  it("applyPlannerMutationApprovalToSurface: с pendingActionId снимает только при совпадении id", () => {
    const s: ExecutionSurfaceState = {
      version: "v1",
      branches: [
        {
          branchId: "x",
          lifecycle: "BLOCKED_ON_CONFIRMATION",
          mutationState: "PENDING",
          pendingActionId: "pa-1",
        },
      ],
    };
    expect(applyPlannerMutationApprovalToSurface(s, "wrong").branches[0].lifecycle).toBe(
      "BLOCKED_ON_CONFIRMATION",
    );
    const out = applyPlannerMutationApprovalToSurface(s, "pa-1");
    expect(out.branches[0].lifecycle).toBe("RUNNING");
    expect(out.branches[0].pendingActionId).toBeUndefined();
  });
});
