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
  driver:
    | "QUALITY_ALERT"
    | "BS_AVG_AUTONOMOUS"
    | "BS_AVG_TOOL_FIRST"
    | "BS_AVG_QUARANTINE"
    | "NO_QUALITY_DATA";
  activeQualityAlert: boolean;
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

    const [rows, activeQualityAlert] = await Promise.all([
      this.prisma.traceSummary.findMany({
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
      }),
      this.prisma.qualityAlert.findFirst({
        where: {
          companyId,
          alertType: "BS_DRIFT",
          resolvedAt: null,
        },
        select: { id: true },
      }),
    ]);

    const knownTraceCount = rows.length;
    if (activeQualityAlert) {
      return {
        level: AutonomyLevel.QUARANTINE,
        avgBsScorePct:
          knownTraceCount === 0
            ? null
            : rows.reduce((sum, row) => sum + (row.bsScorePct ?? 0), 0) /
              knownTraceCount,
        knownTraceCount,
        driver: "QUALITY_ALERT",
        activeQualityAlert: true,
      };
    }
    if (knownTraceCount === 0) {
      return {
        level: AutonomyLevel.TOOL_FIRST,
        avgBsScorePct: null,
        knownTraceCount: 0,
        driver: "NO_QUALITY_DATA",
        activeQualityAlert: false,
      };
    }

    const avg =
      rows.reduce((sum, row) => sum + (row.bsScorePct ?? 0), 0) / knownTraceCount;

    if (avg < 5) {
      return {
        level: AutonomyLevel.AUTONOMOUS,
        avgBsScorePct: avg,
        knownTraceCount,
        driver: "BS_AVG_AUTONOMOUS",
        activeQualityAlert: false,
      };
    }
    if (avg <= 30) {
      return {
        level: AutonomyLevel.TOOL_FIRST,
        avgBsScorePct: avg,
        knownTraceCount,
        driver: "BS_AVG_TOOL_FIRST",
        activeQualityAlert: false,
      };
    }
    return {
      level: AutonomyLevel.QUARANTINE,
      avgBsScorePct: avg,
      knownTraceCount,
      driver: "BS_AVG_QUARANTINE",
      activeQualityAlert: false,
    };
  }
}
