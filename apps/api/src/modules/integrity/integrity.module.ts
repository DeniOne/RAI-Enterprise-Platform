import { Module } from "@nestjs/common";
import { IntegrityGateService } from "./integrity-gate.service";
import { RegistryAgentService } from "./registry-agent.service";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { TelegramModule } from "../telegram/telegram.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ConsultingModule } from "../consulting/consulting.module";

@Module({
    imports: [PrismaModule, CmrModule, TelegramModule, ConsultingModule, ScheduleModule.forRoot()],
    providers: [IntegrityGateService, RegistryAgentService],
    exports: [IntegrityGateService, RegistryAgentService],
})
export class IntegrityModule { }
