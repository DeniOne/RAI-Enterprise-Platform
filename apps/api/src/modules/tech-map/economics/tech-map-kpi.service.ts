import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { TechMapKPIResponseDto } from "../dto/tech-map-kpi.dto";

export interface KPICalculationInput {
  totalPlannedCost: number;
  totalActualCost?: number | null;
  areaHa: number;
  targetYieldTHa: number;
  actualYieldTHa?: number;
  marketPriceRubT: number;
  lossRiskFactor?: number;
}

@Injectable()
export class TechMapKPIService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateKPIs(
    techMapId: string,
    companyId: string,
    marketPriceRubT: number,
    lossRiskFactor = 0,
  ): Promise<TechMapKPIResponseDto> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      include: {
        field: {
          select: {
            area: true,
          },
        },
        cropZone: {
          select: {
            targetYieldTHa: true,
          },
        },
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }

    const budgetLines = await this.prisma.budgetLine.findMany({
      where: {
        techMapId,
        companyId,
      },
    });

    const totalPlannedCost = budgetLines.reduce(
      (sum, line) => sum + line.plannedCost,
      0,
    );
    const hasActuals = budgetLines.some((line) => line.actualCost != null);
    const totalActualCost = hasActuals
      ? budgetLines.reduce((sum, line) => sum + (line.actualCost ?? 0), 0)
      : null;

    return this.computeKPIs({
      totalPlannedCost,
      totalActualCost,
      areaHa: techMap.field.area,
      targetYieldTHa: techMap.cropZone?.targetYieldTHa ?? 0,
      marketPriceRubT,
      lossRiskFactor,
    });
  }

  computeKPIs(input: KPICalculationInput): TechMapKPIResponseDto {
    const costPerHa = input.areaHa > 0 ? input.totalPlannedCost / input.areaHa : 0;
    const costPerTon =
      input.targetYieldTHa > 0 ? costPerHa / input.targetYieldTHa : Number.POSITIVE_INFINITY;
    const grossRevenuePerHa = input.targetYieldTHa * input.marketPriceRubT;
    const marginPerHa = grossRevenuePerHa - costPerHa;
    const marginPct =
      grossRevenuePerHa > 0 ? (marginPerHa / grossRevenuePerHa) * 100 : 0;
    const riskAdjustedMarginPerHa =
      grossRevenuePerHa - costPerHa * (1 + (input.lossRiskFactor ?? 0));
    const variancePct =
      input.totalActualCost != null && input.totalPlannedCost !== 0
        ? ((input.totalActualCost - input.totalPlannedCost) /
            input.totalPlannedCost) *
          100
        : null;

    return {
      costPerHa,
      costPerTon,
      grossRevenuePerHa,
      marginPerHa,
      marginPct,
      riskAdjustedMarginPerHa,
      variancePct,
    };
  }

  async recalculate(
    techMapId: string,
    companyId: string,
    marketPriceRubT: number,
    lossRiskFactor = 0,
  ): Promise<TechMapKPIResponseDto> {
    return this.calculateKPIs(
      techMapId,
      companyId,
      marketPriceRubT,
      lossRiskFactor,
    );
  }
}
