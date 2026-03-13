import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { isFoundationGatedFeatureEnabled } from "../../../../shared/feature-flags/foundation-release-flags";
import { IdempotencyInterceptor } from "../../../../shared/idempotency/idempotency.interceptor";
import {
  DecisionIntelligenceService,
  StrategyForecastRunFeedbackRequest,
  StrategyForecastRunHistoryQueryDto,
  StrategyForecastRunHistoryResponseDto,
  StrategyForecastRunHistoryItemDto,
  StrategyForecastRunRequest,
  StrategyForecastRunResponse,
  StrategyForecastScenarioDto,
  StrategyForecastScenarioSaveRequest,
} from "./decision-intelligence.service";
import { Authorized } from "../../../../shared/auth/authorized.decorator";
import { STRATEGIC_ROLES } from "../../../../shared/auth/rbac.constants";

@Controller("ofs/strategy/forecasts")
export class StrategyForecastsController {
  constructor(
    private readonly decisionIntelligence: DecisionIntelligenceService,
  ) {}

  @Post("run")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async run(
    @Req() req: any,
    @Body() body: StrategyForecastRunRequest,
  ): Promise<StrategyForecastRunResponse> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    return this.decisionIntelligence.runStrategyForecast(
      companyId,
      body,
      req.user?.id ?? req.user?.sub ?? null,
    );
  }

  @Get("scenarios")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listScenarios(@Req() req: any): Promise<StrategyForecastScenarioDto[]> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    return this.decisionIntelligence.listSavedScenarios(companyId);
  }

  @Post("scenarios")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async saveScenario(
    @Req() req: any,
    @Body() body: StrategyForecastScenarioSaveRequest,
  ): Promise<StrategyForecastScenarioDto> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    return this.decisionIntelligence.saveScenario(
      companyId,
      req.user?.id ?? req.user?.sub ?? null,
      body,
    );
  }

  @Get("history")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async listHistory(
    @Req() req: any,
    @Query() query: Record<string, string | undefined>,
  ): Promise<StrategyForecastRunHistoryResponseDto> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    const historyQuery = this.parseHistoryQuery(query);
    return this.decisionIntelligence.listRecentRuns(companyId, historyQuery);
  }

  @Post("history/:runId/feedback")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async recordFeedback(
    @Req() req: any,
    @Param("runId") runId: string,
    @Body() body: StrategyForecastRunFeedbackRequest,
  ): Promise<StrategyForecastRunHistoryItemDto> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    return this.decisionIntelligence.recordOutcomeFeedback(
      companyId,
      runId,
      body,
      req.user?.id ?? req.user?.sub ?? null,
    );
  }

  private parseHistoryQuery(
    query: Record<string, string | undefined>,
  ): StrategyForecastRunHistoryQueryDto {
    const limitRaw = query.limit;
    const offsetRaw = query.offset;
    const riskTierRaw = query.riskTier;
    const degradedRaw = query.degraded;
    const seasonIdRaw = query.seasonId;

    const parsedLimit =
      typeof limitRaw === "string" && limitRaw.trim().length > 0
        ? Number(limitRaw)
        : undefined;
    const parsedOffset =
      typeof offsetRaw === "string" && offsetRaw.trim().length > 0
        ? Number(offsetRaw)
        : undefined;

    if (parsedLimit !== undefined && (!Number.isInteger(parsedLimit) || parsedLimit < 1)) {
      throw new BadRequestException("history limit must be a positive integer");
    }
    if (parsedOffset !== undefined && (!Number.isInteger(parsedOffset) || parsedOffset < 0)) {
      throw new BadRequestException("history offset must be a non-negative integer");
    }

    const riskTier =
      riskTierRaw === "low" || riskTierRaw === "medium" || riskTierRaw === "high"
        ? riskTierRaw
        : undefined;
    if (riskTierRaw && !riskTier) {
      throw new BadRequestException("history riskTier is invalid");
    }

    let degraded: boolean | undefined;
    if (degradedRaw !== undefined) {
      if (degradedRaw === "true" || degradedRaw === "1") {
        degraded = true;
      } else if (degradedRaw === "false" || degradedRaw === "0") {
        degraded = false;
      } else {
        throw new BadRequestException("history degraded must be boolean");
      }
    }

    return {
      ...(parsedLimit !== undefined ? { limit: parsedLimit } : {}),
      ...(parsedOffset !== undefined ? { offset: parsedOffset } : {}),
      ...(riskTier ? { riskTier } : {}),
      ...(typeof degraded === "boolean" ? { degraded } : {}),
      ...(seasonIdRaw?.trim() ? { seasonId: seasonIdRaw.trim() } : {}),
    };
  }

  @Delete("scenarios/:scenarioId")
  @Authorized(...STRATEGIC_ROLES)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async deleteScenario(
    @Req() req: any,
    @Param("scenarioId") scenarioId: string,
  ): Promise<{ ok: true }> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    await this.decisionIntelligence.deleteScenario(companyId, scenarioId);
    return { ok: true };
  }
}
