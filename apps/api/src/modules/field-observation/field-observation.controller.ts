import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import {
  IntegrityStatus,
  ObservationIntent,
  ObservationType,
  User,
} from "@rai/prisma-client";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  EXECUTION_ROLES,
  PLANNING_READ_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("field-observation")
export class FieldObservationController {
  constructor(private readonly observationService: FieldObservationService) {}

  @Post()
  @Authorized(...EXECUTION_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async create(
    @CurrentUser() user: User,
    @Body()
    body: {
      type: ObservationType;
      intent?: ObservationIntent;
      integrityStatus?: IntegrityStatus;
      fieldId: string;
      seasonId: string;
      taskId?: string;
      content?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
    },
  ) {
    return this.observationService.createObservation({
      ...body,
      companyId: user.companyId!,
      authorId: user.id,
    });
  }

  @Get()
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.observationService.findAll(user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }

  @Get("task/:taskId")
  @Authorized(...PLANNING_READ_ROLES)
  async getByTask(
    @Param("taskId") taskId: string,
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.observationService.getByTask(taskId, user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }

  @Get("season/:seasonId")
  @Authorized(...PLANNING_READ_ROLES)
  async getBySeason(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto,
  ) {
    return this.observationService.findAllByFilter(
      { seasonId, companyId: user.companyId },
      {
        skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
        limit: pagination.limit || 20,
        page: pagination.page || 1,
      },
    );
  }
}
