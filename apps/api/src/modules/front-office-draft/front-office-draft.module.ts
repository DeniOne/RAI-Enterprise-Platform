import { Module } from "@nestjs/common";
import { AuditModule } from "../../shared/audit/audit.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { FieldObservationModule } from "../field-observation/field-observation.module";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { TelegramNotificationModule } from "../telegram/telegram-notification.module";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { FrontOfficeClientResponseOrchestrator } from "./front-office-client-response.orchestrator.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "./front-office-handoff.orchestrator.service";
import { FrontOfficeOutboundService } from "./front-office-outbound.service";
import { FrontOfficeReplyPolicyService } from "./front-office-reply-policy.service";
import { FrontOfficeDraftService } from "./front-office-draft.service";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    FieldObservationModule,
    CmrModule,
    RaiChatModule,
    TelegramNotificationModule,
  ],
  providers: [
    FrontOfficeCommunicationRepository,
    FrontOfficeReplyPolicyService,
    FrontOfficeOutboundService,
    FrontOfficeClientResponseOrchestrator,
    FrontOfficeDraftRepository,
    FrontOfficeHandoffOrchestrator,
    FrontOfficeDraftService,
  ],
  exports: [
    FrontOfficeDraftService,
    FrontOfficeHandoffOrchestrator,
    FrontOfficeOutboundService,
  ],
})
export class FrontOfficeDraftModule {}
