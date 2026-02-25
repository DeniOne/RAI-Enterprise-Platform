// Vision AI Baseline (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { VisionIngestionService } from "./vision-ingestion.service";
import { VisionEventBus } from "./vision.event-bus";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { ConsultingService } from "../consulting/consulting.service";
import { RegistryAgentService } from "../integrity/registry-agent.service";
import { BadRequestException } from "@nestjs/common";
import { VisionObservationInputDto } from "./dto/vision.dto";
import { ShadowAdvisoryService } from "../../shared/memory/shadow-advisory.service";
import { QuorumService } from "../integrity/quorum.service";

describe("VisionIngestionService", () => {
  let service: VisionIngestionService;
  const eventBus = { publish: jest.fn() };
  const shadowAdvisory = { evaluate: jest.fn() };
  const prismaMock = {} as PrismaService;
  const deviationMock = {} as DeviationService;
  const consultingMock = {} as ConsultingService;
  const registryMock = {} as RegistryAgentService;
  const quorumMock = {
    isBlockedByQuorum: jest.fn().mockResolvedValue(false),
  } as any;
  const driftQueueMock = { add: jest.fn() } as any;
  const integrityGate = new IntegrityGateService(
    prismaMock,
    deviationMock,
    consultingMock,
    registryMock,
    quorumMock,
    driftQueueMock,
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisionIngestionService,
        { provide: VisionEventBus, useValue: eventBus },
        { provide: IntegrityGateService, useValue: integrityGate },
        { provide: ShadowAdvisoryService, useValue: shadowAdvisory },
      ],
    }).compile();

    service = module.get(VisionIngestionService);
    jest.clearAllMocks();
  });

  it("should publish event when input is valid", async () => {
    const dto: VisionObservationInputDto = {
      id: "v1",
      source: "PHOTO" as any,
      assetId: "field-1",
      timestamp: new Date().toISOString(),
      modality: "RGB" as any,
      rawFeatures: { ndvi: 0.2 },
      metadata: { sensor: "camera-1" },
      confidence: 0.7,
    };

    const result = await service.ingest(dto, "company-1", "trace-1");

    expect(eventBus.publish).toHaveBeenCalled();
    expect(shadowAdvisory.evaluate).toHaveBeenCalled();
    expect(result).toEqual({ status: "accepted", traceId: "trace-1" });
  });

  it("should throw BadRequestException when input is invalid", async () => {
    const dto: VisionObservationInputDto = {
      id: "v1",
      source: "PHOTO" as any,
      assetId: "field-1",
      timestamp: new Date().toISOString(),
      modality: "MULTISPECTRAL" as any,
      confidence: 0.7,
    };

    await expect(service.ingest(dto, "company-1", "trace-1")).rejects.toThrow(
      BadRequestException,
    );
  });
});
