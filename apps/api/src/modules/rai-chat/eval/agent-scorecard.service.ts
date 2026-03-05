import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

export interface AgentScoreCardInput {
  agentName: string;
  promptVersion: string;
  modelVersion: string;
  periodFrom: Date;
  periodTo: Date;
  toolFailureRate: number;
  hallucinationFlagRate: number;
  avgConfidence: number;
  avgLatencyMs: number;
  avgTokensUsed: number;
  acceptanceRate: number;
}

@Injectable()
export class AgentScoreCardService {
  constructor(private readonly prisma: PrismaService) {}

  async saveScoreCard(data: AgentScoreCardInput) {
    return this.prisma.agentScoreCard.create({ data });
  }

  async getScoreCardByVersion(agentName: string, promptVersion: string) {
    return this.prisma.agentScoreCard.findFirst({
      where: { agentName, promptVersion },
      orderBy: { createdAt: "desc" },
    });
  }
}
