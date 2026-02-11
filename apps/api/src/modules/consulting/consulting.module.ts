import { Module } from "@nestjs/common";
import { ConsultingService } from "./consulting.service";
import { ConsultingController } from "./consulting.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";

@Module({
    imports: [PrismaModule, CmrModule],
    controllers: [ConsultingController],
    providers: [ConsultingService, ConsultingDomainRules],
    exports: [ConsultingService],
})
export class ConsultingModule { }
