import { Module } from "@nestjs/common";
import { ClientRegistryService } from "./client-registry.service";
import { ClientRegistryController } from "./client-registry.controller";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [IdempotencyModule],
  providers: [ClientRegistryService],
  controllers: [ClientRegistryController],
  exports: [ClientRegistryService],
})
export class ClientRegistryModule {}
