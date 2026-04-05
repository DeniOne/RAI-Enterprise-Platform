import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import type {
  ExecutionPlan,
  ExecutionSurfaceState,
} from "../../../shared/rai-chat/execution-target-state.types";
import { techMapRebuildDraftIngressBuildFrameParams } from "../eval/tech-map-rebuild-draft-ingress.params";
import { BranchSchedulerService } from "../planner/branch-scheduler.service";
import { SemanticIngressService } from "../semantic-ingress.service";

/**
 * Один связный снимок для сценария Stage 2 blueprint:
 * context → TechMap → execution (planner slice) → deviation hook → ожидаемый артефакт результата.
 * Без HTTP и без вызова `executeAgent` — это контракт состояния, не live e2e.
 */
type TechMapLoopStateSnapshotV1 = {
  version: "v1";
  workspaceRoute: string;
  ingressFrame: SemanticIngressFrame;
  executionPlan: ExecutionPlan;
  initialSurface: ExecutionSurfaceState;
  topologicalOrder: string[];
  deviationFollowUp: {
    intent: "compute_deviations";
    scope: { seasonId: string };
  };
  expectedResult: {
    requestedArtifact: string;
    contextReadiness: string;
  };
};

function buildTechMapLoopStateSnapshotV1(): TechMapLoopStateSnapshotV1 {
  const ingress = new SemanticIngressService();
  const scheduler = new BranchSchedulerService();
  const frame = ingress.buildFrame(techMapRebuildDraftIngressBuildFrameParams());
  const plan = scheduler.buildExecutionPlanFromIngress(frame);
  if (!plan || !frame.techMapFrame || !frame.subIntentGraph) {
    throw new Error("tech-map loop fixture: missing plan / techMapFrame / subIntentGraph");
  }
  const initialSurface = scheduler.buildInitialSurface(plan, frame);
  const topologicalOrder = scheduler.computeTopologicalScheduleOrder(plan);
  const seasonId = frame.techMapFrame.scope?.seasonId;
  if (!seasonId) {
    throw new Error("tech-map loop fixture: missing techMapFrame.scope.seasonId");
  }
  return {
    version: "v1",
    workspaceRoute: "/consulting/techmaps",
    ingressFrame: frame,
    executionPlan: plan,
    initialSurface,
    topologicalOrder,
    deviationFollowUp: {
      intent: "compute_deviations",
      scope: { seasonId },
    },
    expectedResult: {
      requestedArtifact: frame.techMapFrame.requestedArtifact,
      contextReadiness: frame.techMapFrame.contextReadiness,
    },
  };
}

describe("context → TechMap → execution → deviation → result (единый state-object)", () => {
  it("собирает TechMapLoopStateSnapshotV1 из ingress + planner без сети", () => {
    const snap = buildTechMapLoopStateSnapshotV1();

    expect(snap.ingressFrame.techMapFrame?.workflowKind).toBe("tech_map");
    expect(snap.ingressFrame.subIntentGraph?.branches.some((b) => b.kind === "tech_map_core")).toBe(
      true,
    );
    expect(snap.executionPlan.strategy).toBe("sequential");
    expect(snap.topologicalOrder).toContain("tech_map_core");

    const core = snap.initialSurface.branches.find((b) => b.branchId === "tech_map_core");
    expect(core?.lifecycle).toBe("PLANNED");

    expect(snap.deviationFollowUp).toEqual({
      intent: "compute_deviations",
      scope: { seasonId: "season-2026" },
    });
    expect(snap.expectedResult.requestedArtifact).toBe("workflow_draft");
    expect(snap.expectedResult.contextReadiness).toBe("S3_DRAFT_READY");
  });
});
