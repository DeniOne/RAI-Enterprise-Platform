import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
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
import { RuntimeGovernanceControlService } from "./runtime-governance-control.service";
import { SetRuntimeAutonomyOverrideDtoSchema } from "./dto/runtime-governance-control.dto";
import { RuntimeGovernanceDrilldownService } from "./runtime-governance-drilldown.service";
import { RuntimeGovernanceDrilldownsDto } from "./dto/runtime-governance-drilldowns.dto";
import { AgentLifecycleReadModelService } from "./agent-lifecycle-read-model.service";
import { AgentLifecycleSummaryDto } from "./dto/agent-lifecycle-summary.dto";
import { AgentLifecycleItemDto } from "./dto/agent-lifecycle-item.dto";
import { AgentLifecycleHistoryItemDto } from "./dto/agent-lifecycle-history.dto";
import { AgentLifecycleControlService } from "./agent-lifecycle-control.service";
import {
  ClearAgentLifecycleOverrideDtoSchema,
  SetAgentLifecycleOverrideDtoSchema,
} from "./dto/agent-lifecycle-control.dto";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";

function toManualOverrideDto(
  manualOverride:
    | {
        active: boolean;
        level: string;
        reason: string;
        createdAt: string;
        createdByUserId: string | null;
      }
    | null
    | undefined,
): {
  active: boolean;
  level: "TOOL_FIRST" | "QUARANTINE";
  reason: string;
  createdAt: string;
  createdByUserId: string | null;
} | null {
  if (!manualOverride) {
    return null;
  }
  const level: "TOOL_FIRST" | "QUARANTINE" =
    manualOverride.level === "QUARANTINE" ? "QUARANTINE" : "TOOL_FIRST";
  return {
    active: manualOverride.active,
    level,
    reason: manualOverride.reason,
    createdAt: manualOverride.createdAt,
    createdByUserId: manualOverride.createdByUserId,
  };
}

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
    private readonly runtimeGovernanceControl: RuntimeGovernanceControlService,
    private readonly runtimeGovernanceDrilldowns: RuntimeGovernanceDrilldownService,
    private readonly agentLifecycleReadModel: AgentLifecycleReadModelService,
    private readonly agentLifecycleControl: AgentLifecycleControlService,
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
      manualOverride: toManualOverrideDto(status.manualOverride),
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

  @Get("lifecycle/summary")
  async getLifecycleSummary(): Promise<AgentLifecycleSummaryDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.agentLifecycleReadModel.getSummary(companyId);
  }

  @Get("lifecycle/agents")
  async getLifecycleAgents(): Promise<AgentLifecycleItemDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    return this.agentLifecycleReadModel.getAgents(companyId);
  }

  @Get("lifecycle/history")
  async getLifecycleHistory(
    @Query("limit") limit?: string,
  ): Promise<AgentLifecycleHistoryItemDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsedLimit = limit !== undefined ? Number(limit) : 20;
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(Math.trunc(parsedLimit), 100) : 20;
    return this.agentLifecycleReadModel.getHistory(companyId, safeLimit);
  }

  @Post("lifecycle/override")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.CLIENT_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async setLifecycleOverride(
    @Body() body: unknown,
    @CurrentUser() user: { userId?: string },
  ): Promise<AgentLifecycleItemDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = SetAgentLifecycleOverrideDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    await this.agentLifecycleControl.setOverride({
      companyId,
      role: parsed.data.role,
      state: parsed.data.state,
      reason: parsed.data.reason,
      userId: user?.userId,
    });
    return this.agentLifecycleReadModel.getAgents(companyId);
  }

  @Post("lifecycle/override/clear")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.CLIENT_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async clearLifecycleOverride(
    @Body() body: unknown,
    @CurrentUser() user: { userId?: string },
  ): Promise<AgentLifecycleItemDto[]> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = ClearAgentLifecycleOverrideDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    await this.agentLifecycleControl.clearOverride({
      companyId,
      role: parsed.data.role,
      userId: user?.userId,
    });
    return this.agentLifecycleReadModel.getAgents(companyId);
  }

  @Get("runtime-governance/drilldowns")
  async getRuntimeGovernanceDrilldowns(
    @Query("timeWindowMs") timeWindowMs?: string,
    @Query("agentRole") agentRole?: string,
  ): Promise<RuntimeGovernanceDrilldownsDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const windowMs = timeWindowMs ? Number(timeWindowMs) : 3_600_000;
    return this.runtimeGovernanceDrilldowns.getDrilldowns(
      companyId,
      Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 3_600_000,
      agentRole?.trim() || undefined,
    );
  }

  @Post("runtime-governance/autonomy/override")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.CLIENT_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async setRuntimeAutonomyOverride(
    @Body() body: unknown,
    @CurrentUser() user: { userId?: string },
  ): Promise<AutonomyStatusDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const parsed = SetRuntimeAutonomyOverrideDtoSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }
    const status = await this.runtimeGovernanceControl.setManualAutonomyOverride({
      companyId,
      level: parsed.data.level,
      reason: parsed.data.reason,
      userId: user?.userId,
    });
    return {
      companyId,
      level: status.level,
      avgBsScorePct: status.avgBsScorePct,
      knownTraceCount: status.knownTraceCount,
      driver: status.driver,
      activeQualityAlert: status.activeQualityAlert,
      manualOverride: toManualOverrideDto(status.manualOverride),
    };
  }

  @Post("runtime-governance/autonomy/override/clear")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CEO, UserRole.CLIENT_ADMIN)
  @UseInterceptors(IdempotencyInterceptor)
  async clearRuntimeAutonomyOverride(
    @CurrentUser() user: { userId?: string },
  ): Promise<AutonomyStatusDto> {
    const companyId = this.tenantContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }
    const status = await this.runtimeGovernanceControl.clearManualAutonomyOverride({
      companyId,
      userId: user?.userId,
    });
    return {
      companyId,
      level: status.level,
      avgBsScorePct: status.avgBsScorePct,
      knownTraceCount: status.knownTraceCount,
      driver: status.driver,
      activeQualityAlert: status.activeQualityAlert,
      manualOverride: toManualOverrideDto(status.manualOverride),
    };
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
  @UseInterceptors(IdempotencyInterceptor)
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
