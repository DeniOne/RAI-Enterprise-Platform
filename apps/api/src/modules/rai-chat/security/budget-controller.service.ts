import { Injectable, NotFoundException } from "@nestjs/common";
import { ChangeOrderType } from "@rai/prisma-client";
import { TechMapBudgetService } from "../../tech-map/economics/tech-map-budget.service";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { RaiToolActorContext } from "../tools/rai-tools.types";
import { BudgetExceededError } from "./budget-exceeded.error";

@Injectable()
export class BudgetControllerService {
  constructor(
    private readonly budgetService: TechMapBudgetService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Проверяет, не превысит ли добавление deltaCost лимит техкарты.
   * companyId только из actorContext (SECURITY_CANON).
   */
  async validateTransaction(
    techMapId: string,
    deltaCost: number,
    actorContext: RaiToolActorContext,
  ): Promise<void> {
    const { companyId } = actorContext;
    const budget = await this.budgetService.calculateBudget(techMapId, companyId);
    const techMap = await this.prisma.techMap.findFirst({
      where: { id: techMapId, companyId },
      include: {
        field: { select: { area: true } },
        cropZone: { include: { field: { select: { area: true } } } },
      },
    });
    if (!techMap) {
      throw new NotFoundException("TechMap not found");
    }
    const area =
      techMap.field?.area ?? techMap.cropZone?.field?.area ?? 0;
    const budgetCapRubHa = techMap.budgetCapRubHa ?? 0;
    const contingencyPct = techMap.contingencyFundPct ?? 0;
    const budgetCapTotal =
      budgetCapRubHa * area * (1 + contingencyPct);
    const projected =
      Math.max(budget.totalActual, budget.totalPlanned) + deltaCost;
    if (budgetCapTotal > 0 && projected > budgetCapTotal) {
      throw new BudgetExceededError(
        `Превышен лимит бюджета техкарты: проекция ${projected.toFixed(0)} ₽ > лимит ${budgetCapTotal.toFixed(0)} ₽`,
        techMapId,
        budgetCapTotal,
        projected,
      );
    }
  }

  /**
   * CANCEL_OP не увеличивает бюджет — разрешён без проверки лимита.
   * ADD_OP, CHANGE_RATE и т.д. требуют последующей validateTransaction с конкретным deltaCost.
   */
  isChangeAllowed(
    _techMapId: string,
    changeType: ChangeOrderType,
  ): { allowed: boolean; requiresValidation: boolean } {
    if (changeType === "CANCEL_OP") {
      return { allowed: true, requiresValidation: false };
    }
    return { allowed: true, requiresValidation: true };
  }
}
