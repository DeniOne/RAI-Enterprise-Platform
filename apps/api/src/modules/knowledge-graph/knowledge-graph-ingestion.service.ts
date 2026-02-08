// Knowledge Graph (Sprint 2)
﻿import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { KnowledgeGraphEventBus } from "./knowledge-graph.event-bus";
import { KnowledgeGraphIngestionDto } from "./dto/knowledge-graph.dto";
import { KnowledgeGraphUpdatedEvent } from "./events/knowledge-graph.events";

@Injectable()
export class KnowledgeGraphIngestionService {
  private readonly logger = new Logger(KnowledgeGraphIngestionService.name);

  constructor(
    private readonly integrityGate: IntegrityGateService,
    private readonly eventBus: KnowledgeGraphEventBus,
  ) {}

  async ingest(input: KnowledgeGraphIngestionDto, companyId: string, traceId: string) {
    const validation = this.integrityGate.validateKnowledgeGraphInput(input);
    if (!validation.ok) {
      throw new BadRequestException(validation.errors.join("; "));
    }

    const event: KnowledgeGraphUpdatedEvent = {
      type: "KnowledgeGraphUpdated",
      traceId,
      companyId,
      occurredAt: new Date().toISOString(),
      nodes: input.nodes,
      edges: input.edges,
    };

    this.logger.log(`[KNOWLEDGE-GRAPH] Ingest accepted (${traceId})`);
    await this.eventBus.publish(event);

    return { status: "accepted", traceId };
  }
}
