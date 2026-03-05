import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import { MonitoringAgent } from "./agents/monitoring-agent.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { TenantScope } from "../../shared/tenant-context/tenant-scope";
import { QualityAlertingService } from "./quality-alerting.service";

@Injectable()
export class MonitoringTriggerService {
  private readonly logger = new Logger(MonitoringTriggerService.name);

  constructor(
    private readonly monitoringAgent: MonitoringAgent,
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly qualityAlerting: QualityAlertingService,
  ) {}

  /** Ручной запуск цикла мониторинга для тенанта (симуляция event-driven). */
  async triggerMonitoringCycle(companyId: string): Promise<{
    traceId: string;
    status: string;
    alertsEmitted: number;
  }> {
    const traceId = randomUUID();
    const result = await this.monitoringAgent.run({
      companyId,
      traceId,
    });
    return {
      traceId,
      status: result.status,
      alertsEmitted: result.alertsEmitted,
    };
  }

  /** Каждый час — симуляция фонового цикла (по умолчанию без companyId — не запускаем). */
  @Cron("0 * * * *")
  async hourlyCycle(): Promise<void> {
    const now = new Date();
    await this.runBsDriftChecks(now);
    // При необходимости можно подставлять список companyId из БД
    // await this.triggerMonitoringCycle(companyId);
  }

  private async runBsDriftChecks(now: Date): Promise<void> {
    await this.tenantContext.run(
      { scope: TenantScope.system() },
      async () => {
        const windowStart = new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000,
        );
        const rows = await this.prisma.traceSummary.groupBy({
          by: ["companyId"],
          where: {
            createdAt: {
              gte: windowStart,
            },
          },
        });

        for (const row of rows) {
          const companyId = row.companyId;
          try {
            await this.qualityAlerting.evaluateBsDrift({
              companyId,
              now,
            });
          } catch (err) {
            this.logger.warn(
              `BS drift evaluation failed companyId=${companyId} err=${String(
                (err as Error)?.message ?? err,
              )}`,
            );
          }
        }
      },
    );
  }
}
