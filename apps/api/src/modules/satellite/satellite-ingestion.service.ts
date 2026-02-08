// Satellite Ingestion (Sprint 2)
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { SatelliteEventBus } from "./satellite.event-bus";
import { SatelliteObservationInputDto } from "./dto/satellite.dto";
import { SatelliteObservationRecordedEvent } from "./events/satellite.events";
import { ShadowAdvisoryService } from "../../shared/memory/shadow-advisory.service";
import { buildSatelliteShadowEmbedding } from "../../shared/memory/signal-embedding.util";

@Injectable()
export class SatelliteIngestionService {
  private readonly logger = new Logger(SatelliteIngestionService.name);

  constructor(
    private readonly integrityGate: IntegrityGateService,
    private readonly eventBus: SatelliteEventBus,
    private readonly shadowAdvisory: ShadowAdvisoryService,
  ) {}

  async ingest(input: SatelliteObservationInputDto, traceId: string) {
    const validation = this.integrityGate.validateSatelliteObservation(input);
    if (!validation.ok) {
      throw new BadRequestException(validation.errors.join("; "));
    }

    const event: SatelliteObservationRecordedEvent = {
      type: "SatelliteObservationRecorded",
      traceId,
      companyId: input.companyId,
      occurredAt: new Date().toISOString(),
      observation: input,
    };

    this.logger.log(`[SATELLITE] Ingest accepted (${traceId})`);
    await this.eventBus.publish(event);
    try {
      await this.shadowAdvisory.evaluate({
        companyId: input.companyId,
        embedding: buildSatelliteShadowEmbedding({
          value: input.value,
          confidence: input.confidence,
          cloudCoverage: input.cloudCoverage,
          resolution: input.resolution,
          indexType: input.indexType,
          source: input.source,
        }),
        traceId,
        signalType: "SATELLITE",
        memoryType: "CONTEXT",
      });
    } catch (error: any) {
      this.logger.warn(`[SATELLITE] Shadow advisory skipped (${traceId}): ${error?.message ?? "unknown error"}`);
    }

    return { status: "accepted", traceId };
  }
}
