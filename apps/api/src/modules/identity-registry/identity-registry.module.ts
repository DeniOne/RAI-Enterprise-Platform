import { Module } from "@nestjs/common";
import { IdentityRegistryService } from "./identity-registry.service";
import { IdentityRegistryController } from "./identity-registry.controller";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [IdempotencyModule],
  providers: [IdentityRegistryService],
  controllers: [IdentityRegistryController],
  exports: [IdentityRegistryService],
})
export class IdentityRegistryModule {}
