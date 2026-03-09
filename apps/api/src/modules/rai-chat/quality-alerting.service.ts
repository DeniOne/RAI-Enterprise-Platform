import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { IncidentOpsService } from "./incident-ops.service";
import { RuntimeGovernanceEventType, SystemIncidentType } from "@rai/prisma-client";
import { RuntimeGovernanceEventService } from "./runtime-governance/runtime-governance-event.service";
import { RuntimeGovernanceRecommendationService } from "./runtime-governance/runtime-governance-recommendation.service";

const DEFAULT_DELTA_THRESHOLD = 15; // п.п. ухудшения
const DEFAULT_ABSOLUTE_THRESHOLD = 30; // абсолютный BS%

export interface QualityAlertingParams {
  companyId: string;
  now?: Date;
  deltaThresholdPct?: number;
  absoluteThresholdPct?: number;
}

export interface QualityAlertingResult {
  alertCreated: boolean;
  recentAvgBsPct: number;
  baselineAvgBsPct: number;
}

@Injectable()
export class QualityAlertingService {
  private readonly logger = new Logger(QualityAlertingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly incidentOps: IncidentOpsService,
    private readonly governanceEvents: RuntimeGovernanceEventService,
    private readonly recommendationService: RuntimeGovernanceRecommendationService,
  ) {}

  async evaluateBsDrift(
    params: QualityAlertingParams,
  ): Promise<QualityAlertingResult> {
    const {
      companyId,
      now = new Date(),
      deltaThresholdPct = DEFAULT_DELTA_THRESHOLD,
      absoluteThresholdPct = DEFAULT_ABSOLUTE_THRESHOLD,
    } = params;

    const recentWindowEnd = now;
    const recentWindowStart = new Date(
      recentWindowEnd.getTime() - 24 * 60 * 60 * 1000,
    );
    const baselineWindowEnd = recentWindowStart;
    const baselineWindowStart = new Date(
      baselineWindowEnd.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    const [recentAgg, baselineAgg, existingAlert, hottestTrace] = await Promise.all([
      this.prisma.traceSummary.aggregate({
        _avg: { bsScorePct: true },
        where: {
          companyId,
          createdAt: {
            gte: recentWindowStart,
            lt: recentWindowEnd,
          },
        },
      }),
      this.prisma.traceSummary.aggregate({
        _avg: { bsScorePct: true },
        where: {
          companyId,
          createdAt: {
            gte: baselineWindowStart,
            lt: baselineWindowEnd,
          },
        },
      }),
      this.findExistingTodayAlert(companyId, now),
      this.prisma.traceSummary.findFirst({
        where: {
          companyId,
          createdAt: {
            gte: recentWindowStart,
            lt: recentWindowEnd,
          },
          bsScorePct: {
            not: null,
          },
        },
        orderBy: {
          bsScorePct: "desc",
        },
        select: {
          traceId: true,
          bsScorePct: true,
        },
      }),
    ]);

    const recentAvg = recentAgg._avg.bsScorePct ?? 0;
    const baselineAvg = baselineAgg._avg.bsScorePct ?? 0;

    // Если уже есть алерт за сегодня по BS_DRIFT — второй не создаём.
    if (existingAlert) {
      this.logger.log(
        `Cooldown active for companyId=${companyId}, skipping new BS_DRIFT alert`,
      );
      return {
        alertCreated: false,
        recentAvgBsPct: recentAvg,
        baselineAvgBsPct: baselineAvg,
      };
    }

    const delta = recentAvg - baselineAvg;
    const worsened = delta > 0 && delta >= deltaThresholdPct;
    const absoluteBad = recentAvg >= absoluteThresholdPct;

    if (!worsened && !absoluteBad) {
      return {
        alertCreated: false,
        recentAvgBsPct: recentAvg,
        baselineAvgBsPct: baselineAvg,
      };
    }

    const severity = "HIGH";
    const message = `BS% ухудшился с ${baselineAvg.toFixed(
      1,
    )}% до ${recentAvg.toFixed(
      1,
    )}% (дельта +${delta.toFixed(1)} п.п.) для компании ${companyId}.`;

    await this.prisma.qualityAlert.create({
      data: {
        companyId,
        alertType: "BS_DRIFT",
        severity,
        message,
      },
    });
    await this.governanceEvents.record({
      companyId,
      traceId: hottestTrace?.traceId ?? null,
      eventType: RuntimeGovernanceEventType.QUALITY_DRIFT_DETECTED,
      fallbackReason: "NO_EVIDENCE",
      fallbackMode: "READ_ONLY_SUPPORT",
      value: Number(recentAvg.toFixed(1)),
      metadata: {
        baselineAvgBsPct: Number(baselineAvg.toFixed(1)),
        deltaPct: Number(delta.toFixed(1)),
      },
    });
    this.incidentOps.logIncident({
      companyId,
      traceId: hottestTrace?.traceId ?? null,
      incidentType: SystemIncidentType.UNKNOWN,
      severity,
      details: {
        subtype: "QUALITY_BS_DRIFT",
        recentAvgBsPct: Number(recentAvg.toFixed(1)),
        baselineAvgBsPct: Number(baselineAvg.toFixed(1)),
        deltaPct: Number(delta.toFixed(1)),
        hottestTraceId: hottestTrace?.traceId ?? null,
        hottestTraceBsPct: hottestTrace?.bsScorePct ?? null,
      },
    });
    await this.recommendationService.handleQualityAlertCreated({
      companyId,
      traceId: hottestTrace?.traceId ?? null,
      recentAvgBsPct: Number(recentAvg.toFixed(1)),
      baselineAvgBsPct: Number(baselineAvg.toFixed(1)),
    });

    this.logger.warn(
      `Quality alert emitted companyId=${companyId} severity=${severity} recentAvg=${recentAvg} baselineAvg=${baselineAvg}`,
    );

    return {
      alertCreated: true,
      recentAvgBsPct: recentAvg,
      baselineAvgBsPct: baselineAvg,
    };
  }

  private async findExistingTodayAlert(
    companyId: string,
    now: Date,
  ): Promise<unknown | null> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.qualityAlert.findFirst({
      where: {
        companyId,
        alertType: "BS_DRIFT",
        createdAt: {
          gte: startOfDay,
        },
        resolvedAt: null,
      },
    });
  }
}
