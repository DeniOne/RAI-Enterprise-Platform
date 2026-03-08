import { Injectable } from "@nestjs/common";
import { RaiToolName, RaiToolActorContext } from "../tools/rai-tools.types";
import type {
  ComputePlanFactResult,
  SimulateScenarioResult,
  ComputeRiskAssessmentResult,
} from "../tools/rai-tools.types";
import { FinanceToolsRegistry } from "../tools/finance-tools.registry";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";

export type EconomistIntent =
  | "compute_plan_fact"
  | "simulate_scenario"
  | "compute_risk_assessment";

export interface EconomistAgentInput {
  companyId: string;
  traceId: string;
  intent: EconomistIntent;
  scope?: { planId?: string; seasonId?: string };
}

export interface EconomistAgentResult {
  agentName: "EconomistAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  missingContext: string[];
  explain: string;
  toolCallsCount: number;
  traceId: string;
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

const INTENT_TOOL: Record<EconomistIntent, RaiToolName> = {
  compute_plan_fact: RaiToolName.ComputePlanFact,
  simulate_scenario: RaiToolName.SimulateScenario,
  compute_risk_assessment: RaiToolName.ComputeRiskAssessment,
};

type FinanceToolName =
  | RaiToolName.ComputePlanFact
  | RaiToolName.SimulateScenario
  | RaiToolName.ComputeRiskAssessment;

function explainPlanFact(d: ComputePlanFactResult): string {
  if (!d.hasData) {
    return "Данных по плану пока нет. Заполните факт исполнения для расчёта ROI и маржинальности.";
  }
  const deltaCost = d.totalPlannedCost > 0 ? d.totalActualCost - d.totalPlannedCost : 0;
  const parts = [
    `План ${d.planId}: ROI ${(d.roi * 100).toFixed(1)}%, EBITDA ${d.ebitda.toLocaleString("ru-RU")} ₽.`,
    `Выручка: ${d.revenue.toLocaleString("ru-RU")} ₽, факт затрат: ${d.totalActualCost.toLocaleString("ru-RU")} ₽ (план: ${d.totalPlannedCost.toLocaleString("ru-RU")} ₽).`,
  ];
  if (deltaCost !== 0) {
    parts.push(`Δ затрат: ${deltaCost > 0 ? "+" : ""}${deltaCost.toLocaleString("ru-RU")} ₽.`);
  }
  return parts.join(" ");
}

function explainScenario(d: SimulateScenarioResult): string {
  return `Сценарий ${d.scenarioId}: ROI ${(d.roi * 100).toFixed(1)}%, EBITDA ${d.ebitda.toLocaleString("ru-RU")} ₽ (источник: ${d.source}).`;
}

function explainRisk(d: ComputeRiskAssessmentResult): string {
  const factors = d.factors?.length ? ` Факторы: ${d.factors.join(", ")}.` : "";
  return `План ${d.planId}: уровень риска ${d.riskLevel}.${factors}`;
}

@Injectable()
export class EconomistAgent {
  constructor(
    private readonly financeToolsRegistry: FinanceToolsRegistry,
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly promptAssembly: AgentPromptAssemblyService,
  ) {}

  async run(
    input: EconomistAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<EconomistAgentResult> {
    if (
      input.intent === "compute_plan_fact" &&
      !input.scope?.planId &&
      !input.scope?.seasonId
    ) {
      return {
        agentName: "EconomistAgent",
        status: "NEEDS_MORE_DATA",
        data: {},
        confidence: 0,
        missingContext: ["seasonId"],
        explain: "Не хватает контекста: seasonId",
        toolCallsCount: 0,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: false,
      };
    }

    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
    };
    const toolName = INTENT_TOOL[input.intent];
    try {
      const data = await this.financeToolsRegistry.execute(
        toolName as FinanceToolName,
        { scope: input.scope ?? {} },
        actorContext,
      );
      let explain =
        input.intent === "compute_plan_fact"
          ? explainPlanFact(data as ComputePlanFactResult)
          : input.intent === "simulate_scenario"
            ? explainScenario(data as SimulateScenarioResult)
            : explainRisk(data as ComputeRiskAssessmentResult);
      let fallbackUsed = true;

      if (options?.kernel && options.request) {
        try {
          const llm = await this.openRouterGateway.generate({
            traceId: input.traceId,
            agentRole: "economist",
            model: options.kernel.runtimeProfile.model,
            messages: this.promptAssembly.buildMessages(options.kernel, options.request).concat([
              {
                role: "user",
                content: `Finance result: ${JSON.stringify(data)}. Explain tradeoffs and caveats without inventing new facts.`,
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
        agentName: "EconomistAgent",
        status: "COMPLETED",
        data,
        confidence: fallbackUsed ? 0.85 : 0.9,
        missingContext: [],
        explain,
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: this.buildEvidence(input, toolName as FinanceToolName),
        fallbackUsed,
      };
    } catch (err) {
      return {
        agentName: "EconomistAgent",
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

  private buildEvidence(
    input: EconomistAgentInput,
    toolName: FinanceToolName,
  ): EvidenceReference[] {
    const claimBase =
      input.intent === "compute_plan_fact"
        ? "Финансовый анализ плана выполнен на основе детерминированных расчётов ComputePlanFact."
        : input.intent === "simulate_scenario"
          ? "Сценарный анализ выполнен на основе детерминированных расчётов SimulateScenario."
          : "Оценка риска выполнена на основе детерминированных расчётов ComputeRiskAssessment.";

    return [
      {
        claim: claimBase,
        sourceType: "TOOL_RESULT",
        sourceId: toolName,
        confidenceScore: 0.9,
      },
    ];
  }
}
