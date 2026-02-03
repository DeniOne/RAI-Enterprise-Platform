import { Test, TestingModule } from "@nestjs/testing";
import { RapeseedService } from "./rapeseed.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AgroAuditService } from "../agro-audit/agro-audit.service";
import { RapeseedType, User } from "@prisma/client";
import { ConflictException } from "@nestjs/common";

describe("RapeseedService", () => {
  let service: RapeseedService;

  const mockUser: User = {
    id: "user-1",
    email: "test@example.com",
    companyId: "company-1",
  } as any;

  const mockRapeseed = {
    id: "rapeseed-1",
    name: "Winter Rapeseed",
    type: RapeseedType.SPRING,
    oilContent: 45.5,
    vegetationPeriod: 120,
    version: 1,
    isLatest: true,
    companyId: "company-1",
  };

  const prismaMock = {
    rapeseed: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rapeseedHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prismaMock)),
  };

  const auditMock = {
    log: jest.fn(),
    logRapeseedChange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RapeseedService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AgroAuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<RapeseedService>(RapeseedService);

    jest.clearAllMocks();
  });

  it("should create a Rapeseed", async () => {
    prismaMock.Rapeseed.findFirst.mockResolvedValue(null);
    prismaMock.Rapeseed.create.mockResolvedValue(mockRapeseed);

    const result = await service.create(
      {
        name: "Winter Rapeseed",
        type: RapeseedType.SPRING,
        vegetationPeriod: 120,
      },
      mockUser,
      "company-1",
    );

    expect(prismaMock.rapeseed.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Winter Rapeseed",
          version: 1,
          isLatest: true,
        }),
      }),
    );
    expect(auditMock.log).toHaveBeenCalled();
    expect(result).toEqual(mockRapeseed);
  });

  it("should throw ConflictException if rapeseed name exists", async () => {
    prismaMock.rapeseed.findFirst.mockResolvedValue(mockRapeseed);

    await expect(
      service.create(
        {
          name: "Winter Rapeseed",
          type: RapeseedType.SPRING,
          vegetationPeriod: 120,
        },
        mockUser,
        "company-1",
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("should update rapeseed with versioning (transactional)", async () => {
    prismaMock.rapeseed.findFirst.mockResolvedValue(mockRapeseed);
    const newRapeseed = { ...mockRapeseed, version: 2, vegetationPeriod: 130 };
    prismaMock.rapeseed.create.mockResolvedValue(newRapeseed);

    const result = await service.update(
      { id: "rapeseed-1", vegetationPeriod: 130 } as any,
      mockUser,
      "company-1",
    );

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.rapeseed.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: mockRapeseed.id },
        data: { isLatest: false },
      }),
    );
    expect(prismaMock.rapeseed.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 2,
          vegetationPeriod: 130,
          isLatest: true,
        }),
      }),
    );
    expect(prismaMock.rapeseedHistory.create).toHaveBeenCalled();
    expect(auditMock.logRapeseedChange).toHaveBeenCalled();
    expect(result).toEqual(newRapeseed);
  });
});
