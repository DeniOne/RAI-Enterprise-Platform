// Vision AI Baseline (Sprint 2)
import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { IntegrityModule } from "../integrity/integrity.module";
import { VisionEventBus } from "./vision.event-bus";
import { VisionEventHandlerService } from "./vision-event-handler.service";
import { VisionIngestionService } from "./vision-ingestion.service";
import { VisionQueryService } from "./vision-query.service";

@Module({
  imports: [PrismaModule, IntegrityModule],
  providers: [
    VisionEventBus,
    VisionEventHandlerService,
    VisionIngestionService,
    VisionQueryService,
  ],
  exports: [VisionIngestionService, VisionQueryService],
})
export class VisionModule {
  constructor(bus: VisionEventBus, handler: VisionEventHandlerService) {
    bus.register(handler);
  }
}
