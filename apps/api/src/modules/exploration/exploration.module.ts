import { Module } from "@nestjs/common";
import { ExplorationController } from "./exploration.controller";
import { ExplorationService } from "./exploration.service";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [IdempotencyModule],
  controllers: [ExplorationController],
  providers: [ExplorationService],
  exports: [ExplorationService],
})
export class ExplorationModule {}
