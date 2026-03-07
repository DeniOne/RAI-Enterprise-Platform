import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PerformanceMetricType } from "@rai/prisma-client";

export interface QueueMetricPoint {
  queueName: string;
  lastSize: number;
  avgSize: number;
  peakSize: number;
  samples: number;
  activeInstances: number;
  lastObservedAt: string | null;
}

export interface QueuePressureSummary {
  pressureState: "IDLE" | "STABLE" | "PRESSURED" | "SATURATED" | null;
  signalFresh: boolean;
  totalBacklog: number | null;
  hottestQueue: string | null;
  observedQueues: QueueMetricPoint[];
}

const RUNTIME_ACTIVE_RUNS_QUEUE = "runtime_active_runs";
const RUNTIME_ACTIVE_TOOL_CALLS_QUEUE = "runtime_active_tool_calls";
const RUNTIME_PRESSURED_TOOLS = 4;
const RUNTIME_SATURATED_TOOLS = 8;

@Injectable()
export class QueueMetricsService {
  private readonly runtimeInstanceId =
    process.env.HOSTNAME?.trim() ||
    process.env.NODE_APP_INSTANCE?.trim() ||
    `pid:${process.pid}`;
  private readonly runtimeCounters = new Map<
    string,
    { activeRuns: number; activeToolCalls: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async recordQueueSize(
    companyId: string,
    queueName: string,
    size: number,
    instanceId?: string,
  ): Promise<void> {
    await this.prisma.performanceMetric.create({
      data: {
        companyId,
        metricType: PerformanceMetricType.QUEUE_SIZE,
        value: size,
        agentRole: instanceId ?? null,
        toolName: queueName,
      },
    });
  }

  async beginRuntimeExecution(
    companyId: string,
    toolCallCount: number,
  ): Promise<void> {
    const state = this.runtimeCounters.get(companyId) ?? {
      activeRuns: 0,
      activeToolCalls: 0,
    };
    state.activeRuns += 1;
    state.activeToolCalls += Math.max(0, toolCallCount);
    this.runtimeCounters.set(companyId, state);
    await this.recordRuntimeSnapshot(companyId, state);
  }

  async endRuntimeExecution(
    companyId: string,
    toolCallCount: number,
  ): Promise<void> {
    const state = this.runtimeCounters.get(companyId) ?? {
      activeRuns: 0,
      activeToolCalls: 0,
    };
    state.activeRuns = Math.max(0, state.activeRuns - 1);
    state.activeToolCalls = Math.max(0, state.activeToolCalls - Math.max(0, toolCallCount));
    this.runtimeCounters.set(companyId, state);
    await this.recordRuntimeSnapshot(companyId, state);
  }

  async getQueueMetrics(
    companyId: string,
    timeWindowMs: number,
    queueName?: string,
  ): Promise<QueueMetricPoint[]> {
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
    const byQueue = new Map<
      string,
      Array<{ value: number; timestamp: Date; instanceId: string }>
    >();
    for (const r of rows) {
      const name = r.toolName ?? "default";
      if (!byQueue.has(name)) byQueue.set(name, []);
      byQueue.get(name)!.push({
        value: r.value,
        timestamp: r.timestamp,
        instanceId: r.agentRole ?? "__legacy__",
      });
    }
    return Array.from(byQueue.entries()).map(([name, values]) => {
      const latestByInstance = new Map<string, number>();
      for (const item of values) {
        if (!latestByInstance.has(item.instanceId)) {
          latestByInstance.set(item.instanceId, item.value);
        }
      }

      const timeline = [...values].sort(
        (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
      );
      const stateByInstance = new Map<string, number>();
      const aggregatedSamples: number[] = [];
      for (const item of timeline) {
        stateByInstance.set(item.instanceId, item.value);
        aggregatedSamples.push(
          [...stateByInstance.values()].reduce((sum, value) => sum + value, 0),
        );
      }

      return {
        queueName: name,
        lastSize: [...latestByInstance.values()].reduce((sum, value) => sum + value, 0),
        avgSize: aggregatedSamples.length
          ? aggregatedSamples.reduce((a, b) => a + b, 0) / aggregatedSamples.length
          : 0,
        peakSize: aggregatedSamples.length ? Math.max(...aggregatedSamples) : 0,
        samples: aggregatedSamples.length,
        activeInstances: latestByInstance.size,
        lastObservedAt: values[0]?.timestamp?.toISOString() ?? null,
      };
    });
  }

  async getQueuePressure(
    companyId: string,
    timeWindowMs: number,
  ): Promise<QueuePressureSummary> {
    const observedQueues = await this.getQueueMetrics(companyId, timeWindowMs);
    if (observedQueues.length === 0) {
      return {
        pressureState: null,
        signalFresh: false,
        totalBacklog: null,
        hottestQueue: null,
        observedQueues: [],
      };
    }

    const totalBacklog = observedQueues.reduce((sum, queue) => sum + queue.lastSize, 0);
    const hottestQueue =
      [...observedQueues].sort((left, right) => right.lastSize - left.lastSize)[0]?.queueName ?? null;
    const newestTimestamp = observedQueues
      .map((queue) => (queue.lastObservedAt ? new Date(queue.lastObservedAt).getTime() : 0))
      .reduce((latest, value) => Math.max(latest, value), 0);
    const freshnessWindowMs = Math.min(timeWindowMs, 5 * 60 * 1000);

    return {
      pressureState: this.resolvePressureState(totalBacklog),
      signalFresh: newestTimestamp > 0 && Date.now() - newestTimestamp <= freshnessWindowMs,
      totalBacklog,
      hottestQueue,
      observedQueues,
    };
  }

  private async recordRuntimeSnapshot(
    companyId: string,
    state: { activeRuns: number; activeToolCalls: number },
  ): Promise<void> {
    await Promise.all([
      this.recordQueueSize(
        companyId,
        RUNTIME_ACTIVE_RUNS_QUEUE,
        state.activeRuns,
        this.runtimeInstanceId,
      ),
      this.recordQueueSize(
        companyId,
        RUNTIME_ACTIVE_TOOL_CALLS_QUEUE,
        state.activeToolCalls,
        this.runtimeInstanceId,
      ),
    ]);
  }

  private resolvePressureState(
    totalBacklog: number,
  ): QueuePressureSummary["pressureState"] {
    if (totalBacklog <= 0) {
      return "IDLE";
    }
    if (totalBacklog >= RUNTIME_SATURATED_TOOLS) {
      return "SATURATED";
    }
    if (totalBacklog >= RUNTIME_PRESSURED_TOOLS) {
      return "PRESSURED";
    }
    return "STABLE";
  }
}
