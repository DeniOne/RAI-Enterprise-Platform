import { TaskStatus } from "@rai/prisma-client";
import { AuditService } from "../../shared/audit/audit.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DeviationService } from "../cmr/deviation.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { FrontOfficeDraftRepository } from "../front-office-draft/front-office-draft.repository";
import { FrontOfficeDraftService } from "../front-office-draft/front-office-draft.service";
import { FrontOfficeAgent } from "../rai-chat/agents/front-office-agent.service";
import { FrontOfficeService } from "./front-office.service";

function createRuntime() {
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
  };

  const prismaMock = {
    field: {
      count: jest.fn(async ({ where }: any) =>
        state.fields.filter((item) => item.companyId === where.companyId).length,
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

  const draftService = new FrontOfficeDraftService(
    prismaMock as unknown as PrismaService,
    auditMock as unknown as AuditService,
    observationMock as unknown as FieldObservationService,
    deviationMock as unknown as DeviationService,
    agentMock as unknown as FrontOfficeAgent,
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

  return { service, state };
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
});
