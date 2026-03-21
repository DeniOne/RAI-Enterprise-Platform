import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { BranchTrustAssessment } from "../../shared/rai-chat/branch-trust.types";
import { RuntimeTrustLatencyProfile } from "../../shared/rai-chat/runtime-governance-policy.types";

export interface TraceSummaryRecordParams {
  traceId: string;
  companyId: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  modelId: string;
  promptVersion: string;
  toolsVersion: string;
  policyId: string;
  evidenceCoveragePct?: number;
  invalidClaimsPct?: number;
  bsScorePct?: number;
}

export interface UpdateTraceSummaryQualityParams {
  traceId: string;
  companyId: string;
  bsScorePct: number | null;
  evidenceCoveragePct: number | null;
  invalidClaimsPct: number | null;
  branchTrustAssessments?: BranchTrustAssessment[] | null;
  trustGateLatencyMs?: number | null;
  trustLatencyProfile?: RuntimeTrustLatencyProfile | null;
  trustLatencyBudgetMs?: number | null;
  trustLatencyWithinBudget?: boolean | null;
}

@Injectable()
export class TraceSummaryService {
  private readonly logger = new Logger(TraceSummaryService.name);

  constructor(private readonly prisma: PrismaService) { }

  async record(params: TraceSummaryRecordParams): Promise<void> {
    const {
      traceId,
      companyId,
      totalTokens,
      promptTokens,
      completionTokens,
      durationMs,
      modelId,
      promptVersion,
      toolsVersion,
      policyId,
    } = params;

    await this.prisma.traceSummary
      .upsert({
        where: {
          trace_summary_trace_company_unique: {
            traceId,
            companyId,
          },
        },
        create: {
          traceId,
          companyId,
          totalTokens,
          promptTokens,
          completionTokens,
          durationMs,
          modelId,
          promptVersion,
          toolsVersion,
          policyId,
        },
        update: {
          totalTokens,
          promptTokens,
          completionTokens,
          durationMs,
          modelId,
          promptVersion,
          toolsVersion,
          policyId,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `trace_summary upsert failed traceId=${traceId} companyId=${companyId} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }

  async updateQuality(params: UpdateTraceSummaryQualityParams): Promise<void> {
    const {
      traceId,
      companyId,
      bsScorePct,
      evidenceCoveragePct,
      invalidClaimsPct,
    } = params;
    const trustTelemetry = this.buildTrustTelemetry(params);

    await this.prisma.traceSummary
      .update({
        where: {
          trace_summary_trace_company_unique: { traceId, companyId },
        },
        data: {
          bsScorePct,
          evidenceCoveragePct,
          invalidClaimsPct,
          ...trustTelemetry,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `trace_summary updateQuality failed traceId=${traceId} companyId=${companyId} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }

  private buildTrustTelemetry(params: UpdateTraceSummaryQualityParams): {
    verifiedBranchCount: number | null;
    partialBranchCount: number | null;
    unverifiedBranchCount: number | null;
    conflictedBranchCount: number | null;
    rejectedBranchCount: number | null;
    trustGateLatencyMs: number | null;
    trustLatencyProfile: RuntimeTrustLatencyProfile | null;
    trustLatencyBudgetMs: number | null;
    trustLatencyWithinBudget: boolean | null;
  } {
    const assessments = params.branchTrustAssessments ?? [];
    if (assessments.length === 0) {
      return {
        verifiedBranchCount: null,
        partialBranchCount: null,
        unverifiedBranchCount: null,
        conflictedBranchCount: null,
        rejectedBranchCount: null,
        trustGateLatencyMs: null,
        trustLatencyProfile: null,
        trustLatencyBudgetMs: null,
        trustLatencyWithinBudget: null,
      };
    }

    return {
      verifiedBranchCount: this.countVerdicts(assessments, "VERIFIED"),
      partialBranchCount: this.countVerdicts(assessments, "PARTIAL"),
      unverifiedBranchCount: this.countVerdicts(assessments, "UNVERIFIED"),
      conflictedBranchCount: this.countVerdicts(assessments, "CONFLICTED"),
      rejectedBranchCount: this.countVerdicts(assessments, "REJECTED"),
      trustGateLatencyMs:
        typeof params.trustGateLatencyMs === "number" &&
        Number.isFinite(params.trustGateLatencyMs)
          ? Math.max(0, Math.round(params.trustGateLatencyMs))
          : null,
      trustLatencyProfile:
        params.trustLatencyProfile ??
        (assessments.length > 1 ? "MULTI_SOURCE_READ" : "HAPPY_PATH"),
      trustLatencyBudgetMs:
        typeof params.trustLatencyBudgetMs === "number" &&
        Number.isFinite(params.trustLatencyBudgetMs)
          ? Math.max(0, Math.round(params.trustLatencyBudgetMs))
          : null,
      trustLatencyWithinBudget:
        typeof params.trustLatencyWithinBudget === "boolean"
          ? params.trustLatencyWithinBudget
          : null,
    };
  }

  private countVerdicts(
    assessments: BranchTrustAssessment[],
    verdict: BranchTrustAssessment["verdict"],
  ): number {
    return assessments.filter((assessment) => assessment.verdict === verdict)
      .length;
  }
}
