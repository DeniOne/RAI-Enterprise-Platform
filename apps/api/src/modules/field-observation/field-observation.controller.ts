import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { FieldObservationService } from "./field-observation.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { PaginationDto } from "../../shared/dto/pagination.dto";
import {
  IntegrityStatus,
  ObservationIntent,
  ObservationType,
  User,
} from "@rai/prisma-client";

@Controller("field-observation")
@UseGuards(JwtAuthGuard)
export class FieldObservationController {
  constructor(private readonly observationService: FieldObservationService) {}

  @Post()
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
  async findAll(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.observationService.findAll(user.companyId, {
      skip: ((pagination.page || 1) - 1) * (pagination.limit || 20),
      limit: pagination.limit || 20,
      page: pagination.page || 1,
    });
  }

  @Get("task/:taskId")
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
