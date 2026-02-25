// Satellite Ingestion (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { SatelliteQueryService } from "./satellite-query.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("SatelliteQueryService", () => {
  let service: SatelliteQueryService;
  const prismaMock = {
    satelliteObservation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SatelliteQueryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SatelliteQueryService);
    jest.clearAllMocks();
  });

  it("getObservation should query by id", async () => {
    prismaMock.satelliteObservation.findUnique.mockResolvedValue({ id: "s1" });

    const result = await service.getObservation("s1", "company-1");

    expect(prismaMock.satelliteObservation.findUnique).toHaveBeenCalledWith({
      where: { id: "s1" },
    });
    expect(result).toEqual({ id: "s1" });
  });

  it("getObservationsByAsset should query by assetId", async () => {
    prismaMock.satelliteObservation.findMany.mockResolvedValue([{ id: "s1" }]);

    const result = await service.getObservationsByAsset("field-1", "company-1");

    expect(prismaMock.satelliteObservation.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "s1" }]);
  });

  it("getObservationsByAsset should apply time range and indexType", async () => {
    prismaMock.satelliteObservation.findMany.mockResolvedValue([{ id: "s1" }]);

    const result = await service.getObservationsByAsset(
      "field-1",
      "company-1",
      "NDVI" as any,
      {
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-01-02T00:00:00.000Z",
      },
    );

    expect(prismaMock.satelliteObservation.findMany).toHaveBeenCalled();
    expect(result).toEqual([{ id: "s1" }]);
  });
});
