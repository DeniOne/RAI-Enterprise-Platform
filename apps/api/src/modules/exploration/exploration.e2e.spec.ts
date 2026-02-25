import { ForbiddenException, NotFoundException } from "@nestjs/common";
import {
  ExplorationCaseStatus,
  ExplorationMode,
  ExplorationType,
  SignalSource,
  SignalStatus,
  WarRoomStatus,
} from "@rai/prisma-client";
import { ExplorationService } from "./exploration.service";

function createPrismaMock() {
  const state = {
    users: [
      { id: "u-initiator", companyId: "c1" },
      { id: "u-triage", companyId: "c1" },
      { id: "u-board", companyId: "c1" },
      { id: "u-solver", companyId: "c1" },
      { id: "u-outsider", companyId: "c2" },
    ],
    signals: [] as any[],
    cases: [] as any[],
    warRooms: [] as any[],
    warRoomEvents: [] as any[],
  };

  const prismaMock: any = {
    user: {
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.users.find(
            (u) =>
              (!where?.id || u.id === where.id) &&
              (!where?.companyId || u.companyId === where.companyId),
          ) ?? null
        );
      }),
      count: jest.fn(async ({ where }: any) => {
        const ids: string[] = where?.id?.in ?? [];
        return state.users.filter(
          (u) => u.companyId === where.companyId && ids.includes(u.id),
        ).length;
      }),
    },
    strategicSignal: {
      create: jest.fn(async ({ data }: any) => {
        const row = {
          id: `sig-${state.signals.length + 1}`,
          ...data,
          status: data.status ?? SignalStatus.RAW,
        };
        state.signals.push(row);
        return row;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.signals.find(
            (s) => s.id === where.id && s.companyId === where.companyId,
          ) ?? null
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = state.signals.findIndex((s) => s.id === where.id);
        state.signals[idx] = { ...state.signals[idx], ...data };
        return state.signals[idx];
      }),
    },
    explorationCase: {
      create: jest.fn(async ({ data }: any) => {
        const row = {
          id: `case-${state.cases.length + 1}`,
          ...data,
          status: data.status ?? ExplorationCaseStatus.DRAFT,
        };
        state.cases.push(row);
        return row;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.cases.find(
            (c) =>
              (!where?.id || c.id === where.id) &&
              (!where?.companyId || c.companyId === where.companyId),
          ) ?? null
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = state.cases.findIndex((c) => c.id === where.id);
        state.cases[idx] = { ...state.cases[idx], ...data };
        return state.cases[idx];
      }),
      count: jest.fn(async ({ where }: any) => {
        return state.cases.filter(
          (c) =>
            c.companyId === where.companyId &&
            (!where.status || c.status === where.status) &&
            (!where.explorationMode || c.explorationMode === where.explorationMode),
        ).length;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return state.cases.filter(
          (c) =>
            c.companyId === where.companyId &&
            (!where.status || c.status === where.status) &&
            (!where.explorationMode || c.explorationMode === where.explorationMode),
        );
      }),
    },
    warRoomSession: {
      create: jest.fn(async ({ data }: any) => {
        const row = {
          id: `wr-${state.warRooms.length + 1}`,
          ...data,
          status: data.status ?? WarRoomStatus.ACTIVE,
        };
        state.warRooms.push(row);
        return row;
      }),
      findFirst: jest.fn(async ({ where }: any) => {
        return (
          state.warRooms.find(
            (wr) =>
              (!where?.id || wr.id === where.id) &&
              (!where?.companyId || wr.companyId === where.companyId),
          ) ?? null
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const idx = state.warRooms.findIndex((wr) => wr.id === where.id);
        state.warRooms[idx] = { ...state.warRooms[idx], ...data };
        return state.warRooms[idx];
      }),
    },
    warRoomDecisionEvent: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: `wre-${state.warRoomEvents.length + 1}`, ...data };
        state.warRoomEvents.push(row);
        return row;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return state.warRoomEvents.filter(
          (e) =>
            e.companyId === where.companyId &&
            e.warRoomSessionId === where.warRoomSessionId &&
            (!where.participantId?.in ||
              where.participantId.in.includes(e.participantId)),
        );
      }),
    },
    $transaction: jest.fn(async (arg: any) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }
      return arg(prismaMock);
    }),
    __state: state,
  };

  return prismaMock;
}

describe("Exploration runtime e2e flow", () => {
  it("runs signal -> triage -> war room -> decision -> close -> post-audit archive", async () => {
    const prismaMock = createPrismaMock();
    const service = new ExplorationService(prismaMock);

    const signal = await service.ingestSignal("c1", {
      source: SignalSource.INTERNAL,
      rawPayload: { title: "Market pain" },
      confidenceScore: 80,
      initiatorId: "u-initiator",
    });
    expect(signal.status).toBe(SignalStatus.RAW);

    const explorationCase = await service.triageToCase("c1", signal.id, {
      explorationMode: ExplorationMode.SEU,
      type: ExplorationType.RESEARCH,
      ownerId: "u-solver",
      initiatorId: "u-initiator",
      riskScore: 5,
    });
    expect(explorationCase.status).toBe(ExplorationCaseStatus.DRAFT);

    const transitionedToTriage = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.IN_TRIAGE,
      role: "TRIAGE_OFFICER",
    });
    expect(transitionedToTriage.status).toBe(ExplorationCaseStatus.IN_TRIAGE);

    const transitionedToBoard = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.BOARD_REVIEW,
      role: "TRIAGE_OFFICER",
    });
    expect(transitionedToBoard.status).toBe(ExplorationCaseStatus.BOARD_REVIEW);

    const transitionedToActive = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.ACTIVE_EXPLORATION,
      role: "SEU_BOARD",
    });
    expect(transitionedToActive.status).toBe(ExplorationCaseStatus.ACTIVE_EXPLORATION);

    const warRoom = await service.openWarRoomSession("c1", explorationCase.id, {
      facilitatorId: "u-board",
      deadline: "2026-03-01T10:00:00.000Z",
      participants: [
        { userId: "u-board", role: "DECISION_MAKER" },
        { userId: "u-solver", role: "EXPERT" },
      ],
    });
    expect(warRoom.status).toBe(WarRoomStatus.ACTIVE);

    const decision = await service.appendWarRoomDecisionEvent("c1", warRoom.id, {
      participantId: "u-board",
      decisionData: { vote: "YES", note: "Proceed" },
      signatureHash: "sig-1",
    });
    expect(decision.participantId).toBe("u-board");

    const closed = await service.closeWarRoomSession("c1", warRoom.id, {
      resolutionLog: { result: "approved", by: "u-board" },
      status: WarRoomStatus.RESOLVED_WITH_DECISION,
    });
    expect(closed.status).toBe(WarRoomStatus.RESOLVED_WITH_DECISION);

    const implemented = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.IMPLEMENTED,
      role: "SEU_BOARD",
    });
    expect(implemented.status).toBe(ExplorationCaseStatus.IMPLEMENTED);

    const postAudit = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.POST_AUDIT,
      role: "SEU_BOARD",
    });
    expect(postAudit.status).toBe(ExplorationCaseStatus.POST_AUDIT);

    const archived = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.ARCHIVED,
      role: "SEU_BOARD",
    });
    expect(archived.status).toBe(ExplorationCaseStatus.ARCHIVED);
  });

  it("rejects forbidden transition by role (INITIATOR cannot move IN_TRIAGE -> BOARD_REVIEW)", async () => {
    const prismaMock = createPrismaMock();
    const service = new ExplorationService(prismaMock);

    const signal = await service.ingestSignal("c1", {
      source: SignalSource.INTERNAL,
      rawPayload: { title: "Role gate test" },
      initiatorId: "u-initiator",
    });

    const explorationCase = await service.triageToCase("c1", signal.id, {
      explorationMode: ExplorationMode.CDU,
      type: ExplorationType.PROBLEM,
      ownerId: "u-solver",
      initiatorId: "u-initiator",
    });

    await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.IN_TRIAGE,
      role: "TRIAGE_OFFICER",
    });

    await expect(
      service.transitionCase("c1", explorationCase.id, {
        targetStatus: ExplorationCaseStatus.BOARD_REVIEW,
        role: "INITIATOR",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("rejects cross-tenant facilitator on war room open", async () => {
    const prismaMock = createPrismaMock();
    const service = new ExplorationService(prismaMock);

    const signal = await service.ingestSignal("c1", {
      source: SignalSource.INTERNAL,
      rawPayload: { title: "Tenant gate open test" },
      initiatorId: "u-initiator",
    });

    const explorationCase = await service.triageToCase("c1", signal.id, {
      explorationMode: ExplorationMode.SEU,
      type: ExplorationType.RESEARCH,
      ownerId: "u-solver",
      initiatorId: "u-initiator",
    });

    await expect(
      service.openWarRoomSession("c1", explorationCase.id, {
        facilitatorId: "u-outsider",
        deadline: "2026-03-01T10:00:00.000Z",
        participants: [{ userId: "u-board", role: "DECISION_MAKER" }],
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects cross-tenant participant on war room decision append", async () => {
    const prismaMock = createPrismaMock();
    const service = new ExplorationService(prismaMock);

    const signal = await service.ingestSignal("c1", {
      source: SignalSource.INTERNAL,
      rawPayload: { title: "Tenant gate event test" },
      initiatorId: "u-initiator",
    });

    const explorationCase = await service.triageToCase("c1", signal.id, {
      explorationMode: ExplorationMode.SEU,
      type: ExplorationType.RESEARCH,
      ownerId: "u-solver",
      initiatorId: "u-initiator",
    });

    const transitionedToTriage = await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.IN_TRIAGE,
      role: "TRIAGE_OFFICER",
    });
    expect(transitionedToTriage.status).toBe(ExplorationCaseStatus.IN_TRIAGE);

    await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.BOARD_REVIEW,
      role: "TRIAGE_OFFICER",
    });
    await service.transitionCase("c1", explorationCase.id, {
      targetStatus: ExplorationCaseStatus.ACTIVE_EXPLORATION,
      role: "SEU_BOARD",
    });

    const warRoom = await service.openWarRoomSession("c1", explorationCase.id, {
      facilitatorId: "u-board",
      deadline: "2026-03-01T10:00:00.000Z",
      participants: [{ userId: "u-board", role: "DECISION_MAKER" }],
    });

    await expect(
      service.appendWarRoomDecisionEvent("c1", warRoom.id, {
        participantId: "u-outsider",
        decisionData: { vote: "YES" },
        signatureHash: "sig-outsider",
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
