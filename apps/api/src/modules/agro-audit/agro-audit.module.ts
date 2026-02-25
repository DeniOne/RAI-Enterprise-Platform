import { Module, Global } from "@nestjs/common";
import { AgroAuditService } from "./agro-audit.service";
import { AuditModule } from "../../shared/audit/audit.module";
import { AgroAuditController } from "./agro-audit.controller";

@Global()
@Module({
  imports: [AuditModule],
  controllers: [AgroAuditController],
  providers: [AgroAuditService],
  exports: [AgroAuditService],
})
export class AgroAuditModule {}
