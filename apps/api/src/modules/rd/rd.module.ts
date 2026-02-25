import { Module } from "@nestjs/common";
import { ExperimentController } from "./controllers/ExperimentController";
import { ProgramController } from "./controllers/ProgramController";
import { TrialController } from "./controllers/TrialController";
import { RdService } from "./services/RdService";
import { PrismaModule } from "../../shared/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ProgramController, ExperimentController, TrialController],
  providers: [RdService],
  exports: [RdService],
})
export class RdModule {}
