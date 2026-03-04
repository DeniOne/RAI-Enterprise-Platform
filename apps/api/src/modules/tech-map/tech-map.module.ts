import { Module } from "@nestjs/common";
import { TechMapService } from "./tech-map.service";
import { TechMapController } from "./tech-map.controller";
import { IntegrityModule } from "../integrity/integrity.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { TechMapStateMachine } from "./fsm/tech-map.fsm";
import { DAGValidationService } from "./validation/dag-validation.service";
import { TechMapValidationEngine } from "./validation/techmap-validation.engine";
import { TankMixCompatibilityService } from "./validation/tank-mix-compatibility.service";
import { EvidenceService } from "./evidence/evidence.service";
import { ChangeOrderService } from "./change-order/change-order.service";

@Module({
  imports: [PrismaModule, IntegrityModule],
  controllers: [TechMapController],
  providers: [
    TechMapService,
    TechMapStateMachine,
    DAGValidationService,
    TechMapValidationEngine,
    TankMixCompatibilityService,
    EvidenceService,
    ChangeOrderService,
  ],
  exports: [TechMapService, EvidenceService, ChangeOrderService],
})
export class TechMapModule { }
