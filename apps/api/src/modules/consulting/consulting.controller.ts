import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ConsultingService, UserContext } from './consulting.service';
import { BudgetPlanService } from './budget-plan.service';
import { ExecutionService } from './execution.service';
import { CreateHarvestPlanDto } from './dto/create-harvest-plan.dto';
import { UpdateDraftPlanDto } from './dto/update-draft-plan.dto';
import { TransitionPlanStatusDto } from './dto/transition-plan-status.dto';
import { TransitionBudgetStatusDto } from './dto/transition-budget-status.dto';
import { CompleteOperationDto } from './dto/complete-operation.dto';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CurrentUser } from '../../shared/auth/current-user.decorator';
import { UserRole } from '@rai/prisma-client';
import { YieldService } from './yield.service';
import { KpiService } from './kpi.service';
import { SaveHarvestResultDto } from './dto/save-harvest-result.dto';

@Controller('consulting')
@UseGuards(JwtAuthGuard)
export class ConsultingController {
    constructor(
        private readonly consultingService: ConsultingService,
        private readonly budgetService: BudgetPlanService,
        private readonly executionService: ExecutionService,
        private readonly yieldService: YieldService,
        private readonly kpiService: KpiService,
    ) { }

    @Post('plans')
    async create(@Body() dto: CreateHarvestPlanDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.createPlan(dto, context);
    }

    @Get('plans')
    async findAll(@CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.findAll(context);
    }

    @Get('plans/:id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.findOne(id, context);
    }

    @Patch('plans/:id/draft')
    async updateDraft(@Param('id') id: string, @Body() dto: UpdateDraftPlanDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.updateDraftPlan(id, dto, context);
    }

    @Post('plans/:id/transitions')
    async transition(@Param('id') id: string, @Body() dto: TransitionPlanStatusDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.consultingService.transitionPlanStatus(id, dto.status, context);
    }

    // --- TRACK 2: BUDGET ENDPOINTS ---

    @Post('plans/:id/budget')
    async createBudget(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.budgetService.createBudget(id, context);
    }

    @Post('budgets/:id/transitions')
    async transitionBudget(@Param('id') id: string, @Body() dto: TransitionBudgetStatusDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.budgetService.transitionStatus(id, dto.event, context);
    }

    @Post('budgets/:id/sync')
    async syncActuals(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.budgetService.syncActuals(id, context);
    }

    // --- TRACK 4: EXECUTION ENDPOINTS ---

    @Post('execution/:operationId/start')
    async startOperation(@Param('operationId') operationId: string, @CurrentUser() user: any) {
        return this.executionService.startOperation(operationId, {
            userId: user.userId,
            companyId: user.companyId,
        });
    }

    @Post('execution/complete')
    async completeOperation(@Body() dto: CompleteOperationDto, @CurrentUser() user: any) {
        return this.executionService.completeOperation(dto, {
            userId: user.userId,
            companyId: user.companyId,
        });
    }

    @Get('execution/operations')
    async getActiveOperations(@CurrentUser() user: any) {
        return this.executionService.getActiveOperations({
            userId: user.userId,
            companyId: user.companyId,
        });
    }

    // --- TRACK 5: YIELD & KPI ENDPOINTS ---

    @Post('yield')
    async saveYield(@Body() dto: SaveHarvestResultDto, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.yieldService.createOrUpdateHarvestResult(dto, context);
    }

    @Get('yield/plan/:id')
    async getYieldByPlan(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.yieldService.getHarvestResultByPlan(id, context);
    }

    @Get('kpi/plan/:id')
    async getPlanKPI(@Param('id') id: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.kpiService.calculatePlanKPI(id, context);
    }

    @Get('kpi/company/:seasonId')
    async getCompanyKPI(@Param('seasonId') seasonId: string, @CurrentUser() user: any) {
        const context: UserContext = {
            userId: user.userId,
            role: user.role,
            companyId: user.companyId,
        };
        return this.kpiService.calculateCompanyKPI(context, seasonId);
    }
}
