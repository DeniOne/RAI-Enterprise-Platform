import { Module } from "@nestjs/common";
import { TelegramNotificationModule } from "../../modules/telegram/telegram-notification.module";
import { PrismaModule } from "../prisma/prisma.module";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { FrontOfficeOutboundService } from "./front-office-outbound.service";
import { FrontOfficeThreadingService } from "./front-office-threading.service";

@Module({
  imports: [PrismaModule, TelegramNotificationModule],
  providers: [
    FrontOfficeCommunicationRepository,
    FrontOfficeOutboundService,
    FrontOfficeThreadingService,
  ],
  exports: [
    FrontOfficeCommunicationRepository,
    FrontOfficeOutboundService,
    FrontOfficeThreadingService,
  ],
})
export class FrontOfficeSharedModule {}
