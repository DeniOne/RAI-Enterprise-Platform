import { Module } from "@nestjs/common";
import { FoundationModule } from "./foundation/foundation.module";
import { IncentiveModule } from "./incentive/incentive.module";
import { DevelopmentModule } from "./development/development.module";
import { HrOrchestratorService } from "./hr-orchestrator.service";
import { PulseController } from "./development/pulse.controller";

@Module({
  imports: [FoundationModule, IncentiveModule, DevelopmentModule],
  providers: [HrOrchestratorService],
  controllers: [PulseController],
  exports: [
    FoundationModule,
    IncentiveModule,
    DevelopmentModule,
    HrOrchestratorService,
  ],
})
export class HrModule {}
