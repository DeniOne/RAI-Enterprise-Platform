// Knowledge Graph (Sprint 2)
import { KnowledgeEdgeDto, KnowledgeNodeDto } from "../dto/knowledge-graph.dto";

export interface KnowledgeGraphUpdatedEvent {
  type: "KnowledgeGraphUpdated";
  traceId: string;
  companyId: string;
  occurredAt: string;
  nodes: KnowledgeNodeDto[];
  edges: KnowledgeEdgeDto[];
}
