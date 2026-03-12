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
  TraceForensicsSummaryDto,
  TraceForensicsEntryDto,
  TraceForensicsAlertDto,
  EvidenceRefDto,
  TraceForensicsMemoryLaneDto,
} from "./dto/trace-forensics.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";
import { QueuePressureResponseDto } from "./dto/queue-pressure.dto";
import { QueueMetricsService } from "../rai-chat/performance/queue-metrics.service";

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

    return {
      traceId,
      companyId,
      summary,
      timeline,
      qualityAlerts,
      memoryLane,
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
}
