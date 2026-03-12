import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AgroEscalationLoopService } from "./agro-escalation-loop.service";
import { AgroEventsController } from "./agro-events.controller";
import { AgroEventsOrchestratorService } from "./agro-events.orchestrator.service";
import { AgroEventsRepository } from "./agro-events.repository";
import { AgroEventsService } from "./agro-events.service";
import { AgroEventsMustValidator } from "./agro-events.validator";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [PrismaModule, IdempotencyModule],
  providers: [
    AgroEscalationLoopService,
    AgroEventsRepository,
    AgroEventsMustValidator,
    AgroEventsOrchestratorService,
    AgroEventsService,
  ],
  controllers: [AgroEventsController],
  exports: [AgroEventsService, AgroEscalationLoopService],
})
export class AgroEventsModule {}
