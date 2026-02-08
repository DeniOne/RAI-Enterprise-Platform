// Satellite Ingestion (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { SatelliteEventHandlerService } from "./satellite-event-handler.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("SatelliteEventHandlerService", () => {
  let service: SatelliteEventHandlerService;
  const prismaMock = {
    satelliteObservation: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SatelliteEventHandlerService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SatelliteEventHandlerService);
    jest.clearAllMocks();
  });

  it("should persist observation", async () => {
    await service.handle({
      type: "SatelliteObservationRecorded",
      traceId: "t1",
      companyId: "c1",
      occurredAt: new Date().toISOString(),
      observation: {
        id: "s1",
        assetId: "field-1",
        companyId: "c1",
        timestamp: new Date().toISOString(),
        indexType: "NDVI" as any,
        value: 0.5,
        source: "SENTINEL2" as any,
        resolution: 10,
        cloudCoverage: 0.1,
        confidence: 0.9,
      },
    });

    expect(prismaMock.satelliteObservation.create).toHaveBeenCalled();
  });
});
