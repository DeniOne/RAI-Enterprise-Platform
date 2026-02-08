// Satellite Ingestion (Sprint 2)
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SatelliteIndexType } from "./dto/satellite.dto";

export interface SatelliteTimeRange {
  from?: string;
  to?: string;
}

@Injectable()
export class SatelliteQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getObservation(id: string) {
    return this.prisma.satelliteObservation.findUnique({ where: { id } });
  }

  async getObservationsByAsset(
    assetId: string,
    indexType?: SatelliteIndexType,
    timeRange?: SatelliteTimeRange,
  ) {
    const where: any = { assetId };
    if (indexType) where.indexType = indexType;

    if (timeRange?.from || timeRange?.to) {
      where.timestamp = {};
      if (timeRange.from) where.timestamp.gte = new Date(timeRange.from);
      if (timeRange.to) where.timestamp.lte = new Date(timeRange.to);
    }

    return this.prisma.satelliteObservation.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
  }
}
