import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { isFoundationGatedFeatureEnabled } from "../../../../shared/feature-flags/foundation-release-flags";
import { IdempotencyInterceptor } from "../../../../shared/idempotency/idempotency.interceptor";
import {
  DecisionIntelligenceService,
  StrategyForecastRunFeedbackRequest,
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
  ): Promise<StrategyForecastRunHistoryItemDto[]> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    if (!isFoundationGatedFeatureEnabled("RAI_STRATEGY_FORECASTS_ENABLED")) {
      throw new BadRequestException("RAI_STRATEGY_FORECASTS_DISABLED");
    }
    return this.decisionIntelligence.listRecentRuns(companyId, 12);
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
