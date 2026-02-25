import { Module } from "@nestjs/common";
import { IntegrityGateService } from "./integrity-gate.service";
import { RegistryAgentService } from "./registry-agent.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { TelegramModule } from "../telegram/telegram.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ConsultingModule } from "../consulting/consulting.module";

import { BullModule } from "@nestjs/bullmq";
import { DriftFeedbackLoopProcessor } from "./drift-feedback-loop.processor";
import { BaselineService } from "./baseline.service";
import { GovernanceService } from "./governance.service";
import { AuditService } from "./audit.service";
import { GenerativeEngineModule } from "../generative-engine/generative-engine.module";
import { QuorumService } from "./quorum.service";

@Module({
  imports: [
    PrismaModule,
    CmrModule,
    TelegramModule,
    ConsultingModule,
    GenerativeEngineModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: "drift-feedback-loop",
    }),
  ],
  providers: [
    IntegrityGateService,
    RegistryAgentService,
    DriftFeedbackLoopProcessor,
    BaselineService,
    GovernanceService,
    AuditService,
    QuorumService,
  ],
  exports: [
    IntegrityGateService,
    RegistryAgentService,
    BaselineService,
    GovernanceService,
    AuditService,
    QuorumService,
  ],
})
export class IntegrityModule {}
