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

  async getObservation(id: string, companyId: string) {
    return this.prisma.satelliteObservation.findFirst({ where: { id, companyId } });
  }

  async getObservationsByAsset(
    assetId: string,
    companyId: string,
    indexType?: SatelliteIndexType,
    timeRange?: SatelliteTimeRange,
  ) {
    const timestampFilter =
      timeRange?.from || timeRange?.to
        ? {
            gte: timeRange?.from ? new Date(timeRange.from) : undefined,
            lte: timeRange?.to ? new Date(timeRange.to) : undefined,
          }
        : undefined;

    return this.prisma.satelliteObservation.findMany({
      where: {
        assetId,
        companyId,
        indexType: indexType ?? undefined,
        timestamp: timestampFilter,
      },
      orderBy: { timestamp: "desc" },
    });
  }
}
