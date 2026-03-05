import { BadRequestException, Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { CostAnalyticsService, CostHotspotsResponseDto } from "./cost-analytics.service";
import { TraceTopologyService } from "./trace-topology.service";
import { CostHotspotsQueryDto } from "./dto/cost-hotspots.dto";
import { ExplainabilityTimelineResponseDto } from "./dto/explainability-timeline.dto";
import { TraceForensicsResponseDto } from "./dto/trace-forensics.dto";
import { TraceTopologyResponseDto } from "./dto/trace-topology.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";

@Controller("rai/explainability")
@UseGuards(JwtAuthGuard)
export class ExplainabilityPanelController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly explainabilityPanel: ExplainabilityPanelService,
    private readonly costAnalytics: CostAnalyticsService,
    private readonly traceTopology: TraceTopologyService,
  ) {}

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

