// Vision AI Baseline (Sprint 2)
import { VisionObservationInputDto } from "../dto/vision.dto";

export interface VisionObservationRecordedEvent {
  type: "VisionObservationRecorded";
  traceId: string;
  companyId: string;
  occurredAt: string;
  observation: VisionObservationInputDto;
}
