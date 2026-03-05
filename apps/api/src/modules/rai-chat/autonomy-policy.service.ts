import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

export enum AutonomyLevel {
  AUTONOMOUS = "AUTONOMOUS",
  TOOL_FIRST = "TOOL_FIRST",
  QUARANTINE = "QUARANTINE",
}

const DEFAULT_WINDOW_HOURS = 24;

@Injectable()
export class AutonomyPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyAutonomyLevel(companyId: string): Promise<AutonomyLevel> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - DEFAULT_WINDOW_HOURS * 60 * 60 * 1000,
    );

    const agg = await this.prisma.traceSummary.aggregate({
      _avg: { bsScorePct: true },
      where: {
        companyId,
        createdAt: {
          gte: windowStart,
        },
      },
    });

    const avg = agg._avg.bsScorePct ?? 0;

    if (avg < 5) {
      return AutonomyLevel.AUTONOMOUS;
    }
    if (avg <= 30) {
      return AutonomyLevel.TOOL_FIRST;
    }
    return AutonomyLevel.QUARANTINE;
  }
}

