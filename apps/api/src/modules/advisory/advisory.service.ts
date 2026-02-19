import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import type { AdvisoryExplainability } from "../../shared/memory/shadow-advisory.service";

type Recommendation = "ALLOW" | "REVIEW" | "BLOCK";
type SignalType = "VISION" | "SATELLITE" | "OPERATION";

interface ShadowEvent {
  traceId: string;
  companyId: string;
  signalType: SignalType;
  recommendation: Recommendation;
  confidence: number;
  explainability: AdvisoryExplainability;
  createdAt: string;
}

interface DecisionEvent {
  traceId: string;
  action: "ADVISORY_ACCEPTED" | "ADVISORY_REJECTED";
  reason?: string;
  createdAt: string;
}

interface PilotStateEvent {
  enabled: boolean;
  scope: "COMPANY" | "USER";
  companyId: string;
  userId?: string;
  createdAt: string;
}

type RolloutStage = "S0" | "S1" | "S2" | "S3" | "S4";

const ROLLOUT_STAGE_PERCENT: Record<RolloutStage, number> = {
  S0: 0,
  S1: 10,
  S2: 25,
  S3: 50,
  S4: 100,
};

export interface AdvisoryRecommendationDto {
  traceId: string;
  signalType: SignalType;
  recommendation: Recommendation;
  confidence: number;
  explainability: AdvisoryExplainability;
  createdAt: string;
  status: "PENDING";
}

export interface AdvisoryPilotStatusDto {
  enabled: boolean;
  scope: "COMPANY" | "USER";
  companyId: string;
  userId?: string;
  updatedAt?: string;
}

export interface AdvisoryPilotCohortItemDto {
  userId: string;
  enabled: boolean;
  updatedAt: string;
}

export interface AdvisoryThresholds {
  confidenceReview: number;
  blockScore: number;
  allowScore: number;
}

export interface AdvisoryOpsMetrics {
  windowHours: number;
  shadowEvaluated: number;
  accepted: number;
  rejected: number;
  feedbackRecorded: number;
  acceptRate: number;
  rejectRate: number;
  feedbackRate: number;
  decisionLagAvgMinutes: number;
}

export interface AdvisoryRolloutStatusDto {
  stage: RolloutStage;
  percentage: number;
  autoStopEnabled: boolean;
  updatedAt?: string;
}

export interface AdvisoryRolloutGateResultDto {
  stage: RolloutStage;
  pass: boolean;
  reasons: string[];
  metrics: {
    errorRate: number;
    p95LatencyMs: number;
    conversionRate: number;
  };
}

const DEFAULT_THRESHOLDS: AdvisoryThresholds = {
  confidenceReview: 0.45,
  blockScore: -0.35,
  allowScore: 0.35,
};

@Injectable()
export class AdvisoryService {
  private readonly stateTtlMs = 30_000;
  private readonly pilotStateCache = new Map<string, { value: PilotStateEvent | null; expiresAt: number }>();
  private readonly killSwitchCache = new Map<string, { value: { enabled: boolean; createdAt: string } | null; expiresAt: number }>();
  private readonly rolloutStateCache = new Map<string, { value: { stage: RolloutStage; autoStopEnabled: boolean; updatedAt: string } | null; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) { }

  async getPendingRecommendations(
    companyId: string,
    userId: string,
    limit = 10,
  ): Promise<AdvisoryRecommendationDto[]> {
    const pilotEnabled = await this.isPilotEnabled(companyId, userId);
    if (!pilotEnabled) {
      return [];
    }

    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 50)) : 10;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["SHADOW_ADVISORY_EVALUATED", "ADVISORY_ACCEPTED", "ADVISORY_REJECTED"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const shadowEvents = new Map<string, ShadowEvent>();
    const decidedTraceIds = new Set<string>();

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      if (log.action === "SHADOW_ADVISORY_EVALUATED") {
        const event = this.parseShadowEvent(metadata, log.createdAt.toISOString());
        if (!event) continue;

        if (!shadowEvents.has(event.traceId)) {
          shadowEvents.set(event.traceId, event);
        }
      }

      if (log.action === "ADVISORY_ACCEPTED" || log.action === "ADVISORY_REJECTED") {
        const traceId = String(metadata.traceId ?? "");
        if (traceId) {
          decidedTraceIds.add(traceId);
        }
      }
    }

    const pending = [...shadowEvents.values()]
      .filter((event) => !decidedTraceIds.has(event.traceId));

    const antiSpamFiltered = this.applyNoiseControl(pending);

    return antiSpamFiltered
      .slice(0, safeLimit)
      .map((event) => ({
        traceId: event.traceId,
        signalType: event.signalType,
        recommendation: event.recommendation,
        confidence: event.confidence,
        explainability: event.explainability,
        createdAt: event.createdAt,
        status: "PENDING" as const,
      }));
  }

  async getPilotStatus(companyId: string, userId: string): Promise<AdvisoryPilotStatusDto> {
    const killSwitchEnabled = await this.isKillSwitchEnabled(companyId);
    if (killSwitchEnabled) {
      return {
        enabled: false,
        scope: "COMPANY",
        companyId,
        userId,
      };
    }

    const status = await this.resolvePilotStatus(companyId, userId);
    return {
      enabled: status?.enabled ?? false,
      scope: status?.scope ?? "USER",
      companyId,
      userId,
      updatedAt: status?.createdAt,
    };
  }

  async getPilotCohort(companyId: string): Promise<AdvisoryPilotCohortItemDto[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["ADVISORY_PILOT_ENABLED", "ADVISORY_PILOT_DISABLED"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const latestByUser = new Map<string, AdvisoryPilotCohortItemDto>();
    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;
      if (String(metadata.scope ?? "") !== "USER") continue;

      const targetUserId = String(metadata.targetUserId ?? "").trim();
      if (!targetUserId) continue;
      if (latestByUser.has(targetUserId)) continue;

      latestByUser.set(targetUserId, {
        userId: targetUserId,
        enabled: log.action === "ADVISORY_PILOT_ENABLED",
        updatedAt: log.createdAt.toISOString(),
      });
    }

    return [...latestByUser.values()].sort((a, b) => a.userId.localeCompare(b.userId));
  }

  async enablePilot(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetUserId?: string;
  }): Promise<{ status: "ENABLED" }> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_PILOT_ENABLED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        scope: input.targetUserId ? "USER" : "COMPANY",
        targetUserId: input.targetUserId ?? null,
      },
    });
    this.invalidatePilotState(input.companyId, input.targetUserId);

    return { status: "ENABLED" };
  }

  async disablePilot(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetUserId?: string;
  }): Promise<{ status: "DISABLED" }> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_PILOT_DISABLED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        scope: input.targetUserId ? "USER" : "COMPANY",
        targetUserId: input.targetUserId ?? null,
      },
    });
    this.invalidatePilotState(input.companyId, input.targetUserId);

    return { status: "DISABLED" };
  }

  async addPilotUser(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetUserId: string;
  }): Promise<{ status: "ENABLED"; userId: string }> {
    if (!input.targetUserId?.trim()) {
      throw new BadRequestException("targetUserId is required");
    }

    await this.enablePilot({
      actorId: input.actorId,
      actorRole: input.actorRole,
      companyId: input.companyId,
      traceId: input.traceId,
      targetUserId: input.targetUserId.trim(),
    });

    return { status: "ENABLED", userId: input.targetUserId.trim() };
  }

  async removePilotUser(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetUserId: string;
  }): Promise<{ status: "DISABLED"; userId: string }> {
    if (!input.targetUserId?.trim()) {
      throw new BadRequestException("targetUserId is required");
    }

    await this.disablePilot({
      actorId: input.actorId,
      actorRole: input.actorRole,
      companyId: input.companyId,
      traceId: input.traceId,
      targetUserId: input.targetUserId.trim(),
    });

    return { status: "DISABLED", userId: input.targetUserId.trim() };
  }

  async getTuningThresholds(companyId: string): Promise<AdvisoryThresholds> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: "ADVISORY_TUNING_UPDATED" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      const thresholds = this.thresholdsFromMetadata(metadata.thresholds);
      if (thresholds) {
        return thresholds;
      }
    }

    return { ...DEFAULT_THRESHOLDS };
  }

  async updateTuningThresholds(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    thresholds: AdvisoryThresholds;
  }): Promise<AdvisoryThresholds> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);
    this.validateThresholds(input.thresholds);

    await this.audit.log({
      action: "ADVISORY_TUNING_UPDATED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        thresholds: input.thresholds,
      },
    });

    return input.thresholds;
  }

  async getOpsMetrics(companyId: string, windowHours = 24): Promise<AdvisoryOpsMetrics> {
    const safeHours = Number.isFinite(windowHours) ? Math.max(1, Math.min(windowHours, 168)) : 24;
    const dateFrom = new Date(Date.now() - safeHours * 60 * 60 * 1000);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "SHADOW_ADVISORY_EVALUATED",
            "ADVISORY_ACCEPTED",
            "ADVISORY_REJECTED",
            "ADVISORY_FEEDBACK_RECORDED",
          ],
        },
        metadata: {
          path: ["companyId"],
          equals: companyId,
        },
        createdAt: { gte: dateFrom },
      },
      orderBy: { createdAt: "desc" },
      take: 3000,
    });

    const filtered = logs.filter((log) => {
      const metadata = this.metadataAsRecord(log.metadata);
      return metadata ? String(metadata.companyId ?? "") === companyId : false;
    });

    const shadow = filtered.filter((log) => log.action === "SHADOW_ADVISORY_EVALUATED");
    const accepted = filtered.filter((log) => log.action === "ADVISORY_ACCEPTED");
    const rejected = filtered.filter((log) => log.action === "ADVISORY_REJECTED");
    const feedback = filtered.filter((log) => log.action === "ADVISORY_FEEDBACK_RECORDED");

    const shadowByTraceId = new Map<string, Date>();
    for (const log of shadow) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      const traceId = String(metadata.traceId ?? "").trim();
      if (!traceId) continue;
      if (!shadowByTraceId.has(traceId)) {
        shadowByTraceId.set(traceId, log.createdAt);
      }
    }

    const decisionLags: number[] = [];
    for (const log of [...accepted, ...rejected]) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      const traceId = String(metadata.traceId ?? "").trim();
      if (!traceId) continue;
      const startedAt = shadowByTraceId.get(traceId);
      if (!startedAt) continue;
      decisionLags.push((log.createdAt.getTime() - startedAt.getTime()) / (60 * 1000));
    }

    const shadowCount = shadow.length;
    const acceptRate = shadowCount === 0 ? 0 : accepted.length / shadowCount;
    const rejectRate = shadowCount === 0 ? 0 : rejected.length / shadowCount;
    const feedbackRate = shadowCount === 0 ? 0 : feedback.length / shadowCount;
    const decisionLagAvgMinutes = decisionLags.length === 0
      ? 0
      : decisionLags.reduce((a, b) => a + b, 0) / decisionLags.length;

    return {
      windowHours: safeHours,
      shadowEvaluated: shadowCount,
      accepted: accepted.length,
      rejected: rejected.length,
      feedbackRecorded: feedback.length,
      acceptRate: Number(acceptRate.toFixed(4)),
      rejectRate: Number(rejectRate.toFixed(4)),
      feedbackRate: Number(feedbackRate.toFixed(4)),
      decisionLagAvgMinutes: Number(decisionLagAvgMinutes.toFixed(2)),
    };
  }

  async getKillSwitchStatus(companyId: string): Promise<{ enabled: boolean; updatedAt?: string }> {
    const status = await this.resolveKillSwitchStatus(companyId);
    return {
      enabled: status?.enabled ?? false,
      updatedAt: status?.createdAt,
    };
  }

  async getRolloutStatus(companyId: string): Promise<AdvisoryRolloutStatusDto> {
    const state = await this.resolveRolloutState(companyId);
    return {
      stage: state?.stage ?? "S0",
      percentage: ROLLOUT_STAGE_PERCENT[state?.stage ?? "S0"],
      autoStopEnabled: state?.autoStopEnabled ?? true,
      updatedAt: state?.updatedAt,
    };
  }

  async configureRollout(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    stage: RolloutStage;
    autoStopEnabled?: boolean;
  }): Promise<AdvisoryRolloutStatusDto> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_ROLLOUT_CONFIG_UPDATED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        stage: input.stage,
        autoStopEnabled: input.autoStopEnabled ?? true,
      },
    });
    this.invalidateRolloutState(input.companyId);

    return {
      stage: input.stage,
      percentage: ROLLOUT_STAGE_PERCENT[input.stage],
      autoStopEnabled: input.autoStopEnabled ?? true,
    };
  }

  async evaluateRolloutGate(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    stage: RolloutStage;
    metrics?: { errorRate?: number; p95LatencyMs?: number; conversionRate?: number };
  }): Promise<AdvisoryRolloutGateResultDto> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    const ops = await this.getOpsMetrics(input.companyId, 24);
    const computedMetrics = {
      errorRate: input.metrics?.errorRate ?? 0,
      p95LatencyMs: input.metrics?.p95LatencyMs ?? ops.decisionLagAvgMinutes * 60 * 1000,
      conversionRate: input.metrics?.conversionRate ?? ops.acceptRate,
    };

    const reasons: string[] = [];
    if (computedMetrics.errorRate > 0.03) reasons.push("error_rate_exceeded");
    if (computedMetrics.p95LatencyMs > 2500) reasons.push("p95_latency_exceeded");
    if (computedMetrics.conversionRate < 0.1) reasons.push("conversion_too_low");

    const pass = reasons.length === 0;

    await this.audit.log({
      action: "ADVISORY_ROLLOUT_GATE_EVALUATED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        stage: input.stage,
        pass,
        reasons,
        metrics: computedMetrics,
      },
    });

    const rollout = await this.resolveRolloutState(input.companyId);
    if (!pass && (rollout?.autoStopEnabled ?? true)) {
      await this.audit.log({
        action: "ADVISORY_ROLLOUT_AUTO_STOPPED",
        companyId: input.companyId,
        userId: input.actorId,
        metadata: {
          traceId: `${input.traceId}:autostop`,
          companyId: input.companyId,
          stage: input.stage,
          reasons,
        },
      });
    }

    return {
      stage: input.stage,
      pass,
      reasons,
      metrics: computedMetrics,
    };
  }

  async promoteRolloutStage(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetStage: RolloutStage;
  }): Promise<AdvisoryRolloutStatusDto> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);
    const current = await this.getRolloutStatus(input.companyId);
    if (ROLLOUT_STAGE_PERCENT[input.targetStage] < ROLLOUT_STAGE_PERCENT[current.stage]) {
      throw new BadRequestException("targetStage must be greater than or equal to current stage");
    }

    await this.audit.log({
      action: "ADVISORY_ROLLOUT_STAGE_PROMOTED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        fromStage: current.stage,
        toStage: input.targetStage,
      },
    });
    this.invalidateRolloutState(input.companyId);

    return {
      stage: input.targetStage,
      percentage: ROLLOUT_STAGE_PERCENT[input.targetStage],
      autoStopEnabled: current.autoStopEnabled,
    };
  }

  async rollbackRolloutStage(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    targetStage: RolloutStage;
    reason?: string;
  }): Promise<AdvisoryRolloutStatusDto> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);
    const current = await this.getRolloutStatus(input.companyId);
    if (ROLLOUT_STAGE_PERCENT[input.targetStage] > ROLLOUT_STAGE_PERCENT[current.stage]) {
      throw new BadRequestException("rollback targetStage must be less than or equal to current stage");
    }

    await this.audit.log({
      action: "ADVISORY_ROLLOUT_STAGE_ROLLED_BACK",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        fromStage: current.stage,
        toStage: input.targetStage,
        reason: input.reason ?? null,
      },
    });
    this.invalidateRolloutState(input.companyId);

    return {
      stage: input.targetStage,
      percentage: ROLLOUT_STAGE_PERCENT[input.targetStage],
      autoStopEnabled: current.autoStopEnabled,
    };
  }

  async enableKillSwitch(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
    reason?: string;
  }): Promise<{ status: "ENABLED" }> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_KILL_SWITCH_ENABLED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        reason: input.reason ?? null,
      },
    });
    this.invalidateKillSwitchState(input.companyId);

    return { status: "ENABLED" };
  }

  async disableKillSwitch(input: {
    actorId: string;
    actorRole?: string;
    companyId: string;
    traceId: string;
  }): Promise<{ status: "DISABLED" }> {
    await this.assertPilotManagerRole(input.actorRole, input.actorId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_KILL_SWITCH_DISABLED",
      companyId: input.companyId,
      userId: input.actorId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
      },
    });
    this.invalidateKillSwitchState(input.companyId);

    return { status: "DISABLED" };
  }

  async acceptRecommendation(input: {
    traceId: string;
    companyId: string;
    userId: string;
  }): Promise<{ traceId: string; status: "ACCEPTED" }> {
    await this.ensureDecisionAllowed(input.traceId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_ACCEPTED",
      companyId: input.companyId,
      userId: input.userId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
      },
    });

    return { traceId: input.traceId, status: "ACCEPTED" };
  }

  async rejectRecommendation(input: {
    traceId: string;
    companyId: string;
    userId: string;
    reason?: string;
  }): Promise<{ traceId: string; status: "REJECTED" }> {
    await this.ensureDecisionAllowed(input.traceId, input.companyId);

    await this.audit.log({
      action: "ADVISORY_REJECTED",
      companyId: input.companyId,
      userId: input.userId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        reason: input.reason ?? null,
      },
    });

    return { traceId: input.traceId, status: "REJECTED" };
  }

  async recordFeedback(input: {
    traceId: string;
    companyId: string;
    userId: string;
    reason: string;
    outcome?: string;
  }): Promise<{ traceId: string; status: "RECORDED" }> {
    if (!input.reason?.trim()) {
      throw new BadRequestException("feedback reason is required");
    }

    const hasShadowEvent = await this.hasShadowEvent(input.traceId, input.companyId);
    if (!hasShadowEvent) {
      throw new NotFoundException("advisory trace not found");
    }

    await this.audit.log({
      action: "ADVISORY_FEEDBACK_RECORDED",
      companyId: input.companyId,
      userId: input.userId,
      metadata: {
        traceId: input.traceId,
        companyId: input.companyId,
        reason: input.reason.trim(),
        outcome: input.outcome?.trim() || null,
      },
    });

    return { traceId: input.traceId, status: "RECORDED" };
  }

  async getFeedback(companyId: string, traceId: string): Promise<Array<{ reason: string; outcome?: string; createdAt: string }>> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: "ADVISORY_FEEDBACK_RECORDED" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const mapped: Array<{ reason: string; outcome?: string; createdAt: string } | null> = logs
      .map((log) => {
        const metadata = this.metadataAsRecord(log.metadata);
        if (!metadata) return null;
        if (String(metadata.companyId ?? "") !== companyId) return null;
        if (String(metadata.traceId ?? "") !== traceId) return null;

        const reason = String(metadata.reason ?? "").trim();
        if (!reason) return null;

        const outcomeRaw = metadata.outcome;
        const outcome = typeof outcomeRaw === "string" && outcomeRaw.trim().length > 0
          ? outcomeRaw.trim()
          : undefined;

        return {
          reason,
          outcome,
          createdAt: log.createdAt.toISOString(),
        };
      });

    return mapped.filter((v): v is { reason: string; outcome?: string; createdAt: string } => v !== null);
  }

  private async ensureDecisionAllowed(traceId: string, companyId: string): Promise<void> {
    const hasShadowEvent = await this.hasShadowEvent(traceId, companyId);
    if (!hasShadowEvent) {
      throw new NotFoundException("advisory trace not found");
    }

    const latestDecision = await this.getLatestDecision(traceId, companyId);
    if (latestDecision) {
      throw new ConflictException(`advisory already ${latestDecision.action === "ADVISORY_ACCEPTED" ? "accepted" : "rejected"}`);
    }
  }

  private async hasShadowEvent(traceId: string, companyId: string): Promise<boolean> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: "SHADOW_ADVISORY_EVALUATED" },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return logs.some((log) => {
      const metadata = this.metadataAsRecord(log.metadata);
      return metadata
        ? String(metadata.traceId ?? "") === traceId && String(metadata.companyId ?? "") === companyId
        : false;
    });
  }

  private async getLatestDecision(traceId: string, companyId: string): Promise<DecisionEvent | null> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["ADVISORY_ACCEPTED", "ADVISORY_REJECTED"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.traceId ?? "") !== traceId) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      return {
        traceId,
        action: log.action as DecisionEvent["action"],
        reason: typeof metadata.reason === "string" ? metadata.reason : undefined,
        createdAt: log.createdAt.toISOString(),
      };
    }

    return null;
  }

  private async isPilotEnabled(companyId: string, userId: string): Promise<boolean> {
    if (await this.isKillSwitchEnabled(companyId)) {
      return false;
    }

    const rollout = await this.resolveRolloutState(companyId);
    if ((rollout?.stage ?? "S0") === "S0") {
      return false;
    }

    const state = await this.resolvePilotStatus(companyId, userId);
    return state?.enabled ?? false;
  }

  private async resolvePilotStatus(companyId: string, userId: string): Promise<PilotStateEvent | null> {
    const cacheKey = `${companyId}:${userId}`;
    const cached = this.pilotStateCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["ADVISORY_PILOT_ENABLED", "ADVISORY_PILOT_DISABLED"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    let companyEvent: PilotStateEvent | null = null;
    let userEvent: PilotStateEvent | null = null;

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      const scope = String(metadata.scope ?? "") as "COMPANY" | "USER";
      if (scope !== "COMPANY" && scope !== "USER") continue;

      const event: PilotStateEvent = {
        enabled: log.action === "ADVISORY_PILOT_ENABLED",
        scope,
        companyId,
        userId: typeof metadata.targetUserId === "string" ? metadata.targetUserId : undefined,
        createdAt: log.createdAt.toISOString(),
      };

      if (scope === "USER") {
        if (event.userId !== userId) continue;
        if (!userEvent) {
          userEvent = event;
        }
      }

      if (scope === "COMPANY") {
        if (!companyEvent) {
          companyEvent = event;
        }
      }

      if (userEvent && companyEvent) break;
    }

    const resolved = userEvent ?? companyEvent;
    this.pilotStateCache.set(cacheKey, {
      value: resolved,
      expiresAt: Date.now() + this.stateTtlMs,
    });
    return resolved;
  }

  private async isKillSwitchEnabled(companyId: string): Promise<boolean> {
    const status = await this.resolveKillSwitchStatus(companyId);
    return status?.enabled ?? false;
  }

  private async resolveKillSwitchStatus(companyId: string): Promise<{ enabled: boolean; createdAt: string } | null> {
    const cached = this.killSwitchCache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: ["ADVISORY_KILL_SWITCH_ENABLED", "ADVISORY_KILL_SWITCH_DISABLED"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      const value = {
        enabled: log.action === "ADVISORY_KILL_SWITCH_ENABLED",
        createdAt: log.createdAt.toISOString(),
      };
      this.killSwitchCache.set(companyId, {
        value,
        expiresAt: Date.now() + this.stateTtlMs,
      });
      return value;
    }
    this.killSwitchCache.set(companyId, {
      value: null,
      expiresAt: Date.now() + this.stateTtlMs,
    });
    return null;
  }

  private parseShadowEvent(metadata: Record<string, unknown>, createdAt: string): ShadowEvent | null {
    const traceId = String(metadata.traceId ?? "").trim();
    const companyId = String(metadata.companyId ?? "").trim();
    const signalType = String(metadata.signalType ?? "").trim() as SignalType;
    const recommendation = String(metadata.recommendation ?? "").trim() as Recommendation;
    const confidenceRaw = metadata.confidence;
    const confidence = typeof confidenceRaw === "number" ? confidenceRaw : Number.NaN;
    const explainabilityRaw = metadata.explainability;

    if (!traceId || !companyId || Number.isNaN(confidence)) return null;
    if (!["VISION", "SATELLITE", "OPERATION"].includes(signalType)) return null;
    if (!["ALLOW", "REVIEW", "BLOCK"].includes(recommendation)) return null;

    const explainability = this.toExplainability(explainabilityRaw, traceId, confidence, recommendation);

    return {
      traceId,
      companyId,
      signalType,
      recommendation,
      confidence,
      explainability,
      createdAt,
    };
  }

  private toExplainability(
    raw: unknown,
    traceId: string,
    confidence: number,
    recommendation: Recommendation,
  ): AdvisoryExplainability {
    const fallback: AdvisoryExplainability = {
      traceId,
      confidence,
      why: `recommendation=${recommendation}; fallback=true`,
      factors: [],
    };

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return fallback;
    }

    const obj = raw as Record<string, unknown>;
    const why = typeof obj.why === "string" ? obj.why : fallback.why;

    const factorsRaw = Array.isArray(obj.factors) ? obj.factors : [];
    const factors = factorsRaw
      .map((factor) => {
        if (!factor || typeof factor !== "object" || Array.isArray(factor)) return null;
        const f = factor as Record<string, unknown>;
        const name = typeof f.name === "string" ? f.name : null;
        const value = typeof f.value === "number" ? f.value : null;
        const direction = typeof f.direction === "string" ? f.direction : null;
        if (!name || value === null) return null;
        if (direction !== "POSITIVE" && direction !== "NEGATIVE" && direction !== "NEUTRAL") return null;
        return { name, value, direction } as AdvisoryExplainability["factors"][number];
      })
      .filter((f): f is AdvisoryExplainability["factors"][number] => Boolean(f));

    return {
      traceId,
      confidence,
      why,
      factors,
    };
  }

  private metadataAsRecord(metadata: unknown): Record<string, unknown> | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
      return null;
    }
    return metadata as Record<string, unknown>;
  }

  private async assertPilotManagerRole(role?: string, actorId?: string, companyId?: string): Promise<void> {
    let normalized = String(role ?? "").toUpperCase();

    if (!normalized && actorId) {
      const actor = await this.prisma.user.findFirst({
        where: { id: actorId, ...(companyId ? { companyId } : {}) },
        select: { role: true },
      });
      normalized = String(actor?.role ?? "").toUpperCase();
    }

    if (normalized === "ADMIN" || normalized === "MANAGER") {
      return;
    }
    throw new ForbiddenException("pilot management requires ADMIN or MANAGER role");
  }

  private thresholdsFromMetadata(raw: unknown): AdvisoryThresholds | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }

    const value = raw as Record<string, unknown>;
    const candidate: AdvisoryThresholds = {
      confidenceReview: Number(value.confidenceReview),
      blockScore: Number(value.blockScore),
      allowScore: Number(value.allowScore),
    };

    try {
      this.validateThresholds(candidate);
      return candidate;
    } catch {
      return null;
    }
  }

  private validateThresholds(thresholds: AdvisoryThresholds): void {
    if (
      Number.isNaN(thresholds.confidenceReview) ||
      Number.isNaN(thresholds.blockScore) ||
      Number.isNaN(thresholds.allowScore)
    ) {
      throw new BadRequestException("thresholds must be numbers");
    }
    if (thresholds.confidenceReview < 0 || thresholds.confidenceReview > 1) {
      throw new BadRequestException("confidenceReview must be within [0,1]");
    }
    if (thresholds.blockScore >= thresholds.allowScore) {
      throw new BadRequestException("blockScore must be less than allowScore");
    }
  }

  private applyNoiseControl(events: ShadowEvent[]): ShadowEvent[] {
    const groupedCounter = new Map<string, number>();
    const result: ShadowEvent[] = [];

    for (const event of events) {
      const key = `${event.signalType}:${event.recommendation}`;
      const count = groupedCounter.get(key) ?? 0;

      if (count >= 2) {
        continue;
      }

      groupedCounter.set(key, count + 1);
      result.push(event);
    }

    return result;
  }

  private async resolveRolloutState(companyId: string): Promise<{ stage: RolloutStage; autoStopEnabled: boolean; updatedAt: string } | null> {
    const cached = this.rolloutStateCache.get(companyId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "ADVISORY_ROLLOUT_CONFIG_UPDATED",
            "ADVISORY_ROLLOUT_STAGE_PROMOTED",
            "ADVISORY_ROLLOUT_STAGE_ROLLED_BACK",
          ],
        },
        metadata: {
          path: ["companyId"],
          equals: companyId,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    let stage: RolloutStage | null = null;
    let autoStopEnabled: boolean | null = null;
    let updatedAt: string | null = null;

    for (const log of logs) {
      const metadata = this.metadataAsRecord(log.metadata);
      if (!metadata) continue;
      if (String(metadata.companyId ?? "") !== companyId) continue;

      if (!updatedAt) {
        updatedAt = log.createdAt.toISOString();
      }

      if (log.action === "ADVISORY_ROLLOUT_CONFIG_UPDATED") {
        const configuredStage = this.asRolloutStage(metadata.stage);
        if (configuredStage && !stage) {
          stage = configuredStage;
        }
        if (autoStopEnabled === null) {
          autoStopEnabled = Boolean(metadata.autoStopEnabled ?? true);
        }
      }

      if (log.action === "ADVISORY_ROLLOUT_STAGE_PROMOTED" || log.action === "ADVISORY_ROLLOUT_STAGE_ROLLED_BACK") {
        const toStage = this.asRolloutStage(metadata.toStage);
        if (toStage && !stage) {
          stage = toStage;
        }
      }

      if (stage && autoStopEnabled !== null) {
        break;
      }
    }

    if (!stage && autoStopEnabled === null && !updatedAt) {
      this.rolloutStateCache.set(companyId, {
        value: null,
        expiresAt: Date.now() + this.stateTtlMs,
      });
      return null;
    }

    const value = {
      stage: stage ?? "S0",
      autoStopEnabled: autoStopEnabled ?? true,
      updatedAt: updatedAt ?? new Date().toISOString(),
    };
    this.rolloutStateCache.set(companyId, {
      value,
      expiresAt: Date.now() + this.stateTtlMs,
    });
    return value;
  }

  private asRolloutStage(raw: unknown): RolloutStage | null {
    const value = String(raw ?? "").trim().toUpperCase();
    if (value === "S0" || value === "S1" || value === "S2" || value === "S3" || value === "S4") {
      return value;
    }
    return null;
  }

  private invalidatePilotState(companyId: string, userId?: string): void {
    if (userId) {
      this.pilotStateCache.delete(`${companyId}:${userId}`);
      return;
    }

    for (const key of this.pilotStateCache.keys()) {
      if (key.startsWith(`${companyId}:`)) {
        this.pilotStateCache.delete(key);
      }
    }
  }

  private invalidateKillSwitchState(companyId: string): void {
    this.killSwitchCache.delete(companyId);
  }

  private invalidateRolloutState(companyId: string): void {
    this.rolloutStateCache.delete(companyId);
  }
}

