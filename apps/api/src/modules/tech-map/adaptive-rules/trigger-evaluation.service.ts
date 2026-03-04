import {
  AdaptiveRule,
  ChangeOrder,
  Prisma,
  TriggerOperator,
} from "@rai/prisma-client";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { ChangeOrderService } from "../change-order/change-order.service";
import { ChangeOrderCreateDto } from "../dto/change-order.dto";

export interface EvaluationContext {
  weatherTempC?: number;
  weatherPrecipMm?: number;
  ndviValue?: number;
  gddAccumulated?: number;
  currentBBCH?: number;
  priceRubT?: number;
  observationType?: string;
  observationValue?: number;
}

type RuleCondition = {
  parameter: keyof EvaluationContext | string;
  operator: TriggerOperator;
  threshold: number;
  unit?: string;
};

type ChangeTemplate = {
  changeType: ChangeOrderCreateDto["changeType"];
  reasonTemplate?: string;
  deltaCostRub?: number;
  diffPayload?: Record<string, unknown>;
  triggeredByObsId?: string;
  createdByUserId?: string;
};

@Injectable()
export class TriggerEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changeOrderService: ChangeOrderService,
  ) {}

  async evaluateTriggers(
    techMapId: string,
    companyId: string,
    context: EvaluationContext,
  ): Promise<{ triggeredRules: AdaptiveRule[]; createdChangeOrders: ChangeOrder[] }> {
    const rules = await this.prisma.adaptiveRule.findMany({
      where: {
        techMapId,
        companyId,
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const triggeredRules: AdaptiveRule[] = [];
    const createdChangeOrders: ChangeOrder[] = [];
    const now = new Date();

    for (const rule of rules) {
      const condition = rule.condition as unknown as RuleCondition;
      if (this.evaluateCondition(condition, context)) {
        triggeredRules.push(rule);
        createdChangeOrders.push(
          await this.applyTriggeredRule(rule.id, companyId, context),
        );
      }
    }

    if (rules.length > 0) {
      await this.prisma.adaptiveRule.updateMany({
        where: {
          id: {
            in: rules.map((rule) => rule.id),
          },
          companyId,
        },
        data: {
          lastEvaluatedAt: now,
        },
      });
    }

    return { triggeredRules, createdChangeOrders };
  }

  async applyTriggeredRule(
    ruleId: string,
    companyId: string,
    context: EvaluationContext,
  ): Promise<ChangeOrder> {
    const rule = await this.prisma.adaptiveRule.findFirst({
      where: {
        id: ruleId,
        companyId,
      },
      include: {
        techMap: {
          select: {
            id: true,
            version: true,
          },
        },
      },
    });

    if (!rule) {
      throw new NotFoundException("AdaptiveRule not found");
    }

    const template = rule.changeTemplate as unknown as ChangeTemplate;
    const dto: ChangeOrderCreateDto = {
      versionFrom: rule.techMap.version,
      changeType: template.changeType,
      reason: this.interpolateReason(
        template.reasonTemplate ?? rule.name,
        context,
      ),
      diffPayload: {
        ruleId: rule.id,
        triggerType: rule.triggerType,
        affectedOperationIds: rule.affectedOperationIds,
        context,
        ...(template.diffPayload ?? {}),
      },
      deltaCostRub: template.deltaCostRub,
      triggeredByObsId: template.triggeredByObsId,
      createdByUserId: template.createdByUserId,
    };

    const changeOrder = await this.changeOrderService.createChangeOrder(
      rule.techMapId,
      dto,
      companyId,
    );
    await this.changeOrderService.routeForApproval(changeOrder.id, companyId);

    return this.prisma.changeOrder.findUniqueOrThrow({
      where: {
        id: changeOrder.id,
      },
    });
  }

  evaluateCondition(
    condition: RuleCondition,
    context: EvaluationContext,
  ): boolean {
    const value = context[condition.parameter as keyof EvaluationContext];
    if (typeof value !== "number") {
      return false;
    }

    switch (condition.operator) {
      case TriggerOperator.GT:
        return value > condition.threshold;
      case TriggerOperator.GTE:
        return value >= condition.threshold;
      case TriggerOperator.LT:
        return value < condition.threshold;
      case TriggerOperator.LTE:
        return value <= condition.threshold;
      case TriggerOperator.EQ:
        return value === condition.threshold;
      case TriggerOperator.NOT_EQ:
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private interpolateReason(
    template: string,
    context: EvaluationContext,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
      const value = context[key as keyof EvaluationContext];
      return value == null ? "null" : String(value);
    });
  }
}
