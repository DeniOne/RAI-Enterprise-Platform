import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { randomUUID } from "crypto";
import { MonitoringAgent } from "./agents/monitoring-agent.service";

@Injectable()
export class MonitoringTriggerService {
  constructor(private readonly monitoringAgent: MonitoringAgent) {}

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
    // При необходимости можно подставлять список companyId из БД
    // await this.triggerMonitoringCycle(companyId);
  }
}
