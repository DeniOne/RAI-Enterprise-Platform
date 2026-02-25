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

  async getObservation(id: string, companyId: string) {
    return this.prisma.visionObservation.findFirst({
      where: { id, companyId },
    });
  }

  async getObservationsByAsset(
    assetId: string,
    companyId: string,
    timeRange?: VisionTimeRange,
  ) {
    const timestampFilter =
      timeRange?.from || timeRange?.to
        ? {
            gte: timeRange?.from ? new Date(timeRange.from) : undefined,
            lte: timeRange?.to ? new Date(timeRange.to) : undefined,
          }
        : undefined;

    return this.prisma.visionObservation.findMany({
      where: {
        assetId,
        companyId,
        timestamp: timestampFilter,
      },
      orderBy: { timestamp: "desc" },
    });
  }
}
