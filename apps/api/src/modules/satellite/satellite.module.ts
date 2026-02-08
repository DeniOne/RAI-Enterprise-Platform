// Satellite Ingestion (Sprint 2)
import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { IntegrityModule } from "../integrity/integrity.module";
import { SatelliteEventBus } from "./satellite.event-bus";
import { SatelliteEventHandlerService } from "./satellite-event-handler.service";
import { SatelliteIngestionService } from "./satellite-ingestion.service";
import { SatelliteQueryService } from "./satellite-query.service";

@Module({
  imports: [PrismaModule, IntegrityModule],
  providers: [
    SatelliteEventBus,
    SatelliteEventHandlerService,
    SatelliteIngestionService,
    SatelliteQueryService,
  ],
  exports: [SatelliteIngestionService, SatelliteQueryService],
})
export class SatelliteModule {
  constructor(bus: SatelliteEventBus, handler: SatelliteEventHandlerService) {
    bus.register(handler);
  }
}
