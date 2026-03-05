import { Injectable } from "@nestjs/common";
import { RaiToolName } from "../tools/rai-tools.types";
import type {
  ComputePlanFactResult,
  SimulateScenarioResult,
  ComputeRiskAssessmentResult,
} from "../tools/rai-tools.types";
import { FinanceToolsRegistry } from "../tools/finance-tools.registry";
import { RaiToolActorContext } from "../tools/rai-tools.types";

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
  explain: string;
  toolCallsCount: number;
  traceId: string;
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
  constructor(private readonly financeToolsRegistry: FinanceToolsRegistry) {}

  async run(input: EconomistAgentInput): Promise<EconomistAgentResult> {
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
      let explain: string;
      if (input.intent === "compute_plan_fact") {
        explain = explainPlanFact(data as ComputePlanFactResult);
      } else if (input.intent === "simulate_scenario") {
        explain = explainScenario(data as SimulateScenarioResult);
      } else {
        explain = explainRisk(data as ComputeRiskAssessmentResult);
      }
      return {
        agentName: "EconomistAgent",
        status: "COMPLETED",
        data,
        confidence: 0.85,
        explain,
        toolCallsCount: 1,
        traceId: input.traceId,
      };
    } catch (err) {
      return {
        agentName: "EconomistAgent",
        status: "FAILED",
        data: {},
        confidence: 0,
        explain: String((err as Error).message),
        toolCallsCount: 1,
        traceId: input.traceId,
      };
    }
  }
}
