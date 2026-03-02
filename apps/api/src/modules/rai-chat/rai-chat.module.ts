import { Module } from "@nestjs/common";
import { RaiChatController } from "./rai-chat.controller";
import { AuthModule } from "../../shared/auth/auth.module";
import { TenantContextModule } from "../../shared/tenant-context/tenant-context.module";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";

@Module({
  imports: [AuthModule, TenantContextModule],
  controllers: [RaiChatController],
  providers: [RaiChatService, RaiToolsRegistry],
})
export class RaiChatModule {}
