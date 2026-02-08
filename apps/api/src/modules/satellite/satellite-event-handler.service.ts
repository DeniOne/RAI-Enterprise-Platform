// Satellite Ingestion (Sprint 2)
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SatelliteObservationRecordedEvent } from "./events/satellite.events";

@Injectable()
export class SatelliteEventHandlerService {
  private readonly logger = new Logger(SatelliteEventHandlerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: SatelliteObservationRecordedEvent): Promise<void> {
    this.logger.log(`[SATELLITE] Applying event ${event.type} (${event.traceId})`);

    await this.prisma.satelliteObservation.create({
      data: {
        id: event.observation.id,
        assetId: event.observation.assetId,
        timestamp: new Date(event.observation.timestamp),
        indexType: event.observation.indexType,
        value: event.observation.value,
        source: event.observation.source,
        resolution: event.observation.resolution,
        cloudCoverage: event.observation.cloudCoverage,
        tileId: event.observation.tileId ?? undefined,
        confidence: event.observation.confidence,
        companyId: event.companyId,
      },
    });
  }
}
