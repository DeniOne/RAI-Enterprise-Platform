import { ChangeOrder } from "@rai/prisma-client";
import { Injectable } from "@nestjs/common";
import {
  EvaluationContext,
  TriggerEvaluationService,
} from "../adaptive-rules/trigger-evaluation.service";
import { TechMapKPIResponseDto } from "../dto/tech-map-kpi.dto";
import {
  CalculateBudgetResult,
  TechMapBudgetService,
} from "./tech-map-budget.service";
import { TechMapKPIService } from "./tech-map-kpi.service";

export interface RecalculationEvent {
  type:
    | "CHANGE_ORDER_APPLIED"
    | "ACTUAL_YIELD_UPDATED"
    | "PRICE_CHANGED"
    | "TRIGGER_FIRED";
  techMapId: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class RecalculationEngine {
  constructor(
    private readonly budgetService: TechMapBudgetService,
    private readonly kpiService: TechMapKPIService,
    private readonly triggerService: TriggerEvaluationService,
  ) {}

  async onEvent(
    event: RecalculationEvent,
    companyId: string,
    marketPriceRubT: number,
    lossRiskFactor?: number,
  ): Promise<{
    updatedBudget: CalculateBudgetResult;
    updatedKPIs: TechMapKPIResponseDto;
    newChangeOrders: ChangeOrder[];
  }> {
    const updatedBudget = await this.budgetService.calculateBudget(
      event.techMapId,
      companyId,
    );
    const overspendResult = await this.budgetService.checkOverspend(
      event.techMapId,
      companyId,
    );
    const updatedKPIs = await this.kpiService.recalculate(
      event.techMapId,
      companyId,
      marketPriceRubT,
      lossRiskFactor,
    );

    let triggerChangeOrders: ChangeOrder[] = [];
    if (event.type === "TRIGGER_FIRED") {
      const triggerResult = await this.triggerService.evaluateTriggers(
        event.techMapId,
        companyId,
        (event.payload ?? {}) as EvaluationContext,
      );
      triggerChangeOrders = triggerResult.createdChangeOrders;
    }

    return {
      updatedBudget,
      updatedKPIs,
      newChangeOrders: [
        ...overspendResult.createdChangeOrders,
        ...triggerChangeOrders,
      ],
    };
  }
}
