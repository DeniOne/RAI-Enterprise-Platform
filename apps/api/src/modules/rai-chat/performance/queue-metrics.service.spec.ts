import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { QueueMetricsService } from "./queue-metrics.service";
import { PerformanceMetricType } from "@rai/prisma-client";

describe("QueueMetricsService", () => {
  let service: QueueMetricsService;
  const prisma = {
    performanceMetric: {
      create: jest.fn().mockResolvedValue({ id: "q1" }),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        QueueMetricsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(QueueMetricsService);
  });

  it("recordQueueSize пишет QUEUE_SIZE с toolName=queueName", async () => {
    await service.recordQueueSize("c1", "supervisor_tasks", 42);
    expect(prisma.performanceMetric.create).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        metricType: PerformanceMetricType.QUEUE_SIZE,
        value: 42,
        agentRole: null,
        toolName: "supervisor_tasks",
      },
    });
  });

  it("getQueueMetrics возвращает lastSize и avgSize по companyId", async () => {
    prisma.performanceMetric.findMany.mockResolvedValue([
      { toolName: "q1", agentRole: "pod-a", value: 10, timestamp: new Date("2026-03-07T10:00:00Z") },
      { toolName: "q1", agentRole: "pod-a", value: 20, timestamp: new Date("2026-03-07T09:59:00Z") },
      { toolName: "q1", agentRole: "pod-b", value: 4, timestamp: new Date("2026-03-07T09:58:30Z") },
      { toolName: "q2", agentRole: "pod-a", value: 5, timestamp: new Date("2026-03-07T09:58:00Z") },
    ]);
    const out = await service.getQueueMetrics("c1", 3600_000);
    expect(prisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: "c1", metricType: PerformanceMetricType.QUEUE_SIZE }),
      }),
    );
    expect(out.length).toBe(2);
    const q1 = out.find((x) => x.queueName === "q1");
    expect(q1?.lastSize).toBe(14);
    expect(q1?.avgSize).toBeCloseTo((4 + 24 + 14) / 3);
    expect(q1?.peakSize).toBe(24);
    expect(q1?.samples).toBe(3);
    expect(q1?.activeInstances).toBe(2);
  });

  it("begin/end runtime execution пишет live snapshots для runtime source", async () => {
    await service.beginRuntimeExecution("c1", 3);
    await service.endRuntimeExecution("c1", 3);

    expect(prisma.performanceMetric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: "c1",
          metricType: PerformanceMetricType.QUEUE_SIZE,
          agentRole: expect.any(String),
          toolName: "runtime_active_runs",
        }),
      }),
    );
    expect(prisma.performanceMetric.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: "c1",
          metricType: PerformanceMetricType.QUEUE_SIZE,
          agentRole: expect.any(String),
          toolName: "runtime_active_tool_calls",
        }),
      }),
    );
  });

  it("getQueuePressure агрегирует latest snapshots по нескольким инстансам tenant-wide", async () => {
    prisma.performanceMetric.findMany.mockResolvedValue([
      { toolName: "runtime_active_tool_calls", agentRole: "pod-a", value: 4, timestamp: new Date() },
      { toolName: "runtime_active_tool_calls", agentRole: "pod-b", value: 4, timestamp: new Date(Date.now() - 500) },
      { toolName: "runtime_active_tool_calls", agentRole: "pod-b", value: 1, timestamp: new Date(Date.now() - 1_000) },
      { toolName: "runtime_active_runs", agentRole: "pod-a", value: 1, timestamp: new Date() },
      { toolName: "runtime_active_runs", agentRole: "pod-b", value: 1, timestamp: new Date(Date.now() - 500) },
    ]);

    const out = await service.getQueuePressure("c1", 3600_000);

    expect(out.pressureState).toBe("SATURATED");
    expect(out.signalFresh).toBe(true);
    expect(out.totalBacklog).toBe(10);
    expect(out.hottestQueue).toBe("runtime_active_tool_calls");
    const toolCalls = out.observedQueues.find((queue) => queue.queueName === "runtime_active_tool_calls");
    expect(toolCalls?.lastSize).toBe(8);
    expect(toolCalls?.activeInstances).toBe(2);
  });
});
