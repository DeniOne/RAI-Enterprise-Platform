import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ScienceCalculator, TrustEngine } from "@rai/regenerative-engine";

@Processor("drift-feedback-loop")
@Injectable()
export class DriftFeedbackLoopProcessor extends WorkerHost {
  private readonly logger = new Logger(DriftFeedbackLoopProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(
    job: Job<{ fieldId: string; companyId: string }, any, string>,
  ): Promise<any> {
    const { fieldId, companyId } = job.data;
    this.logger.log(`[DRIFT-LOOP] Processing SRI Drift for Field: ${fieldId}`);

    // 1. Fetch Latest Baseline & Recent Metrics
    const baseline = await this.prisma.sustainabilityBaseline.findFirst({
      where: { fieldId, companyId },
      orderBy: { createdAt: "desc" },
    });

    if (!baseline) {
      this.logger.warn(
        `[DRIFT-LOOP] No baseline found for field ${fieldId}. Skipping drift check.`,
      );
      return;
    }

    const recentMetrics = await this.prisma.soilMetric.findMany({
      where: { fieldId, companyId },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    if (recentMetrics.length < 3) {
      this.logger.log(`[DRIFT-LOOP] Not enough data for field ${fieldId}.`);
      return;
    }

    // 2. Simple Drift Calculation (Moving Average vs Baseline)
    const avgSRI =
      recentMetrics.reduce((sum, m) => sum + m.sri, 0) / recentMetrics.length;
    const drift = Math.abs(avgSRI - baseline.initialSri);

    this.logger.log(
      `[DRIFT-LOOP] Field ${fieldId} SRI Drift: ${drift.toFixed(4)} (Avg: ${avgSRI.toFixed(4)}, Baseline: ${baseline.initialSri.toFixed(4)})`,
    );

    // 3. Trigger Governance Alert if Drift > 15% (Requirement I34)
    if (drift > 0.15) {
      this.logger.error(
        `[DRIFT-CRITICAL] I34 VIOLATION DETECTED: Significant SRI drift for field ${fieldId}`,
      );

      await this.prisma.driftReport.create({
        data: {
          companyId,
          modelVersionId: "regenerative-engine-v1", // Placeholder
          status: "CRITICAL",
          payload: {
            metricName: "SRI_DRIFT",
            expectedValue: baseline.initialSri,
            actualValue: avgSRI,
            driftScore: drift,
            sampleSize: recentMetrics.length,
            enforcedLaw: "I34_SOIL_DEGRADATION",
          },
        },
      });

      // TODO: Call GovernanceLock service to lock the field
    }

    return { drift };
  }
}
