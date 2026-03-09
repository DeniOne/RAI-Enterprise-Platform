import { Test, TestingModule } from "@nestjs/testing";
import { IntegrityStatus, ObservationIntent, ObservationType } from "@rai/prisma-client";
import { AuditService } from "../../shared/audit/audit.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { FrontOfficeAgent } from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeDraftService } from "./front-office-draft.service";

describe("FrontOfficeDraftService", () => {
  let service: FrontOfficeDraftService;

  const prismaMock = {
    task: { findFirst: jest.fn() },
    auditLog: { findMany: jest.fn() },
    fieldObservation: { update: jest.fn() },
  };
  const auditMock = { log: jest.fn() };
  const fieldObservationMock = { createObservation: jest.fn() };
  const deviationMock = { createReview: jest.fn() };
  const agentMock = { run: jest.fn() };
  const repositoryMock = {
    createDraft: jest.fn(),
    getDraft: jest.fn(),
    updateDraft: jest.fn(),
    listDrafts: jest.fn(),
    listCommitted: jest.fn(),
    findCommitted: jest.fn(),
    commitDraft: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrontOfficeDraftService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: FieldObservationService, useValue: fieldObservationMock },
        { provide: DeviationService, useValue: deviationMock },
        { provide: FrontOfficeAgent, useValue: agentMock },
        { provide: FrontOfficeDraftRepository, useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(FrontOfficeDraftService);
    jest.clearAllMocks();
  });

  it("creates ready-to-confirm draft from task-anchored task process signal", async () => {
    agentMock.run.mockResolvedValue({
      data: {
        log: { threadKey: "c1:telegram:tg-1" },
        classification: {
          classification: "task_process",
          confidence: 0.86,
          threadKey: "c1:telegram:tg-1",
        },
      },
    });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-1",
      fieldId: "field-1",
      seasonId: "season-1",
    });
    repositoryMock.createDraft.mockImplementation(async (payload: any) => ({
      id: "draft-1",
      companyId: payload.companyId,
      userId: payload.userId,
      status: payload.status,
      eventType: payload.eventType,
      timestamp: payload.timestamp,
      anchor: {
        farmRef: payload.farmRef ?? null,
        fieldId: payload.fieldId ?? null,
        seasonId: payload.payload.seasonId ?? null,
        taskId: payload.taskId ?? null,
      },
      payload: payload.payload,
      evidence: payload.evidence,
      confidence: payload.confidence,
      mustClarifications: payload.mustClarifications,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    }));
    repositoryMock.findCommitted.mockResolvedValue(null);
    auditMock.log.mockResolvedValue({ id: "audit-1", createdAt: new Date() });

    const result = await service.intakeMessage(
      "c1",
      "trace-1",
      { id: "u1", role: "USER" },
      {
        channel: "telegram",
        messageText: "Работу начали, прикладываю подтверждение",
        taskId: "task-1",
        photoUrl: "https://files/photo.jpg",
      },
    );

    expect(repositoryMock.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "READY_TO_CONFIRM",
        eventType: "FRONT_OFFICE_OBSERVATION",
      }),
    );
    expect((result as any).suggestedIntent).toBe("observation");
    expect((result as any).anchor).toEqual({
      farmRef: null,
      taskId: "task-1",
      fieldId: "field-1",
      seasonId: "season-1",
    });
  });

  it("creates needs-link draft when consultation has no anchor", async () => {
    agentMock.run.mockResolvedValue({
      data: {
        log: { threadKey: "c1:telegram:tg-2" },
        classification: {
          classification: "client_request",
          confidence: 0.9,
          threadKey: "c1:telegram:tg-2",
        },
      },
    });
    repositoryMock.createDraft.mockImplementation(async (payload: any) => ({
      id: "draft-2",
      companyId: payload.companyId,
      userId: payload.userId,
      status: payload.status,
      eventType: payload.eventType,
      timestamp: payload.timestamp,
      anchor: {
        farmRef: null,
        fieldId: null,
        seasonId: null,
        taskId: null,
      },
      payload: payload.payload,
      evidence: payload.evidence,
      confidence: payload.confidence,
      mustClarifications: payload.mustClarifications,
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    }));
    repositoryMock.findCommitted.mockResolvedValue(null);
    auditMock.log.mockResolvedValue({ id: "audit-2", createdAt: new Date() });

    const result = await service.intakeMessage(
      "c1",
      "trace-2",
      { id: "u1", role: "USER" },
      {
        channel: "telegram",
        messageText: "Нужна консультация по текущей ситуации",
      },
    );

    expect(repositoryMock.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "NEEDS_LINK",
        mustClarifications: expect.arrayContaining(["LINK_OBJECT"]),
      }),
    );
    expect((result as any).mustClarifications).toContain("LINK_OBJECT");
  });

  it("links draft and moves it to ready-to-confirm when anchor becomes complete", async () => {
    repositoryMock.getDraft.mockResolvedValue({
      id: "draft-3",
      companyId: "c1",
      userId: "u1",
      status: "NEEDS_LINK",
      eventType: "FRONT_OFFICE_DEVIATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: { farmRef: null, fieldId: null, seasonId: null, taskId: null },
      payload: {
        suggestedIntent: "deviation",
        threadKey: "c1:telegram:tg-3",
        messageText: "Проблема на поле",
      },
      evidence: [],
      confidence: 0.91,
      mustClarifications: ["LINK_FIELD_OR_TASK", "LINK_SEASON"],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
    prismaMock.task.findFirst.mockResolvedValue({
      id: "task-3",
      fieldId: "field-3",
      seasonId: "season-3",
    });
    repositoryMock.updateDraft.mockImplementation(async (_companyId: string, _draftId: string, patch: any) => ({
      id: "draft-3",
      companyId: "c1",
      userId: "u1",
      status: patch.status,
      eventType: "FRONT_OFFICE_DEVIATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: patch.farmRef ?? null,
        fieldId: patch.fieldId ?? null,
        seasonId: patch.payload?.seasonId ?? null,
        taskId: patch.taskId ?? null,
      },
      payload: {
        suggestedIntent: "deviation",
        threadKey: "c1:telegram:tg-3",
        messageText: "Проблема на поле",
        ...(patch.payload ?? {}),
      },
      evidence: [],
      confidence: 0.91,
      mustClarifications: patch.mustClarifications ?? [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:01:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    }));
    repositoryMock.findCommitted.mockResolvedValue(null);
    auditMock.log.mockResolvedValue({ id: "audit-3", createdAt: new Date() });

    const result = await service.linkDraft("c1", "u1", "draft-3", {
      taskId: "task-3",
    });

    expect(repositoryMock.updateDraft).toHaveBeenCalledWith(
      "c1",
      "draft-3",
      expect.objectContaining({
        status: "READY_TO_CONFIRM",
        taskId: "task-3",
        fieldId: "field-3",
      }),
    );
    expect((result as any).anchor).toEqual({
      farmRef: null,
      fieldId: "field-3",
      seasonId: "season-3",
      taskId: "task-3",
    });
  });

  it("confirms observation draft and commits it into domain observation", async () => {
    repositoryMock.getDraft.mockResolvedValue({
      id: "draft-4",
      companyId: "c1",
      userId: "u1",
      status: "READY_TO_CONFIRM",
      eventType: "FRONT_OFFICE_OBSERVATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: "field-4",
        seasonId: "season-4",
        taskId: "task-4",
      },
      payload: {
        suggestedIntent: "observation",
        messageText: "Работа выполнена",
        traceId: "trace-4",
        channel: "telegram",
        sourceMessageId: "m-1",
        chatId: "chat-1",
        photoUrl: "https://files/proof.jpg",
        coordinates: { lat: 51.5, lng: 39.2 },
      },
      evidence: [{ type: "photo", url: "https://files/proof.jpg" }],
      confidence: 0.85,
      mustClarifications: [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
    fieldObservationMock.createObservation.mockResolvedValue({
      id: "obs-4",
      createdAt: new Date("2026-03-09T00:10:00.000Z"),
      type: ObservationType.PHOTO,
      intent: ObservationIntent.CONFIRMATION,
      integrityStatus: IntegrityStatus.WEAK_EVIDENCE,
    });
    repositoryMock.updateDraft
      .mockResolvedValueOnce({
        id: "draft-4",
        companyId: "c1",
        userId: "u1",
        status: "READY_TO_CONFIRM",
        eventType: "FRONT_OFFICE_OBSERVATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: null,
          fieldId: "field-4",
          seasonId: "season-4",
          taskId: "task-4",
        },
        payload: {
          suggestedIntent: "observation",
          messageText: "Работа выполнена",
          commitResult: {
            kind: "observation",
            id: "obs-4",
            createdAt: new Date("2026-03-09T00:10:00.000Z"),
            anchor: {
              farmRef: null,
              fieldId: "field-4",
              seasonId: "season-4",
              taskId: "task-4",
            },
          },
        },
        evidence: [{ type: "photo", url: "https://files/proof.jpg" }],
        confidence: 0.85,
        mustClarifications: [],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:01:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      });
    repositoryMock.commitDraft.mockResolvedValue({
      draft: {
        id: "draft-4",
        companyId: "c1",
        userId: "u1",
        status: "COMMITTED",
        eventType: "FRONT_OFFICE_OBSERVATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: null,
          fieldId: "field-4",
          seasonId: "season-4",
          taskId: "task-4",
        },
        payload: {
          suggestedIntent: "observation",
          messageText: "Работа выполнена",
          commitResult: {
            kind: "observation",
            id: "obs-4",
            createdAt: new Date("2026-03-09T00:10:00.000Z"),
            anchor: {
              farmRef: null,
              fieldId: "field-4",
              seasonId: "season-4",
              taskId: "task-4",
            },
          },
        },
        evidence: [{ type: "photo", url: "https://files/proof.jpg" }],
        confidence: 0.85,
        mustClarifications: [],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:02:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      },
      committed: {
        id: "draft-4",
        companyId: "c1",
        eventType: "FRONT_OFFICE_OBSERVATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        committedAt: "2026-03-09T00:02:00.000Z",
        committedBy: "u1",
        provenanceHash: "hash-1",
        payload: {
          commitResult: {
            kind: "observation",
            id: "obs-4",
          },
        },
        evidence: [{ type: "photo", url: "https://files/proof.jpg" }],
        anchor: {
          farmRef: null,
          fieldId: "field-4",
          seasonId: "season-4",
          taskId: "task-4",
        },
      },
    });
    auditMock.log.mockResolvedValue({ id: "audit-4", createdAt: new Date() });

    const result = await service.confirmDraft(
      "c1",
      { id: "u1", role: "USER" },
      "draft-4",
    );

    expect(fieldObservationMock.createObservation).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        fieldId: "field-4",
        seasonId: "season-4",
        taskId: "task-4",
        content: "Работа выполнена",
      }),
    );
    expect(repositoryMock.commitDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        draftId: "draft-4",
        committedBy: "u1",
      }),
    );
    expect((result as any).status).toBe("COMMITTED");
    expect((result as any).commitResult).toEqual(
      expect.objectContaining({ kind: "observation", id: "obs-4" }),
    );
  });
});
