import { Module, Global } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { SecretsModule } from "../config/secrets.module";
import { AuditNotarizationService } from "./audit-notarization.service";
import { WormModule } from "../../level-f/worm/worm.module";
import { CryptoModule } from "../../level-f/crypto/crypto.module";
import { AnchorModule } from "../../level-f/gateway/anchoring/anchor.module";

@Global()
@Module({
  imports: [PrismaModule, SecretsModule, WormModule, CryptoModule, AnchorModule],
  controllers: [AuditController],
  providers: [AuditService, AuditNotarizationService],
  exports: [AuditService, AuditNotarizationService],
})
export class AuditModule {}
