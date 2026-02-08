// Vision AI Baseline (Sprint 2)
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { VisionEventBus } from "./vision.event-bus";
import { VisionObservationInputDto } from "./dto/vision.dto";
import { VisionObservationRecordedEvent } from "./events/vision.events";

@Injectable()
export class VisionIngestionService {
  private readonly logger = new Logger(VisionIngestionService.name);

  constructor(
    private readonly integrityGate: IntegrityGateService,
    private readonly eventBus: VisionEventBus,
  ) {}

  async ingest(input: VisionObservationInputDto, companyId: string, traceId: string) {
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

    return { status: "accepted", traceId };
  }
}
