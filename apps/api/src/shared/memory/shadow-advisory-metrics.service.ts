import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface ShadowAdvisoryBaselineRequest {
  companyId: string;
  from?: Date;
  to?: Date;
}

export interface ShadowAdvisoryBaselineReport {
  totalSignals: number;
  advisoriesGenerated: number;
  coverage: number;
  allowCount: number;
  reviewCount: number;
  blockCount: number;
  allowRatio: number;
  reviewRatio: number;
  blockRatio: number;
  avgConfidence: number;
}

@Injectable()
export class ShadowAdvisoryMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async buildBaseline(
    request: ShadowAdvisoryBaselineRequest,
  ): Promise<ShadowAdvisoryBaselineReport> {
    const where: any = {
      action: "SHADOW_ADVISORY_EVALUATED",
      metadata: {
        path: ["companyId"],
        equals: request.companyId,
      },
    };

    if (request.from || request.to) {
      where.createdAt = {};
      if (request.from) where.createdAt.gte = request.from;
      if (request.to) where.createdAt.lte = request.to;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      select: { metadata: true },
    });

    const advisoriesGenerated = logs.length;
    let allowCount = 0;
    let reviewCount = 0;
    let blockCount = 0;
    let confidenceSum = 0;

    for (const log of logs) {
      const metadata = (log.metadata || {}) as Record<string, any>;
      const rec = String(metadata.recommendation || "");
      const conf = Number(metadata.confidence || 0);
      if (rec === "ALLOW") allowCount += 1;
      if (rec === "REVIEW") reviewCount += 1;
      if (rec === "BLOCK") blockCount += 1;
      confidenceSum += Number.isFinite(conf) ? conf : 0;
    }

    // В текущем shadow-контуре один сигнал = один расчет advisory.
    const totalSignals = advisoriesGenerated;
    const coverage = totalSignals === 0 ? 0 : advisoriesGenerated / totalSignals;

    return {
      totalSignals,
      advisoriesGenerated,
      coverage: Number(coverage.toFixed(4)),
      allowCount,
      reviewCount,
      blockCount,
      allowRatio: Number((advisoriesGenerated ? allowCount / advisoriesGenerated : 0).toFixed(4)),
      reviewRatio: Number((advisoriesGenerated ? reviewCount / advisoriesGenerated : 0).toFixed(4)),
      blockRatio: Number((advisoriesGenerated ? blockCount / advisoriesGenerated : 0).toFixed(4)),
      avgConfidence: Number((advisoriesGenerated ? confidenceSum / advisoriesGenerated : 0).toFixed(4)),
    };
  }
}
