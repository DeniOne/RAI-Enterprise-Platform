import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { TechMapService } from "./tech-map.service";
import { TechMapStatus } from "@rai/prisma-client";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  PLANNING_READ_ROLES,
  PLANNING_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("tech-map")
export class TechMapController {
  constructor(private readonly techMapService: TechMapService) {}

  @Get()
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@CurrentUser() user: any) {
    return this.techMapService.findAll(user.companyId);
  }

  @Post("generate")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async generate(@Body() body: { harvestPlanId: string; seasonId: string }) {
    return this.techMapService.generateMap(body.harvestPlanId, body.seasonId);
  }

  @Patch(":id/draft")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async updateDraft(
    @Param("id") id: string,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.updateDraft(id, data, user.companyId);
  }

  @Patch(":id/transition")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async transition(
    @Param("id") id: string,
    @Body() body: { status: TechMapStatus },
    @CurrentUser() user: any,
  ) {
    return this.techMapService.transitionStatus(
      id,
      body.status,
      user.companyId,
      user.role,
      user.id,
    );
  }

  @Get(":id")
  @Authorized(...PLANNING_READ_ROLES)
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.techMapService.findOne(id, user.companyId);
  }

  @Get("season/:seasonId")
  @Authorized(...PLANNING_READ_ROLES)
  async findBySeason(
    @Param("seasonId") seasonId: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.findBySeason(seasonId, user.companyId);
  }
}
