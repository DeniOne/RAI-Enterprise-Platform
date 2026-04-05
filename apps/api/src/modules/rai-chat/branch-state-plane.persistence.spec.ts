import { BranchStatePlaneService } from "./branch-state-plane.service";
import type { PlannerThreadSliceV1 } from "./planner-thread-slice.types";

describe("BranchStatePlaneService персистенция (mock Prisma)", () => {
  const slice: PlannerThreadSliceV1 = {
    version: "v1",
    sourceGraphId: "g1",
    executionPlan: {
      version: "v1",
      planId: "p1",
      strategy: "sequential",
      sourceGraphId: "g1",
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
    },
    executionSurface: {
      version: "v1",
      branches: [
        {
          branchId: "primary",
          lifecycle: "PLANNED",
          mutationState: "NOT_REQUIRED",
        },
      ],
    },
  };

  beforeEach(() => {
    process.env.RAI_PLANNER_THREAD_PERSIST = "true";
  });

  afterEach(() => {
    delete process.env.RAI_PLANNER_THREAD_PERSIST;
  });

  it("getThreadPlannerSlice читает из БД при промахе in-memory", async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const findUnique = jest.fn().mockResolvedValue({
      sliceJson: slice,
    });
    const prisma = {
      raiPlannerThreadState: { upsert, findUnique },
    } as unknown as import("../../shared/prisma/prisma.service").PrismaService;

    const plane = new BranchStatePlaneService(prisma);
    const got = await plane.getThreadPlannerSlice("c1", "t1");
    expect(findUnique).toHaveBeenCalled();
    expect(got?.sourceGraphId).toBe("g1");
  });

  it("recordThreadPlannerSlice вызывает upsert", async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const findUnique = jest.fn();
    const prisma = {
      raiPlannerThreadState: { upsert, findUnique },
    } as unknown as import("../../shared/prisma/prisma.service").PrismaService;

    const plane = new BranchStatePlaneService(prisma);
    await plane.recordThreadPlannerSlice("c2", "t2", slice);
    expect(upsert).toHaveBeenCalled();
  });
});
