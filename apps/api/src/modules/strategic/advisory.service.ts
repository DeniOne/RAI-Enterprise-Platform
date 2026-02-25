import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  AdvisorySignalDto,
  AdvisorySignalType,
  AdvisoryLevel,
  AdvisoryTrend,
  AdvisoryTraceStatus,
} from "./dto/advisory-signal.dto";
import { AIExplainabilityDto } from "../../shared/dto/explainability.dto";
import { CanonicalJsonBuilder } from "../../shared/crypto/canonical-json.builder";
// Native Date math
const subDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

@Injectable()
export class AdvisoryService {
  constructor(private readonly prisma: PrismaService) {}

  private buildExplainability(
    verdict: string,
    confidence: number,
    factors: Array<{
      name: string;
      weight: number;
      impact: number;
      description?: string;
    }>,
    inputPayload: Record<string, unknown>,
    ledgerTraceId: string,
    counterfactuals?: Array<{
      scenarioName: string;
      deltaInput: Record<string, unknown>;
      expectedOutcome: string;
      probabilityShift: number;
    }>,
  ): AIExplainabilityDto {
    const explainabilityPayload = {
      confidence,
      verdict,
      factors,
      counterfactuals,
      limitationsDisclosed: true,
    };

    return {
      ...explainabilityPayload,
      forensic: {
        modelVersion: "strategic-advisory-v1",
        inferenceTimestamp: new Date().toISOString(),
        inputCanonicalHash: CanonicalJsonBuilder.hash(inputPayload),
        explainabilityCanonicalHash: CanonicalJsonBuilder.hash(
          explainabilityPayload,
        ),
        ledgerTraceId,
        environment:
          process.env.NODE_ENV === "production"
            ? "prod"
            : process.env.NODE_ENV === "staging"
              ? "staging"
              : "dev",
      },
    };
  }

  async getCompanyHealth(companyId: string): Promise<AdvisorySignalDto> {
    const activePlans = await this.prisma.harvestPlan.count({
      where: { companyId, status: "ACTIVE" },
    });

    if (activePlans === 0) {
      const ledgerTraceId = `advisory:company-health:${companyId}`;
      return {
        type: AdvisorySignalType.HEALTH,
        level: AdvisoryLevel.LOW,
        score: 0,
        message: "No active plans found for this company",
        confidence: 0,
        trend: AdvisoryTrend.STABLE,
        sources: ["NO_ACTIVE_PLANS"],
        explainability: this.buildExplainability(
          "INSUFFICIENT_EVIDENCE",
          0,
          [
            {
              name: "No active plans",
              weight: 1,
              impact: -1,
              description: "No active plans were found for this company.",
            },
          ],
          { companyId, activePlans },
          ledgerTraceId,
        ),
        traceStatus: AdvisoryTraceStatus.AVAILABLE,
        ledgerTraceId,
      };
    }

    const openDeviations = await this.prisma.deviationReview.count({
      where: { companyId, status: "DETECTED" },
    });

    const closedDeviations = await this.prisma.deviationReview.findMany({
      where: {
        companyId,
        status: "CLOSED",
        updatedAt: { gte: subDays(new Date(), 30) },
      },
      select: { createdAt: true, updatedAt: true },
    });

    const avgClosureDays =
      closedDeviations.length > 0
        ? closedDeviations.reduce(
            (acc, d) => acc + (d.updatedAt.getTime() - d.createdAt.getTime()),
            0,
          ) /
          (closedDeviations.length * 1000 * 60 * 60 * 24)
        : 0;

    const lockedBudgets = await this.prisma.budgetPlan.count({
      where: {
        companyId,
        status: "LOCKED",
        harvestPlanActive: { status: "ACTIVE" },
      },
    });

    const overspendingBudgets = await this.prisma.budgetItem.aggregate({
      _sum: {
        plannedAmount: true,
        actualAmount: true,
      },
      where: {
        budgetPlan: { companyId, status: "LOCKED" },
        actualAmount: { gt: 0 },
      },
    });

    const totalPlanned = Number(overspendingBudgets._sum.plannedAmount) || 0;
    const totalActual = Number(overspendingBudgets._sum.actualAmount) || 0;
    const overrunRate =
      totalPlanned > 0
        ? Math.max(0, (totalActual - totalPlanned) / totalPlanned)
        : 0;

    // --- FORMULAS ---
    const D_ratio = openDeviations / activePlans;
    const score_D = Math.max(0, Math.min(100, 100 - D_ratio * 100));
    const score_C = Math.max(0, Math.min(100, 100 - avgClosureDays * 10));
    const score_B = (lockedBudgets / activePlans) * 100;
    const score_F = Math.max(0, Math.min(100, 100 - overrunRate * 100));

    const finalScore =
      score_D * 0.3 + score_C * 0.3 + score_B * 0.2 + score_F * 0.2;

    // --- CONFIDENCE ---
    const conf_deviations = Math.min(
      1,
      (openDeviations + closedDeviations.length) / 5,
    );
    const conf_budgets = Math.min(1, lockedBudgets / 3);
    const confidence = Math.min(conf_deviations, conf_budgets);

    // --- TREND (Simplified for MVP, would normally compare with a snapshot) ---
    const trend = AdvisoryTrend.STABLE;

    const sources = [];
    if (D_ratio > 0.5) sources.push("HIGH_DEVIATION_RATIO");
    if (avgClosureDays > 5) sources.push("SLOW_DEVIATION_CLOSURE");
    if (score_B < 80) sources.push("LOW_BUDGET_LOCK_RATE");
    if (overrunRate > 0.1) sources.push("BUDGET_OVERRUN_DETECTED");
    const level =
      finalScore > 70
        ? AdvisoryLevel.HIGH
        : finalScore > 30
          ? AdvisoryLevel.MEDIUM
          : AdvisoryLevel.LOW;
    const ledgerTraceId = `advisory:company-health:${companyId}:${new Date().toISOString().slice(0, 10)}`;
    const factors = [
      {
        name: "Deviation ratio",
        weight: 0.3,
        impact: (score_D - 50) / 50,
        description: `Open deviations to active plans ratio: ${D_ratio.toFixed(2)}.`,
      },
      {
        name: "Deviation closure speed",
        weight: 0.3,
        impact: (score_C - 50) / 50,
        description: `Average closure days over last 30d: ${avgClosureDays.toFixed(2)}.`,
      },
      {
        name: "Budget lock coverage",
        weight: 0.2,
        impact: (score_B - 50) / 50,
        description: `Locked budgets coverage: ${score_B.toFixed(2)}%.`,
      },
      {
        name: "Budget overrun pressure",
        weight: 0.2,
        impact: (score_F - 50) / 50,
        description: `Observed overrun rate: ${(overrunRate * 100).toFixed(2)}%.`,
      },
    ];

    return {
      type: AdvisorySignalType.HEALTH,
      level,
      score: Math.round(finalScore),
      message: `Company health indexed at ${Math.round(finalScore)}%`,
      confidence,
      trend,
      sources,
      explainability: this.buildExplainability(
        level === AdvisoryLevel.HIGH
          ? "FAVORABLE"
          : level === AdvisoryLevel.MEDIUM
            ? "WATCH"
            : "CRITICAL",
        confidence,
        factors,
        {
          companyId,
          activePlans,
          openDeviations,
          avgClosureDays,
          lockedBudgets,
          overrunRate,
          score_D,
          score_C,
          score_B,
          score_F,
          finalScore,
          confidence,
          trend,
          sources,
        },
        ledgerTraceId,
      ),
      traceStatus: AdvisoryTraceStatus.AVAILABLE,
      ledgerTraceId,
    };
  }

  async getPlanVolatility(
    planId: string,
    companyId: string,
  ): Promise<AdvisorySignalDto> {
    const plan = await this.prisma.harvestPlan.findFirst({
      where: { id: planId, companyId },
      include: {
        _count: {
          select: {
            deviationReviews: true,
            budgetPlans: true, // used as proxy for adjustments here
          },
        },
      },
    });

    if (!plan) throw new Error("Plan not found");

    const decisionsCount = await this.prisma.cmrDecision.count({
      where: {
        season: {
          companyId: plan.companyId,
          techMaps: { some: { harvestPlanId: planId } },
        },
      },
    });

    // Scale-Invariant Index (simplified for single plan)
    const volatility = Math.min(
      100,
      plan._count.deviationReviews * 20 +
        plan._count.budgetPlans * 10 +
        decisionsCount * 10,
    );
    const level =
      volatility > 70
        ? AdvisoryLevel.HIGH
        : volatility > 30
          ? AdvisoryLevel.MEDIUM
          : AdvisoryLevel.LOW;
    const ledgerTraceId = `advisory:plan-volatility:${planId}:${new Date().toISOString().slice(0, 10)}`;
    const confidence = 1;
    const factors = [
      {
        name: "Deviation pressure",
        weight: 0.5,
        impact: Math.min(1, plan._count.deviationReviews / 5),
        description: `Deviation reviews count: ${plan._count.deviationReviews}.`,
      },
      {
        name: "Budget adjustment churn",
        weight: 0.25,
        impact: Math.min(1, plan._count.budgetPlans / 5),
        description: `Budget plan versions count: ${plan._count.budgetPlans}.`,
      },
      {
        name: "Decision churn",
        weight: 0.25,
        impact: Math.min(1, decisionsCount / 5),
        description: `Decision count tied to plan season: ${decisionsCount}.`,
      },
    ];

    return {
      type: AdvisorySignalType.STABILITY,
      level,
      score: Math.round(volatility),
      message: `Plan stability risk is ${volatility > 70 ? "CRITICAL" : volatility > 30 ? "ELEVATED" : "LOW"}`,
      confidence, // Direct data
      trend: AdvisoryTrend.STABLE,
      sources: plan._count.deviationReviews > 2 ? ["HIGH_DEVIATION_COUNT"] : [],
      explainability: this.buildExplainability(
        level === AdvisoryLevel.HIGH
          ? "UNSTABLE"
          : level === AdvisoryLevel.MEDIUM
            ? "VOLATILE"
            : "STABLE",
        confidence,
        factors,
        {
          planId,
          companyId,
          deviationReviews: plan._count.deviationReviews,
          budgetPlans: plan._count.budgetPlans,
          decisionsCount,
          volatility,
          level,
        },
        ledgerTraceId,
      ),
      traceStatus: AdvisoryTraceStatus.AVAILABLE,
      ledgerTraceId,
    };
  }
}
