import {
  BudgetCategory,
  BudgetLine,
  ChangeOrder,
  Prisma,
} from "@rai/prisma-client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { ChangeOrderService } from "../change-order/change-order.service";
import { BudgetLineCreateDto } from "../dto/budget-line.dto";

type BudgetSummary = {
  planned: number;
  actual: number;
};

export type CalculateBudgetResult = {
  totalPlanned: number;
  totalActual: number;
  byCategory: Record<BudgetCategory, BudgetSummary>;
  withinCap: boolean;
  overCap: number;
};

@Injectable()
export class TechMapBudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changeOrderService: ChangeOrderService,
  ) {}

  async upsertBudgetLine(
    dto: BudgetLineCreateDto,
    techMapId: string,
    companyId: string,
  ): Promise<BudgetLine> {
    await this.ensureTechMapExists(techMapId, companyId);

    const data: Prisma.BudgetLineUncheckedCreateInput = {
      techMapId,
      companyId,
      category: dto.category,
      description: dto.description,
      plannedCost: dto.plannedCost,
      actualCost: dto.actualCost,
      tolerancePct:
        dto.tolerancePct ?? this.getDefaultTolerance(dto.category),
      unit: dto.unit,
      plannedQty: dto.plannedQty,
      actualQty: dto.actualQty,
      unitPrice: dto.unitPrice,
      operationId: dto.operationId,
    };

    if (dto.id) {
      return this.prisma.budgetLine.upsert({
        where: { id: dto.id },
        create: {
          id: dto.id,
          ...data,
        },
        update: data,
      });
    }

    return this.prisma.budgetLine.create({
      data,
    });
  }

  async calculateBudget(
    techMapId: string,
    companyId: string,
  ): Promise<CalculateBudgetResult> {
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
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }

    const lines = await this.prisma.budgetLine.findMany({
      where: {
        techMapId,
        companyId,
      },
    });

    const byCategory = this.createCategoryLedger();
    let totalPlanned = 0;
    let totalActual = 0;

    for (const line of lines) {
      const planned = line.plannedCost;
      const actual = line.actualCost ?? 0;

      totalPlanned += planned;
      totalActual += actual;
      byCategory[line.category].planned += planned;
      byCategory[line.category].actual += actual;
    }

    const budgetCap = (techMap.budgetCapRubHa ?? 0) * techMap.field.area;
    const trackedTotal = totalActual > 0 ? totalActual : totalPlanned;
    const overCap =
      budgetCap > 0 && trackedTotal > budgetCap ? trackedTotal - budgetCap : 0;

    return {
      totalPlanned,
      totalActual,
      byCategory,
      withinCap: overCap === 0,
      overCap,
    };
  }

  async checkOverspend(
    techMapId: string,
    companyId: string,
  ): Promise<{
    overspentLines: BudgetLine[];
    createdChangeOrders: ChangeOrder[];
  }> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      select: {
        id: true,
        version: true,
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }

    const lines = await this.prisma.budgetLine.findMany({
      where: {
        techMapId,
        companyId,
        actualCost: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const overspentLines: BudgetLine[] = [];
    const createdChangeOrders: ChangeOrder[] = [];

    for (const line of lines) {
      const tolerancePct = line.tolerancePct ?? this.getDefaultTolerance(line.category);
      const actualCost = line.actualCost ?? 0;
      const overspent = actualCost > line.plannedCost * (1 + tolerancePct);

      if (!overspent) {
        continue;
      }

      overspentLines.push(line);

      const changeOrder = await this.changeOrderService.createChangeOrder(
        techMap.id,
        {
          versionFrom: techMap.version,
          changeType: "CHANGE_RATE",
          reason: `Перерасход по категории ${line.category}`,
          diffPayload: {
            budgetLineId: line.id,
            category: line.category,
            plannedCost: line.plannedCost,
            actualCost,
            tolerancePct,
            deltaCostRub: actualCost - line.plannedCost,
          },
          deltaCostRub: actualCost - line.plannedCost,
        },
        companyId,
      );

      await this.changeOrderService.routeForApproval(changeOrder.id, companyId);

      createdChangeOrders.push(
        await this.prisma.changeOrder.findUniqueOrThrow({
          where: {
            id: changeOrder.id,
          },
        }),
      );
    }

    return { overspentLines, createdChangeOrders };
  }

  private async ensureTechMapExists(
    techMapId: string,
    companyId: string,
  ): Promise<void> {
    const techMap = await this.prisma.techMap.findFirst({
      where: {
        id: techMapId,
        companyId,
      },
      select: {
        id: true,
      },
    });

    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }
  }

  private createCategoryLedger(): Record<BudgetCategory, BudgetSummary> {
    return Object.values(BudgetCategory).reduce(
      (acc, category) => {
        acc[category] = { planned: 0, actual: 0 };
        return acc;
      },
      {} as Record<BudgetCategory, BudgetSummary>,
    );
  }

  private getDefaultTolerance(category: BudgetCategory): number {
    return category === BudgetCategory.SEEDS ? 0.05 : 0.1;
  }
}
