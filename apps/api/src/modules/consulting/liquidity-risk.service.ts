import { Injectable, Logger } from "@nestjs/common";
import { CashFlowService } from "./cash-flow.service";
import { KpiService } from "./kpi.service";
import { UserContext } from "./consulting.service";

export enum RiskSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

@Injectable()
export class LiquidityRiskService {
  private readonly logger = new Logger(LiquidityRiskService.name);

  constructor(
    private readonly cashFlow: CashFlowService,
    private readonly kpi: KpiService,
  ) {}

  /**
   * АНАЛИЗ RISK GAP.
   * Проверяет проекцию на предмет кассовых разрывов.
   */
  async analyzeLiquidityRisk(context: UserContext, seasonId: string) {
    const now = new Date();
    const future = new Date();
    future.setMonth(future.getMonth() + 3); // Прогноз на 3 месяца

    const projection = await this.cashFlow.getProjectedCashFlow(
      context,
      now,
      future,
    );
    const currentPos = await this.cashFlow.getCashPosition(context);
    const kpis = await this.kpi.calculateStrategicKPIs(seasonId, context);

    // OPEX Source: Единое определение из KpiService
    const monthlyOpex = kpis.actualCost / 12; // Упрощенно для детекции буфера
    const bufferThreshold = monthlyOpex * 0.05; // 5% Buffer

    let minBalance = currentPos.netPosition;
    let gapDetected = false;
    let gapDate: string | null = null;

    projection.forEach((p) => {
      if (p.projectedBalance < minBalance) {
        minBalance = p.projectedBalance;
      }
      if (p.projectedBalance < 0 && !gapDetected) {
        gapDetected = true;
        gapDate = p.date;
      }
    });

    let severity = RiskSeverity.LOW;
    let message = "Ликвидность в норме";

    if (gapDetected) {
      severity = RiskSeverity.CRITICAL;
      message = `Обнаружен кассовый разрыв ${gapDate}. Прогнозный остаток: ${minBalance}`;
    } else if (minBalance < bufferThreshold) {
      severity = RiskSeverity.MEDIUM;
      message = `Баланс ниже порога безопасности (5% OPEX). Минимальный прогноз: ${minBalance}`;
    }

    return {
      severity,
      message,
      minProjectedBalance: minBalance,
      bufferThreshold,
      hasGap: gapDetected,
      gapDate,
    };
  }
}
