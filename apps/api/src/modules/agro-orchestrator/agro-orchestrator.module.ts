import { Module } from "@nestjs/common";
import { AgroOrchestratorService } from "./agro-orchestrator.service";
import { AgroOrchestratorController } from "./agro-orchestrator.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { RiskModule } from "../risk/risk.module";

@Module({
  imports: [PrismaModule, AuditModule, RiskModule],
  controllers: [AgroOrchestratorController],
  providers: [AgroOrchestratorService],
  exports: [AgroOrchestratorService],
})
export class AgroOrchestratorModule {}
