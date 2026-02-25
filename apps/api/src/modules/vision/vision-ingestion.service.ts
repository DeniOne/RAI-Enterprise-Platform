// Vision AI Baseline (Sprint 2)
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { VisionEventBus } from "./vision.event-bus";
import { VisionObservationInputDto } from "./dto/vision.dto";
import { VisionObservationRecordedEvent } from "./events/vision.events";
import { ShadowAdvisoryService } from "../../shared/memory/shadow-advisory.service";
import { buildVisionShadowEmbedding } from "../../shared/memory/signal-embedding.util";

@Injectable()
export class VisionIngestionService {
  private readonly logger = new Logger(VisionIngestionService.name);

  constructor(
    private readonly integrityGate: IntegrityGateService,
    private readonly eventBus: VisionEventBus,
    private readonly shadowAdvisory: ShadowAdvisoryService,
  ) {}

  async ingest(
    input: VisionObservationInputDto,
    companyId: string,
    traceId: string,
  ) {
    const validation = this.integrityGate.validateVisionObservation(input);
    if (!validation.ok) {
      throw new BadRequestException(validation.errors.join("; "));
    }

    const event: VisionObservationRecordedEvent = {
      type: "VisionObservationRecorded",
      traceId,
      companyId,
      occurredAt: new Date().toISOString(),
      observation: input,
    };

    this.logger.log(`[VISION] Ingest accepted (${traceId})`);
    await this.eventBus.publish(event);
    try {
      await this.shadowAdvisory.evaluate({
        companyId,
        embedding: buildVisionShadowEmbedding({
          confidence: input.confidence,
          modality: input.modality,
          source: input.source,
          ndvi: input.rawFeatures?.ndvi,
          ndre: input.rawFeatures?.ndre,
          cloudCover: input.metadata?.cloudCover,
        }),
        traceId,
        signalType: "VISION",
        memoryType: "CONTEXT",
      });
    } catch (error: any) {
      this.logger.warn(
        `[VISION] Shadow advisory skipped (${traceId}): ${error?.message ?? "unknown error"}`,
      );
    }

    return { status: "accepted", traceId };
  }
}
