import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  TraceTopologyNodeDto,
  TraceTopologyResponseDto,
} from "./dto/trace-topology.dto";

const ROOT_NODE_ID = "__root__";

interface PhaseMeta {
  name?: string;
  durationMs?: number;
  kind?: string;
}

@Injectable()
export class TraceTopologyService {
  constructor(private readonly prisma: PrismaService) { }

  async getTraceTopology(traceId: string, companyId: string): Promise<TraceTopologyResponseDto> {
    const [entries, summary] = await Promise.all([
      this.prisma.aiAuditEntry.findMany({
        where: { traceId },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.traceSummary.findFirst({
        where: { traceId, companyId },
      }),
    ]);

    if (!entries.length) {
      throw new NotFoundException("TRACE_NOT_FOUND");
    }

    const hasForeign = entries.some((e) => e.companyId !== companyId);
    const own = entries.find((e) => e.companyId === companyId);
    if (!own && hasForeign) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }
    const baseCompanyId = own?.companyId ?? entries[0].companyId;
    if (baseCompanyId !== companyId) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }

    const totalDurationMs = summary?.durationMs ?? 0;
    const nodes: TraceTopologyNodeDto[] = [];
    const rootCreatedAt = entries[0].createdAt;

    nodes.push({
      id: ROOT_NODE_ID,
      label: "request",
      kind: "request",
      durationMs: totalDurationMs,
      parentId: null,
      childrenIds: entries.map((e) => e.id),
      createdAt: rootCreatedAt.toISOString(),
    });

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const meta = (e as { metadata?: { phases?: Array<{ name: string; timestamp: string; durationMs: number }>; error?: boolean } }).metadata;
      const phases = Array.isArray(meta?.phases) ? meta.phases : [];
      const hasError = Boolean(meta?.error);

      if (phases.length) {
        // R5: Ингестим фазы как отдельные узлы топологии для полноты картины
        for (const p of phases) {
          const nodeId = `${e.id}:${p.name}`;
          nodes.push({
            id: nodeId,
            label: p.name === "tools" ? `tools: ${e.toolNames?.join(", ") ?? "none"}` : p.name,
            kind: p.name as TraceTopologyNodeDto["kind"],
            durationMs: p.durationMs ?? 0,
            parentId: ROOT_NODE_ID,
            childrenIds: [],
            createdAt: p.timestamp,
            hasError: (p.name === "tools" && hasError) ? true : undefined,
            toolNames: p.name === "tools" ? e.toolNames ?? [] : undefined,
          });
          // Добавляем ID в список детей рута (хотя он уже там через parentId, но для детей рута в DTO)
          const rootNode = nodes.find((n) => n.id === ROOT_NODE_ID);
          if (rootNode && !rootNode.childrenIds.includes(nodeId)) {
            rootNode.childrenIds.push(nodeId);
          }
        }
        // Убираем временную привязку entries.map((e) => e.id) из rootNode, 
        // так как мы теперь используем взрыв фаз.
        const rootNode = nodes.find((n) => n.id === ROOT_NODE_ID);
        if (rootNode) {
          rootNode.childrenIds = rootNode.childrenIds.filter(cid => cid !== e.id);
        }
      } else {
        // Fallback: старая логика
        const nextTs = entries[i + 1]?.createdAt?.getTime();
        const curTs = e.createdAt.getTime();
        const durationFromDelta = nextTs != null ? nextTs - curTs : totalDurationMs - (curTs - rootCreatedAt.getTime());

        const label = e.toolNames?.length
          ? `tools: ${e.toolNames.join(", ")}`
          : (e.intentMethod ? `router: ${e.intentMethod}` : "agent");

        nodes.push({
          id: e.id,
          label,
          kind: e.toolNames?.length ? "tools" : "router",
          durationMs: Math.max(0, durationFromDelta),
          parentId: ROOT_NODE_ID,
          childrenIds: [],
          createdAt: e.createdAt.toISOString(),
          hasError: hasError || undefined,
          toolNames: e.toolNames?.length ? e.toolNames : undefined,
        });
      }
    }

    const criticalPathNodeIds = this.computeCriticalPath(nodes, ROOT_NODE_ID);

    return {
      traceId,
      companyId,
      nodes,
      criticalPathNodeIds,
      totalDurationMs,
    };
  }

  /**
   * Критический путь: от корня идём в потомка с макс. суммарной длительностью (включая его поддерево).
   */
  private computeCriticalPath(nodes: TraceTopologyNodeDto[], rootId: string): string[] {
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const maxPathFrom = (id: string): number => {
      const n = byId.get(id);
      if (!n) return 0;
      let maxChild = 0;
      for (const cid of n.childrenIds) {
        maxChild = Math.max(maxChild, maxPathFrom(cid));
      }
      return n.durationMs + maxChild;
    };

    const path: string[] = [];
    let current: string | null = rootId;
    while (current) {
      path.push(current);
      const n = byId.get(current);
      if (!n?.childrenIds.length) break;
      let bestChild = n.childrenIds[0];
      let bestScore = 0;
      for (const cid of n.childrenIds) {
        const s = maxPathFrom(cid);
        if (s > bestScore) {
          bestScore = s;
          bestChild = cid;
        }
      }
      current = bestChild;
    }
    return path;
  }
}
