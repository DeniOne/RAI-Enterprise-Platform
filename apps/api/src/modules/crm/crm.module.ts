import { Module } from "@nestjs/common";
import { CrmService } from "./crm.service";
import { CrmController } from "./crm.controller";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [IdempotencyModule],
  providers: [CrmService],
  controllers: [CrmController],
  exports: [CrmService],
})
export class CrmModule {}
