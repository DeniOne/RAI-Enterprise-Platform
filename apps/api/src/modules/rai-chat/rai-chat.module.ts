import { Module } from "@nestjs/common";
import { RaiChatController } from "./rai-chat.controller";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { SatelliteModule } from "../satellite/satellite.module";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";

@Module({
  imports: [AuthModule, TenantContextModule, SatelliteModule],
  controllers: [RaiChatController],
  providers: [
    RaiChatService,
    RaiToolsRegistry,
    ExternalSignalsService,
    RaiChatWidgetBuilder,
  ],
})
export class RaiChatModule {}
