import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ReputationLevel } from "@rai/prisma-client";

const POINTS_STABLE_MAX = 100;
const POINTS_TRUSTED_MAX = 500;

function pointsToLevel(points: number): ReputationLevel {
  if (points <= POINTS_STABLE_MAX) return ReputationLevel.STABLE;
  if (points <= POINTS_TRUSTED_MAX) return ReputationLevel.TRUSTED;
  return ReputationLevel.AUTONOMOUS;
}

@Injectable()
export class AgentReputationService {
  constructor(private readonly prisma: PrismaService) {}

  async awardPoints(
    companyId: string,
    agentRole: string,
    points: number,
  ): Promise<{ points: number; reputationLevel: ReputationLevel }> {
    const row = await this.getOrCreate(companyId, agentRole);
    const newPoints = Math.max(0, row.points + points);
    const level = pointsToLevel(newPoints);
    await this.prisma.agentReputation.update({
      where: { id: row.id },
      data: { points: newPoints, reputationLevel: level },
    });
    return { points: newPoints, reputationLevel: level };
  }

  async deductPoints(
    companyId: string,
    agentRole: string,
    points: number,
  ): Promise<{ points: number; reputationLevel: ReputationLevel }> {
    const row = await this.getOrCreate(companyId, agentRole);
    const newPoints = Math.max(0, row.points - points);
    const level = pointsToLevel(newPoints);
    await this.prisma.agentReputation.update({
      where: { id: row.id },
      data: { points: newPoints, reputationLevel: level },
    });
    return { points: newPoints, reputationLevel: level };
  }

  async getByCompanyAndAgent(
    companyId: string,
    agentRole: string,
  ): Promise<{ points: number; reputationLevel: ReputationLevel } | null> {
    const row = await this.prisma.agentReputation.findUnique({
      where: {
        agent_reputation_company_role_unique: { companyId, agentRole },
      },
    });
    if (!row) return null;
    return { points: row.points, reputationLevel: row.reputationLevel };
  }

  private async getOrCreate(
    companyId: string,
    agentRole: string,
  ): Promise<{ id: string; points: number; reputationLevel: ReputationLevel }> {
    const existing = await this.prisma.agentReputation.findUnique({
      where: { agent_reputation_company_role_unique: { companyId, agentRole } },
    });
    if (existing) return existing;
    const created = await this.prisma.agentReputation.create({
      data: {
        companyId,
        agentRole,
        points: 0,
        reputationLevel: ReputationLevel.STABLE,
      },
    });
    return created;
  }
}
