import { Module } from "@nestjs/common";
import { DeviationService } from "./deviation.service";
import { RiskService } from "./risk.service";
import { DecisionService } from "./decision.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";

import { CmrController } from "./cmr.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CmrController],
  providers: [DeviationService, RiskService, DecisionService],
  exports: [DeviationService, RiskService, DecisionService],
})
export class CmrModule {}
