/** Узел графа выполнения трейса (router / agent / tools / composer). */
export interface TraceTopologyNodeDto {
  id: string;
  label: string;
  kind: "router" | "agent" | "tools" | "composer" | "request";
  durationMs: number;
  parentId: string | null;
  childrenIds: string[];
  createdAt: string;
  /** Признак ошибки/ретрая из metadata */
  hasError?: boolean;
  toolNames?: string[];
}

export interface TraceTopologyResponseDto {
  traceId: string;
  companyId: string;
  nodes: TraceTopologyNodeDto[];
  /** Id узлов критического пути (самая длинная цепочка по времени). */
  criticalPathNodeIds: string[];
  totalDurationMs: number;
}
