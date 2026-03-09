import { Test, TestingModule } from "@nestjs/testing";
import { TaskStatus } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { DeviationService } from "../cmr/deviation.service";
import { FrontOfficeAgent } from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeDraftService } from "../front-office-draft/front-office-draft.service";
import { FrontOfficeService } from "./front-office.service";

describe("FrontOfficeService", () => {
  let service: FrontOfficeService;

  const prismaMock = {
    field: { count: jest.fn() },
    season: { count: jest.fn() },
    task: { findMany: jest.fn() },
    deviationReview: { findMany: jest.fn() },
    auditLog: { findMany: jest.fn() },
  };
  const auditMock = { log: jest.fn() };
  const fieldObservationMock = { createObservation: jest.fn() };
  const deviationMock = { createReview: jest.fn(), findAll: jest.fn() };
  const agentMock = { run: jest.fn() };
  const draftServiceMock = {
    intakeMessage: jest.fn(),
    getDraft: jest.fn(),
    fixDraft: jest.fn(),
    linkDraft: jest.fn(),
    confirmDraft: jest.fn(),
    getQueues: jest.fn(),
    getThread: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrontOfficeService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: FieldObservationService, useValue: fieldObservationMock },
        { provide: DeviationService, useValue: deviationMock },
        { provide: FrontOfficeAgent, useValue: agentMock },
        { provide: FrontOfficeDraftService, useValue: draftServiceMock },
      ],
    }).compile();

    service = module.get(FrontOfficeService);
    jest.clearAllMocks();
  });

  it("delegates intake to front-office draft service", async () => {
    draftServiceMock.intakeMessage.mockResolvedValue({
      status: "DRAFT_RECORDED",
      draftId: "draft-1",
      suggestedIntent: "deviation",
    });

    const result = await service.intakeMessage(
      "c1",
      "trace-1",
      { id: "u1", role: "USER" },
      {
        channel: "telegram",
        messageText: "Проблема на поле, вот фото",
        taskId: "task-1",
      },
    );

    expect(draftServiceMock.intakeMessage).toHaveBeenCalledWith(
      "c1",
      "trace-1",
      { id: "u1", role: "USER" },
      expect.objectContaining({
        channel: "telegram",
        messageText: "Проблема на поле, вот фото",
        taskId: "task-1",
      }),
    );
    expect((result as any).draftId).toBe("draft-1");
  });

  it("builds overview from current company state", async () => {
    prismaMock.field.count.mockResolvedValue(3);
    prismaMock.season.count.mockResolvedValue(2);
    prismaMock.task.findMany.mockResolvedValue([
      {
        id: "task-1",
        status: TaskStatus.PENDING,
        field: { id: "field-1", name: "Поле 1" },
        season: { id: "season-1", year: 2026 },
      },
    ]);
    prismaMock.deviationReview.findMany.mockResolvedValue([
      { id: "dev-1", status: "DETECTED" },
    ]);
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: "audit-1",
        action: "FRONT_OFFICE_CONTEXT_UPDATED",
        createdAt: new Date("2026-03-09T00:00:00.000Z"),
        metadata: { messageText: "Новый контекст" },
      },
    ]);

    const result = await service.getOverview("c1", "u1");

    expect(result.counts).toEqual({
      fields: 3,
      seasons: 2,
      tasks: 1,
      openDeviations: 1,
    });
    expect(result.tasks).toHaveLength(1);
    expect(result.deviations).toHaveLength(1);
    expect(result.recentSignals).toHaveLength(1);
  });
});
