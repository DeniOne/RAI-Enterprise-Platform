// Knowledge Graph (Sprint 2)
import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { IntegrityModule } from "../integrity/integrity.module";
import { KnowledgeGraphEventBus } from "./knowledge-graph.event-bus";
import { KnowledgeGraphEventHandlerService } from "./knowledge-graph-event-handler.service";
import { KnowledgeGraphIngestionService } from "./knowledge-graph-ingestion.service";
import { KnowledgeGraphQueryService } from "./knowledge-graph-query.service";

@Module({
  imports: [PrismaModule, IntegrityModule],
  providers: [
    KnowledgeGraphEventBus,
    KnowledgeGraphEventHandlerService,
    KnowledgeGraphIngestionService,
    KnowledgeGraphQueryService,
  ],
  exports: [KnowledgeGraphIngestionService, KnowledgeGraphQueryService],
})
export class KnowledgeGraphModule {
  constructor(
    bus: KnowledgeGraphEventBus,
    handler: KnowledgeGraphEventHandlerService,
  ) {
    bus.register(handler);
  }
}
