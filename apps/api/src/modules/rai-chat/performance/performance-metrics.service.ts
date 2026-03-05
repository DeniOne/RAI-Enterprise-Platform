import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PerformanceMetricType } from "@rai/prisma-client";

export interface AggregatedMetrics {
  successRatePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  byAgent: Array<{ agentRole: string; avgLatencyMs: number; p95LatencyMs: number; errorCount: number }>;
}

@Injectable()
export class PerformanceMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordLatency(
    companyId: string,
    latencyMs: number,
    agentRole?: string,
    toolName?: string,
  ): Promise<void> {
    await this.prisma.performanceMetric.create({
      data: {
        companyId,
        metricType: PerformanceMetricType.LATENCY,
        value: latencyMs,
        agentRole: agentRole ?? null,
        toolName: toolName ?? null,
      },
    });
  }

  async recordError(
    companyId: string,
    agentRole?: string,
    toolName?: string,
  ): Promise<void> {
    await this.prisma.performanceMetric.create({
      data: {
        companyId,
        metricType: PerformanceMetricType.ERROR_RATE,
        value: 1,
        agentRole: agentRole ?? null,
        toolName: toolName ?? null,
      },
    });
  }

  async getAggregatedMetrics(
    companyId: string,
    timeWindowMs: number,
  ): Promise<AggregatedMetrics> {
    const from = new Date(Date.now() - timeWindowMs);
    const [latencies, errors] = await Promise.all([
      this.prisma.performanceMetric.findMany({
        where: {
          companyId,
          metricType: PerformanceMetricType.LATENCY,
          timestamp: { gte: from },
        },
      }),
      this.prisma.performanceMetric.findMany({
        where: {
          companyId,
          metricType: PerformanceMetricType.ERROR_RATE,
          timestamp: { gte: from },
        },
      }),
    ]);
    const totalCalls = latencies.length;
    const errorCount = errors.length;
    const successRatePct =
      totalCalls > 0 ? ((totalCalls - errorCount) / totalCalls) * 100 : 100;
    const values = latencies.map((r) => r.value).sort((a, b) => a - b);
    const avgLatencyMs =
      values.length > 0
        ? values.reduce((s, v) => s + v, 0) / values.length
        : 0;
    const p95Idx = Math.floor(values.length * 0.95);
    const p95LatencyMs = values.length > 0 ? values[p95Idx] ?? values[values.length - 1] : 0;
    const byAgentMap = new Map<
      string,
      { values: number[]; errorCount: number }
    >();
    for (const r of latencies) {
      const key = r.agentRole ?? "unknown";
      if (!byAgentMap.has(key)) byAgentMap.set(key, { values: [], errorCount: 0 });
      byAgentMap.get(key)!.values.push(r.value);
    }
    for (const r of errors) {
      const key = r.agentRole ?? "unknown";
      if (!byAgentMap.has(key)) byAgentMap.set(key, { values: [], errorCount: 0 });
      byAgentMap.get(key)!.errorCount += 1;
    }
    const byAgent = Array.from(byAgentMap.entries()).map(
      ([agentRole, { values: v, errorCount: ec }]) => {
        const sorted = [...v].sort((a, b) => a - b);
        const avg = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
        const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1] : 0;
        return { agentRole, avgLatencyMs: avg, p95LatencyMs: p95, errorCount: ec };
      },
    );
    return {
      successRatePct,
      avgLatencyMs,
      p95LatencyMs,
      byAgent,
    };
  }
}
