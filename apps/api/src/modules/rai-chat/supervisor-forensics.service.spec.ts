import { PrismaService } from "../../shared/prisma/prisma.service";
import { InvariantMetrics } from "../../shared/invariants/invariant-metrics";
import { SupervisorForensicsService } from "./supervisor-forensics.service";

describe("SupervisorForensicsService", () => {
  beforeEach(() => {
    InvariantMetrics.resetForTests();
  });

  it("increments memory_lane_populated_total when lane contains recalled/used items", () => {
    const service = new SupervisorForensicsService({} as PrismaService);
    const lane = service.buildMemoryLane(
      {
        recall: {
          items: [
            {
              content: "Исторический кейс",
              similarity: 0.9,
              confidence: 0.8,
              metadata: { source: "episode" },
            },
          ],
        },
        profile: {},
        engrams: [],
        hotEngrams: [],
        activeAlerts: [],
      } as any,
      {
        memoryUsed: [
          {
            kind: "episode",
            label: "Исторический кейс",
            confidence: 0.8,
            source: "episode",
          },
        ],
        runtimeGovernance: {
          degraded: false,
        },
      } as any,
    );

    expect(lane.recalled.length).toBeGreaterThan(0);
    expect(lane.used.length).toBeGreaterThan(0);
    expect(InvariantMetrics.snapshot().memory_lane_populated_total).toBe(1);
  });
});
