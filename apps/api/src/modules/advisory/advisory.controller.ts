import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { AdvisoryService } from "./advisory.service";

interface AdvisoryActor {
  id: string;
  userId?: string;
  companyId: string;
  role?: string;
}

@Controller("advisory")
@UseGuards(JwtAuthGuard)
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
  async getPilotCohort(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getPilotCohort(user.companyId);
  }

  @Post("pilot/enable")
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
  async getTuningThresholds(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getTuningThresholds(user.companyId);
  }

  @Post("tuning/thresholds")
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
  async getKillSwitchStatus(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getKillSwitchStatus(user.companyId);
  }

  @Get("rollout/status")
  async getRolloutStatus(@CurrentUser() user: AdvisoryActor) {
    return this.advisoryService.getRolloutStatus(user.companyId);
  }

  @Post("rollout/config")
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
