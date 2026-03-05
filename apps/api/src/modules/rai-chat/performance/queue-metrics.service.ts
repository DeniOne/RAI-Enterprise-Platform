import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PerformanceMetricType } from "@rai/prisma-client";

/** Заглушка: очереди (RabbitMQ/Kafka/BullMQ) пока нет — пишем только в БД для дашборда. */
@Injectable()
export class QueueMetricsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async recordQueueSize(
    companyId: string,
    queueName: string,
    size: number,
  ): Promise<void> {
    await this.prisma.performanceMetric.create({
      data: {
        companyId,
        metricType: PerformanceMetricType.QUEUE_SIZE,
        value: size,
        toolName: queueName,
      },
    });
  }

  /** Агрегированная глубина очереди за окно (последнее значение или среднее). */
  async getQueueMetrics(
    companyId: string,
    timeWindowMs: number,
    queueName?: string,
  ): Promise<{ queueName: string; lastSize: number; avgSize: number }[]> {
    const from = new Date(Date.now() - timeWindowMs);
    const where: { companyId: string; metricType: PerformanceMetricType; timestamp: { gte: Date }; toolName?: string } = {
      companyId,
      metricType: PerformanceMetricType.QUEUE_SIZE,
      timestamp: { gte: from },
    };
    if (queueName) where.toolName = queueName;
    const rows = await this.prisma.performanceMetric.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
    const byQueue = new Map<string, number[]>();
    for (const r of rows) {
      const name = r.toolName ?? "default";
      if (!byQueue.has(name)) byQueue.set(name, []);
      byQueue.get(name)!.push(r.value);
    }
    return Array.from(byQueue.entries()).map(([queueName, values]) => ({
      queueName,
      lastSize: values[0] ?? 0,
      avgSize: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    }));
  }
}
