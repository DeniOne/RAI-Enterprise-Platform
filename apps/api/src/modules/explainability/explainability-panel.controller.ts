import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { ExplainabilityTimelineResponseDto } from "./dto/explainability-timeline.dto";

@Controller("rai/explainability")
@UseGuards(JwtAuthGuard)
export class ExplainabilityPanelController {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly explainabilityPanel: ExplainabilityPanelService,
  ) {}

  @Get("trace/:traceId")
  async getTraceTimeline(@Param("traceId") traceId: string): Promise<ExplainabilityTimelineResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      throw new BadRequestException("Security Context: companyId is missing");
    }

    return this.explainabilityPanel.getTraceTimeline(traceId, companyId);
  }
}

