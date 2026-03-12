import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { AdvisoryService } from "./advisory.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  INTERNAL_USER_ROLES,
  MANAGEMENT_ROLES,
} from "../../shared/auth/rbac.constants";

interface AdvisoryActor {
  id: string;
  userId?: string;
  companyId: string;
  role?: string;
}

@Controller("advisory")
@Authorized(...INTERNAL_USER_ROLES)
export class AdvisoryController {
  constructor(private readonly advisoryService: AdvisoryService) {}

  private actorId(user: AdvisoryActor): string {
    return user.id ?? user.userId ?? "";
  }

  @Get("recommendations/my")
  async getMyRecommendations(
    @CurrentUser() user: AdvisoryActor,
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.advisoryService.getPendingRecommendations(
      user.companyId,
      this.actorId(user),
      limit ?? 10,
    );
  }

  @Get("pilot/status")
  async getPilotStatus(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getPilotStatus(
      user.companyId,
      this.actorId(user),
    );
  }

  @Get("pilot/cohort")
  @Roles(...MANAGEMENT_ROLES)
  async getPilotCohort(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getPilotCohort(user.companyId);
  }

  @Post("pilot/enable")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async enablePilot(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string; targetUserId?: string },
  ) {
    return this.advisoryService.enablePilot({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetUserId: body.targetUserId,
    });
  }

  @Post("pilot/disable")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async disablePilot(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string; targetUserId?: string },
  ) {
    return this.advisoryService.disablePilot({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetUserId: body.targetUserId,
    });
  }

  @Post("pilot/cohort/add")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async addPilotUser(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string; targetUserId: string },
  ) {
    return this.advisoryService.addPilotUser({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetUserId: body.targetUserId,
    });
  }

  @Post("pilot/cohort/remove")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async removePilotUser(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string; targetUserId: string },
  ) {
    return this.advisoryService.removePilotUser({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetUserId: body.targetUserId,
    });
  }

  @Get("tuning/thresholds")
  @Roles(...MANAGEMENT_ROLES)
  async getTuningThresholds(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getTuningThresholds(user.companyId);
  }

  @Post("tuning/thresholds")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async updateTuningThresholds(
    @CurrentUser() user: AdvisoryActor,
    @Body()
    body: {
      traceId: string;
      thresholds: {
        confidenceReview: number;
        blockScore: number;
        allowScore: number;
      };
    },
  ) {
    return this.advisoryService.updateTuningThresholds({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      thresholds: body.thresholds,
    });
  }

  @Get("ops/metrics")
  @Roles(...MANAGEMENT_ROLES)
  async getOpsMetrics(
    @CurrentUser() user: AdvisoryActor,
    @Query("windowHours", new ParseIntPipe({ optional: true }))
    windowHours?: number,
  ) {
    return this.advisoryService.getOpsMetrics(
      user.companyId,
      windowHours ?? 24,
    );
  }

  @Get("incident/kill-switch")
  @Roles(...MANAGEMENT_ROLES)
  async getKillSwitchStatus(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getKillSwitchStatus(user.companyId);
  }

  @Get("rollout/status")
  @Roles(...MANAGEMENT_ROLES)
  async getRolloutStatus(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getRolloutStatus(user.companyId);
  }

  @Post("rollout/config")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async configureRollout(
    @CurrentUser() user: AdvisoryActor,
    @Body()
    body: {
      traceId: string;
      stage: "S0" | "S1" | "S2" | "S3" | "S4";
      autoStopEnabled?: boolean;
    },
  ) {
    return this.advisoryService.configureRollout({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      stage: body.stage,
      autoStopEnabled: body.autoStopEnabled,
    });
  }

  @Post("rollout/gate/evaluate")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async evaluateRolloutGate(
    @CurrentUser() user: AdvisoryActor,
    @Body()
    body: {
      traceId: string;
      stage: "S0" | "S1" | "S2" | "S3" | "S4";
      metrics?: {
        errorRate?: number;
        p95LatencyMs?: number;
        conversionRate?: number;
      };
    },
  ) {
    return this.advisoryService.evaluateRolloutGate({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      stage: body.stage,
      metrics: body.metrics,
    });
  }

  @Post("rollout/stage/promote")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async promoteRolloutStage(
    @CurrentUser() user: AdvisoryActor,
    @Body()
    body: { traceId: string; targetStage: "S0" | "S1" | "S2" | "S3" | "S4" },
  ) {
    return this.advisoryService.promoteRolloutStage({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetStage: body.targetStage,
    });
  }

  @Post("rollout/stage/rollback")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async rollbackRolloutStage(
    @CurrentUser() user: AdvisoryActor,
    @Body()
    body: {
      traceId: string;
      targetStage: "S0" | "S1" | "S2" | "S3" | "S4";
      reason?: string;
    },
  ) {
    return this.advisoryService.rollbackRolloutStage({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      targetStage: body.targetStage,
      reason: body.reason,
    });
  }

  @Post("incident/kill-switch/enable")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async enableKillSwitch(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string; reason?: string },
  ) {
    return this.advisoryService.enableKillSwitch({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
      reason: body.reason,
    });
  }

  @Post("incident/kill-switch/disable")
  @Roles(...MANAGEMENT_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async disableKillSwitch(
    @CurrentUser() user: AdvisoryActor,
    @Body() body: { traceId: string },
  ) {
    return this.advisoryService.disableKillSwitch({
      actorId: this.actorId(user),
      actorRole: user.role,
      companyId: user.companyId,
      traceId: body.traceId,
    });
  }

  @Post("recommendations/:traceId/accept")
  @UseInterceptors(IdempotencyInterceptor)
  async acceptRecommendation(
    @CurrentUser() user: AdvisoryActor,
    @Param("traceId") traceId: string,
  ) {
    return this.advisoryService.acceptRecommendation({
      traceId,
      companyId: user.companyId,
      userId: this.actorId(user),
    });
  }

  @Post("recommendations/:traceId/reject")
  @UseInterceptors(IdempotencyInterceptor)
  async rejectRecommendation(
    @CurrentUser() user: AdvisoryActor,
    @Param("traceId") traceId: string,
    @Body() body: { reason?: string },
  ) {
    return this.advisoryService.rejectRecommendation({
      traceId,
      companyId: user.companyId,
      userId: this.actorId(user),
      reason: body?.reason,
    });
  }

  @Post("recommendations/:traceId/feedback")
  @UseInterceptors(IdempotencyInterceptor)
  async recordFeedback(
    @CurrentUser() user: AdvisoryActor,
    @Param("traceId") traceId: string,
    @Body() body: { reason: string; outcome?: string },
  ) {
    return this.advisoryService.recordFeedback({
      traceId,
      companyId: user.companyId,
      userId: this.actorId(user),
      reason: body.reason,
      outcome: body.outcome,
    });
  }

  @Get("recommendations/:traceId/feedback")
  async getFeedback(
    @CurrentUser() user: AdvisoryActor,
    @Param("traceId") traceId: string,
  ) {
    return this.advisoryService.getFeedback(user.companyId, traceId);
  }
}
