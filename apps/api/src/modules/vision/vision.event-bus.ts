// Vision AI Baseline (Sprint 2)
import { Injectable } from "@nestjs/common";
import { VisionObservationRecordedEvent } from "./events/vision.events";

export interface VisionEventHandler {
  handle(event: VisionObservationRecordedEvent): Promise<void>;
}

@Injectable()
export class VisionEventBus {
  private handler: VisionEventHandler | null = null;

  register(handler: VisionEventHandler) {
    this.handler = handler;
  }

  async publish(event: VisionObservationRecordedEvent): Promise<void> {
    if (this.handler) {
      await this.handler.handle(event);
    }
  }
}
