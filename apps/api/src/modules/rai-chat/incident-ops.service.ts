import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SystemIncidentType } from "@rai/prisma-client";

export interface LogIncidentParams {
  companyId?: string | null;
  traceId?: string | null;
  incidentType: SystemIncidentType;
  severity: string;
  details?: Record<string, unknown>;
}

export interface IncidentFeedItem {
  id: string;
  companyId: string | null;
  traceId: string | null;
  incidentType: string;
  severity: string;
  details: unknown;
  createdAt: string;
  resolvedAt: string | null;
  resolveComment: string | null;
}

export interface GovernanceCountersDto {
  crossTenantBreach: number;
  piiLeak: number;
  byType: Record<string, number>;
}

@Injectable()
export class IncidentOpsService {
  private readonly logger = new Logger(IncidentOpsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Пишет инцидент в лог. Не блокирует основной флоу (fire-and-forget). */
  logIncident(params: LogIncidentParams): void {
    const { companyId, traceId, incidentType, severity, details = {} } = params;
    void this.prisma.systemIncident
      .create({
        data: {
          companyId: companyId ?? undefined,
          traceId: traceId ?? undefined,
          incidentType,
          severity,
          details: details as object,
        },
      })
      .catch((err) => {
        this.logger.warn(
          `logIncident failed type=${incidentType} err=${String((err as Error)?.message ?? err)}`,
        );
      });
  }

  async getIncidentsFeed(
    companyId: string,
    limit: number,
    offset: number,
  ): Promise<IncidentFeedItem[]> {
    const rows = await this.prisma.systemIncident.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: Math.min(100, Math.max(1, limit)),
      skip: Math.max(0, offset),
    });
    return rows.map((r) => ({
      id: r.id,
      companyId: r.companyId,
      traceId: r.traceId,
      incidentType: r.incidentType,
      severity: r.severity,
      details: r.details,
      createdAt: r.createdAt.toISOString(),
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      resolveComment: r.resolveComment ?? null,
    }));
  }

  async resolveIncident(incidentId: string, companyId: string, comment: string): Promise<void> {
    await this.prisma.systemIncident.updateMany({
      where: { id: incidentId, companyId },
      data: { resolvedAt: new Date(), resolveComment: comment ?? "" },
    });
  }

  async getGovernanceCounters(companyId: string): Promise<GovernanceCountersDto> {
    const rows = await this.prisma.systemIncident.findMany({
      where: { companyId },
      select: { incidentType: true },
    });
    const byType: Record<string, number> = {};
    for (const r of rows) {
      byType[r.incidentType] = (byType[r.incidentType] ?? 0) + 1;
    }
    return {
      crossTenantBreach: byType["CROSS_TENANT_BREACH"] ?? 0,
      piiLeak: byType["PII_LEAK"] ?? 0,
      byType,
    };
  }
}
