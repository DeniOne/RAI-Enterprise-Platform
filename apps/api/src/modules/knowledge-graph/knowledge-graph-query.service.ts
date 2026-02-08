// Knowledge Graph (Sprint 2)
﻿import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class KnowledgeGraphQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getNode(id: string) {
    return this.prisma.knowledgeNode.findUnique({ where: { id } });
  }

  async getEdgesByNode(id: string) {
    return this.prisma.knowledgeEdge.findMany({
      where: {
        OR: [{ fromNodeId: id }, { toNodeId: id }],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getSubgraph(nodeId: string, depth = 1) {
    if (depth < 1) {
      const node = await this.prisma.knowledgeNode.findUnique({ where: { id: nodeId } });
      return { nodes: node ? [node] : [], edges: [] };
    }

    const visited = new Set<string>();
    let frontier = new Set<string>([nodeId]);
    const allEdges: any[] = [];

    for (let d = 0; d < depth; d += 1) {
      const ids = Array.from(frontier).sort();
      if (ids.length === 0) break;

      const edges = await this.prisma.knowledgeEdge.findMany({
        where: {
          OR: [
            { fromNodeId: { in: ids } },
            { toNodeId: { in: ids } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      const next = new Set<string>();
      for (const e of edges) {
        allEdges.push(e);
        if (!visited.has(e.fromNodeId)) next.add(e.fromNodeId);
        if (!visited.has(e.toNodeId)) next.add(e.toNodeId);
      }

      ids.forEach((i) => visited.add(i));
      frontier = next;
    }

    const nodeIds = Array.from(new Set([nodeId, ...Array.from(visited)])).sort();
    const nodes = await this.prisma.knowledgeNode.findMany({
      where: { id: { in: nodeIds } },
      orderBy: { createdAt: "asc" },
    });

    return { nodes, edges: allEdges };
  }
}
