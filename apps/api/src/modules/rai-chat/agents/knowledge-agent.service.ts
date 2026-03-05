import { Injectable } from "@nestjs/common";
import { RaiToolName } from "../tools/rai-tools.types";
import { KnowledgeToolsRegistry } from "../tools/knowledge-tools.registry";
import { RaiToolActorContext } from "../tools/rai-tools.types";
import type { QueryKnowledgeResult } from "../tools/rai-tools.types";
import type { EvidenceReference } from "../dto/rai-chat.dto";

export interface KnowledgeAgentInput {
  companyId: string;
  traceId: string;
  query: string;
}

export interface KnowledgeAgentResult {
  agentName: "KnowledgeAgent";
  status: "COMPLETED" | "FAILED";
  data: unknown;
  confidence: number;
  explain: string;
  toolCallsCount: number;
  traceId: string;
  evidence: EvidenceReference[];
}

function explainFromResult(d: QueryKnowledgeResult): string {
  if (d.hits === 0) return "По запросу ничего не найдено в базе знаний.";
  const parts = d.items.slice(0, 5).map((it, i) => `[${i + 1}] (релевантность ${it.score.toFixed(2)}): ${it.content.slice(0, 150)}${it.content.length > 150 ? "…" : ""}`);
  return `Найдено совпадений: ${d.hits}.\n${parts.join("\n")}`;
}

@Injectable()
export class KnowledgeAgent {
  constructor(private readonly knowledgeToolsRegistry: KnowledgeToolsRegistry) {}

  async run(input: KnowledgeAgentInput): Promise<KnowledgeAgentResult> {
    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
    };
    try {
      const data = await this.knowledgeToolsRegistry.execute(
        RaiToolName.QueryKnowledge,
        { query: input.query },
        actorContext,
      );
      const d = data as QueryKnowledgeResult;
      return {
        agentName: "KnowledgeAgent",
        status: "COMPLETED",
        data: d,
        confidence: d.hits > 0 ? 0.8 : 0.3,
        explain: explainFromResult(d),
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: this.buildEvidence(input, d),
      };
    } catch (err) {
      return {
        agentName: "KnowledgeAgent",
        status: "FAILED",
        data: {},
        confidence: 0,
        explain: String((err as Error).message),
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: [],
      };
    }
  }

  private buildEvidence(
    input: KnowledgeAgentInput,
    d: QueryKnowledgeResult,
  ): EvidenceReference[] {
    if (!d.hits || d.items.length === 0) {
      return [];
    }
    return d.items.slice(0, 3).map((item, index) => ({
      claim: `Ответ сформирован с опорой на фрагмент #${index + 1} из базы знаний по запросу "${input.query}".`,
      sourceType: "DOC",
      sourceId: `knowledge_item_${index + 1}`,
      confidenceScore: item.score,
    }));
  }
}
