// Vision AI Baseline (Sprint 2)
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

export interface VisionTimeRange {
  from?: string;
  to?: string;
}

@Injectable()
export class VisionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getObservation(id: string) {
    return this.prisma.visionObservation.findUnique({ where: { id } });
  }

  async getObservationsByAsset(assetId: string, timeRange?: VisionTimeRange) {
    const where: any = { assetId };

    if (timeRange?.from || timeRange?.to) {
      where.timestamp = {};
      if (timeRange.from) where.timestamp.gte = new Date(timeRange.from);
      if (timeRange.to) where.timestamp.lte = new Date(timeRange.to);
    }

    return this.prisma.visionObservation.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
  }
}
