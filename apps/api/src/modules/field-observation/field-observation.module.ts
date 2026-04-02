import { Module, forwardRef } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";
import { FieldObservationController } from "./field-observation.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { IntegrityModule } from "../integrity/integrity.module";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    forwardRef(() => IntegrityModule),
    IdempotencyModule,
  ],
  providers: [FieldObservationService],
  controllers: [FieldObservationController],
  exports: [FieldObservationService],
})
export class FieldObservationModule {}
