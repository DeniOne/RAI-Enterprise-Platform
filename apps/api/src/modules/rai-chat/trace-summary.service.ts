import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

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
    const { traceId, companyId, bsScorePct, evidenceCoveragePct, invalidClaimsPct } = params;

    await this.prisma.traceSummary
      .update({
        where: {
          trace_summary_trace_company_unique: { traceId, companyId },
        },
        data: {
          bsScorePct,
          evidenceCoveragePct,
          invalidClaimsPct,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `trace_summary updateQuality failed traceId=${traceId} companyId=${companyId} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }
}
