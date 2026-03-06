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
} from "./dto/trace-forensics.dto";
import { TruthfulnessDashboardResponseDto } from "./dto/truthfulness-dashboard.dto";

@Injectable()
export class ExplainabilityPanelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sensitiveDataFilter: SensitiveDataFilterService,
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
        avgBsScore: 0,
        p95BsScore: 0,
        avgEvidenceCoverage: 0,
        worstTraces: [],
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

    const avgBsScore = avg(bsKnown);
    const avgEvidenceCoverage = avg(evidenceKnown);

    const sortedForP95 = [...bsKnown].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * (sortedForP95.length - 1));
    const p95BsScore = sortedForP95[p95Index] ?? 0;

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

    return {
      companyId,
      avgBsScore,
      p95BsScore,
      avgEvidenceCoverage,
      worstTraces,
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

    return {
      traceId,
      companyId,
      summary,
      timeline,
      qualityAlerts,
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
}

