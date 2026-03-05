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

@Injectable()
export class TraceSummaryService {
  private readonly logger = new Logger(TraceSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      evidenceCoveragePct = 0,
      invalidClaimsPct = 0,
      bsScorePct = 0,
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
          evidenceCoveragePct,
          invalidClaimsPct,
          bsScorePct,
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
          evidenceCoveragePct,
          invalidClaimsPct,
          bsScorePct,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `trace_summary upsert failed traceId=${traceId} companyId=${companyId} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }
}

