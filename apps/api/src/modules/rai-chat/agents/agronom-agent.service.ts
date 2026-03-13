import { Injectable } from "@nestjs/common";
import { RaiToolName, RaiToolActorContext } from "../tools/rai-tools.types";
import { AgroToolsRegistry } from "../tools/agro-tools.registry";
import type { ExplainableResult } from "../../../shared/rai-chat/explainable-result.types";
import { AgroDeterministicEngineFacade } from "../deterministic/agro-deterministic.facade";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";

export interface AgronomAgentInput {
  companyId: string;
  traceId: string;
  intent: "generate_tech_map_draft" | "compute_deviations";
  fieldRef?: string;
  seasonRef?: string;
  crop?: "rapeseed" | "sunflower";
  scope?: { seasonId?: string; fieldId?: string };
}

export interface AgronomAgentResult {
  agentName: "AgronomAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  missingContext: string[];
  explain: string;
  toolCallsCount: number;
  traceId: string;
  mathBasis?: ExplainableResult<unknown>[];
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

@Injectable()
export class AgronomAgent {
  constructor(
    private readonly agroToolsRegistry: AgroToolsRegistry,
    private readonly agroFacade: AgroDeterministicEngineFacade,
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly promptAssembly: AgentPromptAssemblyService,
  ) {}

  async run(
    input: AgronomAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<AgronomAgentResult> {
    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
    };

    if (input.intent === "generate_tech_map_draft") {
      const missing: string[] = [];
      if (!input.fieldRef) missing.push("fieldRef");
      if (!input.seasonRef) missing.push("seasonRef");
      if (missing.length > 0) {
        return {
          agentName: "AgronomAgent",
          status: "NEEDS_MORE_DATA",
          data: {},
          confidence: 0,
          missingContext: missing,
          explain: `Не хватает контекста: ${missing.join(", ")}`,
          toolCallsCount: 0,
          traceId: input.traceId,
          evidence: [],
          fallbackUsed: false,
        };
      }

      try {
        const data = await this.agroToolsRegistry.execute(
          RaiToolName.GenerateTechMapDraft,
          {
            fieldRef: input.fieldRef!,
            seasonRef: input.seasonRef!,
            crop: input.crop ?? "rapeseed",
          },
          actorContext,
        );
        const mathBasis = this.buildMathBasis();
        const evidence: EvidenceReference[] = [
          {
            claim: "Агрономический черновик основан на deterministic tech map generation.",
            sourceType: "TOOL_RESULT",
            sourceId: RaiToolName.GenerateTechMapDraft,
            confidenceScore: 0.92,
          },
        ];
        const synthesis = await this.synthesize(
          options?.kernel,
          options?.request,
          data,
          "Сформируй краткую agronomic рекомендацию с допущениями и отметь, что вывод governed и требует review для write-действий.",
          "Черновик создан детерминированно. Использован governed fallback без LLM.",
        );
        return {
          agentName: "AgronomAgent",
          status: "COMPLETED",
          data,
          confidence: synthesis.fallbackUsed ? 0.6 : 0.78,
          missingContext: [],
          explain: synthesis.text,
          toolCallsCount: 1,
          traceId: input.traceId,
          mathBasis: mathBasis.length > 0 ? mathBasis : undefined,
          evidence,
          fallbackUsed: synthesis.fallbackUsed,
        };
      } catch (err) {
        return {
          agentName: "AgronomAgent",
          status: "FAILED",
          data: {},
          confidence: 0,
          missingContext: [],
          explain: String((err as Error).message),
          toolCallsCount: 1,
          traceId: input.traceId,
          evidence: [],
          fallbackUsed: true,
        };
      }
    }

    try {
      const data = await this.agroToolsRegistry.execute(
        RaiToolName.ComputeDeviations,
        { scope: input.scope ?? {} },
        actorContext,
      );
      const evidence: EvidenceReference[] = [
        {
          claim: "Отклонения получены из deterministic agro deviations tool.",
          sourceType: "TOOL_RESULT",
          sourceId: RaiToolName.ComputeDeviations,
          confidenceScore: 0.95,
        },
      ];
      const synthesis = await this.synthesize(
        options?.kernel,
        options?.request,
        data,
        "Объясни agronomic deviations кратко, без галлюцинаций, со ссылкой на недостаток данных если это уместно.",
        "Отклонения получены из AgroToolsRegistry. Использован deterministic fallback.",
      );
      return {
        agentName: "AgronomAgent",
        status: "COMPLETED",
        data,
        confidence: synthesis.fallbackUsed ? 0.9 : 0.94,
        missingContext: [],
        explain: synthesis.text,
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence,
        fallbackUsed: synthesis.fallbackUsed,
      };
    } catch (err) {
      return {
        agentName: "AgronomAgent",
        status: "FAILED",
        data: {},
        confidence: 0,
        missingContext: [],
        explain: String((err as Error).message),
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: true,
      };
    }
  }

  private buildMathBasis(): ExplainableResult<unknown>[] {
    const mathBasis: ExplainableResult<unknown>[] = [];
    try {
      const seeding = this.agroFacade.computeSeedingRate({
        targetDensityMlnHa: 1.2,
        thousandSeedWeightG: 4.5,
        labGerminationPct: 95,
        fieldGerminationPct: 85,
      });
      mathBasis.push(seeding as ExplainableResult<unknown>);
    } catch {
      return [];
    }
    return mathBasis;
  }

  private async synthesize(
    kernel: EffectiveAgentKernelEntry | undefined,
    request: AgentExecutionRequest | undefined,
    data: unknown,
    instruction: string,
    fallbackText: string,
  ): Promise<{ text: string; fallbackUsed: boolean }> {
    if (!kernel || !request) {
      return { text: fallbackText, fallbackUsed: true };
    }

    try {
      const llm = await this.openRouterGateway.generate({
        traceId: request.traceId,
        agentRole: "agronomist",
        model: kernel.runtimeProfile.model,
        messages: this.promptAssembly.buildMessages(kernel, request).concat([
          {
            role: "user",
            content: `${instruction}\nDeterministic result: ${JSON.stringify(data)}`,
          },
        ]),
        temperature: kernel.runtimeProfile.temperature,
        maxTokens: kernel.runtimeProfile.maxOutputTokens,
        timeoutMs: kernel.runtimeProfile.timeoutMs,
      });
      return { text: llm.outputText, fallbackUsed: false };
    } catch {
      return { text: fallbackText, fallbackUsed: true };
    }
  }
}
