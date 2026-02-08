// Satellite Ingestion (Sprint 2)
import { SatelliteObservationInputDto } from "../dto/satellite.dto";

export interface SatelliteObservationRecordedEvent {
  type: "SatelliteObservationRecorded";
  traceId: string;
  companyId: string;
  occurredAt: string;
  observation: SatelliteObservationInputDto;
}
