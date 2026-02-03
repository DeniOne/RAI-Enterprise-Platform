import { Module } from "@nestjs/common";
import { IdentityRegistryService } from "./identity-registry.service";
import { IdentityRegistryController } from "./identity-registry.controller";

@Module({
  providers: [IdentityRegistryService],
  controllers: [IdentityRegistryController],
  exports: [IdentityRegistryService],
})
export class IdentityRegistryModule {}
