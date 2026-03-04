import { Test, TestingModule } from "@nestjs/testing";
import { CropVarietyService } from "./crop-variety.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ConflictException, NotFoundException } from "@nestjs/common";

describe("CropVarietyService", () => {
  let service: CropVarietyService;
  const prisma = {
    cropVariety: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    cropVarietyHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (cb: (tx: any) => any) => cb(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CropVarietyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CropVarietyService);
  });

  it("create: creates variety in tenant scope", async () => {
    prisma.cropVariety.findFirst.mockResolvedValue(null);
    prisma.cropVariety.create.mockResolvedValue({ id: "cv1", isLatest: true });

    const result = await service.create(
      {
        name: "Raps A",
        cropType: "RAPESEED",
        type: "WINTER",
        vegetationPeriod: 270,
      } as any,
      "c1",
    );

    expect(result.id).toBe("cv1");
    expect(prisma.cropVariety.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: "c1", version: 1 }),
      }),
    );
  });

  it("create: throws ConflictException when name exists", async () => {
    prisma.cropVariety.findFirst.mockResolvedValue({ id: "exists" });
    await expect(
      service.create(
        {
          name: "Raps A",
          cropType: "RAPESEED",
          type: "WINTER",
          vegetationPeriod: 270,
        } as any,
        "c1",
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("update: creates next version and history", async () => {
    prisma.cropVariety.findFirst.mockResolvedValue({ id: "cv1", companyId: "c1", isLatest: true, version: 1, name: "A" });
    prisma.cropVariety.create.mockResolvedValue({ id: "cv2", version: 2 });

    const result = await service.update({ id: "cv1", variety: "B" } as any, "c1", "u1");

    expect(result.version).toBe(2);
    expect(prisma.cropVarietyHistory.create).toHaveBeenCalled();
  });

  it("update: throws NotFoundException outside tenant", async () => {
    prisma.cropVariety.findFirst.mockResolvedValue(null);
    await expect(service.update({ id: "cv1" } as any, "c1", "u1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("findAll: filters by companyId", async () => {
    prisma.cropVariety.findMany.mockResolvedValue([]);
    await service.findAll("c2");
    expect(prisma.cropVariety.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ companyId: "c2" }) }),
    );
  });

  it("getVarietiesByCropType: filters by cropType and tenant", async () => {
    prisma.cropVariety.findMany.mockResolvedValue([]);
    await service.getVarietiesByCropType("CORN", "c2");
    expect(prisma.cropVariety.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cropType: "CORN", companyId: "c2" }),
      }),
    );
  });
});
