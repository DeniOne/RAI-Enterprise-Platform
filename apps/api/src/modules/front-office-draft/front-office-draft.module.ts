import { Module } from "@nestjs/common";
import { AuditModule } from "../../shared/audit/audit.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { FieldObservationModule } from "../field-observation/field-observation.module";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { TelegramModule } from "../telegram/telegram.module";
import { FrontOfficeCommunicationRepository } from "./front-office-communication.repository";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "./front-office-handoff.orchestrator.service";
import { FrontOfficeDraftService } from "./front-office-draft.service";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    FieldObservationModule,
    CmrModule,
    RaiChatModule,
    TelegramModule,
  ],
  providers: [
    FrontOfficeCommunicationRepository,
    FrontOfficeDraftRepository,
    FrontOfficeHandoffOrchestrator,
    FrontOfficeDraftService,
  ],
  exports: [FrontOfficeDraftService, FrontOfficeHandoffOrchestrator],
})
export class FrontOfficeDraftModule {}
