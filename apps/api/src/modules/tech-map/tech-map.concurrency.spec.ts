import { Test, TestingModule } from "@nestjs/testing";
import { TechMapService } from "./tech-map.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { TechMapActiveConflictError } from "./tech-map.errors";
import { TechMapValidationEngine } from "./validation/techmap-validation.engine";
import { DAGValidationService } from "./validation/dag-validation.service";
import { TechMapValidator } from "./tech-map.validator";
import { UnitNormalizationService } from "./unit-normalization.service";
import { TechMapWorkflowOrchestratorService } from "./tech-map-workflow-orchestrator.service";
import { TechMapGenerationOrchestratorService } from "./generation/tech-map-generation-orchestrator.service";

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
  techMapReviewSnapshot: {
    upsert: jest.fn(),
  },
  techMapApprovalSnapshot: {
    upsert: jest.fn(),
  },
  techMapPublicationLock: {
    upsert: jest.fn(),
  },
  harvestPlan: {
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  season: { findUnique: jest.fn() },
});

const makePersistedTechMapStub = (status: TechMapStatus) =>
  ({
    id: "map-1",
    companyId: "comp-1",
    harvestPlanId: "plan-1",
    fieldId: "field-1",
    cropZoneId: "crop-zone-1",
    seasonId: "season-1",
    crop: "rapeseed",
    version: 1,
    status,
    approvedAt: null,
    basePlanHash: null,
    generationMetadata: {
      source: "blueprint",
      blueprintVersion: "2026.03",
      hash: "hash-1",
    },
    generationRecordId: null,
    updatedAt: new Date("2026-03-22T10:00:00.000Z"),
    field: {
      id: "field-1",
      area: 50,
      clientId: "farm-1",
      protectedZoneFlags: { waterProtection: true },
    },
    season: {
      id: "season-1",
      farmId: "farm-1",
      expectedYield: 4.1,
      actualYield: null,
      cropVarietyId: "var-1",
    },
    harvestPlan: {
      accountId: "farm-account-1",
      minValue: 5000,
      optValue: 6500,
      maxValue: 9000,
      baselineValue: 6000,
      targetMetric: "YIELD_QPH",
      period: "SEASON_2026",
      performanceContract: {
        modelType: "FIXED",
      },
    },
    cropZone: {
      id: "crop-zone-1",
      fieldId: "field-1",
      seasonId: "season-1",
      cropType: "RAPESEED",
      cropVarietyId: "var-1",
      varietyHybrid: "hybrid-a",
      predecessorCrop: "wheat",
      targetYieldTHa: 4.5,
      constraints: { water: true },
      field: {
        id: "field-1",
        area: 50,
        clientId: "farm-1",
        protectedZoneFlags: { waterProtection: true },
      },
      season: {
        id: "season-1",
        farmId: "farm-1",
        expectedYield: 4.1,
        actualYield: null,
        cropVarietyId: "var-1",
      },
      cropVariety: null,
    },
    stages: [
      {
        id: "stage-1",
        name: "Посев",
        sequence: 1,
        aplStageId: "04_SOWING",
        operations: [
          {
            id: "op-1",
            name: "Сев",
            operationType: "SEEDING",
            bbchWindowFrom: "10",
            bbchWindowTo: "12",
            dateWindowStart: new Date("2026-03-25T00:00:00.000Z"),
            dateWindowEnd: new Date("2026-03-28T00:00:00.000Z"),
            weatherConstraints: null,
            dependencies: [{ operationId: "op-0" }],
            isCritical: true,
            executionProtocol: null,
            evidenceRequired: null,
            plannedStartTime: new Date("2026-03-25T00:00:00.000Z"),
            plannedEndTime: new Date("2026-03-25T06:00:00.000Z"),
            durationHours: 6,
            requiredMachineryType: "SEEDER",
            evidence: [{ id: "evidence-1" }],
            executionRecord: { id: "execution-1" },
            resources: [
              {
                id: "res-1",
                inputCatalogId: "input-1",
                type: "seed",
                name: "Семена",
                amount: 120,
                unit: "kg",
                costPerUnit: 200,
                plannedRateUnit: "kg/ha",
                minRate: 2,
                maxRate: 3,
                applicationMethod: null,
                bbchRestrictionFrom: null,
                bbchRestrictionTo: null,
                tankMixGroupId: null,
                evidence: [],
              },
            ],
          },
        ],
      },
    ],
  } as any);

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
        {
          provide: UnitNormalizationService,
          useValue: { normalize: jest.fn((value: number, unit: string) => ({ value, unit })) },
        },
        {
          provide: TechMapValidator,
          useValue: { validateForActivation: jest.fn() },
        },
        {
          provide: TechMapWorkflowOrchestratorService,
          useValue: {
            buildWorkflowTrace: jest.fn(() => ({
              phase_engine: [
                "INTAKE",
                "TRIAGE",
                "BRANCHING",
                "TRUST",
                "COMPOSITION",
              ],
              summary: "Workflow spine",
            })),
          },
        },
        {
          provide: TechMapGenerationOrchestratorService,
          useValue: {
            orchestrate: jest.fn(),
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
    const mockMap = makePersistedTechMapStub(TechMapStatus.ACTIVE);

    prismaMock.techMap.findFirst.mockResolvedValue(mockMap as any);
    prismaMock.techMap.updateMany.mockResolvedValue({ count: 1 });
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

  it("should persist review snapshot when moving into REVIEW", async () => {
    const draft = makePersistedTechMapStub(TechMapStatus.DRAFT);
    const reviewed = makePersistedTechMapStub(TechMapStatus.REVIEW);

    prismaMock.techMap.findFirst.mockResolvedValueOnce(draft);
    prismaMock.techMap.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.techMap.findFirstOrThrow.mockResolvedValue(reviewed);
    prismaMock.techMapReviewSnapshot.upsert.mockResolvedValue({ id: "review-snapshot-1" });

    await service.transitionStatus(
      "map-1",
      TechMapStatus.REVIEW,
      "comp-1",
      UserRole.AGRONOMIST,
      "user-1",
    );

    expect(prismaMock.techMapReviewSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          techMapId_version: {
            techMapId: "map-1",
            version: 1,
          },
        },
        create: expect.objectContaining({
          techMapId: "map-1",
          reviewStatus: "IN_REVIEW",
        }),
      }),
    );
  });

  it("should persist publication lock when activating an APPROVED map", async () => {
    const approved = makePersistedTechMapStub(TechMapStatus.APPROVED);
    const active = makePersistedTechMapStub(TechMapStatus.ACTIVE);

    prismaMock.techMap.findFirst.mockResolvedValueOnce(approved);
    prismaMock.techMap.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.harvestPlan.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.techMap.findFirstOrThrow.mockResolvedValue(active);
    prismaMock.techMapPublicationLock.upsert.mockResolvedValue({
      id: "publication-lock-1",
    });

    await service.transitionStatus(
      "map-1",
      TechMapStatus.ACTIVE,
      "comp-1",
      UserRole.CEO,
      "user-1",
    );

    expect(prismaMock.techMapPublicationLock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          techMapId_version: {
            techMapId: "map-1",
            version: 1,
          },
        },
        create: expect.objectContaining({
          techMapId: "map-1",
          publicationState: "PUBLISHED",
          isLocked: true,
        }),
      }),
    );
  });
});
