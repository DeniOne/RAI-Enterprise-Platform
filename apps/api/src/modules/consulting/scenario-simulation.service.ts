import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { KpiService } from "./kpi.service";
import { UserContext } from "./consulting.service";
import { Prisma } from "@rai/prisma-client";

export interface SimulationOverrides {
  priceDeviationPercent?: number; // +/- % к рыночной цене
  yieldDeviationPercent?: number; // +/- % к урожайности
  costDeviationPercent?: number; // +/- % к затратам (Ledger)
}

@Injectable()
export class ScenarioSimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
  ) {}

  /**
   * Симуляция сценария "What-if" БЕЗ изменения данных в БД.
   * Использует Virtual Layer: Snapshot -> Pre-calculation Overrides -> KPI Projection.
   */
  async simulateSeason(
    seasonId: string,
    overrides: SimulationOverrides,
    context: UserContext,
  ) {
    // 1. Получаем базовые данные для расчета (аналог логики KpiService, но с перехватом)
    const harvestResults = await this.prisma.harvestResult.findMany({
      where: { seasonId, companyId: context.companyId },
    });

    const ledgerSummary = await this.prisma.ledgerEntry.aggregate({
      where: {
        execution: {
          operation: { mapStage: { techMap: { seasonId: seasonId } } },
        },
        companyId: context.companyId,
      },
      _sum: { amount: true },
    });

    // 2. Применяем оверрайды (Virtual Layer)
    const d = (v: any) => new Prisma.Decimal(v || 0);
    const pMult = d(1).plus(d(overrides.priceDeviationPercent || 0).div(100));
    const yMult = d(1).plus(d(overrides.yieldDeviationPercent || 0).div(100));
    const cMult = d(1).plus(d(overrides.costDeviationPercent || 0).div(100));

    // ПроекцияRevenue
    const simulatedRevenue = harvestResults.reduce((acc, r) => {
      const yield_ = d(r.totalOutput).mul(yMult);
      const price = d(r.marketPrice).mul(pMult);
      return acc.plus(yield_.mul(price));
    }, d(0));

    // Проекция Cost
    const simulatedCost = d(ledgerSummary._sum.amount).mul(cMult);

    // 3. Расчет прогнозных KPI
    const ebitda = simulatedRevenue.minus(simulatedCost);
    const roi = simulatedCost.gt(0) ? ebitda.div(simulatedCost).mul(100) : d(0);

    // Получаем Baseline для сравнения
    const baseline = await this.kpiService.calculateStrategicKPIs(
      seasonId,
      context,
    );

    return {
      baseline: {
        revenue: baseline.revenue,
        cost: baseline.actualCost,
        ebitda: baseline.ebitda,
        roi: baseline.roi,
      },
      simulated: {
        revenue: this.round(simulatedRevenue),
        cost: this.round(simulatedCost),
        ebitda: this.round(ebitda),
        roi: this.round(roi),
      },
      delta: {
        ebitda: this.round(ebitda.minus(d(baseline.ebitda))),
        roi: this.round(roi.minus(d(baseline.roi))),
      },
      overrides,
    };
  }

  private round(val: Prisma.Decimal): number {
    return val.toDecimalPlaces(2).toNumber();
  }
}
