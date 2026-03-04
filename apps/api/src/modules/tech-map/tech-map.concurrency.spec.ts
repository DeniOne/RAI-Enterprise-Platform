import { Test, TestingModule } from "@nestjs/testing";
import { TechMapService } from "./tech-map.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { TechMapActiveConflictError } from "./tech-map.errors";
import { TechMapValidationEngine } from "./validation/techmap-validation.engine";
import { DAGValidationService } from "./validation/dag-validation.service";

// Полноценный mock объект для PrismaService — используется и напрямую и внутри $transaction
const makePrismaMock = () => ({
  $transaction: jest.fn(),
  techMap: {
    findFirst: jest.fn(),
    findFirstOrThrow: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  harvestPlan: {
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  season: { findUnique: jest.fn() },
});

describe("TechMapService Concurrency (Track 1)", () => {
  let service: TechMapService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();

    // $transaction вызывает callback с тем же mock-объектом
    prismaMock.$transaction.mockImplementation((cb: (tx: any) => any) =>
      cb(prismaMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechMapService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: IntegrityGateService,
          useValue: { validateTechMapAdmission: jest.fn() },
        },
        TechMapStateMachine,
        {
          provide: TechMapValidationEngine,
          useValue: { validate: jest.fn() },
        },
        {
          provide: DAGValidationService,
          useValue: {
            validateAcyclicity: jest.fn(),
            calculateCriticalPath: jest.fn(),
            detectResourceConflicts: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TechMapService>(TechMapService);
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

    prismaMock.techMap.findFirst.mockResolvedValue(mockMap as any);
    prismaMock.techMap.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.harvestPlan.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.techMap.findFirstOrThrow.mockRejectedValue({ code: "P2002" });

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

    prismaMock.techMap.findFirst.mockResolvedValue(mockMap as any);
    prismaMock.techMap.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.tecmhMap?.findFirstOrThrow?.mockResolvedValue({
      ...mockMap,
      status: TechMapStatus.ARCHIVED,
    });
    prismaMock.techMap.findFirstOrThrow.mockResolvedValue({
      ...mockMap,
      status: TechMapStatus.ARCHIVED,
    });

    await service.transitionStatus(
      "map-1",
      TechMapStatus.ARCHIVED,
      "comp-1",
      UserRole.CEO,
      "user-1",
    );

    expect(prismaMock.harvestPlan.updateMany).toHaveBeenCalledWith({
      where: { id: "plan-1", companyId: "comp-1" },
      data: { activeTechMapId: null },
    });
  });
});
