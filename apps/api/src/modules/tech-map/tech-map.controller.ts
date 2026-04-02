import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Query,
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
import { ControlPointService } from "./control-point.service";
import {
  ControlPointOutcomeDtoSchema,
  type ControlPointOutcomeDto,
} from "./dto/control-point-outcome.dto";

@Controller("tech-map")
export class TechMapController {
  constructor(
    private readonly techMapService: TechMapService,
    private readonly controlPointService: ControlPointService,
  ) {}

  @Get()
  @Authorized(...PLANNING_READ_ROLES)
  async findAll(@CurrentUser() user: any) {
    return this.techMapService.findAll(user.companyId);
  }

  @Get("generation-rollout/summary")
  @Authorized(...PLANNING_READ_ROLES)
  async getGenerationRolloutSummary(
    @CurrentUser() user: any,
    @Query("companyId") companyId?: string,
  ) {
    return this.techMapService.getGenerationRolloutSummary(
      companyId ?? user.companyId,
    );
  }

  @Get("generation-rollout/readiness")
  @Authorized(...PLANNING_READ_ROLES)
  async getGenerationRolloutReadiness(
    @CurrentUser() user: any,
    @Query("companyId") companyId?: string,
  ) {
    return this.techMapService.getGenerationRolloutReadiness(
      companyId ?? user.companyId,
    );
  }

  @Get("generation-rollout/cutover-packet")
  @Authorized(...PLANNING_READ_ROLES)
  async getGenerationRolloutCutoverPacket(
    @CurrentUser() user: any,
    @Query("companyId") companyId?: string,
  ) {
    return this.techMapService.getGenerationRolloutCutoverPacket(
      companyId ?? user.companyId,
    );
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

  @Post(":id/version")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async createNextVersion(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.createNextVersion(id, user.companyId);
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

  @Post(":id/clarify/resume")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async resumeClarify(
    @Param("id") id: string,
    @Body()
    body: {
      resolvedSlotKeys?: string[];
      resumeRequested?: boolean;
    },
    @CurrentUser() user: any,
  ) {
    return this.techMapService.resumeDraftClarify(id, user.companyId, body);
  }

  @Get(":id/runtime-adoption")
  @Authorized(...PLANNING_READ_ROLES)
  async getRuntimeAdoption(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.getRuntimeAdoptionSnapshot(
      id,
      user.companyId,
    );
  }

  @Get(":id/canonical-draft")
  @Authorized(...PLANNING_READ_ROLES)
  async getCanonicalDraft(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.getCanonicalDraft(id, user.companyId);
  }

  @Get(":id/explainability")
  @Authorized(...PLANNING_READ_ROLES)
  async getExplainability(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.getExplainability(id, user.companyId);
  }

  @Post(":id/control-points/:controlPointId/outcome")
  @Authorized(...PLANNING_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async recordControlPointOutcome(
    @Param("id") id: string,
    @Param("controlPointId") controlPointId: string,
    @Body() body: ControlPointOutcomeDto,
    @CurrentUser() user: any,
  ) {
    const payload = ControlPointOutcomeDtoSchema.parse(body);
    return this.controlPointService.recordOutcome(
      id,
      controlPointId,
      payload,
      user.companyId,
      user.id,
    );
  }

  @Get(":id/persistence-boundary")
  @Authorized(...PLANNING_READ_ROLES)
  async getPersistenceBoundary(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.techMapService.getPersistenceBoundarySnapshot(
      id,
      user.companyId,
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
