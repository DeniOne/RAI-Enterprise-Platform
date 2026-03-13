import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import type {
  StrategyForecastRunFeedbackRequest,
  StrategyForecastRunHistoryQueryDto,
  StrategyForecastRunHistoryResponseDto,
  StrategyForecastRunHistoryItemDto,
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
} from "./decision-intelligence.service";

@Injectable()
export class DecisionEvaluationService {
  private readonly logger = new Logger(DecisionEvaluationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordRun(params: {
    companyId: string;
    createdByUserId?: string | null;
    request: StrategyForecastRunRequest;
    result: StrategyForecastRunResponse;
  }): Promise<void> {
    try {
      await this.prisma.strategyForecastRun.create({
        data: {
          companyId: params.companyId,
          traceId: params.result.traceId,
          scopeLevel: params.request.scopeLevel,
          seasonId: params.request.seasonId,
          horizonDays: params.request.horizonDays,
          farmId: params.request.farmId?.trim() || null,
          fieldId: params.request.fieldId?.trim() || null,
          crop: params.request.crop?.trim() || null,
          domainsJson: params.request.domains as unknown as Prisma.InputJsonValue,
          requestJson: this.toJsonValue(params.request),
          resultJson: this.toJsonValue(params.result),
          degraded: params.result.degraded,
          riskTier: params.result.riskTier,
          createdByUserId: params.createdByUserId ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to persist strategy forecast run: ${this.toReason(error)}`);
    }
  }

  async listRecentRuns(
    companyId: string,
    query: StrategyForecastRunHistoryQueryDto = {},
  ): Promise<StrategyForecastRunHistoryResponseDto> {
    const limit = Math.max(1, Math.min(query.limit ?? 12, 50));
    const offset = Math.max(0, query.offset ?? 0);
    const where: Prisma.StrategyForecastRunWhereInput = {
      companyId,
      ...(query.seasonId?.trim() ? { seasonId: query.seasonId.trim() } : {}),
      ...(query.riskTier ? { riskTier: query.riskTier } : {}),
      ...(typeof query.degraded === "boolean" ? { degraded: query.degraded } : {}),
    };

    const rows = await this.prisma.strategyForecastRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });
    const total = await this.prisma.strategyForecastRun.count({ where });

    return {
      items: rows.map((row) => this.mapHistoryRow(row)),
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    };
  }

  async recordOutcomeFeedback(params: {
    companyId: string;
    runId: string;
    feedback: StrategyForecastRunFeedbackRequest;
    feedbackByUserId?: string | null;
  }): Promise<StrategyForecastRunHistoryItemDto> {
    const run = await this.prisma.strategyForecastRun.findFirst({
      where: {
        id: params.runId,
        companyId: params.companyId,
      },
    });

    if (!run) {
      throw new BadRequestException("strategy forecast run not found");
    }

    const resultJson =
      run.resultJson && typeof run.resultJson === "object"
        ? (run.resultJson as Record<string, unknown>)
        : {};
    const baseline =
      resultJson.baseline && typeof resultJson.baseline === "object"
        ? (resultJson.baseline as Record<string, unknown>)
        : {};

    const evaluation = {
      revenueErrorPct: this.computeErrorPct(params.feedback.actualRevenue, baseline.revenue),
      marginErrorPct: this.computeErrorPct(params.feedback.actualMargin, baseline.margin),
      cashFlowErrorPct: this.computeErrorPct(params.feedback.actualCashFlow, baseline.cashFlow),
      yieldErrorPct: this.computeErrorPct(params.feedback.actualYield, baseline.yield),
      note: params.feedback.note?.trim() || null,
      feedbackAt: new Date().toISOString(),
    };

    const updated = await this.prisma.strategyForecastRun.update({
      where: { id: run.id },
      data: {
        feedbackJson: this.toJsonValue(params.feedback),
        evaluationJson: this.toJsonValue(evaluation),
        feedbackByUserId: params.feedbackByUserId ?? null,
        feedbackAt: new Date(evaluation.feedbackAt),
      },
    });

    return this.mapHistoryRow(updated);
  }

  private mapHistoryRow(row: {
    id: string;
    traceId: string;
    scopeLevel: string;
    seasonId: string;
    horizonDays: number;
    domainsJson: unknown;
    requestJson: unknown;
    resultJson: unknown;
    evaluationJson?: unknown;
    degraded: boolean;
    riskTier: string;
    createdByUserId: string | null;
    feedbackAt?: Date | null;
    createdAt: Date;
  }): StrategyForecastRunHistoryItemDto {
    const domains = Array.isArray(row.domainsJson)
      ? row.domainsJson.filter(
        (item): item is StrategyForecastRunHistoryItemDto["domains"][number] =>
          item === "agro" ||
          item === "economics" ||
          item === "finance" ||
          item === "risk",
      )
      : [];

    const resultJson =
      row.resultJson && typeof row.resultJson === "object"
        ? (row.resultJson as Record<string, unknown>)
        : {};
    const evaluationJson =
      row.evaluationJson && typeof row.evaluationJson === "object"
        ? (row.evaluationJson as Record<string, unknown>)
        : {};
    const requestJson =
      "requestJson" in row && row.requestJson && typeof row.requestJson === "object"
        ? (row.requestJson as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      traceId: row.traceId,
      scopeLevel: this.asScopeLevel(row.scopeLevel),
      seasonId: row.seasonId,
      horizonDays: this.asHorizon(row.horizonDays),
      domains,
      degraded: row.degraded,
      riskTier: this.asRiskTier(row.riskTier),
      recommendedAction:
        typeof resultJson.recommendedAction === "string"
          ? resultJson.recommendedAction
          : "Рекомендация недоступна",
      scenarioName:
        typeof requestJson.scenario === "object" &&
        requestJson.scenario &&
        typeof (requestJson.scenario as Record<string, unknown>).name === "string"
          ? ((requestJson.scenario as Record<string, unknown>).name as string)
          : null,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt.toISOString(),
      evaluation: {
        status: row.feedbackAt ? "feedback_recorded" : "pending",
        revenueErrorPct: this.asNumberOrNull(evaluationJson.revenueErrorPct),
        marginErrorPct: this.asNumberOrNull(evaluationJson.marginErrorPct),
        cashFlowErrorPct: this.asNumberOrNull(evaluationJson.cashFlowErrorPct),
        yieldErrorPct: this.asNumberOrNull(evaluationJson.yieldErrorPct),
        note: typeof evaluationJson.note === "string" ? evaluationJson.note : null,
        feedbackAt:
          typeof evaluationJson.feedbackAt === "string"
            ? evaluationJson.feedbackAt
            : row.feedbackAt?.toISOString() ?? null,
      },
    };
  }

  private asScopeLevel(value: string): StrategyForecastRunHistoryItemDto["scopeLevel"] {
    return value === "farm" || value === "field" ? value : "company";
  }

  private asHorizon(value: number): StrategyForecastRunHistoryItemDto["horizonDays"] {
    return value === 30 || value === 180 || value === 365 ? value : 90;
  }

  private asRiskTier(value: string): StrategyForecastRunHistoryItemDto["riskTier"] {
    return value === "low" || value === "high" ? value : "medium";
  }

  private toReason(error: unknown): string {
    return String((error as Error)?.message ?? error ?? "unknown").slice(0, 140);
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
  }

  private computeErrorPct(actual: unknown, predicted: unknown): number | null {
    if (typeof actual !== "number" || !Number.isFinite(actual)) {
      return null;
    }
    if (typeof predicted !== "number" || !Number.isFinite(predicted) || predicted === 0) {
      return null;
    }
    return Math.round((((actual - predicted) / Math.abs(predicted)) * 100) * 100) / 100;
  }

  private asNumberOrNull(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
}
