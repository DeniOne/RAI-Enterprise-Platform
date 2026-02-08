// Satellite Ingestion (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SatelliteIngestionService } from "./satellite-ingestion.service";
import { SatelliteEventBus } from "./satellite.event-bus";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { ConsultingService } from "../consulting/consulting.service";
import { RegistryAgentService } from "../integrity/registry-agent.service";
import { SatelliteObservationInputDto } from "./dto/satellite.dto";

describe("SatelliteIngestionService", () => {
  let service: SatelliteIngestionService;
  const eventBus = { publish: jest.fn() };
  const prismaMock = {} as PrismaService;
  const deviationMock = {} as DeviationService;
  const consultingMock = {} as ConsultingService;
  const registryMock = {} as RegistryAgentService;
  const integrityGate = new IntegrityGateService(
    prismaMock,
    deviationMock,
    consultingMock,
    registryMock,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SatelliteIngestionService,
        { provide: SatelliteEventBus, useValue: eventBus },
        { provide: IntegrityGateService, useValue: integrityGate },
      ],
    }).compile();

    service = module.get(SatelliteIngestionService);
    jest.clearAllMocks();
  });

  it("should publish event when input is valid", async () => {
    const dto: SatelliteObservationInputDto = {
      id: "s1",
      assetId: "field-1",
      companyId: "company-1",
      timestamp: new Date().toISOString(),
      indexType: "NDVI" as any,
      value: 0.5,
      source: "SENTINEL2" as any,
      resolution: 10,
      cloudCoverage: 0.2,
      confidence: 0.8,
    };

    const result = await service.ingest(dto, "trace-1");

    expect(eventBus.publish).toHaveBeenCalled();
    expect(result).toEqual({ status: "accepted", traceId: "trace-1" });
  });

  it("should throw BadRequestException when input is invalid", async () => {
    const dto: SatelliteObservationInputDto = {
      id: "s1",
      assetId: "field-1",
      companyId: "company-1",
      timestamp: new Date().toISOString(),
      indexType: "NDRE" as any,
      value: 1.2,
      source: "LANDSAT8" as any,
      resolution: 30,
      cloudCoverage: 0.2,
      confidence: 0.8,
    };

    await expect(service.ingest(dto, "trace-1")).rejects.toThrow(BadRequestException);
  });
});
