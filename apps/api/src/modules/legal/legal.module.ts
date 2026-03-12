import { Module } from "@nestjs/common";
import { LegalController } from "./controllers/legal.controller";
import { GrController } from "./controllers/gr.controller";
import { ComplianceService } from "./services/compliance.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [PrismaModule, IdempotencyModule],
  controllers: [LegalController, GrController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class LegalModule {}
