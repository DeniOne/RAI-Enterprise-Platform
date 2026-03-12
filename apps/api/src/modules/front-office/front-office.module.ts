import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { FieldObservationModule } from "../field-observation/field-observation.module";
import { CmrModule } from "../cmr/cmr.module";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { AgroOrchestratorModule } from "../agro-orchestrator/agro-orchestrator.module";
import { FrontOfficeDraftModule } from "../front-office-draft/front-office-draft.module";
import { FrontOfficeController } from "./front-office.controller";
import { FrontOfficeExternalController } from "./front-office-external.controller";
import { FrontOfficeService } from "./front-office.service";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    FieldObservationModule,
    CmrModule,
    RaiChatModule,
    AgroOrchestratorModule,
    FrontOfficeDraftModule,
    IdempotencyModule,
  ],
  providers: [FrontOfficeService],
  controllers: [FrontOfficeController, FrontOfficeExternalController],
  exports: [FrontOfficeService],
})
export class FrontOfficeModule {}
