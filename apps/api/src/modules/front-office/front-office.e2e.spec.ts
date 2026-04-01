import { TaskStatus } from "@rai/prisma-client";
import { AuditService } from "../../shared/audit/audit.service";
import { FrontOfficeCommunicationRepository } from "../../shared/front-office/front-office-communication.repository";
import { FrontOfficeMetricsService } from "../../shared/front-office/front-office-metrics.service";
import { FrontOfficeThreadingService } from "../../shared/front-office/front-office-threading.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { FrontOfficeDraftRepository } from "../front-office-draft/front-office-draft.repository";
import { FrontOfficeHandoffOrchestrator } from "../front-office-draft/front-office-handoff.orchestrator.service";
import { FrontOfficeDraftService } from "../front-office-draft/front-office-draft.service";
import { FrontOfficeAgent } from "../rai-chat/agents/front-office-agent.service";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";
import { FrontOfficeService } from "./front-office.service";

function createRuntime(options?: {
  decisionSequence?: Array<Record<string, any>>;
}) {
  const state = {
    fields: [{ id: "field-1", companyId: "c1", name: "Поле 1" }],
    seasons: [{ id: "season-1", companyId: "c1", year: 2026 }],
    tasks: [
      {
        id: "task-1",
        companyId: "c1",
        assigneeId: "u1",
        name: "Осмотр поля",
        status: TaskStatus.PENDING,
        fieldId: "field-1",
        seasonId: "season-1",
        field: { id: "field-1", name: "Поле 1" },
        season: { id: "season-1", year: 2026 },
      },
    ],
    deviations: [] as any[],
    observations: [] as any[],
    auditLogs: [] as any[],
    drafts: [] as any[],
    committed: [] as any[],
    threads: [] as any[],
    threadMessages: [] as any[],
    handoffs: [] as any[],
    participantStates: [] as any[],
    users: [
      {
        id: "fo-external-1",
        companyId: "c1",
        telegramId: null,
        accountId: "farm-1",
        account: {
          id: "farm-1",
          name: "Ферма 1",
        },
      },
    ] as any[],
    accounts: [
      {
        id: "farm-1",
        companyId: "c1",
        name: "Ферма 1",
      },
    ] as any[],
  };

  const prismaMock = {
    field: {
      count: jest.fn(async ({ where }: any) =>
        state.fields.filter((item) => item.companyId === where.companyId).length,
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        state.fields.find(
          (item) => item.id === where.id && item.companyId === where.companyId,
        ) ?? null,
      ),
    },
    season: {
      count: jest.fn(async ({ where }: any) =>
        state.seasons.filter((item) => item.companyId === where.companyId).length,
      ),
    },
    task: {
      findMany: jest.fn(async ({ where, take }: any) =>
        state.tasks
          .filter(
            (item) =>
              item.companyId === where.companyId &&
              (!where.assigneeId || item.assigneeId === where.assigneeId),
          )
          .slice(0, take ?? state.tasks.length),
      ),
      findFirst: jest.fn(async ({ where }: any) =>
        state.tasks.find(
          (item) => item.id === where.id && item.companyId === where.companyId,
        ) ?? null,
      ),
    },
    deviationReview: {
      findMany: jest.fn(async ({ where, take }: any) =>
        state.deviations
          .filter((item) => item.companyId === where.companyId)
          .slice(0, take ?? state.deviations.length),
      ),
    },
    auditLog: {
      findMany: jest.fn(async ({ where, take }: any) =>
        state.auditLogs
          .filter((item) => {
            if (item.companyId !== where.companyId) {
              return false;
            }
            if (!where.action) {
              return true;
            }
            if (Array.isArray(where.action?.in)) {
              return where.action.in.includes(item.action);
            }
            return item.action === where.action;
          })
          .slice(0, take ?? state.auditLogs.length),
      ),
    },
    fieldObservation: {
      update: jest.fn(async ({ where, data }: any) => {
        const observation = state.observations.find((item) => item.id === where.id);
        if (observation) {
          Object.assign(observation, data);
        }
        return observation;
      }),
    },
    user: {
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.users.find(
            (item) =>
              item.companyId === where.companyId &&
              (!where.id || item.id === where.id),
          ) ?? null
        );
      }),
    },
    account: {
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.accounts.find(
            (item) =>
              item.companyId === where.companyId &&
              (!where.id || item.id === where.id),
          ) ?? null
        );
      }),
    },
  };

  const auditMock = {
    log: jest.fn(async (payload: any) => {
      const auditLog = {
        id: `audit-${state.auditLogs.length + 1}`,
        createdAt: new Date(`2026-03-09T00:00:${String(state.auditLogs.length).padStart(2, "0")}.000Z`),
        ...payload,
      };
      state.auditLogs.push(auditLog);
      return auditLog;
    }),
  };

  const observationMock = {
    createObservation: jest.fn(async (payload: any) => {
      const observation = {
        id: `obs-${state.observations.length + 1}`,
        createdAt: new Date(`2026-03-09T00:01:${String(state.observations.length).padStart(2, "0")}.000Z`),
        ...payload,
      };
      state.observations.push(observation);
      return observation;
    }),
  };

  const deviationMock = {
    createReview: jest.fn(async (payload: any) => {
      const deviation = {
        id: `dev-${state.deviations.length + 1}`,
        createdAt: new Date(`2026-03-09T00:02:${String(state.deviations.length).padStart(2, "0")}.000Z`),
        status: "DETECTED",
        severity: "HIGH",
        ...payload,
      };
      state.deviations.push(deviation);
      return deviation;
    }),
    findAll: jest.fn(async (companyId: string) => ({
      data: state.deviations.filter((item) => item.companyId === companyId),
      meta: { total: state.deviations.length, page: 1, limit: 100, totalPages: 1 },
    })),
  };

  const agentMock = {
    run: jest.fn(async ({ messageText, channel, threadExternalId }: any) => ({
      data: {
        log: {
          threadKey: `c1:${channel}:${threadExternalId ?? "unknown"}`,
        },
        classification: {
          classification: /консультац/i.test(String(messageText))
            ? "client_request"
            : /срочно|проблем/i.test(String(messageText))
              ? "escalation_signal"
              : "task_process",
          confidence: 0.86,
          threadKey: `c1:${channel}:${threadExternalId ?? "unknown"}`,
        },
      },
    })),
  };
  const decisionQueue = [...(options?.decisionSequence ?? [])];
  const defaultDecision = {
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
  };
  const replyPolicyMock = {
    evaluate: jest.fn(() => decisionQueue.shift() ?? defaultDecision),
  };
  const outboundServiceMock = {
    sendToThread: jest.fn(async (payload: any) => {
      const createdAt = new Date().toISOString();
      const thread = state.threads.find((item) => item.id === payload.thread.id)
        ?? payload.thread;
      const replyStatus = payload.thread.channel === "telegram" ? "SENT" : "SKIPPED";
      const deliveryStatus = replyStatus === "SENT" ? "SENT" : "SKIPPED";

      const message = {
        id: `msg-${state.threadMessages.length + 1}`,
        companyId: payload.companyId,
        threadId: payload.thread.id,
        direction: "outbound",
        messageText: payload.messageText,
        createdAt,
        channel: payload.thread.channel,
        deliveryStatus,
      };
      state.threadMessages.push(message);
      Object.assign(thread, {
        lastMessagePreview: payload.messageText,
        lastMessageDirection: "outbound",
        lastMessageAt: createdAt,
        messageCount: (thread.messageCount ?? 0) + 1,
      });

      return {
        thread,
        message: {
          id: message.id,
          createdAt: message.createdAt,
        },
        delivery: null,
        replyStatus,
      };
    }),
  };
  const clientResponseOrchestratorMock = {
    sendAutoReply: jest.fn().mockResolvedValue({
      replyStatus: "SENT",
      messageId: "auto-1",
      autoReplyTraceId: "auto-trace-1",
      ownerRole: "monitoring",
    }),
    sendClarification: jest.fn().mockResolvedValue({
      replyStatus: "SENT",
      text: "Уточните поле, сезон и задачу.",
    }),
    sendHandoffReceipt: jest.fn().mockResolvedValue({
      replyStatus: "SENT",
      messageId: "receipt-1",
    }),
  };

  const draftRepositoryMock = {
    createDraft: jest.fn(async (payload: any) => {
      const record = {
        id: `draft-${state.drafts.length + 1}`,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      state.drafts.unshift(record);
      return record;
    }),
    getDraft: jest.fn(async (companyId: string, draftId: string) => {
      const draft = state.drafts.find(
        (item) => item.id === draftId && item.companyId === companyId,
      );
      if (!draft) {
        throw new Error("Front-office draft not found");
      }
      return draft;
    }),
    updateDraft: jest.fn(async (companyId: string, draftId: string, patch: any) => {
      const draft = state.drafts.find(
        (item) => item.id === draftId && item.companyId === companyId,
      );
      if (!draft) {
        throw new Error("Front-office draft not found");
      }
      draft.status = patch.status ?? draft.status;
      draft.anchor = {
        farmRef: patch.farmRef !== undefined ? patch.farmRef : draft.anchor.farmRef,
        fieldId: patch.fieldId !== undefined ? patch.fieldId : draft.anchor.fieldId,
        seasonId:
          patch.payload?.seasonId !== undefined
            ? patch.payload.seasonId
            : draft.anchor.seasonId,
        taskId: patch.taskId !== undefined ? patch.taskId : draft.anchor.taskId,
      };
      draft.payload = patch.payload ? { ...draft.payload, ...patch.payload } : draft.payload;
      draft.evidence = patch.evidence ?? draft.evidence;
      draft.confidence = patch.confidence ?? draft.confidence;
      draft.mustClarifications = patch.mustClarifications ?? draft.mustClarifications;
      draft.updatedAt = new Date().toISOString();
      return draft;
    }),
    listDrafts: jest.fn(async (companyId: string, params?: any) =>
      state.drafts.filter(
        (item) =>
          item.companyId === companyId &&
          (!params?.statuses?.length || params.statuses.includes(item.status)),
      ),
    ),
    listCommitted: jest.fn(async (companyId: string) =>
      state.committed.filter((item) => item.companyId === companyId),
    ),
    findCommitted: jest.fn(async (companyId: string, draftId: string) =>
      state.committed.find(
        (item) => item.companyId === companyId && item.id === draftId,
      ) ?? null,
    ),
    commitDraft: jest.fn(async ({ companyId, draftId, committedBy }: any) => {
      const draft = state.drafts.find(
        (item) => item.id === draftId && item.companyId === companyId,
      );
      if (!draft) {
        throw new Error("Front-office draft not found");
      }
      draft.status = "COMMITTED";
      const committed = {
        id: draft.id,
        companyId,
        eventType: draft.eventType,
        timestamp: draft.timestamp,
        committedAt: new Date().toISOString(),
        committedBy,
        provenanceHash: "hash-1",
        payload: draft.payload,
        evidence: draft.evidence,
        anchor: draft.anchor,
      };
      state.committed.unshift(committed);
      return { draft, committed };
    }),
  };

  const communicationRepositoryMock = {
    upsertThread: jest.fn(async (payload: any) => {
      const existing = state.threads.find(
        (item) => item.companyId === payload.companyId && item.threadKey === payload.threadKey,
      );
      if (existing) {
        Object.assign(existing, {
          channel: payload.channel ?? existing.channel,
          farmAccountId:
            payload.farmAccountId !== undefined
              ? payload.farmAccountId
              : existing.farmAccountId,
          farmNameSnapshot:
            payload.farmNameSnapshot !== undefined
              ? payload.farmNameSnapshot
              : existing.farmNameSnapshot,
          representativeUserId:
            payload.representativeUserId !== undefined
              ? payload.representativeUserId
              : existing.representativeUserId,
          representativeTelegramId:
            payload.representativeTelegramId !== undefined
              ? payload.representativeTelegramId
              : existing.representativeTelegramId,
          currentClassification:
            payload.currentClassification !== undefined
              ? payload.currentClassification
              : existing.currentClassification,
          currentOwnerRole:
            payload.currentOwnerRole !== undefined
              ? payload.currentOwnerRole
              : existing.currentOwnerRole,
          currentHandoffStatus:
            payload.currentHandoffStatus !== undefined
              ? payload.currentHandoffStatus
              : existing.currentHandoffStatus,
          lastDraftId:
            payload.lastDraftId !== undefined ? payload.lastDraftId : existing.lastDraftId,
          lastMessagePreview:
            payload.lastMessagePreview !== undefined
              ? payload.lastMessagePreview
              : existing.lastMessagePreview,
          lastMessageDirection:
            payload.lastMessageDirection !== undefined
              ? payload.lastMessageDirection
              : existing.lastMessageDirection,
          lastMessageAt:
            payload.lastMessageAt !== undefined
              ? payload.lastMessageAt
              : existing.lastMessageAt,
          messageCount:
            typeof payload.messageCountIncrement === "number"
              ? (existing.messageCount ?? 0) + payload.messageCountIncrement
              : existing.messageCount,
        });
        return existing;
      }
      const thread = {
        id: `thread-${state.threads.length + 1}`,
        companyId: payload.companyId,
        threadKey: payload.threadKey,
        channel: payload.channel,
        farmAccountId: payload.farmAccountId ?? null,
        farmNameSnapshot: payload.farmNameSnapshot ?? null,
        representativeUserId: payload.representativeUserId ?? null,
        representativeTelegramId: payload.representativeTelegramId ?? null,
        currentClassification: payload.currentClassification ?? null,
        currentOwnerRole: payload.currentOwnerRole ?? null,
        currentHandoffStatus: payload.currentHandoffStatus ?? null,
        lastDraftId: payload.lastDraftId ?? null,
        lastMessagePreview: payload.lastMessagePreview ?? null,
        lastMessageDirection: payload.lastMessageDirection ?? null,
        lastMessageAt: payload.lastMessageAt ?? null,
        messageCount: payload.messageCountIncrement ?? 0,
      };
      state.threads.push(thread);
      return thread;
    }),
    createMessage: jest.fn(async (payload: any) => {
      const message = {
        id: `msg-${state.threadMessages.length + 1}`,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      state.threadMessages.push(message);
      return message;
    }),
    getThreadByKey: jest.fn(async (companyId: string, threadKey: string) => {
      return state.threads.find(
        (item) => item.companyId === companyId && item.threadKey === threadKey,
      );
    }),
    getThreadById: jest.fn(async (companyId: string, threadId: string) => {
      return state.threads.find(
        (item) => item.companyId === companyId && item.id === threadId,
      );
    }),
    listThreads: jest.fn(async (companyId: string, options?: any) =>
      state.threads.filter((item) => {
        if (item.companyId !== companyId) {
          return false;
        }
        if (options?.farmAccountId && item.farmAccountId !== options.farmAccountId) {
          return false;
        }
        return true;
      }),
    ),
    listMessages: jest.fn(async (companyId: string, threadId: string, options?: any) => {
      const base = state.threadMessages.filter(
        (item) => item.companyId === companyId && item.threadId === threadId,
      );
      if (!options?.afterId) {
        return base;
      }
      const anchorIndex = base.findIndex((item) => item.id === options.afterId);
      if (anchorIndex < 0) {
        return [];
      }
      const sliced = base.slice(anchorIndex + 1);
      if (typeof options.limit === "number" && options.limit > 0) {
        return sliced.slice(0, options.limit);
      }
      return sliced;
    }),
    listMessagesForThreads: jest.fn(async (companyId: string, threadIds: string[]) =>
      state.threadMessages.filter(
        (item) => item.companyId === companyId && threadIds.includes(item.threadId),
      ),
    ),
    upsertParticipantState: jest.fn(async (payload: any) => {
      const existing = state.participantStates.find(
        (item) =>
          item.companyId === payload.companyId &&
          item.threadId === payload.threadId &&
          item.userId === payload.userId,
      );
      if (existing) {
        Object.assign(existing, {
          lastReadMessageId: payload.lastReadMessageId ?? null,
          lastReadAt: payload.lastReadAt ?? null,
        });
        return existing;
      }
      const created = {
        id: `state-${state.participantStates.length + 1}`,
        companyId: payload.companyId,
        threadId: payload.threadId,
        userId: payload.userId,
        lastReadMessageId: payload.lastReadMessageId ?? null,
        lastReadAt: payload.lastReadAt ?? null,
      };
      state.participantStates.push(created);
      return created;
    }),
    listParticipantStates: jest.fn(async (companyId: string, userId: string, threadIds: string[]) =>
      state.participantStates.filter(
        (item) =>
          item.companyId === companyId &&
          item.userId === userId &&
          threadIds.includes(item.threadId),
      ),
    ),
    createHandoff: jest.fn(async (payload: any) => {
      const handoff = {
        id: `handoff-${state.handoffs.length + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...payload,
      };
      state.handoffs.push(handoff);
      return handoff;
    }),
    updateHandoff: jest.fn(async (_companyId: string, handoffId: string, patch: any) => {
      const handoff = state.handoffs.find((item) => item.id === handoffId);
      Object.assign(handoff, patch);
      return handoff;
    }),
    getHandoff: jest.fn(async (companyId: string, handoffId: string) =>
      state.handoffs.find((item) => item.companyId === companyId && item.id === handoffId),
    ),
    listHandoffs: jest.fn(async (companyId: string) =>
      state.handoffs.filter((item) => item.companyId === companyId),
    ),
  };
  const telegramNotificationMock = {
    sendFrontOfficeReply: jest.fn(async () => ({ success: true, messageId: "m-1" })),
    notifyFrontOfficeThread: jest.fn(async () => ({ success: true })),
  };
  const metrics = new FrontOfficeMetricsService();

  const handoffOrchestrator = new FrontOfficeHandoffOrchestrator(
    auditMock as unknown as AuditService,
    communicationRepositoryMock as unknown as FrontOfficeCommunicationRepository,
    metrics,
  );
  const threadingService = new FrontOfficeThreadingService(
    prismaMock as unknown as PrismaService,
    communicationRepositoryMock as unknown as FrontOfficeCommunicationRepository,
    outboundServiceMock as any,
    telegramNotificationMock as unknown as TelegramNotificationService,
  );

  const draftService = new FrontOfficeDraftService(
    prismaMock as unknown as PrismaService,
    auditMock as unknown as AuditService,
    observationMock as unknown as FieldObservationService,
    deviationMock as unknown as DeviationService,
    agentMock as unknown as FrontOfficeAgent,
    communicationRepositoryMock as unknown as FrontOfficeCommunicationRepository,
    metrics,
    threadingService,
    replyPolicyMock as any,
    clientResponseOrchestratorMock as any,
    handoffOrchestrator,
    draftRepositoryMock as unknown as FrontOfficeDraftRepository,
  );

  const service = new FrontOfficeService(
    prismaMock as unknown as PrismaService,
    auditMock as unknown as AuditService,
    observationMock as unknown as FieldObservationService,
    deviationMock as unknown as DeviationService,
    agentMock as unknown as FrontOfficeAgent,
    draftService,
  );

  return { service, state, metrics };
}

describe("FrontOffice runtime e2e flow", () => {
  it("runs intake -> queues -> confirm -> committed draft", async () => {
    const { service, state } = createRuntime();

    const initialOverview = await service.getOverview("c1", "u1");
    expect(initialOverview.counts.fields).toBe(1);
    expect(initialOverview.counts.seasons).toBe(1);
    expect(initialOverview.tasks).toHaveLength(1);

    const intake = await service.intakeMessage(
      "c1",
      "trace-1",
      { id: "u1", role: "USER" },
      {
        channel: "telegram",
        threadExternalId: "tg-1",
        messageText: "Работа выполнена, прикладываю фото",
        taskId: "task-1",
        photoUrl: "https://files/proof.jpg",
        coordinates: { lat: 51.5, lng: 39.2 },
      },
    );

    expect((intake as any).status).toBe("DRAFT_RECORDED");
    expect((intake as any).suggestedIntent).toBe("observation");

    const queues = await service.getQueues("c1");
    expect(queues.counts.readyToConfirm).toBe(1);

    const confirmed = await service.confirmDraft(
      "c1",
      { id: "u1", role: "USER" },
      (intake as any).draftId,
    );

    expect((confirmed as any).status).toBe("COMMITTED");
    expect((confirmed as any).commitResult).toEqual(
      expect.objectContaining({ kind: "observation", id: "obs-1" }),
    );
    expect(state.observations).toHaveLength(1);
    expect(state.committed).toHaveLength(1);

    const draft = await service.getDraft("c1", (intake as any).draftId);
    expect((draft as any).status).toBe("COMMITTED");

    const thread = await service.getThread("c1", "c1:telegram:tg-1");
    expect(thread.drafts).toHaveLength(1);
  });

  it("runs telegram ingress -> clarification -> fix/link -> confirm -> handoff", async () => {
    const { service, state, metrics } = createRuntime({
      decisionSequence: [
        {
          rolloutMode: "rollout",
          resolutionMode: "REQUEST_CLARIFICATION",
          responseRisk: "INSUFFICIENT_CONTEXT",
          targetOwnerRole: "crm_agent",
          missingContext: ["LINK_OBJECT"],
          directReplyAllowed: false,
          prohibitedReason: "Недостаточно контекста.",
          dialogSummary: "Нужна привязка объекта",
          managerShouldBeNotified: false,
          needsHumanAction: false,
        },
        {
          rolloutMode: "rollout",
          resolutionMode: "PROCESS_DRAFT",
          responseRisk: "RESPONSIBLE_ACTION",
          targetOwnerRole: "crm_agent",
          missingContext: ["LINK_OBJECT"],
          directReplyAllowed: false,
          prohibitedReason: null,
          dialogSummary: "Запрос на консультацию после уточнения",
          managerShouldBeNotified: false,
          needsHumanAction: false,
        },
      ],
    });

    const firstIngress = await service.intakeMessage(
      "c1",
      "trace-clarify-1",
      { id: "u-fo-1", role: "FRONT_OFFICE_USER" },
      {
        channel: "telegram",
        threadExternalId: "tg-clarify",
        messageText: "Подскажите, нужна консультация",
      },
    );

    expect((firstIngress as any).resolutionMode).toBe("REQUEST_CLARIFICATION");
    expect((firstIngress as any).replyStatus).toBe("SENT");
    expect((firstIngress as any).commitResult).toEqual(
      expect.objectContaining({ kind: "clarification_request" }),
    );

    const secondIngress = await service.intakeMessage(
      "c1",
      "trace-clarify-2",
      { id: "u-fo-1", role: "FRONT_OFFICE_USER" },
      {
        channel: "telegram",
        threadExternalId: "tg-clarify",
        messageText: "Нужна консультация по контрагенту и договору",
      },
    );

    expect((secondIngress as any).status).toBe("DRAFT_RECORDED");
    expect((secondIngress as any).mustClarifications).toContain("LINK_OBJECT");

    const fixed = await service.fixDraft(
      "c1",
      "trace-fix-1",
      { id: "u-fo-1", role: "FRONT_OFFICE_USER" },
      (secondIngress as any).draftId,
      {
        messageText: "Нужна консультация по договору и реквизитам",
      },
    );
    expect((fixed as any).status).toBe("DRAFT_RECORDED");

    const linked = await service.linkDraft(
      "c1",
      "u-fo-1",
      (secondIngress as any).draftId,
      {
        fieldId: "field-1",
        seasonId: "season-1",
        taskId: "task-1",
      },
    );
    expect((linked as any).anchor.fieldId).toBe("field-1");

    const confirmed = await service.confirmDraft(
      "c1",
      { id: "u-fo-1", role: "FRONT_OFFICE_USER" },
      (secondIngress as any).draftId,
    );

    expect((confirmed as any).status).toBe("COMMITTED");
    expect((confirmed as any).commitResult).toEqual(
      expect.objectContaining({
        kind: "handoff",
        handoffStatus: "ROUTED",
      }),
    );
    expect(state.handoffs).toHaveLength(1);

    const metricsSnapshot = await service.getMetrics("c1");
    expect(metricsSnapshot.outcomes.REQUEST_CLARIFICATION).toBe(1);
    expect(metricsSnapshot.outcomes.PROCESS_DRAFT).toBe(1);
    expect(metricsSnapshot.clarification.maxDepth).toBe(1);
    expect(metricsSnapshot.handoff.createdTotal).toBe(1);
    expect(metricsSnapshot.delivery.repliesSentTotal).toBeGreaterThanOrEqual(1);
    expect(metrics.snapshot("c1").alerts).toBeDefined();
  });

  it("runs web_chat ingress -> viewer reply -> polling cursor -> read marker", async () => {
    const { service } = createRuntime();
    const viewer = {
      id: "fo-external-1",
      role: "FRONT_OFFICE_USER",
      accountId: "farm-1",
    };

    const intake = await service.intakeMessageForViewer("c1", viewer, {
      messageText: "Нужна консультация по документам",
      threadExternalId: "web-dialog-1",
    });
    expect((intake as any).status).toBe("DRAFT_RECORDED");

    const threads = await service.listThreadsForViewer("c1", viewer);
    expect(threads.length).toBeGreaterThan(0);
    const threadKey = threads[0].threadKey;

    const initialMessages = await service.listMessagesForViewer(
      "c1",
      viewer,
      threadKey,
    );
    expect(initialMessages.some((message: any) => message.direction === "inbound")).toBe(
      true,
    );

    const reply = await service.replyToThread(
      "c1",
      viewer,
      threadKey,
      "Ответ оператора во внешний контур",
    );
    expect((reply as any).channel).toBe("web_chat");
    expect((reply as any).deliveryStatus).toBe("SKIPPED");

    const polled = await service.listMessagesForViewer(
      "c1",
      viewer,
      threadKey,
      {
        afterId: initialMessages.at(-1)?.id,
        limit: 20,
      },
    );
    expect(polled).toHaveLength(1);
    expect(polled[0]).toMatchObject({
      direction: "outbound",
      deliveryStatus: "SKIPPED",
    });

    const readState = await service.markThreadRead(
      "c1",
      viewer,
      threadKey,
      polled[0].id,
    );
    expect((readState as any).lastReadMessageId).toBe(polled[0].id);
  });
});
