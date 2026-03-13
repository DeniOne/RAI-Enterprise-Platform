import { Test, TestingModule } from "@nestjs/testing";
import { IntegrityStatus, ObservationIntent, ObservationType } from "@rai/prisma-client";
import { AuditService } from "../../shared/audit/audit.service";
import { FrontOfficeCommunicationRepository } from "../../shared/front-office/front-office-communication.repository";
import { FrontOfficeMetricsService } from "../../shared/front-office/front-office-metrics.service";
import { FrontOfficeOutboundService } from "../../shared/front-office/front-office-outbound.service";
import { FrontOfficeThreadingService } from "../../shared/front-office/front-office-threading.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { FrontOfficeClientResponseOrchestrator } from "./front-office-client-response.orchestrator.service";
import { FrontOfficeAgent } from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeDraftRepository } from "./front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "./front-office-handoff.orchestrator.service";
import { FrontOfficeReplyPolicyService } from "./front-office-reply-policy.service";
import { FrontOfficeDraftService } from "./front-office-draft.service";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";

describe("FrontOfficeDraftService", () => {
  let service: FrontOfficeDraftService;

  const prismaMock = {
    task: { findFirst: jest.fn() },
    user: { findFirst: jest.fn() },
    account: { findFirst: jest.fn() },
    field: { findFirst: jest.fn() },
    auditLog: { findMany: jest.fn() },
    fieldObservation: { update: jest.fn() },
  };
  const auditMock = { log: jest.fn() };
  const fieldObservationMock = { createObservation: jest.fn() };
  const deviationMock = { createReview: jest.fn() };
  const agentMock = { run: jest.fn() };
  const communicationRepositoryMock = {
    upsertThread: jest.fn(),
    createMessage: jest.fn(),
    getThreadByKey: jest.fn(),
    getThreadById: jest.fn(),
    listThreads: jest.fn(),
    listMessages: jest.fn(),
    findAssignment: jest.fn(),
  };
  const metricsMock = {
    recordRoutingOutcome: jest.fn(),
    recordReplyStatus: jest.fn(),
    recordClarificationRequest: jest.fn(),
    recordHandoffCreated: jest.fn(),
    recordHandoffResolved: jest.fn(),
    recordHandoffClosed: jest.fn(),
    snapshot: jest.fn(),
    prometheus: jest.fn(),
  };
  const handoffOrchestratorMock = {
    routeDraftHandoff: jest.fn(),
    listHandoffs: jest.fn(),
    getHandoff: jest.fn(),
    claimHandoff: jest.fn(),
    rejectHandoff: jest.fn(),
    resolveHandoff: jest.fn(),
    addManualNote: jest.fn(),
  };
  const replyPolicyMock = { evaluate: jest.fn() };
  const outboundServiceMock = { sendToThread: jest.fn() };
  const clientResponseOrchestratorMock = {
    sendAutoReply: jest.fn(),
    sendClarification: jest.fn(),
    sendHandoffReceipt: jest.fn(),
  };
  const repositoryMock = {
    createDraft: jest.fn(),
    getDraft: jest.fn(),
    updateDraft: jest.fn(),
    listDrafts: jest.fn(),
    listCommitted: jest.fn(),
    findCommitted: jest.fn(),
    commitDraft: jest.fn(),
  };
  const telegramNotificationMock = {
    sendFrontOfficeReply: jest.fn(),
    notifyFrontOfficeThread: jest.fn(),
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
        { provide: FrontOfficeCommunicationRepository, useValue: communicationRepositoryMock },
        { provide: FrontOfficeMetricsService, useValue: metricsMock },
        FrontOfficeThreadingService,
        { provide: FrontOfficeReplyPolicyService, useValue: replyPolicyMock },
        { provide: FrontOfficeOutboundService, useValue: outboundServiceMock },
        {
          provide: FrontOfficeClientResponseOrchestrator,
          useValue: clientResponseOrchestratorMock,
        },
        { provide: FrontOfficeDraftRepository, useValue: repositoryMock },
        { provide: FrontOfficeHandoffOrchestrator, useValue: handoffOrchestratorMock },
        { provide: TelegramNotificationService, useValue: telegramNotificationMock },
      ],
    }).compile();

    service = module.get(FrontOfficeDraftService);
    jest.clearAllMocks();
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.account.findFirst.mockResolvedValue(null);
    prismaMock.field.findFirst.mockResolvedValue(null);
    communicationRepositoryMock.upsertThread.mockResolvedValue({
      id: "thread-1",
      threadKey: "c1:telegram:tg-1",
      channel: "telegram",
      companyId: "c1",
      farmAccountId: null,
      farmNameSnapshot: null,
      representativeUserId: null,
      representativeTelegramId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: null,
      lastMessageAt: null,
      currentOwnerRole: null,
      currentHandoffStatus: null,
    });
    communicationRepositoryMock.createMessage.mockResolvedValue({
      id: "msg-1",
      createdAt: "2026-03-09T00:00:00.000Z",
    });
    communicationRepositoryMock.listMessages.mockResolvedValue([]);
    communicationRepositoryMock.findAssignment.mockResolvedValue(null);
    communicationRepositoryMock.getThreadByKey.mockResolvedValue({
      id: "thread-1",
      threadKey: "c1:telegram:tg-1",
      channel: "telegram",
      companyId: "c1",
      farmAccountId: null,
      farmNameSnapshot: null,
      representativeUserId: null,
      representativeTelegramId: null,
      threadExternalId: "tg-1",
      dialogExternalId: null,
      senderExternalId: null,
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: null,
      lastMessageAt: null,
      currentOwnerRole: null,
      currentHandoffStatus: null,
    });
    communicationRepositoryMock.getThreadById.mockResolvedValue({
      id: "thread-1",
      threadKey: "c1:telegram:tg-1",
      channel: "telegram",
      companyId: "c1",
      farmAccountId: null,
      farmNameSnapshot: null,
      representativeUserId: null,
      representativeTelegramId: null,
      threadExternalId: "tg-1",
      dialogExternalId: null,
      senderExternalId: null,
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: null,
      lastMessageAt: null,
      currentOwnerRole: null,
      currentHandoffStatus: null,
    });
    handoffOrchestratorMock.listHandoffs.mockResolvedValue([]);
    repositoryMock.updateDraft.mockImplementation(
      async (_companyId: string, draftId: string, patch: any) => ({
        id: draftId,
        companyId: "c1",
        userId: "u1",
        status: patch.status ?? "READY_TO_CONFIRM",
        eventType: "FRONT_OFFICE_OBSERVATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: patch.farmRef ?? null,
          fieldId: patch.fieldId ?? null,
          seasonId: patch.payload?.seasonId ?? null,
          taskId: patch.taskId ?? null,
        },
        payload: {
          threadKey: "c1:telegram:tg-default",
          messageText: "default",
          ...(patch.payload ?? {}),
        },
        evidence: [],
        confidence: patch.confidence ?? 0.9,
        mustClarifications: patch.mustClarifications ?? [],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:01:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      }),
    );
    replyPolicyMock.evaluate.mockReturnValue({
      rolloutMode: "rollout",
      resolutionMode: "PROCESS_DRAFT",
      responseRisk: "OPERATIONAL_SIGNAL",
      targetOwnerRole: null,
      missingContext: [],
      directReplyAllowed: false,
      prohibitedReason: null,
      dialogSummary: "summary",
      managerShouldBeNotified: false,
      needsHumanAction: false,
    });
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
    repositoryMock.updateDraft.mockResolvedValue({
      id: "draft-1",
      companyId: "c1",
      userId: "u1",
      status: "READY_TO_CONFIRM",
      eventType: "FRONT_OFFICE_OBSERVATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: "field-1",
        seasonId: "season-1",
        taskId: "task-1",
      },
      payload: {
        threadKey: "c1:telegram:tg-1",
        messageText: "Работу начали, прикладываю подтверждение",
        classification: "task_process",
        suggestedIntent: "observation",
        channel: "telegram",
        resolutionMode: "PROCESS_DRAFT",
        responseRisk: "OPERATIONAL_SIGNAL",
      },
      evidence: [{ type: "photo", url: "https://files/photo.jpg" }],
      confidence: 0.86,
      mustClarifications: [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:01:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
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

  it("requests clarification instead of leaving consultation draft in manual link state", async () => {
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
    replyPolicyMock.evaluate.mockReturnValue({
      rolloutMode: "rollout",
      resolutionMode: "REQUEST_CLARIFICATION",
      responseRisk: "INSUFFICIENT_CONTEXT",
      targetOwnerRole: "agronomist",
      missingContext: ["FIELD_CONTEXT", "SEASON_CONTEXT"],
      directReplyAllowed: false,
      prohibitedReason: "Недостаточно контекста для безопасного ответа.",
      dialogSummary: "summary",
      managerShouldBeNotified: false,
      needsHumanAction: false,
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
    repositoryMock.updateDraft.mockImplementation(async (_companyId: string, _draftId: string, patch: any) => ({
      id: "draft-2",
      companyId: "c1",
      userId: "u1",
      status: "NEEDS_LINK",
      eventType: "FRONT_OFFICE_CONSULTATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: null,
        seasonId: null,
        taskId: null,
      },
      payload: {
        messageText: "Нужна консультация по текущей ситуации",
        threadKey: "c1:telegram:tg-2",
        classification: "client_request",
        suggestedIntent: "consultation",
        channel: "telegram",
        ...(patch.payload ?? {}),
      },
      evidence: [],
      confidence: 0.9,
      mustClarifications: patch.mustClarifications ?? ["LINK_OBJECT"],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:01:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    }));
    repositoryMock.commitDraft.mockResolvedValue({
      draft: {
        id: "draft-2",
        companyId: "c1",
        userId: "u1",
        status: "COMMITTED",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: null,
          fieldId: null,
          seasonId: null,
          taskId: null,
        },
        payload: {
          messageText: "Нужна консультация по текущей ситуации",
          threadKey: "c1:telegram:tg-2",
          classification: "client_request",
          suggestedIntent: "consultation",
          channel: "telegram",
          resolutionMode: "REQUEST_CLARIFICATION",
          responseRisk: "INSUFFICIENT_CONTEXT",
          replyStatus: "SENT",
          commitResult: {
            kind: "clarification_request",
            id: "draft-2",
            replyStatus: "SENT",
            missingContext: ["FIELD_CONTEXT", "SEASON_CONTEXT"],
          },
        },
        evidence: [],
        confidence: 0.9,
        mustClarifications: ["LINK_OBJECT"],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:02:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      },
      committed: {
        id: "draft-2",
        companyId: "c1",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        committedAt: "2026-03-09T00:02:00.000Z",
        committedBy: "u1",
        provenanceHash: "hash-2",
        payload: {
          resolutionMode: "REQUEST_CLARIFICATION",
          responseRisk: "INSUFFICIENT_CONTEXT",
          replyStatus: "SENT",
          commitResult: {
            kind: "clarification_request",
            id: "draft-2",
            replyStatus: "SENT",
            missingContext: ["FIELD_CONTEXT", "SEASON_CONTEXT"],
          },
        },
        evidence: [],
        anchor: {
          farmRef: null,
          fieldId: null,
          seasonId: null,
          taskId: null,
        },
      },
    });
    clientResponseOrchestratorMock.sendClarification.mockResolvedValue({
      replyStatus: "SENT",
      text: "Уточните поле и сезон.",
    });
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

    expect(clientResponseOrchestratorMock.sendClarification).toHaveBeenCalled();
    expect((result as any).status).toBe("COMMITTED");
    expect((result as any).resolutionMode).toBe("REQUEST_CLARIFICATION");
    expect((result as any).replyStatus).toBe("SENT");
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

  it("auto-replies to safe informational client question through RAI path", async () => {
    agentMock.run.mockResolvedValue({
      data: {
        log: { threadKey: "c1:telegram:tg-auto" },
        classification: {
          classification: "client_request",
          confidence: 0.93,
          threadKey: "c1:telegram:tg-auto",
          targetOwnerRole: "agronomist",
        },
      },
    });
    replyPolicyMock.evaluate.mockReturnValue({
      rolloutMode: "rollout",
      resolutionMode: "AUTO_REPLY",
      responseRisk: "SAFE_INFORMATIONAL",
      targetOwnerRole: "agronomist",
      missingContext: [],
      directReplyAllowed: true,
      prohibitedReason: null,
      dialogSummary: "summary",
      managerShouldBeNotified: false,
      needsHumanAction: false,
    });
    repositoryMock.createDraft.mockImplementation(async (payload: any) => ({
      id: "draft-auto",
      companyId: payload.companyId,
      userId: payload.userId,
      status: payload.status,
      eventType: payload.eventType,
      timestamp: payload.timestamp,
      anchor: {
        farmRef: null,
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
    repositoryMock.updateDraft.mockResolvedValue({
      id: "draft-auto",
      companyId: "c1",
      userId: "u1",
      status: "READY_TO_CONFIRM",
      eventType: "FRONT_OFFICE_CONSULTATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: "field-auto",
        seasonId: "season-auto",
        taskId: null,
      },
      payload: {
        messageText: "Какая сейчас стадия по полю?",
        threadKey: "c1:telegram:tg-auto",
        classification: "client_request",
        suggestedIntent: "consultation",
        channel: "telegram",
        targetOwnerRole: "agronomist",
        resolutionMode: "AUTO_REPLY",
        responseRisk: "SAFE_INFORMATIONAL",
      },
      evidence: [],
      confidence: 0.93,
      mustClarifications: [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:01:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
    repositoryMock.commitDraft.mockResolvedValue({
      draft: {
        id: "draft-auto",
        companyId: "c1",
        userId: "u1",
        status: "COMMITTED",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: null,
          fieldId: "field-auto",
          seasonId: "season-auto",
          taskId: null,
        },
        payload: {
          resolutionMode: "AUTO_REPLY",
          responseRisk: "SAFE_INFORMATIONAL",
          replyStatus: "SENT",
          autoReplyTraceId: "tr-auto",
          commitResult: {
            kind: "auto_reply",
            id: "msg-auto",
            replyStatus: "SENT",
            autoReplyTraceId: "tr-auto",
            targetOwnerRole: "agronomist",
          },
        },
        evidence: [],
        confidence: 0.93,
        mustClarifications: [],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:02:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      },
      committed: {
        id: "draft-auto",
        companyId: "c1",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        committedAt: "2026-03-09T00:02:00.000Z",
        committedBy: "u1",
        provenanceHash: "hash-auto",
        payload: {
          resolutionMode: "AUTO_REPLY",
          responseRisk: "SAFE_INFORMATIONAL",
          replyStatus: "SENT",
          autoReplyTraceId: "tr-auto",
          commitResult: {
            kind: "auto_reply",
            id: "msg-auto",
            replyStatus: "SENT",
            autoReplyTraceId: "tr-auto",
            targetOwnerRole: "agronomist",
          },
        },
        evidence: [],
        anchor: {
          farmRef: null,
          fieldId: "field-auto",
          seasonId: "season-auto",
          taskId: null,
        },
      },
    });
    repositoryMock.findCommitted.mockResolvedValue(null);
    auditMock.log.mockResolvedValue({ id: "audit-auto", createdAt: new Date() });
    clientResponseOrchestratorMock.sendAutoReply.mockResolvedValue({
      replyStatus: "SENT",
      autoReplyTraceId: "tr-auto",
      ownerRole: "agronomist",
      messageId: "msg-auto",
      deliveredText: "Сейчас стадия развития зафиксирована в журнале поля.",
    });

    const result = await service.intakeMessage(
      "c1",
      "trace-auto",
      { id: "u1", role: "USER" },
      {
        channel: "telegram",
        messageText: "Какая сейчас стадия по полю?",
        fieldId: "field-auto",
        seasonId: "season-auto",
      },
    );

    expect(clientResponseOrchestratorMock.sendAutoReply).toHaveBeenCalled();
    expect((result as any).status).toBe("COMMITTED");
    expect((result as any).resolutionMode).toBe("AUTO_REPLY");
    expect((result as any).replyStatus).toBe("SENT");
    expect((result as any).autoReplyTraceId).toBe("tr-auto");
  });

  it("blocks manager from reading unassigned farm thread messages", async () => {
    communicationRepositoryMock.getThreadByKey.mockResolvedValue({
      id: "thread-10",
      threadKey: "c1:telegram:tg-10",
      companyId: "c1",
      channel: "telegram",
      farmAccountId: "farm-10",
      farmNameSnapshot: "Farm 10",
      representativeUserId: "rep-10",
      representativeTelegramId: "90010",
      threadExternalId: "90010",
      dialogExternalId: null,
      senderExternalId: "90010",
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: "Нужна помощь",
      lastMessageAt: "2026-03-09T00:00:00.000Z",
      currentOwnerRole: "crm_agent",
      currentHandoffStatus: null,
    });

    await expect(
      service.listMessagesForViewer(
        "c1",
        { id: "manager-1", role: "MANAGER", accountId: null },
        "c1:telegram:tg-10",
      ),
    ).rejects.toThrow("User manager-1 is not assigned to farm farm-10");
  });

  it("routes manager reply through unified outbound pipeline", async () => {
    communicationRepositoryMock.getThreadByKey.mockResolvedValue({
      id: "thread-r1",
      threadKey: "c1:telegram:tg-reply",
      companyId: "c1",
      channel: "telegram",
      farmAccountId: "farm-r1",
      farmNameSnapshot: "Farm R1",
      representativeUserId: "rep-r1",
      representativeTelegramId: "999001",
      threadExternalId: "999001",
      dialogExternalId: null,
      senderExternalId: "999001",
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: "Нужен ответ",
      lastMessageAt: "2026-03-09T00:00:00.000Z",
      currentOwnerRole: "contracts_agent",
      currentHandoffStatus: "ROUTED",
    });
    communicationRepositoryMock.findAssignment.mockResolvedValue({
      id: "assign-1",
      companyId: "c1",
      userId: "manager-1",
      farmAccountId: "farm-r1",
      status: "ACTIVE",
      priority: 1,
      farmName: "Farm R1",
      userEmail: "manager@example.com",
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });
    outboundServiceMock.sendToThread.mockResolvedValue({
      thread: { threadKey: "c1:telegram:tg-reply" },
      message: {
        id: "msg-reply",
        createdAt: "2026-03-09T00:10:00.000Z",
      },
      delivery: { messageId: "166" },
    });

    const result = await service.replyToThread(
      "c1",
      { id: "manager-1", role: "MANAGER" },
      "c1:telegram:tg-reply",
      "Принято, возвращаюсь с ответом.",
    );

    expect(outboundServiceMock.sendToThread).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        messageText: "Принято, возвращаюсь с ответом.",
        kind: "manager_reply",
        authorType: "back_office_operator",
      }),
    );
    expect((result as any).message.id).toBe("msg-reply");
  });

  it("confirms consultation draft into governed handoff instead of audit-only commit", async () => {
    repositoryMock.getDraft.mockResolvedValue({
      id: "draft-5",
      companyId: "c1",
      userId: "u1",
      status: "READY_TO_CONFIRM",
      eventType: "FRONT_OFFICE_CONSULTATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: "field-5",
        seasonId: "season-5",
        taskId: null,
      },
      payload: {
        suggestedIntent: "consultation",
        messageText: "Нужно завести клиента в CRM и продолжить сопровождение",
        traceId: "trace-5",
        threadKey: "c1:telegram:tg-5",
        channel: "telegram",
        targetOwnerRole: "crm_agent",
      },
      evidence: [],
      confidence: 0.91,
      mustClarifications: [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
    handoffOrchestratorMock.routeDraftHandoff.mockResolvedValue({
      id: "handoff-1",
      threadId: "thread-1",
      draftId: "draft-5",
      targetOwnerRole: "crm_agent",
      status: "ROUTED",
      ownerRoute: "/crm",
      nextAction: "Открыть /crm и забрать handoff в работу.",
      ownerResultRef: null,
      createdAt: "2026-03-09T00:05:00.000Z",
    });
    repositoryMock.updateDraft.mockResolvedValue({
      id: "draft-5",
      companyId: "c1",
      userId: "u1",
      status: "READY_TO_CONFIRM",
      eventType: "FRONT_OFFICE_CONSULTATION",
      timestamp: "2026-03-09T00:00:00.000Z",
      anchor: {
        farmRef: null,
        fieldId: "field-5",
        seasonId: "season-5",
        taskId: null,
      },
      payload: {
        suggestedIntent: "consultation",
        messageText: "Нужно завести клиента в CRM и продолжить сопровождение",
        traceId: "trace-5",
        threadKey: "c1:telegram:tg-5",
        channel: "telegram",
        targetOwnerRole: "crm_agent",
        commitResult: {
          kind: "handoff",
          handoffId: "handoff-1",
          handoffStatus: "ROUTED",
          targetOwnerRole: "crm_agent",
          ownerRoute: "/crm",
        },
      },
      evidence: [],
      confidence: 0.91,
      mustClarifications: [],
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:01:00.000Z",
      expiresAt: "2026-03-16T00:00:00.000Z",
    });
    repositoryMock.commitDraft.mockResolvedValue({
      draft: {
        id: "draft-5",
        companyId: "c1",
        userId: "u1",
        status: "COMMITTED",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        anchor: {
          farmRef: null,
          fieldId: "field-5",
          seasonId: "season-5",
          taskId: null,
        },
        payload: {
          suggestedIntent: "consultation",
          messageText: "Нужно завести клиента в CRM и продолжить сопровождение",
          traceId: "trace-5",
          threadKey: "c1:telegram:tg-5",
          channel: "telegram",
          targetOwnerRole: "crm_agent",
          commitResult: {
            kind: "handoff",
            handoffId: "handoff-1",
            handoffStatus: "ROUTED",
            targetOwnerRole: "crm_agent",
            ownerRoute: "/crm",
          },
        },
        evidence: [],
        confidence: 0.91,
        mustClarifications: [],
        createdAt: "2026-03-09T00:00:00.000Z",
        updatedAt: "2026-03-09T00:02:00.000Z",
        expiresAt: "2026-03-16T00:00:00.000Z",
      },
      committed: {
        id: "draft-5",
        companyId: "c1",
        eventType: "FRONT_OFFICE_CONSULTATION",
        timestamp: "2026-03-09T00:00:00.000Z",
        committedAt: "2026-03-09T00:02:00.000Z",
        committedBy: "u1",
        provenanceHash: "hash-5",
        payload: {
          commitResult: {
            kind: "handoff",
            handoffId: "handoff-1",
            handoffStatus: "ROUTED",
            targetOwnerRole: "crm_agent",
            ownerRoute: "/crm",
          },
        },
        evidence: [],
        anchor: {
          farmRef: null,
          fieldId: "field-5",
          seasonId: "season-5",
          taskId: null,
        },
      },
    });
    auditMock.log.mockResolvedValue({ id: "audit-5", createdAt: new Date() });

    const result = await service.confirmDraft(
      "c1",
      { id: "u1", role: "USER" },
      "draft-5",
    );

    expect(handoffOrchestratorMock.routeDraftHandoff).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        draftId: "draft-5",
        targetOwnerRole: "crm_agent",
        sourceIntent: "consultation",
      }),
    );
    expect((result as any).handoffId).toBe("handoff-1");
    expect((result as any).handoffStatus).toBe("ROUTED");
    expect((result as any).targetOwnerRole).toBe("crm_agent");
  });

  it("returns only bound threads for external front-office user", async () => {
    communicationRepositoryMock.listThreads.mockResolvedValue([
      {
        id: "thread-1",
        threadKey: "c1:telegram:tg-1",
        farmAccountId: "farm-1",
      },
    ]);

    const result = await service.listThreadsForViewer("c1", {
      id: "user-1",
      role: "FRONT_OFFICE_USER",
      accountId: "farm-1",
    });

    expect(communicationRepositoryMock.listThreads).toHaveBeenCalledWith("c1", {
      farmAccountId: "farm-1",
      boundOnly: true,
      take: 200,
    });
    expect(result).toHaveLength(1);
  });

  it("hides drafts and handoffs for external thread view", async () => {
    communicationRepositoryMock.getThreadByKey.mockResolvedValue({
      id: "thread-1",
      threadKey: "c1:telegram:tg-1",
      channel: "telegram",
      companyId: "c1",
      farmAccountId: "farm-1",
      farmNameSnapshot: "Ферма 1",
      representativeUserId: "rep-1",
      representativeTelegramId: "telegram:1001",
      threadExternalId: "telegram:1001",
      dialogExternalId: null,
      senderExternalId: null,
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: "Привет",
      lastMessageAt: "2026-03-09T00:00:00.000Z",
      currentOwnerRole: null,
      currentHandoffStatus: null,
    });
    communicationRepositoryMock.listMessages.mockResolvedValue([
      {
        id: "msg-1",
        threadId: "thread-1",
        companyId: "c1",
        messageText: "Привет",
      },
    ]);

    const result = await service.getThreadForViewer(
      "c1",
      {
        id: "user-1",
        role: "FRONT_OFFICE_USER",
        accountId: "farm-1",
      },
      "c1:telegram:tg-1",
    );

    expect(result.thread.threadKey).toBe("c1:telegram:tg-1");
    expect(result.messages).toHaveLength(1);
    expect(result.drafts).toEqual([]);
    expect(result.handoffs).toEqual([]);
  });

  it("allows external user to reply inside own thread", async () => {
    communicationRepositoryMock.getThreadByKey.mockResolvedValue({
      id: "thread-1",
      threadKey: "c1:telegram:tg-1",
      channel: "telegram",
      companyId: "c1",
      farmAccountId: "farm-1",
      farmNameSnapshot: "Ферма 1",
      representativeUserId: "rep-1",
      representativeTelegramId: "telegram:1001",
      threadExternalId: "telegram:1001",
      dialogExternalId: null,
      senderExternalId: null,
      recipientExternalId: null,
      route: null,
      lastDraftId: null,
      lastMessageDirection: "inbound",
      lastMessagePreview: "Привет",
      lastMessageAt: "2026-03-09T00:00:00.000Z",
      currentOwnerRole: "manager",
      currentHandoffStatus: null,
    });
    outboundServiceMock.sendToThread.mockResolvedValue({
      thread: { id: "thread-1" },
      message: { id: "msg-2" },
      delivery: { ok: true },
    });

    const result = await service.replyToThread(
      "c1",
      {
        id: "user-1",
        role: "FRONT_OFFICE_USER",
        accountId: "farm-1",
      },
      "c1:telegram:tg-1",
      "Подтверждаю данные",
    );

    expect(outboundServiceMock.sendToThread).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        messageText: "Подтверждаю данные",
        actorUserId: "user-1",
        actorUserRole: "FRONT_OFFICE_USER",
      }),
    );
    expect(result.delivery).toEqual({ ok: true });
  });
});
