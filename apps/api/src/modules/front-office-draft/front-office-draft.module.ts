import { Module } from "@nestjs/common";
import { AuditModule } from "../../shared/audit/audit.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { FieldObservationModule } from "../field-observation/field-observation.module";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeDraftService } from "./front-office-draft.service";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    FieldObservationModule,
    CmrModule,
    RaiChatModule,
  ],
  providers: [FrontOfficeDraftRepository, FrontOfficeDraftService],
  exports: [FrontOfficeDraftService],
})
export class FrontOfficeDraftModule {}
