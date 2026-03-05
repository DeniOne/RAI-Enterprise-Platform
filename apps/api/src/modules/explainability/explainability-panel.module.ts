import { Module } from "@nestjs/common";
import { ExplainabilityPanelController } from "./explainability-panel.controller";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { CostAnalyticsService } from "./cost-analytics.service";
import { TraceTopologyService } from "./trace-topology.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import { RaiChatModule } from "../rai-chat/rai-chat.module";

@Module({
  imports: [AuthModule, TenantContextModule, PrismaModule, RaiChatModule],
  controllers: [ExplainabilityPanelController],
  providers: [ExplainabilityPanelService, CostAnalyticsService, TraceTopologyService, SensitiveDataFilterService],
})
export class ExplainabilityPanelModule {}

