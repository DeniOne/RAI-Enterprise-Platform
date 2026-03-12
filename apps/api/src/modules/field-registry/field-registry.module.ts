import { Module } from "@nestjs/common";
import { FieldRegistryService } from "./field-registry.service";
import { FieldRegistryController } from "./field-registry.controller";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [IdempotencyModule],
  providers: [FieldRegistryService],
  controllers: [FieldRegistryController],
  exports: [FieldRegistryService],
})
export class FieldRegistryModule {}
