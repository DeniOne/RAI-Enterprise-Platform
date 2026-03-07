import { Injectable } from "@nestjs/common";
import { RaiToolName, RaiToolActorContext, QueryKnowledgeResult } from "../tools/rai-tools.types";
import { KnowledgeToolsRegistry } from "../tools/knowledge-tools.registry";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";

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
  fallbackUsed: boolean;
}

function explainFromResult(d: QueryKnowledgeResult): string {
  if (d.hits === 0) return "По запросу ничего не найдено в базе знаний.";
  const parts = d.items
    .slice(0, 5)
    .map(
      (it, i) =>
        `[${i + 1}] (релевантность ${it.score.toFixed(2)}): ${it.content.slice(0, 150)}${it.content.length > 150 ? "…" : ""}`,
    );
  return `Найдено совпадений: ${d.hits}.\n${parts.join("\n")}`;
}

@Injectable()
export class KnowledgeAgent {
  constructor(
    private readonly knowledgeToolsRegistry: KnowledgeToolsRegistry,
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly promptAssembly: AgentPromptAssemblyService,
  ) {}

  async run(
    input: KnowledgeAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<KnowledgeAgentResult> {
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
      const result = data as QueryKnowledgeResult;
      let explain = explainFromResult(result);
      let fallbackUsed = true;

      if (result.hits > 0 && options?.kernel && options.request) {
        try {
          const llm = await this.openRouterGateway.generate({
            traceId: input.traceId,
            agentRole: "knowledge",
            model: options.kernel.runtimeProfile.model,
            messages: this.promptAssembly.buildMessages(options.kernel, options.request).concat([
              {
                role: "user",
                content: `Grounded knowledge hits: ${JSON.stringify(result.items.slice(0, 3))}. Synthesize answer and mention uncertainty if evidence is weak.`,
              },
            ]),
            temperature: options.kernel.runtimeProfile.temperature,
            maxTokens: options.kernel.runtimeProfile.maxOutputTokens,
            timeoutMs: options.kernel.runtimeProfile.timeoutMs,
          });
          explain = llm.outputText;
          fallbackUsed = false;
        } catch {
          fallbackUsed = true;
        }
      }

      return {
        agentName: "KnowledgeAgent",
        status: "COMPLETED",
        data: result,
        confidence: result.hits > 0 ? 0.8 : 0.3,
        explain,
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: this.buildEvidence(input, result),
        fallbackUsed,
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
        fallbackUsed: true,
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
