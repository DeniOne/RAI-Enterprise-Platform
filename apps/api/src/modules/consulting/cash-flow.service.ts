import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { UserContext } from "./consulting.service";
import { CashDirection, CashFlowType, Prisma } from "@rai/prisma-client";

@Injectable()
export class CashFlowService {
  private readonly logger = new Logger(CashFlowService.name);

  constructor(private readonly prisma: PrismaService) {}

  private d(val: any): Prisma.Decimal {
    return new Prisma.Decimal(val || 0);
  }

  /**
   * РАССЧЕТ ТЕКУЩЕЙ КАССОВОЙ ПОЗИЦИИ (As of Date).
   * Формула: Σ Inflows - Σ Outflows (включая BOOTSTRAP).
   */
  async getCashPosition(context: UserContext, asOfDate: Date = new Date()) {
    this.logger.debug(
      `Calculating cash position for company ${context.companyId} as of ${asOfDate.toISOString()}`,
    );

    const aggregations = await this.prisma.ledgerEntry.groupBy({
      by: ["cashDirection"],
      where: {
        companyId: context.companyId,
        cashImpact: true,
        createdAt: { lte: asOfDate },
      },
      _sum: { amount: true },
    });

    let totalInflow = this.d(0);
    let totalOutflow = this.d(0);

    for (const agg of aggregations) {
      if (agg.cashDirection === CashDirection.INFLOW) {
        totalInflow = totalInflow.plus(this.d(agg._sum.amount));
      } else if (agg.cashDirection === CashDirection.OUTFLOW) {
        totalOutflow = totalOutflow.plus(this.d(agg._sum.amount));
      }
    }

    return {
      asOfDate,
      totalInflow: totalInflow.toNumber(),
      totalOutflow: totalOutflow.toNumber(),
      netPosition: totalInflow.minus(totalOutflow).toNumber(),
    };
  }

  /**
   * ПРОГНОЗ ДЕНЕЖНЫХ ПОТОКОВ (Projected Cash Flow).
   * Основан на dueDate зафиксированных обязательств в Ledger.
   */
  async getProjectedCashFlow(
    context: UserContext,
    startDate: Date,
    endDate: Date,
  ) {
    this.logger.debug(
      `Calculating projected cash flow for company ${context.companyId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        companyId: context.companyId,
        cashImpact: true,
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Группировка по дням для проекции
    const projection: any[] = [];
    const currentBalance = (await this.getCashPosition(context, startDate))
      .netPosition;

    // Инициализируем карту дат
    const dateMap = new Map<
      string,
      { inflow: Prisma.Decimal; outflow: Prisma.Decimal }
    >();

    entries.forEach((entry) => {
      const dateStr = entry.dueDate!.toISOString().split("T")[0];
      const current = dateMap.get(dateStr) || {
        inflow: this.d(0),
        outflow: this.d(0),
      };

      if (entry.cashDirection === CashDirection.INFLOW) {
        current.inflow = current.inflow.plus(this.d(entry.amount));
      } else {
        current.outflow = current.outflow.plus(this.d(entry.amount));
      }
      dateMap.set(dateStr, current);
    });

    // Формируем таймлайн
    const dates = Array.from(dateMap.keys()).sort();
    let runningBalance = this.d(currentBalance);

    dates.forEach((date) => {
      const val = dateMap.get(date)!;
      runningBalance = runningBalance.plus(val.inflow).minus(val.outflow);
      projection.push({
        date,
        inflow: val.inflow.toNumber(),
        outflow: val.outflow.toNumber(),
        projectedBalance: runningBalance.toNumber(),
      });
    });

    return projection;
  }

  /**
   * РАССЧЕТ BURN RATE (OPERATING ONLY).
   * Среднемесячный чистый отток по операционной деятельности.
   */
  async getBurnRate(context: UserContext, lastMonths: number = 3) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - lastMonths);

    const aggregations = await this.prisma.ledgerEntry.groupBy({
      by: ["cashDirection"],
      where: {
        companyId: context.companyId,
        cashImpact: true,
        cashFlowType: CashFlowType.OPERATING,
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    let totalOutflow = this.d(0);
    aggregations.forEach((agg) => {
      if (agg.cashDirection === CashDirection.OUTFLOW) {
        totalOutflow = totalOutflow.plus(this.d(agg._sum.amount));
      }
    });

    const burnRate = totalOutflow.div(lastMonths);

    return {
      periodMonths: lastMonths,
      totalOperatingOutflow: totalOutflow.toNumber(),
      monthlyBurnRate: burnRate.toNumber(),
    };
  }
}
