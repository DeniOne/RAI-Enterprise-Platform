import { HybridPhenologyModel, Prisma } from "@rai/prisma-client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

type PredictionResult = {
  bbchCode: string;
  bbchValue: number;
  nextStage: string | null;
  gddToNextStage: number | null;
};

@Injectable()
export class HybridPhenologyService {
  constructor(private readonly prisma: PrismaService) {}

  async predictBBCH(
    hybridName: string,
    gddAccumulated: number,
    companyId: string,
  ): Promise<PredictionResult | null> {
    const model = await this.prisma.hybridPhenologyModel.findFirst({
      where: {
        hybridName,
        OR: [{ companyId }, { companyId: null }],
      },
      orderBy: [
        { companyId: "desc" },
        { updatedAt: "desc" },
      ],
    });

    if (!model) {
      return null;
    }

    const stages = this.sortStages(model.gddToStage as Record<string, number>);
    const current =
      stages.filter(([, gdd]) => gdd <= gddAccumulated).at(-1) ?? stages[0];
    const nextIndex = stages.findIndex(([code]) => code === current[0]) + 1;
    const next = stages[nextIndex] ?? null;

    return {
      bbchCode: current[0],
      bbchValue: this.extractBbchValue(current[0]),
      nextStage: next?.[0] ?? null,
      gddToNextStage: next ? next[1] - gddAccumulated : null,
    };
  }

  async getOrCreateModel(
    hybridName: string,
    cropType: string,
    companyId: string | null,
  ): Promise<HybridPhenologyModel> {
    const existing = await this.prisma.hybridPhenologyModel.findFirst({
      where: {
        hybridName,
        cropType,
        companyId,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.hybridPhenologyModel.create({
      data: {
        hybridName,
        cropType,
        companyId,
        gddToStage: {
          BBCH_00: 0,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private sortStages(gddToStage: Record<string, number>): Array<[string, number]> {
    return Object.entries(gddToStage).sort((a, b) => a[1] - b[1]);
  }

  private extractBbchValue(bbchCode: string): number {
    const match = bbchCode.match(/(\d+)$/);
    return match ? Number(match[1]) : 0;
  }
}
