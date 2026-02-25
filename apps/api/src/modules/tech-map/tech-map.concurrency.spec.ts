import { Test, TestingModule } from "@nestjs/testing";
import { TechMapService } from "./tech-map.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { TechMapActiveConflictError } from "./tech-map.errors";

describe("TechMapService Concurrency (Track 1)", () => {
  let service: TechMapService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechMapService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb) => cb(prisma)),
            techMap: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            harvestPlan: { update: jest.fn() },
            season: { findUnique: jest.fn() },
          },
        },
        {
          provide: IntegrityGateService,
          useValue: { validateTechMapAdmission: jest.fn() },
        },
        TechMapStateMachine,
      ],
    }).compile();

    service = module.get<TechMapService>(TechMapService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should throw TechMapActiveConflictError on P2002 duplicate active map", async () => {
    const mockMap = {
      id: "map-1",
      status: TechMapStatus.APPROVED,
      companyId: "comp-1",
      harvestPlanId: "plan-1",
      fieldId: "field-1",
      crop: "Wheat",
      seasonId: "season-1",
      stages: [],
    };

    jest.spyOn(prisma.techMap, "findFirst").mockResolvedValue(mockMap as any);
    jest.spyOn(prisma.techMap, "update").mockRejectedValue({ code: "P2002" });

    await expect(
      service.transitionStatus(
        "map-1",
        TechMapStatus.ACTIVE,
        "comp-1",
        UserRole.CEO,
        "user-1",
      ),
    ).rejects.toThrow(TechMapActiveConflictError);
  });

  it("should reset activeTechMapId when archiving an ACTIVE map", async () => {
    const mockMap = {
      id: "map-1",
      status: TechMapStatus.ACTIVE,
      companyId: "comp-1",
      harvestPlanId: "plan-1",
      stages: [],
    };

    jest.spyOn(prisma.techMap, "findFirst").mockResolvedValue(mockMap as any);
    jest
      .spyOn(prisma.techMap, "update")
      .mockResolvedValue({ ...mockMap, status: TechMapStatus.ARCHIVED } as any);

    await service.transitionStatus(
      "map-1",
      TechMapStatus.ARCHIVED,
      "comp-1",
      UserRole.CEO,
      "user-1",
    );

    expect(prisma.harvestPlan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: { activeTechMapId: null },
    });
  });
});
