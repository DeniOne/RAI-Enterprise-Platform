import { BadRequestException, Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { ExplainabilityTimelineResponseDto } from "./dto/explainability-timeline.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";

@Controller("rai/explainability")
@UseGuards(JwtAuthGuard)
export class ExplainabilityPanelController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly explainabilityPanel: ExplainabilityPanelService,
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
}

