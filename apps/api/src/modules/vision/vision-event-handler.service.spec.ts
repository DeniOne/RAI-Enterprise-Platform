// Vision AI Baseline (Sprint 2)
import { Test, TestingModule } from "@nestjs/testing";
import { VisionEventHandlerService } from "./vision-event-handler.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("VisionEventHandlerService", () => {
  let service: VisionEventHandlerService;

  const prismaMock = {
    visionObservation: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VisionEventHandlerService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(VisionEventHandlerService);
    jest.clearAllMocks();
  });

  it("should persist observation", async () => {
    await service.handle({
      type: "VisionObservationRecorded",
      traceId: "t1",
      companyId: "c1",
      occurredAt: new Date().toISOString(),
      observation: {
        id: "v1",
        source: "PHOTO" as any,
        assetId: "field-1",
        timestamp: new Date().toISOString(),
        modality: "RGB" as any,
        rawFeatures: { ndvi: 0.2 },
        metadata: { sensor: "camera-1" },
        confidence: 0.7,
      },
    });

    expect(prismaMock.visionObservation.create).toHaveBeenCalled();
  });
});
