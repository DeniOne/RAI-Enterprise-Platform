import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import { DeviationService } from "./deviation.service";
import { RiskService } from "./risk.service";
import { DecisionService } from "./decision.service";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  EXECUTION_ROLES,
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("cmr")
@Authorized(...PLANNING_READ_ROLES)
export class CmrController {
  constructor(
    private readonly deviationService: DeviationService,
    private readonly riskService: RiskService,
    private readonly decisionService: DecisionService,
  ) {}

  @Post("reviews")
  @Roles(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async createReview(@Body() data: any, @CurrentUser() user: any) {
    return this.deviationService.createReview({
      ...data,
      companyId: user.companyId,
      userId: user.userId,
    });
  }

  @Get("reviews")
  async listReviews(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.deviationService.findAll(user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }

  @Get("reviews/:id")
  async getReview(@Param("id") id: string, @CurrentUser() user: any) {
    return this.deviationService.findOne(id, user.companyId);
  }

  @Patch("reviews/:id/transition")
  @Roles(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async transitionReview(
    @Param("id") id: string,
    @Body("status") status: any,
    @CurrentUser() user: any,
  ) {
    return this.deviationService.transitionStatus(
      id,
      status,
      user.companyId,
      user.userId,
    );
  }

  @Get("decisions")
  async getDecisions(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.decisionService.findAll(user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }

  @Get("decisions/season/:seasonId")
  async getDecisionsBySeason(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.decisionService.findBySeason(seasonId, user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }
}
