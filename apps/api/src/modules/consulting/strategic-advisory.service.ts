import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { KpiService } from "./kpi.service";
import { ScenarioSimulationService } from "./scenario-simulation.service";
import { UserContext } from "./consulting.service";
import { Prisma, BudgetStatus } from "@rai/prisma-client";
import { LiquidityRiskService } from "./liquidity-risk.service";

export interface AdvisoryRisk {
  score: number; // 0-100
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  linkedKpi: string;
  recommendation: string;
}

@Injectable()
export class StrategicAdvisoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
    private readonly simulationService: ScenarioSimulationService,
    private readonly liquidityRisk: LiquidityRiskService,
  ) {}

  /**
   * Анализ стратегических рисков и генерация консультаций
   */
  async getAdvisory(seasonId: string, context: UserContext) {
    const baseline = await this.kpiService.calculateStrategicKPIs(
      seasonId,
      context,
    );
    const risks: AdvisoryRisk[] = [];

    // 1. Анализ чувствительности (Yield Sensitivity)
    // Что если урожайность упадет на 10%?
    const yieldStress = await this.simulationService.simulateSeason(
      seasonId,
      { yieldDeviationPercent: -10 },
      context,
    );
    if (yieldStress.simulated.roi < 5) {
      risks.push({
        score: 75,
        level: "HIGH",
        reason:
          "Высокая чувствительность к урожайности. Падение на 10% делает проект нерентабельным (ROI < 5%)",
        linkedKpi: "ROI",
        recommendation:
          "Рассмотреть страхование урожая или пересмотр структуры затрат.",
      });
    }

    // 2. АНАЛИЗ ЛИКВИДНОСТИ (Phase 5: Financial Stability)
    const liquidity = await this.liquidityRisk.analyzeLiquidityRisk(
      context,
      seasonId,
    );
    if (liquidity.severity !== "LOW") {
      risks.push({
        score: liquidity.severity === "CRITICAL" ? 95 : 60,
        level: liquidity.severity as any,
        reason: `Риск финансовой стабильности: ${liquidity.message}`,
        linkedKpi: "Cash Balance",
        recommendation: liquidity.hasGap
          ? "Срочная реструктуризация платежей или привлечение краткосрочного финансирования."
          : "Рекомендуется оптимизация оборотного капитала для восстановления буфера ликвидности.",
      });
    }

    // 3. Анализ перерасхода бюджета
    const budget = await this.prisma.budgetPlan.findFirst({
      where: {
        seasonId,
        companyId: context.companyId,
        status: BudgetStatus.LOCKED,
      },
      include: { items: true },
    });

    if (budget) {
      const actualCost = new Prisma.Decimal(baseline.actualCost);
      const plannedCost = new Prisma.Decimal(baseline.plannedCost);

      if (actualCost.gt(plannedCost.mul(1.05))) {
        risks.push({
          score: 85,
          level: "CRITICAL",
          reason: `Превышение операционного бюджета на ${actualCost.minus(plannedCost).toFixed(2)} (> 5%)`,
          linkedKpi: "Cost",
          recommendation:
            "Срочный аудит Ledger-записей по категории Fertilizer/Fuel.",
        });
      }
    }

    // 4. Анализ рыночной волатильности
    const priceStress = await this.simulationService.simulateSeason(
      seasonId,
      { priceDeviationPercent: -15 },
      context,
    );
    if (priceStress.delta.ebitda < -1000000) {
      // Порог 1 млн (условный)
      risks.push({
        score: 60,
        level: "MEDIUM",
        reason:
          "Прогноз значительного падения прибыли при коррекции рыночных цен на 15%",
        linkedKpi: "EBITDA",
        recommendation:
          "Рекомендуется фиксация цены через форвардные контракты.",
      });
    }

    return {
      seasonId,
      complianceScore: this.calculateComplianceScore(risks),
      risks,
      generatedAt: new Date(),
      financialStability: liquidity.severity !== "LOW" ? "RISKY" : "STABLE", // Phase 5 Label
    };
  }

  private calculateComplianceScore(risks: AdvisoryRisk[]): number {
    if (risks.length === 0) return 100;
    const totalPenalty = risks.reduce((acc, r) => acc + r.score / 2, 0);
    return Math.max(0, 100 - totalPenalty);
  }
}
