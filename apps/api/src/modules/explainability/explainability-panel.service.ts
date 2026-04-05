import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import {
  ExplainabilityTimelineNodeDto,
  ExplainabilityTimelineNodeKind,
  ExplainabilityTimelineResponseDto,
} from "./dto/explainability-timeline.dto";
import {
  TraceForensicsResponseDto,
  TraceForensicsBranchTrustDto,
  TraceForensicsSummaryDto,
  TraceForensicsEntryDto,
  TraceForensicsAlertDto,
  EvidenceRefDto,
  TraceForensicsMemoryLaneDto,
} from "./dto/trace-forensics.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";
import { QueuePressureResponseDto } from "./dto/queue-pressure.dto";
import { QueueMetricsService } from "../rai-chat/performance/queue-metrics.service";
import {
  RoutingCaseMemoryCandidateCaptureResponseDto,
  RoutingDivergenceResponseDto,
} from "./dto/routing-divergence.dto";
import {
  RoutingCaseMemoryLifecycleStatus,
  RoutingTelemetryEvent,
} from "../../shared/rai-chat/semantic-routing.types";
import { SemanticIngressFrame } from "../../shared/rai-chat/semantic-ingress.types";
import {
  ROUTING_CASE_MEMORY_ACTIVATION_ACTION,
  ROUTING_CASE_MEMORY_CAPTURE_ACTION,
  ROUTING_CASE_MEMORY_TTL_HOURS,
} from "../../shared/rai-chat/routing-case-memory.constants";

@Injectable()
export class ExplainabilityPanelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sensitiveDataFilter: SensitiveDataFilterService,
    private readonly queueMetrics: QueueMetricsService,
  ) { }

  async getTruthfulnessDashboard(companyId: string, timeWindowHours: number): Promise<TruthfulnessDashboardResponseDto> {
    const windowHours = Number.isFinite(timeWindowHours) && timeWindowHours > 0 ? timeWindowHours : 24;
    const from = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    const summaries = await this.prisma.traceSummary.findMany({
      where: {
        companyId,
        createdAt: {
          gte: from,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!summaries.length) {
      return {
        companyId,
        avgBsScore: null,
        p95BsScore: null,
        avgEvidenceCoverage: null,
        acceptanceRate: null,
        correctionRate: null,
        worstTraces: [],
        qualityKnownTraceCount: 0,
        qualityPendingTraceCount: 0,
        branchTrust: this.buildBranchTrustDashboard([]),
        criticalPath: [],
      };
    }

    // Avg только по трейсам где quality уже посчитана (не-null).
    // Трейсы с NULL = quality pending — не включаем в среднее: это честнее, чем ?? 0.
    const bsKnown = summaries
      .map((s) => s.bsScorePct)
      .filter((v): v is number => v !== null);
    const evidenceKnown = summaries
      .map((s) => s.evidenceCoveragePct)
      .filter((v): v is number => v !== null);

    const avg = (values: number[]): number =>
      values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

    const avgBsScore = bsKnown.length > 0 ? avg(bsKnown) : null;
    const avgEvidenceCoverage = evidenceKnown.length > 0 ? avg(evidenceKnown) : null;

    const sortedForP95 = [...bsKnown].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * (sortedForP95.length - 1));
    const p95BsScore = sortedForP95.length > 0 ? (sortedForP95[p95Index] ?? sortedForP95[sortedForP95.length - 1]) : null;

    const worstTraces = summaries
      .slice()
      .sort((a, b) => (b.bsScorePct ?? 0) - (a.bsScorePct ?? 0))
      .slice(0, 10)
      .map((s) => ({
        traceId: s.traceId,
        bsScorePct: s.bsScorePct,
        evidenceCoveragePct: s.evidenceCoveragePct,
        invalidClaimsPct: s.invalidClaimsPct,
        createdAt: s.createdAt.toISOString(),
      }));

    const qualityKnownTraceCount = summaries.filter(
      (s) => s.bsScorePct !== null && s.evidenceCoveragePct !== null,
    ).length;
    const qualityPendingTraceCount = summaries.length - qualityKnownTraceCount;
    const branchTrust = this.buildBranchTrustDashboard(summaries);

    const traceIds = summaries.map((s) => s.traceId);
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: { companyId, traceId: { in: traceIds } },
      select: {
        traceId: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const criticalPath = this.buildCriticalPathCards(auditEntries, summaries);

    // Acceptance Rate: пока единственный честный tenant-scoped live source —
    // advisory decisions в AuditLog. Correction Rate не инструментирован отдельно,
    // поэтому возвращаем null вместо фейковой цифры.
    const advisoryLogs = await this.prisma.auditLog.findMany({
      where: {
        companyId,
        action: {
          in: [
            "ADVISORY_ACCEPTED",
            "ADVISORY_REJECTED",
            "ADVISORY_FEEDBACK_RECORDED",
          ],
        },
        createdAt: {
          gte: from,
        },
      },
      select: {
        action: true,
        metadata: true,
      },
    });
    const advisoryTraceId = (log: { metadata: unknown }): string => {
      const metadata =
        log.metadata && typeof log.metadata === "object"
          ? (log.metadata as Record<string, unknown>)
          : null;
      return typeof metadata?.traceId === "string"
        ? metadata.traceId.trim()
        : "";
    };
    const acceptedTraceIds = new Set(
      advisoryLogs
        .filter((log) => log.action === "ADVISORY_ACCEPTED")
        .map(advisoryTraceId)
        .filter((traceId) => traceId.length > 0),
    );
    const rejectedTraceIds = new Set(
      advisoryLogs
        .filter((log) => log.action === "ADVISORY_REJECTED")
        .map(advisoryTraceId)
        .filter((traceId) => traceId.length > 0),
    );
    const decisionTraceIds = new Set([...acceptedTraceIds, ...rejectedTraceIds]);
    const accepted = acceptedTraceIds.size;
    const rejected = rejectedTraceIds.size;
    const decisionCount = decisionTraceIds.size;
    const acceptanceRate =
      decisionCount > 0 ? Number(((accepted / decisionCount) * 100).toFixed(1)) : null;
    const correctedTraceIds = new Set(
      advisoryLogs
        .filter((log) => log.action === "ADVISORY_FEEDBACK_RECORDED")
        .map((log) => {
          const metadata =
            log.metadata && typeof log.metadata === "object"
              ? (log.metadata as Record<string, unknown>)
              : null;
          const traceId =
            typeof metadata?.traceId === "string" ? metadata.traceId.trim() : "";
          const outcome =
            typeof metadata?.outcome === "string"
              ? metadata.outcome.trim().toLowerCase()
              : "";
          return outcome === "corrected" && decisionTraceIds.has(traceId)
            ? traceId
            : "";
        })
        .filter((traceId) => traceId.length > 0),
    );
    const correctionRate =
      decisionCount > 0
        ? Number(((correctedTraceIds.size / decisionCount) * 100).toFixed(1))
        : null;

    return {
      companyId,
      avgBsScore,
      p95BsScore,
      avgEvidenceCoverage,
      acceptanceRate,
      correctionRate,
      worstTraces,
      qualityKnownTraceCount,
      qualityPendingTraceCount,
      branchTrust,
      criticalPath,
    };
  }

  async getTraceTimeline(traceId: string, companyId: string): Promise<ExplainabilityTimelineResponseDto> {
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: { traceId },
    });

    if (!auditEntries.length) {
      throw new NotFoundException("TRACE_NOT_FOUND");
    }

    const hasForeignTenant = auditEntries.some((e) => e.companyId !== companyId);
    const ownEntry = auditEntries.find((e) => e.companyId === companyId);

    if (!ownEntry && hasForeignTenant) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }

    const baseCompanyId = ownEntry?.companyId ?? auditEntries[0].companyId;

    if (baseCompanyId !== companyId) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }

    const [pendingActions, decisions, quorums] = await Promise.all([
      this.prisma.pendingAction.findMany({
        where: { traceId, companyId },
      }),
      this.prisma.decisionRecord.findMany({
        where: { traceId, companyId },
      }),
      this.prisma.quorumProcess.findMany({
        where: { traceId, companyId },
      }),
    ]);

    const nodes: ExplainabilityTimelineNodeDto[] = [];

    // Попытка извлечь доменные фазы из metadata (R5)
    let hasSystemPhases = false;
    for (const entry of auditEntries) {
      const meta = (entry.metadata as { phases?: Array<{ name: string; timestamp: string; durationMs: number }> }) ?? {};
      if (Array.isArray(meta.phases)) {
        hasSystemPhases = true;
        for (const phase of meta.phases) {
          nodes.push({
            kind: phase.name as ExplainabilityTimelineNodeKind,
            timestamp: phase.timestamp,
            label: this.getPhaseLabel(phase.name),
            status: phase.name === "router" ? (entry.intentMethod ?? undefined) : undefined,
            metadata: {
              durationMs: phase.durationMs,
              ...(phase.name === "tools" ? { toolNames: entry.toolNames } : {}),
            },
          });
        }
      }
    }

    if (!hasSystemPhases) {
      // Fallback: старая логика синтетических нод (Backward Compatibility)
      nodes.push({
        kind: "router",
        timestamp: ownEntry?.createdAt.toISOString() ?? auditEntries[0].createdAt.toISOString(),
        label: "IntentRouter",
        status: ownEntry?.intentMethod ?? undefined,
        metadata: this.deepMask({
          model: ownEntry?.model ?? undefined,
        }) as Record<string, unknown>,
      });

      nodes.push({
        kind: "tools",
        timestamp: ownEntry?.createdAt.toISOString() ?? auditEntries[0].createdAt.toISOString(),
        label: "Executed tools",
        metadata: this.deepMask({
          toolNames: ownEntry?.toolNames ?? [],
        }) as Record<string, unknown>,
      });

      nodes.push({
        kind: "composer",
        timestamp: ownEntry?.createdAt.toISOString() ?? auditEntries[0].createdAt.toISOString(),
        label: "ResponseComposer",
        metadata: {},
      });
    }

    for (const action of pendingActions) {
      nodes.push({
        kind: "pending_action",
        timestamp: action.createdAt.toISOString(),
        label: `PendingAction ${action.toolName}`,
        status: action.status,
        metadata: this.deepMask({
          riskLevel: action.riskLevel,
        }) as Record<string, unknown>,
      });
    }

    for (const decision of decisions) {
      nodes.push({
        kind: "decision",
        timestamp: decision.decidedAt.toISOString(),
        label: `Decision ${decision.actionType}`,
        status: decision.riskVerdict,
        metadata: this.deepMask({
          targetId: decision.targetId,
          riskState: decision.riskState,
          explanation: decision.explanation,
        }) as Record<string, unknown>,
      });
    }

    for (const quorum of quorums) {
      nodes.push({
        kind: "quorum",
        timestamp: quorum.createdAt.toISOString(),
        label: "QuorumProcess",
        status: quorum.status,
        metadata: this.deepMask({
          committeeId: quorum.committeeId,
          committeeVersion: quorum.committeeVersion,
          cmrRiskId: quorum.cmrRiskId,
          decisionRecordId: quorum.decisionRecordId,
        }) as Record<string, unknown>,
      });
    }

    nodes.sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0));

    return {
      traceId,
      companyId: baseCompanyId,
      nodes,
    };
  }

  async getRoutingDivergence(params: {
    companyId: string;
    windowHours: number;
    slice?: string;
    decisionType?: string;
    targetRole?: string;
    onlyMismatches?: boolean;
  }): Promise<RoutingDivergenceResponseDto> {
    const from = new Date(Date.now() - params.windowHours * 60 * 60 * 1000);
    const lifecycleState =
      await this.loadRoutingCaseMemoryLifecycleState(params.companyId);
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: {
        companyId: params.companyId,
        createdAt: {
          gte: from,
        },
      },
      select: {
        traceId: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });

    const events = auditEntries
      .map((entry) => {
        const metadata =
          entry.metadata && typeof entry.metadata === "object"
            ? (entry.metadata as Record<string, unknown>)
            : null;
        const telemetry =
          metadata?.routingTelemetry &&
          typeof metadata.routingTelemetry === "object"
            ? (metadata.routingTelemetry as RoutingTelemetryEvent)
            : null;
        if (!telemetry) {
          return null;
        }
        return {
          traceId: entry.traceId,
          createdAt: entry.createdAt,
          telemetry,
        };
      })
      .filter(
        (
          item,
        ): item is {
          traceId: string;
          createdAt: Date;
          telemetry: RoutingTelemetryEvent;
        } => item !== null,
      )
      .filter((item) =>
        params.slice ? item.telemetry.sliceId === params.slice : true,
      )
      .filter((item) =>
        params.decisionType
          ? item.telemetry.routeDecision.decisionType === params.decisionType
          : true,
      )
      .filter((item) =>
        params.targetRole
          ? item.telemetry.baselineClassification?.targetRole === params.targetRole
          : true,
      )
      .filter((item) =>
        params.onlyMismatches ? item.telemetry.divergence.isMismatch : true,
      );

    const totalEvents = events.length;
    const mismatched = events.filter((item) => item.telemetry.divergence.isMismatch);
    const mismatchedEvents = mismatched.length;
    const divergenceRatePct =
      totalEvents > 0
        ? Number(((mismatchedEvents / totalEvents) * 100).toFixed(1))
        : 0;
    const semanticPrimaryCount = events.filter(
      (item) => item.telemetry.promotedPrimary,
    ).length;

    const clusterMap = new Map<
      string,
      {
        label: string;
        count: number;
        mismatchKinds: Set<string>;
        sampleTraceId: string | null;
        sampleQuery: string | null;
      }
    >();
    const decisionMap = new Map<string, number>();
    const collisionMap = new Map<string, number>();
    const failureClusterMap = new Map<
      string,
      {
        targetRole: string;
        decisionType: string;
        mismatchKinds: string[];
        count: number;
        semanticPrimaryCount: number;
        lastSeenAt: Date;
        sampleTraceId: string | null;
        sampleQuery: string | null;
      }
    >();
    const caseMemoryCandidateMap = new Map<
      string,
      {
        sliceId: string | null;
        targetRole: string;
        decisionType: string;
        mismatchKinds: string[];
        routerVersion: string;
        promptVersion: string;
        toolsetVersion: string;
        traceCount: number;
        semanticPrimaryCount: number;
        firstSeenAt: Date;
        lastSeenAt: Date;
        sampleTraceId: string | null;
        sampleQuery: string | null;
        semanticIntent: RoutingTelemetryEvent["semanticIntent"];
        routeDecision: RoutingTelemetryEvent["routeDecision"];
      }
    >();
    const agentMap = new Map<
      string,
      {
        totalEvents: number;
        mismatchedEvents: number;
        semanticPrimaryCount: number;
        decisionMap: Map<string, number>;
        mismatchMap: Map<string, number>;
        sampleTraceId: string | null;
        sampleQuery: string | null;
      }
    >();

    for (const item of events) {
      const baselineClassification = item.telemetry.baselineClassification;
      const targetRole = baselineClassification?.targetRole ?? "unknown";
      const clusterKey = item.telemetry.divergence.summary;
      const cluster = clusterMap.get(clusterKey) ?? {
        label: clusterKey,
        count: 0,
        mismatchKinds: new Set<string>(),
        sampleTraceId: null,
        sampleQuery: null,
      };
      cluster.count += 1;
      item.telemetry.divergence.mismatchKinds.forEach((kind) =>
        cluster.mismatchKinds.add(kind),
      );
      if (!cluster.sampleTraceId) {
        cluster.sampleTraceId = item.traceId;
        cluster.sampleQuery = item.telemetry.userQueryRedacted;
      }
      clusterMap.set(clusterKey, cluster);

      const decisionType = item.telemetry.routeDecision.decisionType;
      decisionMap.set(decisionType, (decisionMap.get(decisionType) ?? 0) + 1);

      const collisionKey = [
        item.telemetry.divergence.baselineRouteKey ?? "baseline_unknown",
        item.telemetry.divergence.semanticRouteKey,
      ].join(" -> ");
      collisionMap.set(collisionKey, (collisionMap.get(collisionKey) ?? 0) + 1);

      if (item.telemetry.divergence.isMismatch) {
        const mismatchKinds = [...item.telemetry.divergence.mismatchKinds].sort();
        const failureClusterKey = [
          targetRole,
          decisionType,
          mismatchKinds.join("|") || "match",
        ].join("::");
        const failureCluster = failureClusterMap.get(failureClusterKey) ?? {
          targetRole,
          decisionType,
          mismatchKinds,
          count: 0,
          semanticPrimaryCount: 0,
          lastSeenAt: item.createdAt,
          sampleTraceId: null,
          sampleQuery: null,
        };
        failureCluster.count += 1;
        if (item.telemetry.promotedPrimary) {
          failureCluster.semanticPrimaryCount += 1;
        }
        if (item.createdAt > failureCluster.lastSeenAt) {
          failureCluster.lastSeenAt = item.createdAt;
        }
        if (!failureCluster.sampleTraceId) {
          failureCluster.sampleTraceId = item.traceId;
          failureCluster.sampleQuery = item.telemetry.userQueryRedacted;
        }
        failureClusterMap.set(failureClusterKey, failureCluster);

        const caseMemoryCandidateKey = [
          item.telemetry.sliceId ?? "no_slice",
          targetRole,
          decisionType,
          mismatchKinds.join("|") || "match",
          item.telemetry.routerVersion,
          item.telemetry.promptVersion,
          item.telemetry.toolsetVersion,
        ].join("::");
        const caseMemoryCandidate = caseMemoryCandidateMap.get(
          caseMemoryCandidateKey,
        ) ?? {
          sliceId: item.telemetry.sliceId ?? null,
          targetRole,
          decisionType,
          mismatchKinds,
          routerVersion: item.telemetry.routerVersion,
          promptVersion: item.telemetry.promptVersion,
          toolsetVersion: item.telemetry.toolsetVersion,
          traceCount: 0,
          semanticPrimaryCount: 0,
          firstSeenAt: item.createdAt,
          lastSeenAt: item.createdAt,
          sampleTraceId: null,
          sampleQuery: null,
          semanticIntent: item.telemetry.semanticIntent,
          routeDecision: item.telemetry.routeDecision,
        };
        caseMemoryCandidate.traceCount += 1;
        if (item.telemetry.promotedPrimary) {
          caseMemoryCandidate.semanticPrimaryCount += 1;
        }
        if (item.createdAt < caseMemoryCandidate.firstSeenAt) {
          caseMemoryCandidate.firstSeenAt = item.createdAt;
        }
        if (item.createdAt > caseMemoryCandidate.lastSeenAt) {
          caseMemoryCandidate.lastSeenAt = item.createdAt;
        }
        if (!caseMemoryCandidate.sampleTraceId) {
          caseMemoryCandidate.sampleTraceId = item.traceId;
          caseMemoryCandidate.sampleQuery = item.telemetry.userQueryRedacted;
        }
        caseMemoryCandidateMap.set(
          caseMemoryCandidateKey,
          caseMemoryCandidate,
        );
      }

      const agent = agentMap.get(targetRole) ?? {
        totalEvents: 0,
        mismatchedEvents: 0,
        semanticPrimaryCount: 0,
        decisionMap: new Map<string, number>(),
        mismatchMap: new Map<string, number>(),
        sampleTraceId: null,
        sampleQuery: null,
      };
      agent.totalEvents += 1;
      if (item.telemetry.divergence.isMismatch) {
        agent.mismatchedEvents += 1;
        item.telemetry.divergence.mismatchKinds.forEach((kind) =>
          agent.mismatchMap.set(kind, (agent.mismatchMap.get(kind) ?? 0) + 1),
        );
      }
      if (item.telemetry.promotedPrimary) {
        agent.semanticPrimaryCount += 1;
      }
      agent.decisionMap.set(
        decisionType,
        (agent.decisionMap.get(decisionType) ?? 0) + 1,
      );
      if (!agent.sampleTraceId) {
        agent.sampleTraceId = item.traceId;
        agent.sampleQuery = item.telemetry.userQueryRedacted;
      }
      agentMap.set(targetRole, agent);
    }

    return {
      companyId: params.companyId,
      windowHours: params.windowHours,
      totalEvents,
      mismatchedEvents,
      divergenceRatePct,
      semanticPrimaryCount,
      topClusters: [...clusterMap.entries()]
        .sort((left, right) => right[1].count - left[1].count)
        .slice(0, 10)
        .map(([key, value]) => ({
          key,
          label: value.label,
          count: value.count,
          mismatchKinds: [...value.mismatchKinds],
          sampleTraceId: value.sampleTraceId,
          sampleQuery: value.sampleQuery
            ? (this.deepMask(value.sampleQuery) as string)
            : null,
        })),
      decisionBreakdown: [...decisionMap.entries()]
        .sort((left, right) => right[1] - left[1])
        .map(([decisionType, count]) => ({
          decisionType,
          count,
        })),
      collisionMatrix: [...collisionMap.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([key, count]) => {
          const [baselineRouteKey, semanticRouteKey] = key.split(" -> ");
          return {
            baselineRouteKey,
            semanticRouteKey,
            count,
          };
        }),
      agentBreakdown: [...agentMap.entries()]
        .sort((left, right) => {
          if (right[1].mismatchedEvents !== left[1].mismatchedEvents) {
            return right[1].mismatchedEvents - left[1].mismatchedEvents;
          }
          return right[1].totalEvents - left[1].totalEvents;
        })
        .slice(0, 10)
        .map(([targetRole, value]) => ({
          targetRole,
          totalEvents: value.totalEvents,
          mismatchedEvents: value.mismatchedEvents,
          divergenceRatePct:
            value.totalEvents > 0
              ? Number(
                  ((value.mismatchedEvents / value.totalEvents) * 100).toFixed(1),
                )
              : 0,
          semanticPrimaryCount: value.semanticPrimaryCount,
          decisionBreakdown: [...value.decisionMap.entries()]
            .sort((left, right) => right[1] - left[1])
            .map(([decisionType, count]) => ({
              decisionType,
              count,
            })),
          topMismatchKinds: [...value.mismatchMap.entries()]
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([kind, count]) => ({
              kind,
              count,
            })),
          sampleTraceId: value.sampleTraceId,
          sampleQuery: value.sampleQuery
            ? (this.deepMask(value.sampleQuery) as string)
            : null,
        })),
      failureClusters: [...failureClusterMap.entries()]
        .sort((left, right) => {
          if (right[1].count !== left[1].count) {
            return right[1].count - left[1].count;
          }
          return right[1].lastSeenAt.getTime() - left[1].lastSeenAt.getTime();
        })
        .slice(0, 10)
        .map(([key, value]) => ({
          key,
          targetRole: value.targetRole,
          decisionType: value.decisionType,
          mismatchKinds: value.mismatchKinds,
          count: value.count,
          semanticPrimaryCount: value.semanticPrimaryCount,
          caseMemoryReadiness:
            value.count >= 3
              ? "ready_for_case_memory"
              : value.count === 2
                ? "needs_more_evidence"
                : "observe",
          lastSeenAt: value.lastSeenAt.toISOString(),
          sampleTraceId: value.sampleTraceId,
          sampleQuery: value.sampleQuery
            ? (this.deepMask(value.sampleQuery) as string)
            : null,
        })),
      caseMemoryCandidates: [...caseMemoryCandidateMap.entries()]
        .sort((left, right) => {
          const leftReadiness = this.caseMemoryReadinessRank(
            this.resolveCaseMemoryReadiness(left[1].traceCount),
          );
          const rightReadiness = this.caseMemoryReadinessRank(
            this.resolveCaseMemoryReadiness(right[1].traceCount),
          );
          if (rightReadiness !== leftReadiness) {
            return rightReadiness - leftReadiness;
          }
          if (right[1].traceCount !== left[1].traceCount) {
            return right[1].traceCount - left[1].traceCount;
          }
          return right[1].lastSeenAt.getTime() - left[1].lastSeenAt.getTime();
        })
        .slice(0, 10)
        .map(([key, value]) => {
          const caseMemoryReadiness = this.resolveCaseMemoryReadiness(
            value.traceCount,
          );
          const lifecycle = lifecycleState.get(key) ?? null;
          const captureStatus =
            lifecycle?.status === RoutingCaseMemoryLifecycleStatus.Active
              ? "active"
              : lifecycle?.status === RoutingCaseMemoryLifecycleStatus.Captured
                ? "captured"
                : "not_captured";
          return {
            key,
            sliceId: value.sliceId,
            targetRole: value.targetRole,
            decisionType: value.decisionType,
            mismatchKinds: value.mismatchKinds,
            routerVersion: value.routerVersion,
            promptVersion: value.promptVersion,
            toolsetVersion: value.toolsetVersion,
            traceCount: value.traceCount,
            semanticPrimaryCount: value.semanticPrimaryCount,
            caseMemoryReadiness,
            firstSeenAt: value.firstSeenAt.toISOString(),
            lastSeenAt: value.lastSeenAt.toISOString(),
            ttlExpiresAt: new Date(
              value.lastSeenAt.getTime() +
                ROUTING_CASE_MEMORY_TTL_HOURS * 60 * 60 * 1000,
            ).toISOString(),
            sampleTraceId: value.sampleTraceId,
            sampleQuery: value.sampleQuery
              ? (this.deepMask(value.sampleQuery) as string)
              : null,
            semanticIntent: value.semanticIntent,
            routeDecision: value.routeDecision,
            captureStatus,
            capturedAt: lifecycle?.capturedAt ?? null,
            captureAuditLogId: lifecycle?.captureAuditLogId ?? null,
            activatedAt: lifecycle?.activatedAt ?? null,
            activationAuditLogId: lifecycle?.activationAuditLogId ?? null,
          };
        }),
      recentMismatches: mismatched.slice(0, 10).map((item) => ({
        traceId: item.traceId,
        createdAt: item.createdAt.toISOString(),
        summary: item.telemetry.divergence.summary,
        sampleQuery: this.deepMask(item.telemetry.userQueryRedacted) as string,
        targetRole:
          item.telemetry.baselineClassification?.targetRole ?? "unknown",
        decisionType: item.telemetry.routeDecision.decisionType,
        promotedPrimary: item.telemetry.promotedPrimary,
      })),
    };
  }

  async captureRoutingCaseMemoryCandidate(params: {
    companyId: string;
    userId?: string | null;
    key: string;
    windowHours?: number;
    slice?: string;
    targetRole?: string;
    note?: string;
  }): Promise<RoutingCaseMemoryCandidateCaptureResponseDto> {
    const divergence = await this.getRoutingDivergence({
      companyId: params.companyId,
      windowHours: params.windowHours ?? 24,
      slice: params.slice,
      targetRole: params.targetRole,
      onlyMismatches: true,
    });

    const candidate = divergence.caseMemoryCandidates.find(
      (item) => item.key === params.key,
    );

    if (!candidate) {
      throw new NotFoundException("ROUTING_CASE_MEMORY_CANDIDATE_NOT_FOUND");
    }

    if (candidate.caseMemoryReadiness !== "ready_for_case_memory") {
      throw new ForbiddenException(
        "ROUTING_CASE_MEMORY_CANDIDATE_NOT_READY",
      );
    }

    if (
      candidate.captureStatus !== "not_captured" &&
      candidate.captureAuditLogId &&
      candidate.capturedAt
    ) {
      return {
        status: "already_captured",
        candidateKey: candidate.key,
        auditLogId: candidate.captureAuditLogId,
        capturedAt: candidate.capturedAt,
      };
    }

    const createdAt = new Date();
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: ROUTING_CASE_MEMORY_CAPTURE_ACTION,
        companyId: params.companyId,
        userId: params.userId ?? null,
        metadata: {
          domain: "routing_case_memory_candidate",
          candidateKey: candidate.key,
          sliceId: candidate.sliceId,
          targetRole: candidate.targetRole,
          decisionType: candidate.decisionType,
          mismatchKinds: candidate.mismatchKinds,
          routerVersion: candidate.routerVersion,
          promptVersion: candidate.promptVersion,
          toolsetVersion: candidate.toolsetVersion,
          traceCount: candidate.traceCount,
          semanticPrimaryCount: candidate.semanticPrimaryCount,
          caseMemoryReadiness: candidate.caseMemoryReadiness,
          firstSeenAt: candidate.firstSeenAt,
          lastSeenAt: candidate.lastSeenAt,
          ttlExpiresAt: candidate.ttlExpiresAt,
          sampleTraceId: candidate.sampleTraceId,
          sampleQueryRedacted: candidate.sampleQuery,
          semanticIntent: candidate.semanticIntent,
          routeDecision: candidate.routeDecision,
          note: params.note ?? null,
          sourceWindowHours: params.windowHours ?? 24,
          capturedAt: createdAt.toISOString(),
        } as unknown as object,
      },
      select: {
        id: true,
      },
    });

    return {
      status: "captured",
      candidateKey: candidate.key,
      auditLogId: auditLog.id,
      capturedAt: createdAt.toISOString(),
    };
  }

  private resolveCaseMemoryReadiness(
    traceCount: number,
  ): "observe" | "needs_more_evidence" | "ready_for_case_memory" {
    if (traceCount >= 3) {
      return "ready_for_case_memory";
    }
    if (traceCount === 2) {
      return "needs_more_evidence";
    }
    return "observe";
  }

  private caseMemoryReadinessRank(
    readiness: "observe" | "needs_more_evidence" | "ready_for_case_memory",
  ): number {
    if (readiness === "ready_for_case_memory") {
      return 3;
    }
    if (readiness === "needs_more_evidence") {
      return 2;
    }
    return 1;
  }

  private async loadRoutingCaseMemoryLifecycleState(
    companyId: string,
  ): Promise<
    Map<
      string,
      {
        status: RoutingCaseMemoryLifecycleStatus;
        capturedAt: string | null;
        captureAuditLogId: string | null;
        activatedAt: string | null;
        activationAuditLogId: string | null;
      }
    >
  > {
    const [captureLogs, activationLogs] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          action: ROUTING_CASE_MEMORY_CAPTURE_ACTION,
        },
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
      this.prisma.auditLog.findMany({
        where: {
          companyId,
          action: ROUTING_CASE_MEMORY_ACTIVATION_ACTION,
        },
        select: {
          id: true,
          createdAt: true,
          metadata: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),
    ]);

    const result = new Map<
      string,
      {
        status: RoutingCaseMemoryLifecycleStatus;
        capturedAt: string | null;
        captureAuditLogId: string | null;
        activatedAt: string | null;
        activationAuditLogId: string | null;
      }
    >();

    for (const entry of captureLogs) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as Record<string, unknown>)
          : null;
      const candidateKey =
        typeof metadata?.candidateKey === "string"
          ? metadata.candidateKey
          : null;
      if (!candidateKey || result.has(candidateKey)) {
        continue;
      }
      const ttlExpiresAt =
        typeof metadata?.ttlExpiresAt === "string"
          ? Date.parse(metadata.ttlExpiresAt)
          : NaN;
      if (Number.isFinite(ttlExpiresAt) && ttlExpiresAt < Date.now()) {
        continue;
      }
      result.set(candidateKey, {
        status: RoutingCaseMemoryLifecycleStatus.Captured,
        captureAuditLogId: entry.id,
        capturedAt:
          typeof metadata?.capturedAt === "string"
            ? metadata.capturedAt
            : entry.createdAt.toISOString(),
        activatedAt: null,
        activationAuditLogId: null,
      });
    }

    for (const entry of activationLogs) {
      const metadata =
        entry.metadata && typeof entry.metadata === "object"
          ? (entry.metadata as Record<string, unknown>)
          : null;
      const candidateKey =
        typeof metadata?.candidateKey === "string"
          ? metadata.candidateKey
          : null;
      if (!candidateKey) {
        continue;
      }
      const current = result.get(candidateKey);
      if (!current) {
        continue;
      }
      result.set(candidateKey, {
        ...current,
        status: RoutingCaseMemoryLifecycleStatus.Active,
        activatedAt:
          typeof metadata?.activatedAt === "string"
            ? metadata.activatedAt
            : entry.createdAt.toISOString(),
        activationAuditLogId: entry.id,
      });
    }

    return result;
  }

  async getQueuePressure(
    companyId: string,
    timeWindowMs: number,
  ): Promise<QueuePressureResponseDto> {
    const summary = await this.queueMetrics.getQueuePressure(companyId, timeWindowMs);
    return {
      companyId,
      pressureState: summary.pressureState,
      signalFresh: summary.signalFresh,
      totalBacklog: summary.totalBacklog,
      hottestQueue: summary.hottestQueue,
      observedQueues: summary.observedQueues,
    };
  }

  async getTraceForensics(
    traceId: string,
    companyId: string,
  ): Promise<TraceForensicsResponseDto> {
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: { traceId },
      orderBy: { createdAt: "asc" },
    });

    if (!auditEntries.length) {
      throw new NotFoundException("TRACE_NOT_FOUND");
    }

    const hasForeignTenant = auditEntries.some((e) => e.companyId !== companyId);
    const ownEntry = auditEntries.find((e) => e.companyId === companyId);
    if (!ownEntry && hasForeignTenant) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }
    const baseCompanyId = ownEntry?.companyId ?? auditEntries[0].companyId;
    if (baseCompanyId !== companyId) {
      throw new ForbiddenException("TRACE_TENANT_MISMATCH");
    }

    const traceTime =
      auditEntries[0].createdAt ?? new Date();
    const windowStart = new Date(traceTime.getTime() - 12 * 60 * 60 * 1000);
    const windowEnd = new Date(traceTime.getTime() + 12 * 60 * 60 * 1000);

    const [summaryRow, qualityAlertsRows] = await Promise.all([
      this.prisma.traceSummary.findFirst({
        where: { traceId, companyId },
      }),
      this.prisma.qualityAlert.findMany({
        where: {
          companyId,
          alertType: "BS_DRIFT",
          createdAt: { gte: windowStart, lte: windowEnd },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const summaryTrust = summaryRow as Record<string, unknown> | null;
    const summary: TraceForensicsSummaryDto | null = summaryRow
      ? {
        traceId: summaryRow.traceId,
        companyId: summaryRow.companyId,
        totalTokens: summaryRow.totalTokens,
        promptTokens: summaryRow.promptTokens,
        completionTokens: summaryRow.completionTokens,
        durationMs: summaryRow.durationMs,
        modelId: summaryRow.modelId,
        promptVersion: summaryRow.promptVersion,
        toolsVersion: summaryRow.toolsVersion,
        policyId: summaryRow.policyId,
        bsScorePct: summaryRow.bsScorePct,
        evidenceCoveragePct: summaryRow.evidenceCoveragePct,
        invalidClaimsPct: summaryRow.invalidClaimsPct,
        verifiedBranchCount: this.readNullableNumber(
          summaryTrust ?? {},
          "verifiedBranchCount",
        ),
        partialBranchCount: this.readNullableNumber(
          summaryTrust ?? {},
          "partialBranchCount",
        ),
        unverifiedBranchCount: this.readNullableNumber(
          summaryTrust ?? {},
          "unverifiedBranchCount",
        ),
        conflictedBranchCount: this.readNullableNumber(
          summaryTrust ?? {},
          "conflictedBranchCount",
        ),
        rejectedBranchCount: this.readNullableNumber(
          summaryTrust ?? {},
          "rejectedBranchCount",
        ),
        trustGateLatencyMs: this.readNullableNumber(
          summaryTrust ?? {},
          "trustGateLatencyMs",
        ),
        trustLatencyProfile: this.readNullableString(
          summaryTrust ?? {},
          "trustLatencyProfile",
        ),
        trustLatencyBudgetMs: this.readNullableNumber(
          summaryTrust ?? {},
          "trustLatencyBudgetMs",
        ),
        trustLatencyWithinBudget: this.readNullableBoolean(
          summaryTrust ?? {},
          "trustLatencyWithinBudget",
        ),
        createdAt: summaryRow.createdAt.toISOString(),
      }
      : null;

    const timeline: TraceForensicsEntryDto[] = [];
    for (const e of auditEntries) {
      const meta = (e as { metadata?: { phases?: Array<{ name: string; timestamp: string; durationMs: number }>; evidence?: EvidenceRefDto[] } })
        .metadata;
      const phases = Array.isArray(meta?.phases) ? meta.phases : [];
      const evidenceRefs = Array.isArray(meta?.evidence) ? meta.evidence : [];

      if (phases.length) {
        for (const p of phases) {
          const nodeId = `${e.id}:${p.name}`;
          timeline.push({
            id: nodeId,
            traceId: e.traceId,
            companyId: e.companyId,
            toolNames: p.name === "tools" ? (e.toolNames ?? []) : [],
            model: e.model ?? "deterministic",
            intentMethod: p.name === "router" ? (e.intentMethod ?? null) : null,
            phase: p.name,
            label: this.getPhaseLabel(p.name),
            kind: p.name as ExplainabilityTimelineNodeKind,
            durationMs: p.durationMs,
            tokensUsed: p.name === "composer" ? (e.tokensUsed ?? 0) : 0,
            createdAt: p.timestamp,
            evidenceRefs: (p.name === "tools" || p.name === "composer") ? evidenceRefs : [],
          });
        }
      } else {
        // Fallback: старая запись без фаз
        timeline.push({
          id: e.id,
          traceId: e.traceId,
          companyId: e.companyId,
          toolNames: e.toolNames ?? [],
          model: e.model ?? "deterministic",
          intentMethod: e.intentMethod ?? null,
          phase: e.toolNames?.length ? "tools" : "agent",
          label: e.toolNames?.length ? "Tool Execution" : "Agent Execution",
          tokensUsed: e.tokensUsed ?? 0,
          createdAt: e.createdAt.toISOString(),
          evidenceRefs,
        });
      }
    }

    const qualityAlerts: TraceForensicsAlertDto[] = qualityAlertsRows.map(
      (a) => ({
        id: a.id,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
      }),
    );

    const memoryLane = this.buildMemoryLane(auditEntries);
    const branchTrust = this.buildBranchTrust(auditEntries);
    const semanticIngressFrame = this.buildSemanticIngressFrame(auditEntries);
    const writePolicy = semanticIngressFrame?.writePolicy ?? null;

    return {
      traceId,
      companyId,
      summary,
      timeline,
      qualityAlerts,
      memoryLane,
      branchTrust,
      semanticIngressFrame,
      writePolicy,
    };
  }

  private getPhaseLabel(name: string): string {
    const map: Record<string, string> = {
      router: "Intent Classification",
      tools: "Tool Execution",
      composer: "Response Composition",
      trace_summary_record: "Initial Quality Trace",
      audit_write: "Audit Trail Commit",
      truthfulness: "Truthfulness Engine",
      quality_update: "Final Quality Sync",
    };
    return map[name] ?? name;
  }

  private deepMask(value: unknown): unknown {
    if (typeof value === "string") {
      return this.sensitiveDataFilter.mask(value);
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.deepMask(v));
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.deepMask(v);
      }
      return out;
    }
    return value;
  }

  private buildMemoryLane(
    auditEntries: Array<{ metadata: unknown }>,
  ): TraceForensicsMemoryLaneDto | null {
    for (const entry of auditEntries) {
      const meta = (entry.metadata as {
        memoryLane?: TraceForensicsMemoryLaneDto;
      }) ?? {};
      if (!meta.memoryLane) {
        continue;
      }
      return this.deepMask(meta.memoryLane) as TraceForensicsMemoryLaneDto;
    }
    return null;
  }

  private buildBranchTrust(
    auditEntries: Array<{ metadata?: unknown }>,
  ): TraceForensicsBranchTrustDto | null {
    for (let index = auditEntries.length - 1; index >= 0; index -= 1) {
      const metadata =
        auditEntries[index]?.metadata &&
        typeof auditEntries[index].metadata === "object"
          ? (auditEntries[index].metadata as Record<string, unknown>)
          : null;
      if (!metadata) {
        continue;
      }

      const branchResults = Array.isArray(metadata.branchResults)
        ? metadata.branchResults
        : [];
      const branchTrustAssessments = Array.isArray(metadata.branchTrustAssessments)
        ? metadata.branchTrustAssessments
        : [];
      const branchCompositions = Array.isArray(metadata.branchCompositions)
        ? metadata.branchCompositions
        : [];

      if (
        branchResults.length === 0 &&
        branchTrustAssessments.length === 0 &&
        branchCompositions.length === 0
      ) {
        continue;
      }

      return this.deepMask({
        branchResults,
        branchTrustAssessments,
        branchCompositions,
      }) as TraceForensicsBranchTrustDto;
    }

    return null;
  }

  private buildSemanticIngressFrame(
    auditEntries: Array<{ metadata?: unknown }>,
  ): SemanticIngressFrame | null {
    for (let index = auditEntries.length - 1; index >= 0; index -= 1) {
      const metadata =
        auditEntries[index]?.metadata &&
        typeof auditEntries[index].metadata === "object"
          ? (auditEntries[index].metadata as Record<string, unknown>)
          : null;
      if (!metadata?.semanticIngressFrame) {
        continue;
      }

      return this.deepMask(
        metadata.semanticIngressFrame,
      ) as SemanticIngressFrame;
    }

    return null;
  }

  private readNullableNumber(
    input: Record<string, unknown>,
    key: string,
  ): number | null {
    const value = input[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  private readNullableString(
    input: Record<string, unknown>,
    key: string,
  ): string | null {
    const value = input[key];
    return typeof value === "string" ? value : null;
  }

  private readNullableBoolean(
    input: Record<string, unknown>,
    key: string,
  ): boolean | null {
    const value = input[key];
    return typeof value === "boolean" ? value : null;
  }

  private buildCriticalPathCards(
    auditEntries: Array<{ traceId: string; createdAt: Date; metadata: unknown }>,
    summaries: Array<{ traceId: string; durationMs: number; createdAt: Date }>,
  ): TruthfulnessDashboardResponseDto["criticalPath"] {
    const summaryByTrace = new Map(
      summaries.map((summary) => [summary.traceId, summary]),
    );
    const bestByTrace = new Map<
      string,
      { phase: string; durationMs: number; createdAt: string }
    >();

    for (const entry of auditEntries) {
      const meta = (entry.metadata as {
        phases?: Array<{ name: string; timestamp: string; durationMs: number }>;
      }) ?? {};
      const phases = Array.isArray(meta.phases) ? meta.phases : [];
      for (const phase of phases) {
        const current = bestByTrace.get(entry.traceId);
        if (!current || phase.durationMs > current.durationMs) {
          bestByTrace.set(entry.traceId, {
            phase: phase.name,
            durationMs: phase.durationMs,
            createdAt: phase.timestamp,
          });
        }
      }
    }

    return Array.from(bestByTrace.entries())
      .map(([traceId, value]) => ({
        traceId,
        phase: value.phase,
        durationMs: value.durationMs,
        totalDurationMs: summaryByTrace.get(traceId)?.durationMs ?? null,
        createdAt: value.createdAt,
      }))
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 5);
  }

  private buildBranchTrustDashboard(
    summaries: Array<{
      verifiedBranchCount?: number | null;
      partialBranchCount?: number | null;
      unverifiedBranchCount?: number | null;
      conflictedBranchCount?: number | null;
      rejectedBranchCount?: number | null;
      trustGateLatencyMs?: number | null;
      trustLatencyProfile?: string | null;
      trustLatencyWithinBudget?: boolean | null;
    }>,
  ): TruthfulnessDashboardResponseDto["branchTrust"] {
    const trustAwareSummaries = summaries.filter((summary) =>
      [
        summary.verifiedBranchCount,
        summary.partialBranchCount,
        summary.unverifiedBranchCount,
        summary.conflictedBranchCount,
        summary.rejectedBranchCount,
      ].some((value) => typeof value === "number" && Number.isFinite(value)),
    );
    const knownTraceCount = trustAwareSummaries.length;
    const pendingTraceCount = Math.max(0, summaries.length - knownTraceCount);

    const latencies = trustAwareSummaries
      .map((summary) => summary.trustGateLatencyMs)
      .filter(
        (value): value is number =>
          typeof value === "number" && Number.isFinite(value),
      )
      .sort((a, b) => a - b);
    const avgLatencyMs =
      latencies.length > 0
        ? Number(
            (
              latencies.reduce((sum, value) => sum + value, 0) /
              latencies.length
            ).toFixed(1),
          )
        : null;
    const p95LatencyMs =
      latencies.length > 0
        ? latencies[Math.floor(0.95 * (latencies.length - 1))] ??
          latencies[latencies.length - 1]
        : null;

    const budgetAwareSummaries = trustAwareSummaries.filter(
      (summary) => typeof summary.trustLatencyWithinBudget === "boolean",
    );
    const withinBudgetTraceCount = budgetAwareSummaries.filter(
      (summary) => summary.trustLatencyWithinBudget === true,
    ).length;
    const overBudgetTraceCount = budgetAwareSummaries.filter(
      (summary) => summary.trustLatencyWithinBudget === false,
    ).length;
    const withinBudgetRate =
      budgetAwareSummaries.length > 0
        ? Number(
            (
              (withinBudgetTraceCount / budgetAwareSummaries.length) *
              100
            ).toFixed(1),
          )
        : null;

    const sumMetric = (
      key:
        | "verifiedBranchCount"
        | "partialBranchCount"
        | "unverifiedBranchCount"
        | "conflictedBranchCount"
        | "rejectedBranchCount",
    ): number =>
      trustAwareSummaries.reduce((sum, summary) => {
        const value = summary[key];
        return sum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
      }, 0);

    return {
      knownTraceCount,
      pendingTraceCount,
      verifiedBranchCount: sumMetric("verifiedBranchCount"),
      partialBranchCount: sumMetric("partialBranchCount"),
      unverifiedBranchCount: sumMetric("unverifiedBranchCount"),
      conflictedBranchCount: sumMetric("conflictedBranchCount"),
      rejectedBranchCount: sumMetric("rejectedBranchCount"),
      crossCheckTraceCount: trustAwareSummaries.filter(
        (summary) => summary.trustLatencyProfile === "CROSS_CHECK_TRIGGERED",
      ).length,
      withinBudgetTraceCount,
      overBudgetTraceCount,
      withinBudgetRate,
      avgLatencyMs,
      p95LatencyMs,
    };
  }
}
