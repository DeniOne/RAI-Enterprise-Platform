import { Module } from "@nestjs/common";
import { RaiChatController } from "./rai-chat.controller";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { SatelliteModule } from "../satellite/satellite.module";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { SupervisorAgent } from "./supervisor-agent.service";
import { TechMapModule } from "../tech-map/tech-map.module";
import { ConsultingModule } from "../consulting/consulting.module";
import { AgroEventsModule } from "../agro-events/agro-events.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";

@Module({
  imports: [
    AuthModule,
    TenantContextModule,
    SatelliteModule,
    TechMapModule,
    ConsultingModule,
    AgroEventsModule,
    PrismaModule,
  ],
  controllers: [RaiChatController],
  providers: [
    RaiChatService,
    SupervisorAgent,
    RaiToolsRegistry,
    ExternalSignalsService,
    RaiChatWidgetBuilder,
  ],
})
export class RaiChatModule {}
