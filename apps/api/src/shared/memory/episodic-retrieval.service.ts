import { Inject, Injectable } from "@nestjs/common";
import type { MemoryManager } from "./memory-manager.service";
import { EngramOutcome, resolveEngramOutcome } from "./engram-rules";

export interface EpisodicRetrievalRequest {
  companyId: string;
  embedding: number[];
  memoryType?: string;
  limit?: number;
  minSimilarity?: number;
  traceId?: string;
}

export interface EpisodicCase {
  id: string;
  content: string;
  similarity: number;
  outcome: EngramOutcome;
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface EpisodicRetrievalResponse {
  traceId?: string;
  total: number;
  positive: number;
  negative: number;
  unknown: number;
  items: EpisodicCase[];
}

@Injectable()
export class EpisodicRetrievalService {
  constructor(
    @Inject("MEMORY_MANAGER")
    private readonly memoryManager: Pick<MemoryManager, "recall">,
  ) {}

  async retrieve(request: EpisodicRetrievalRequest): Promise<EpisodicRetrievalResponse> {
    const recalled = await this.memoryManager.recall(request.embedding, {
      companyId: request.companyId,
      memoryType: request.memoryType ?? "CONTEXT",
      needsKnowledge: true,
      limit: request.limit ?? 5,
      minSimilarity: request.minSimilarity ?? 0.7,
    });

    const items = recalled.map((entry: any) => {
      const metadata = this.safeMetadata(entry.metadata);
      const outcome = this.detectOutcome(metadata);
      const confidence = this.calculateConfidence(entry.similarity, outcome);

      return {
        id: String(entry.id),
        content: String(entry.content ?? ""),
        similarity: Number(entry.similarity ?? 0),
        outcome,
        confidence,
        metadata,
      };
    });

    return {
      traceId: request.traceId,
      total: items.length,
      positive: items.filter((i) => i.outcome === "POSITIVE").length,
      negative: items.filter((i) => i.outcome === "NEGATIVE").length,
      unknown: items.filter((i) => i.outcome === "UNKNOWN").length,
      items: items.sort((a, b) => b.confidence - a.confidence),
    };
  }

  private safeMetadata(input: unknown): Record<string, unknown> {
    if (input && typeof input === "object" && !Array.isArray(input)) {
      return input as Record<string, unknown>;
    }
    return {};
  }

  private detectOutcome(metadata: Record<string, unknown>): EngramOutcome {
    return resolveEngramOutcome(metadata);
  }

  private calculateConfidence(similarity: number, outcome: EngramOutcome): number {
    const base = Math.max(0, Math.min(1, Number(similarity ?? 0)));
    if (outcome === "UNKNOWN") {
      return Number((base * 0.8).toFixed(4));
    }
    return Number(base.toFixed(4));
  }
}
