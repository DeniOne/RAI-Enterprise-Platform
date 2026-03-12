import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseInterceptors,
  Query,
} from "@nestjs/common";
import { ConsultingService, UserContext } from "./consulting.service";
import { BudgetPlanService } from "./budget-plan.service";
import { ExecutionService } from "./execution.service";
import { CreateHarvestPlanDto } from "./dto/create-harvest-plan.dto";
import { UpdateDraftPlanDto } from "./dto/update-draft-plan.dto";
import { TransitionPlanStatusDto } from "./dto/transition-plan-status.dto";
import { TransitionBudgetStatusDto } from "./dto/transition-budget-status.dto";
import { CompleteOperationDto } from "./dto/complete-operation.dto";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { YieldService } from "./yield.service";
import { KpiService } from "./kpi.service";
import { SaveHarvestResultDto } from "./dto/save-harvest-result.dto";
import { YieldOrchestrator } from "./yield.orchestrator";
import { ManagementDecisionService } from "./management-decision.service";
import { StrategicViewService } from "./strategic-view.service";
import { StrategicGoalService } from "./strategic-goal.service";
import { StrategicDecompositionService } from "./strategic-decomposition.service";
import { ScenarioSimulationService } from "./scenario-simulation.service";
import { StrategicAdvisoryService } from "./strategic-advisory.service";
import { ConsultingOrchestrator } from "./consulting.orchestrator";
import { CashFlowService } from "./cash-flow.service";
import { LiquidityRiskService } from "./liquidity-risk.service";
import { DeviationService } from "./deviation.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  EXECUTION_ROLES,
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
  STRATEGIC_ROLES,
} from "../../shared/auth/rbac.constants";
import { ConsultingAccess } from "./consulting-access.decorator";

@Controller("consulting")
export class ConsultingController {
  constructor(
    private readonly consultingService: ConsultingService,
    private readonly budgetService: BudgetPlanService,
    private readonly orchestrator: ConsultingOrchestrator,
    private readonly yieldOrchestrator: YieldOrchestrator,
    private readonly decisionService: ManagementDecisionService,
    private readonly goalService: StrategicGoalService,
    private readonly decompositionService: StrategicDecompositionService,
    private readonly simulationService: ScenarioSimulationService,
    private readonly advisoryService: StrategicAdvisoryService,
    private readonly cashFlowService: CashFlowService,
    private readonly liquidityRiskService: LiquidityRiskService,
    private readonly deviationService: DeviationService,
    private readonly strategicService: StrategicViewService,
    private readonly executionService: ExecutionService,
    private readonly yieldService: YieldService,
    private readonly kpiService: KpiService,
  ) {}

  // --- Strategic Goals ---

  @Post("goals")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  @UseInterceptors(IdempotencyInterceptor)
  async createGoal(@Body() dto: any, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.goalService.createDraft(dto, context);
  }

  @Get("goals/:id/decompose")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  async decomposeGoal(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.decompositionService.decomposeGoal(id, context);
  }

  // --- Scenario & Advisory ---

  @Post("simulations/season/:id")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  @UseInterceptors(IdempotencyInterceptor)
  async simulate(
    @Param("id") id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.simulationService.simulateSeason(id, dto, context);
  }

  @Get("advisory/:seasonId")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  async getAdvisory(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.advisoryService.getAdvisory(seasonId, context);
  }

  // --- Cash Flow & Liquidity Risk ---

  @Get("cashflow/current")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  async getCashPosition(
    @Query("asOfDate") asOfDate: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    const date = asOfDate ? new Date(asOfDate) : new Date();
    return this.cashFlowService.getCashPosition(context, date);
  }

  @Get("cashflow/projection")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  async getCashProjection(
    @Query("startDate") start: string,
    @Query("endDate") end: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date();
    if (!end) endDate.setMonth(endDate.getMonth() + 3);

    return this.cashFlowService.getProjectedCashFlow(
      context,
      startDate,
      endDate,
    );
  }

  @Get("cashflow/liquidity-risk/:seasonId")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("strategic")
  async getLiquidityRisk(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.liquidityRiskService.analyzeLiquidityRisk(context, seasonId);
  }

  // Deviation & Decisions
  @Get("deviations")
  @Authorized(...PLANNING_READ_ROLES)
  async getDeviations(@CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.deviationService.getActiveDeviations(context);
  }

  @Post("decisions/confirm/:id")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("management")
  @UseInterceptors(IdempotencyInterceptor)
  async confirmDecision(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.decisionService.confirm(id, context);
  }

  @Post("decisions/:id/supersede")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("management")
  @UseInterceptors(IdempotencyInterceptor)
  async supersedeDecision(
    @Param("id") id: string,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.decisionService.supersede(
      id,
      dto.description,
      dto.expectedEffect,
      context,
    );
  }

  @Get("decisions/:id/history")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("management")
  async getDecisionHistory(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.decisionService.getDecisionHistory(id, context);
  }

  // ... (plans, budgets, execution methods)

  @Post("plans")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async create(@Body() dto: CreateHarvestPlanDto, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.consultingService.createPlan(dto, context);
  }

  @Get("plans")
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.consultingService.findAll(context);
  }

  @Get("plans/:id")
  @Authorized(...PLANNING_READ_ROLES)
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.consultingService.findOne(id, context);
  }

  @Patch("plans/:id/draft")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async updateDraft(
    @Param("id") id: string,
    @Body() dto: UpdateDraftPlanDto,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.consultingService.updateDraftPlan(id, dto, context);
  }

  @Post("plans/:id/transitions")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async transition(
    @Param("id") id: string,
    @Body() dto: TransitionPlanStatusDto,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.consultingService.transitionPlanStatus(id, dto.status, context);
  }

  @Post("plans/:id/budget")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async createBudget(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.budgetService.createBudget(id, context);
  }

  @Post("budgets/:id/transitions")
  @Authorized(...STRATEGIC_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async transitionBudget(
    @Param("id") id: string,
    @Body() dto: TransitionBudgetStatusDto,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.budgetService.transitionStatus(id, dto.event, context);
  }

  @Post("budgets/:id/sync")
  @Authorized(...STRATEGIC_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async syncActuals(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.budgetService.syncActuals(id, context);
  }

  @Post("execution/:operationId/start")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async startOperation(
    @Param("operationId") operationId: string,
    @CurrentUser() user: any,
  ) {
    return this.executionService.startOperation(operationId, {
      userId: user.userId,
      companyId: user.companyId,
    });
  }

  @Post("execution/complete")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async completeOperation(
    @Body() dto: CompleteOperationDto,
    @CurrentUser() user: any,
  ) {
    return this.executionService.completeOperation(dto, {
      userId: user.userId,
      companyId: user.companyId,
    });
  }

  @Get("execution/operations")
  @Authorized(...EXECUTION_ROLES)
  async getActiveOperations(@CurrentUser() user: any) {
    return this.executionService.getActiveOperations({
      userId: user.userId,
      companyId: user.companyId,
    });
  }

  @Post("yield")
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async saveYield(@Body() dto: SaveHarvestResultDto, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.yieldOrchestrator.recordHarvest(dto, context);
  }

  @Get("yield/plan/:id")
  @Authorized(...PLANNING_READ_ROLES)
  async getYieldByPlan(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.yieldService.getHarvestResultByPlan(id, context);
  }

  @Get("kpi/plan/:id")
  @Authorized(...PLANNING_READ_ROLES)
  async getPlanKPI(@Param("id") id: string, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.kpiService.calculatePlanKPI(id, context);
  }

  @Get("kpi/company/:seasonId")
  @Authorized(...STRATEGIC_ROLES)
  async getCompanyKPI(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.kpiService.calculateStrategicKPIs(seasonId, context);
  }

  // --- PHASE 3: STRATEGIC & MANAGEMENT ENDPOINTS (PROTECTED RBAC) ---

  @Get("strategic/dashboard/:seasonId")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("management")
  async getStrategicDashboard(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
  ) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.strategicService.getStrategicDashboard(seasonId, context);
  }

  @Post("decisions/draft")
  @Authorized(...STRATEGIC_ROLES)
  @ConsultingAccess("management")
  @UseInterceptors(IdempotencyInterceptor)
  async createDecisionDraft(@Body() dto: any, @CurrentUser() user: any) {
    const context: UserContext = {
      userId: user.userId,
      role: user.role,
      companyId: user.companyId,
    };
    return this.decisionService.createDraft(
      dto.deviationId,
      dto.description,
      dto.expectedEffect,
      context,
    );
  }
}
