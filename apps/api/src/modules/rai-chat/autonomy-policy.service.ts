import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

export enum AutonomyLevel {
  AUTONOMOUS = "AUTONOMOUS",
  TOOL_FIRST = "TOOL_FIRST",
  QUARANTINE = "QUARANTINE",
}

const DEFAULT_WINDOW_HOURS = 24;

export interface AutonomyStatus {
  level: AutonomyLevel;
  avgBsScorePct: number | null;
  knownTraceCount: number;
}

@Injectable()
export class AutonomyPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyAutonomyLevel(companyId: string): Promise<AutonomyLevel> {
    const status = await this.getCompanyAutonomyStatus(companyId);
    return status.level;
  }

  async getCompanyAutonomyStatus(companyId: string): Promise<AutonomyStatus> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const rows = await this.prisma.traceSummary.findMany({
      select: { bsScorePct: true },
      where: {
        companyId,
        createdAt: {
          gte: windowStart,
        },
        bsScorePct: {
          not: null,
        },
      },
    });

    const knownTraceCount = rows.length;
    if (knownTraceCount === 0) {
      return {
        level: AutonomyLevel.TOOL_FIRST,
        avgBsScorePct: null,
        knownTraceCount: 0,
      };
    }

    const avg =
      rows.reduce((sum, row) => sum + (row.bsScorePct ?? 0), 0) / knownTraceCount;

    if (avg < 5) {
      return {
        level: AutonomyLevel.AUTONOMOUS,
        avgBsScorePct: avg,
        knownTraceCount,
      };
    }
    if (avg <= 30) {
      return {
        level: AutonomyLevel.TOOL_FIRST,
        avgBsScorePct: avg,
        knownTraceCount,
      };
    }
    return {
      level: AutonomyLevel.QUARANTINE,
      avgBsScorePct: avg,
      knownTraceCount,
    };
  }
}

