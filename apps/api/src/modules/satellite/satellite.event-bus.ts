// Satellite Ingestion (Sprint 2)
import { Injectable } from "@nestjs/common";
import { SatelliteObservationRecordedEvent } from "./events/satellite.events";

export interface SatelliteEventHandler {
  handle(event: SatelliteObservationRecordedEvent): Promise<void>;
}

@Injectable()
export class SatelliteEventBus {
  private handler: SatelliteEventHandler | null = null;

  register(handler: SatelliteEventHandler) {
    this.handler = handler;
  }

  async publish(event: SatelliteObservationRecordedEvent): Promise<void> {
    if (this.handler) {
      await this.handler.handle(event);
    }
  }
}
