import { Module } from "@nestjs/common";
import { ConsultingService } from "./consulting.service";
import { ConsultingController } from "./consulting.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { CmrModule } from "../cmr/cmr.module";
import { ConsultingDomainRules } from "./domain-rules/consulting.domain-rules.service";
import { BudgetPlanService } from "./budget-plan.service";
import { ExecutionService } from "./execution.service";
import { ConsultingOrchestrator } from "./consulting.orchestrator";
import { YieldService } from './yield.service';
import { KpiService } from './kpi.service';

@Module({
    imports: [PrismaModule, CmrModule],
    controllers: [ConsultingController],
    providers: [
        ConsultingService,
        BudgetPlanService,
        ConsultingDomainRules,
        ExecutionService,
        ConsultingOrchestrator,
        YieldService,
        KpiService
    ],
    exports: [ConsultingService, BudgetPlanService, ExecutionService],
})
export class ConsultingModule { }
