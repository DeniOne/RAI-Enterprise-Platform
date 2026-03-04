import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import {
  ContractCorePayload,
  ContractCoreService,
} from "./contract-core.service";

describe("ContractCoreService", () => {
  let service: ContractCoreService;
  let prisma: any;

  const payload: ContractCorePayload = {
    techMapId: "tm-1",
    companyId: "company-1",
    fieldId: "field-1",
    cropType: "rapeseed",
    targetYieldTHa: 4.2,
    budgetCapRubHa: 18000,
    criticalOperations: [
      { id: "op-1", operationType: "SEEDING", bbchWindowFrom: 10 },
    ],
    sealedAt: "2026-03-04T10:00:00.000Z",
    version: 3,
  };

  beforeEach(async () => {
    prisma = {
      techMap: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractCoreService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(ContractCoreService);
  });

  it("hashContractCore: одинаковый payload -> одинаковый hash", () => {
    expect(service.hashContractCore(payload)).toBe(
      service.hashContractCore(payload),
    );
  });

  it("hashContractCore: разный порядок ключей -> одинаковый hash", () => {
    const reordered = {
      version: 3,
      sealedAt: "2026-03-04T10:00:00.000Z",
      cropType: "rapeseed",
      techMapId: "tm-1",
      companyId: "company-1",
      fieldId: "field-1",
      targetYieldTHa: 4.2,
      budgetCapRubHa: 18000,
      criticalOperations: [
        { operationType: "SEEDING", bbchWindowFrom: 10, id: "op-1" },
      ],
    } as ContractCorePayload;

    expect(service.hashContractCore(payload)).toBe(
      service.hashContractCore(reordered),
    );
  });

  it("hashContractCore: изменение одного поля -> другой hash", () => {
    expect(
      service.hashContractCore({ ...payload, budgetCapRubHa: 19000 }),
    ).not.toBe(service.hashContractCore(payload));
  });

  it("verifyIntegrity: stored == current -> valid true", async () => {
    const storedHash = service.hashContractCore(payload);
    prisma.techMap.findFirst
      .mockResolvedValueOnce({ basePlanHash: storedHash })
      .mockResolvedValueOnce({
        id: "tm-1",
        fieldId: "field-1",
        crop: "rapeseed",
        budgetCapRubHa: 18000,
        approvedAt: new Date("2026-03-04T10:00:00.000Z"),
        createdAt: new Date("2026-03-04T09:00:00.000Z"),
        version: 3,
        cropZone: { targetYieldTHa: 4.2 },
        stages: [
          {
            operations: [
              {
                id: "op-1",
                operationType: "SEEDING",
                bbchWindowFrom: "10",
                isCritical: true,
              },
            ],
          },
        ],
      });

    await expect(
      service.verifyIntegrity("tm-1", "company-1"),
    ).resolves.toEqual({
      valid: true,
      storedHash,
      currentHash: storedHash,
    });
  });

  it("verifyIntegrity: hash изменён в БД -> valid false", async () => {
    const currentHash = service.hashContractCore(payload);
    prisma.techMap.findFirst
      .mockResolvedValueOnce({ basePlanHash: "mismatch" })
      .mockResolvedValueOnce({
        id: "tm-1",
        fieldId: "field-1",
        crop: "rapeseed",
        budgetCapRubHa: 18000,
        approvedAt: new Date("2026-03-04T10:00:00.000Z"),
        createdAt: new Date("2026-03-04T09:00:00.000Z"),
        version: 3,
        cropZone: { targetYieldTHa: 4.2 },
        stages: [
          {
            operations: [
              {
                id: "op-1",
                operationType: "SEEDING",
                bbchWindowFrom: "10",
                isCritical: true,
              },
            ],
          },
        ],
      });

    await expect(
      service.verifyIntegrity("tm-1", "company-1"),
    ).resolves.toEqual({
      valid: false,
      storedHash: "mismatch",
      currentHash,
    });
  });
});
