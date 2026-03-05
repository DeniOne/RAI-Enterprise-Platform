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
        toolName: "supervisor_tasks",
      },
    });
  });

  it("getQueueMetrics возвращает lastSize и avgSize по companyId", async () => {
    prisma.performanceMetric.findMany.mockResolvedValue([
      { toolName: "q1", value: 10 },
      { toolName: "q1", value: 20 },
      { toolName: "q2", value: 5 },
    ]);
    const out = await service.getQueueMetrics("c1", 3600_000);
    expect(prisma.performanceMetric.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: "c1", metricType: PerformanceMetricType.QUEUE_SIZE }),
      }),
    );
    expect(out.length).toBe(2);
    const q1 = out.find((x) => x.queueName === "q1");
    expect(q1?.lastSize).toBe(10);
    expect(q1?.avgSize).toBe(15);
  });
});
