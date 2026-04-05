import {
  buildControlTowerPlannerEnvelopeV1,
  buildControlTowerSubIntentGraphSnapshotV1,
} from "./control-tower-planner-envelope";
import type { SemanticIngressFrame } from "./semantic-ingress.types";

describe("control-tower-planner-envelope", () => {
  const minimalFrame = (): SemanticIngressFrame =>
    ({
      version: "v1",
      subIntentGraph: {
        version: "v1",
        graphId: "g_test",
        branches: [
          {
            branchId: "a",
            ownerRole: null,
            intent: null,
            toolName: null,
            kind: "informational",
            dependsOn: [],
          },
        ],
      },
    }) as SemanticIngressFrame;

  it("фиксирует schemaVersion, promotion и plannerSignals", () => {
    const env = buildControlTowerPlannerEnvelopeV1({
      traceId: "tr1",
      companyId: "c1",
      promotion: { enabled: true, mode: "full_rollout" },
      frame: minimalFrame(),
      plannerBranchTelemetry: null,
    });
    expect(env.schemaVersion).toBe("control_tower.planner_envelope.v1");
    expect(env.traceId).toBe("tr1");
    expect(env.companyId).toBe("c1");
    expect(env.promotion).toEqual({ enabled: true, mode: "full_rollout" });
    expect(env.plannerSignals).toEqual({
      graphId: "g_test",
      branchCount: 1,
      hasExecutionPlan: false,
      hasExecutionSurface: false,
      telemetryPresent: false,
    });
  });

  it("telemetryPresent true при непустом snapshot", () => {
    const env = buildControlTowerPlannerEnvelopeV1({
      traceId: "t",
      companyId: "c",
      promotion: { enabled: false, mode: "canary_allowlist_out" },
      frame: minimalFrame(),
      plannerBranchTelemetry: { planId: "p1" },
    });
    expect((env.plannerSignals as { telemetryPresent: boolean }).telemetryPresent).toBe(
      true,
    );
  });

  describe("buildControlTowerSubIntentGraphSnapshotV1", () => {
    it("возвращает null без графа", () => {
      expect(buildControlTowerSubIntentGraphSnapshotV1(null)).toBeNull();
      expect(buildControlTowerSubIntentGraphSnapshotV1(undefined)).toBeNull();
    });

    it("сериализует ветки и schemaVersion", () => {
      const snap = buildControlTowerSubIntentGraphSnapshotV1({
        version: "v1",
        graphId: "g_x",
        branches: [
          {
            branchId: "primary",
            ownerRole: "agronomist",
            intent: "tech_map_draft",
            toolName: null,
            kind: "informational",
            dependsOn: [],
          },
        ],
      });
      expect(snap).toEqual({
        schemaVersion: "control_tower.sub_intent_graph.v1",
        graphId: "g_x",
        version: "v1",
        branches: [
          {
            branchId: "primary",
            ownerRole: "agronomist",
            intent: "tech_map_draft",
            toolName: null,
            kind: "informational",
            dependsOn: [],
          },
        ],
      });
    });
  });
});
