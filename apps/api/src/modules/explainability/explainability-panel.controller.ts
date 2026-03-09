import { BadRequestException, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RolesGuard } from "../../shared/auth/roles.guard";
import { Roles } from "../../shared/auth/roles.decorator";
import { UserRole } from "@rai/prisma-client";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { CostAnalyticsService, CostHotspotsResponseDto } from "./cost-analytics.service";
import { TraceTopologyService } from "./trace-topology.service";
import { SafeReplayService, ReplayResultDto } from "../rai-chat/safe-replay.service";
import { PerformanceMetricsService, AggregatedMetrics } from "../rai-chat/performance/performance-metrics.service";
import { AutonomyPolicyService } from "../rai-chat/autonomy-policy.service";
import { AutonomyStatusDto } from "./dto/autonomy-status.dto";
import { CostHotspotsQueryDto } from "./dto/cost-hotspots.dto";
import { ExplainabilityTimelineResponseDto } from "./dto/explainability-timeline.dto";
import { QueuePressureResponseDto } from "./dto/queue-pressure.dto";
import { TraceForensicsResponseDto } from "./dto/trace-forensics.dto";
import { TraceTopologyResponseDto } from "./dto/trace-topology.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";
import { RuntimeGovernanceSummaryDto } from "./dto/runtime-governance-summary.dto";
import { RuntimeGovernanceAgentDto } from "./dto/runtime-governance-agent.dto";
import { RuntimeGovernanceReadModelService } from "./runtime-governance-read-model.service";

@Controller("rai/explainability")
@UseGuards(JwtAuthGuard)
export class ExplainabilityPanelController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly explainabilityPanel: ExplainabilityPanelService,
    private readonly costAnalytics: CostAnalyticsService,
    private readonly traceTopology: TraceTopologyService,
    private readonly safeReplay: SafeReplayService,
    private readonly performanceMetrics: PerformanceMetricsService,
    private readonly autonomyPolicy: AutonomyPolicyService,
    private readonly runtimeGovernanceReadModel: RuntimeGovernanceReadModelService,
  ) {}

  @Get("performance")
  async getPerformance(@Query("timeWindowMs") timeWindowMs?: string): Promise<AggregatedMetrics> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const windowMs = timeWindowMs !== undefined ? Number(timeWindowMs) : 3600000;
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new BadRequestException("Invalid timeWindowMs");
    }
    return this.performanceMetrics.getAggregatedMetrics(companyId, windowMs);
  }

  @Get("dashboard")
  async getDashboard(
    @Query("hours") hours?: string,
  ): Promise<TruthfulnessDashboardResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    const timeWindowHours = hours !== undefined ? Number(hours) : 24;

    if (!Number.isFinite(timeWindowHours) || timeWindowHours <= 0) {
      throw new BadRequestException("Invalid timeWindowHours");
    }

    return this.explainabilityPanel.getTruthfulnessDashboard(companyId, timeWindowHours);
  }

  @Get("queue-pressure")
  async getQueuePressure(
    @Query("timeWindowMs") timeWindowMs?: string,
  ): Promise<QueuePressureResponseDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const windowMs = timeWindowMs !== undefined ? Number(timeWindowMs) : 3600000;
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new BadRequestException("Invalid timeWindowMs");
    }
    return this.explainabilityPanel.getQueuePressure(companyId, windowMs);
  }

  @Get("autonomy-status")
  async getAutonomyStatus(): Promise<AutonomyStatusDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    const status = await this.autonomyPolicy.getCompanyAutonomyStatus(companyId);
    return {
      companyId,
      level: status.level,
      avgBsScorePct: status.avgBsScorePct,
      knownTraceCount: status.knownTraceCount,
      driver: status.driver,
      activeQualityAlert: status.activeQualityAlert,
    };
  }

  @Get("runtime-governance/summary")
  async getRuntimeGovernanceSummary(
    @Query("timeWindowMs") timeWindowMs?: string,
  ): Promise<RuntimeGovernanceSummaryDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const windowMs = timeWindowMs !== undefined ? Number(timeWindowMs) : 3600000;
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new BadRequestException("Invalid timeWindowMs");
    }
    return this.runtimeGovernanceReadModel.getSummary(companyId, windowMs);
  }

  @Get("runtime-governance/agents")
  async getRuntimeGovernanceAgents(
    @Query("timeWindowMs") timeWindowMs?: string,
  ): Promise<RuntimeGovernanceAgentDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const windowMs = timeWindowMs !== undefined ? Number(timeWindowMs) : 3600000;
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new BadRequestException("Invalid timeWindowMs");
    }
    return this.runtimeGovernanceReadModel.getAgents(companyId, windowMs);
  }

  @Get("trace/:traceId")
  async getTraceTimeline(@Param("traceId") traceId: string): Promise<ExplainabilityTimelineResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    return this.explainabilityPanel.getTraceTimeline(traceId, companyId);
  }

  @Get("trace/:traceId/forensics")
  async getTraceForensics(@Param("traceId") traceId: string): Promise<TraceForensicsResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    return this.explainabilityPanel.getTraceForensics(traceId, companyId);
  }

  @Get("trace/:traceId/topology")
  async getTraceTopology(@Param("traceId") traceId: string): Promise<TraceTopologyResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    return this.traceTopology.getTraceTopology(traceId, companyId);
  }

  @Post("trace/:traceId/replay")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async replayTrace(
    @Param("traceId") traceId: string,
    @CurrentUser() user: { userId?: string },
  ): Promise<ReplayResultDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    return this.safeReplay.runReplay(traceId, companyId, user?.userId);
  }

  @Get("cost-hotspots")
  async getCostHotspots(
    @Query() query: CostHotspotsQueryDto,
  ): Promise<CostHotspotsResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    const timeWindowMs = query.timeWindowMs ?? 86400000;
    const limit = query.limit ?? 10;

    if (!Number.isFinite(timeWindowMs) || timeWindowMs <= 0) {
      throw new BadRequestException("Invalid timeWindowMs");
    }
    if (!Number.isFinite(limit) || limit <= 0 || limit > 100) {
      throw new BadRequestException("Invalid limit (1..100)");
    }

    return this.costAnalytics.getCostHotspots(companyId, timeWindowMs, limit);
  }
}
