import { AgroEscalationLoopService } from "./agro-escalation-loop.service";

describe("AgroEscalationLoopService", () => {
  let service: AgroEscalationLoopService;
  let prisma: any;

  const committedEvent = {
    id: "event-1",
    companyId: "company-1",
    farmRef: "farm-1",
    fieldRef: "field-1",
    taskRef: "task-1",
    eventType: "FIELD_OPERATION",
    payload: {
      companyId: "alien-company",
    },
    evidence: [],
    timestamp: "2026-03-01T10:00:00.000Z",
    committedAt: "2026-03-05T10:00:00.000Z",
    committedBy: "user-1",
    provenanceHash: "hash-1",
  };

  beforeEach(() => {
    prisma = {
      mapOperation: {
        findUnique: jest.fn(),
      },
      agroEscalation: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    service = new AgroEscalationLoopService(prisma);
  });

  it("создаёт escalation при delayDays=4 с severity=S3", async () => {
    prisma.mapOperation.findUnique.mockResolvedValue({
      plannedEndTime: new Date("2026-03-01T10:00:00.000Z"),
    });
    prisma.agroEscalation.findMany.mockResolvedValue([]);

    await service.handleCommittedEvent(committedEvent);

    expect(prisma.agroEscalation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: committedEvent.companyId,
        metricKey: "operationDelayDays",
        severity: "S3",
        status: "OPEN",
        references: expect.objectContaining({
          eventId: committedEvent.id,
          fieldRef: committedEvent.fieldRef,
          taskRef: committedEvent.taskRef,
        }),
      }),
    });
  });

  it("не создаёт escalation при delayDays=0", async () => {
    prisma.mapOperation.findUnique.mockResolvedValue({
      plannedEndTime: new Date("2026-03-05T10:00:00.000Z"),
    });

    await service.handleCommittedEvent(committedEvent);

    expect(prisma.agroEscalation.findMany).not.toHaveBeenCalled();
    expect(prisma.agroEscalation.create).not.toHaveBeenCalled();
  });

  it("не берёт tenant из payload, использует только committed.companyId", async () => {
    prisma.mapOperation.findUnique.mockResolvedValue({
      plannedEndTime: new Date("2026-03-01T10:00:00.000Z"),
    });
    prisma.agroEscalation.findMany.mockResolvedValue([]);

    await service.handleCommittedEvent(committedEvent);

    expect(prisma.agroEscalation.findMany).toHaveBeenCalledWith({
      where: {
        companyId: "company-1",
        metricKey: "operationDelayDays",
      },
      select: {
        id: true,
        references: true,
      },
    });
    expect(prisma.agroEscalation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: "company-1",
      }),
    });
  });
});
