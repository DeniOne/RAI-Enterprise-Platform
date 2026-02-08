// Vision AI Baseline (Sprint 2)
import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { VisionObservationRecordedEvent } from "./events/vision.events";

@Injectable()
export class VisionEventHandlerService {
  private readonly logger = new Logger(VisionEventHandlerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: VisionObservationRecordedEvent): Promise<void> {
    this.logger.log(`[VISION] Applying event ${event.type} (${event.traceId})`);

    await this.prisma.visionObservation.create({
      data: {
        id: event.observation.id,
        source: event.observation.source,
        assetId: event.observation.assetId,
        timestamp: new Date(event.observation.timestamp),
        modality: event.observation.modality,
        rawFeatures: event.observation.rawFeatures
          ? (event.observation.rawFeatures as Prisma.InputJsonValue)
          : undefined,
        metadata: event.observation.metadata
          ? (event.observation.metadata as Prisma.InputJsonValue)
          : undefined,
        confidence: event.observation.confidence,
        companyId: event.companyId,
      },
    });
  }
}
