import { Module } from "@nestjs/common";
import { AuditModule } from "../../shared/audit/audit.module";
import { FrontOfficeSharedModule } from "../../shared/front-office/front-office-shared.module";
import { CmrModule } from "../cmr/cmr.module";
import { FieldObservationModule } from "../field-observation/field-observation.module";
import { RaiChatModule } from "../rai-chat/rai-chat.module";
import { FrontOfficeClientResponseOrchestrator } from "./front-office-client-response.orchestrator.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "./front-office-handoff.orchestrator.service";
import { FrontOfficeReplyPolicyService } from "./front-office-reply-policy.service";
import { FrontOfficeDraftService } from "./front-office-draft.service";

@Module({
  imports: [
    AuditModule,
    FrontOfficeSharedModule,
    FieldObservationModule,
    CmrModule,
    RaiChatModule,
  ],
  providers: [
    FrontOfficeReplyPolicyService,
    FrontOfficeClientResponseOrchestrator,
    FrontOfficeDraftRepository,
    FrontOfficeHandoffOrchestrator,
    FrontOfficeDraftService,
  ],
  exports: [
    FrontOfficeDraftService,
    FrontOfficeHandoffOrchestrator,
  ],
})
export class FrontOfficeDraftModule {}
