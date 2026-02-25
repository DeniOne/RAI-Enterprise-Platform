// Knowledge Graph (Sprint 2)
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { KnowledgeGraphUpdatedEvent } from "./events/knowledge-graph.events";

@Injectable()
export class KnowledgeGraphEventHandlerService {
  private readonly logger = new Logger(KnowledgeGraphEventHandlerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: KnowledgeGraphUpdatedEvent): Promise<void> {
    this.logger.log(
      `[KNOWLEDGE-GRAPH] Applying event ${event.type} (${event.traceId})`,
    );

    if (event.nodes.length > 0) {
      await this.prisma.knowledgeNode.createMany({
        data: event.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          source: n.source,
          companyId: event.companyId,
        })),
        skipDuplicates: true,
      });
    }

    if (event.edges.length > 0) {
      await this.prisma.knowledgeEdge.createMany({
        data: event.edges.map((e) => ({
          fromNodeId: e.fromNodeId,
          toNodeId: e.toNodeId,
          relation: e.relation,
          confidence: e.confidence,
          source: e.source,
          companyId: event.companyId,
        })),
        skipDuplicates: true,
      });
    }
  }
}
