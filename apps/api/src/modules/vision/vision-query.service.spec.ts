// Vision AI Baseline (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { VisionQueryService } from "./vision-query.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("VisionQueryService", () => {
  let service: VisionQueryService;
  const prismaMock = {
    visionObservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisionQueryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(VisionQueryService);
    jest.clearAllMocks();
  });

  it("getObservation should query by id", async () => {
    prismaMock.visionObservation.findUnique.mockResolvedValue({ id: "v1" });

    const result = await service.getObservation("v1", "company-1");

    expect(prismaMock.visionObservation.findUnique).toHaveBeenCalledWith({
      where: { id: "v1" },
    });
    expect(result).toEqual({ id: "v1" });
  });

  it("getObservationsByAsset should query by assetId", async () => {
    prismaMock.visionObservation.findMany.mockResolvedValue([{ id: "v1" }]);

    const result = await service.getObservationsByAsset("field-1", "company-1");

    expect(prismaMock.visionObservation.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "v1" }]);
  });

  it("getObservationsByAsset should apply time range", async () => {
    prismaMock.visionObservation.findMany.mockResolvedValue([{ id: "v1" }]);

    const result = await service.getObservationsByAsset(
      "field-1",
      "company-1",
      {
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-02T00:00:00.000Z",
      },
    );

    expect(prismaMock.visionObservation.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "v1" }]);
  });
});
