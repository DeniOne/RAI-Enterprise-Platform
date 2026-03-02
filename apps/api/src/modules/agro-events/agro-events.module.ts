import { Module } from "@nestjs/common";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AgroEscalationLoopService } from "./agro-escalation-loop.service";
import { AgroEventsController } from "./agro-events.controller";
import { AgroEventsOrchestratorService } from "./agro-events.orchestrator.service";
import { AgroEventsRepository } from "./agro-events.repository";
import { AgroEventsService } from "./agro-events.service";
import { AgroEventsMustValidator } from "./agro-events.validator";

@Module({
  imports: [PrismaModule],
  providers: [
    AgroEscalationLoopService,
    AgroEventsRepository,
    AgroEventsMustValidator,
    AgroEventsOrchestratorService,
    AgroEventsService,
  ],
  controllers: [AgroEventsController],
  exports: [AgroEventsService],
})
export class AgroEventsModule {}
