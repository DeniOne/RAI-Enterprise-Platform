import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HsmService } from "./hsm.service";
import { MultisigService } from "./multisig.service";
import { SecretsModule } from "../../shared/config/secrets.module";

@Global()
@Module({
  imports: [ConfigModule, SecretsModule],
  providers: [HsmService, MultisigService],
  exports: [HsmService, MultisigService],
})
export class CryptoModule {}
