import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import {
  ExplainabilityTimelineNodeDto,
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
  ) {}

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

    const bsValues = summaries.map((s) => s.bsScorePct ?? 0);
    const evidenceValues = summaries.map((s) => s.evidenceCoveragePct ?? 0);

    const avg = (values: number[]): number =>
      values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

    const avgBsScore = avg(bsValues);
    const avgEvidenceCoverage = avg(evidenceValues);

    const sortedForP95 = [...bsValues].sort((a, b) => a - b);
    const p95Index = Math.floor(0.95 * (sortedForP95.length - 1));
    const p95BsScore = sortedForP95[p95Index] ?? 0;

    const worstTraces = summaries
      .slice()
      .sort((a, b) => b.bsScorePct - a.bsScorePct)
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
          bsScorePct: summaryRow.bsScorePct ?? 0,
          evidenceCoveragePct: summaryRow.evidenceCoveragePct ?? 0,
          invalidClaimsPct: summaryRow.invalidClaimsPct ?? 0,
          createdAt: summaryRow.createdAt.toISOString(),
        }
      : null;

    const timeline: TraceForensicsEntryDto[] = auditEntries.map((e) => {
      const meta = (e as { metadata?: { evidence?: EvidenceRefDto[] } }).metadata;
      const evidenceRefs = Array.isArray(meta?.evidence) ? meta.evidence : [];
      return {
        id: e.id,
        traceId: e.traceId,
        companyId: e.companyId,
        toolNames: e.toolNames ?? [],
        model: e.model ?? "deterministic",
        intentMethod: e.intentMethod ?? null,
        tokensUsed: e.tokensUsed ?? 0,
        createdAt: e.createdAt.toISOString(),
        evidenceRefs,
      };
    });

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

