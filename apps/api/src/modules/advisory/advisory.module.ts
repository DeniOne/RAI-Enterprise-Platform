import { Module } from "@nestjs/common";
import { AdvisoryController } from "./advisory.controller";
import { AdvisoryService } from "./advisory.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuditModule } from "../../shared/audit/audit.module";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdvisoryController],
  providers: [AdvisoryService],
  exports: [AdvisoryService],
})
export class AdvisoryModule {}
