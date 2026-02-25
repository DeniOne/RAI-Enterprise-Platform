import { Module } from "@nestjs/common";
import { ExplorationController } from "./exploration.controller";
import { ExplorationService } from "./exploration.service";

@Module({
  controllers: [ExplorationController],
  providers: [ExplorationService],
  exports: [ExplorationService],
})
export class ExplorationModule {}

