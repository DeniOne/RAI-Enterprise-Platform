import { Module } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";
import { FieldObservationController } from "./field-observation.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { AuditModule } from "../../shared/audit/audit.module";
import { IntegrityModule } from "../integrity/integrity.module";

@Module({
    imports: [PrismaModule, AuditModule, IntegrityModule],
    providers: [FieldObservationService],
    controllers: [FieldObservationController],
    exports: [FieldObservationService],
})
export class FieldObservationModule { }
