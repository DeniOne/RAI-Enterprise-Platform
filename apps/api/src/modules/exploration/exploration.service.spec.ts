import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ExplorationCaseStatus, WarRoomStatus } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ExplorationService } from "./exploration.service";

describe("ExplorationService War Room orchestration", () => {
  let service: ExplorationService;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    explorationCase: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    warRoomSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    warRoomDecisionEvent: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prismaMock)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplorationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExplorationService>(ExplorationService);
    jest.clearAllMocks();
  });

  it("opens War Room and switches case status to WAR_ROOM", async () => {
    prismaMock.explorationCase.findFirst.mockResolvedValue({
      id: "case-1",
      status: ExplorationCaseStatus.ACTIVE_EXPLORATION,
    });
    prismaMock.user.findFirst.mockResolvedValue({ id: "user-1" });
    prismaMock.user.count.mockResolvedValue(2);
    prismaMock.warRoomSession.create.mockResolvedValue({
      id: "session-1",
      explorationCaseId: "case-1",
      status: WarRoomStatus.ACTIVE,
    });
    prismaMock.explorationCase.update.mockResolvedValue({
      id: "case-1",
      status: ExplorationCaseStatus.WAR_ROOM,
    });

    const result = await service.openWarRoomSession("company-1", "case-1", {
      facilitatorId: "user-1",
      deadline: "2026-02-25T10:00:00.000Z",
      participants: [
        { userId: "user-1", role: "DECISION_MAKER" },
        { userId: "user-2", role: "EXPERT" },
      ],
    });

    expect(result.id).toBe("session-1");
    expect(prismaMock.explorationCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: { status: ExplorationCaseStatus.WAR_ROOM },
    });
  });

  it("rejects open when participant list has out-of-tenant users", async () => {
    prismaMock.explorationCase.findFirst.mockResolvedValue({
      id: "case-1",
      status: ExplorationCaseStatus.ACTIVE_EXPLORATION,
    });
    prismaMock.user.findFirst.mockResolvedValue({ id: "user-1" });
    prismaMock.user.count.mockResolvedValue(1);

    await expect(
      service.openWarRoomSession("company-1", "case-1", {
        facilitatorId: "user-1",
        deadline: "2026-02-25T10:00:00.000Z",
        participants: [
          { userId: "user-1", role: "DECISION_MAKER" },
          { userId: "user-2", role: "EXPERT" },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects close without resolutionLog", async () => {
    prismaMock.warRoomSession.findFirst.mockResolvedValue({
      id: "session-1",
      explorationCaseId: "case-1",
      participants: [{ userId: "user-1", role: "DECISION_MAKER" }],
      status: WarRoomStatus.ACTIVE,
    });

    await expect(
      service.closeWarRoomSession("company-1", "session-1", {
        resolutionLog: null,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects close when DECISION_MAKER votes are incomplete", async () => {
    prismaMock.warRoomSession.findFirst.mockResolvedValue({
      id: "session-1",
      explorationCaseId: "case-1",
      participants: [
        { userId: "u1", role: "DECISION_MAKER" },
        { userId: "u2", role: "DECISION_MAKER" },
      ],
      status: WarRoomStatus.ACTIVE,
    });
    prismaMock.warRoomDecisionEvent.findMany.mockResolvedValue([
      { participantId: "u1" },
    ]);

    await expect(
      service.closeWarRoomSession("company-1", "session-1", {
        resolutionLog: { outcome: "go" },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("closes War Room and returns case to ACTIVE_EXPLORATION on resolved status", async () => {
    prismaMock.warRoomSession.findFirst.mockResolvedValue({
      id: "session-1",
      explorationCaseId: "case-1",
      participants: [{ userId: "u1", role: "DECISION_MAKER" }],
      status: WarRoomStatus.ACTIVE,
    });
    prismaMock.warRoomDecisionEvent.findMany.mockResolvedValue([
      { participantId: "u1" },
    ]);
    prismaMock.warRoomSession.update.mockResolvedValue({
      id: "session-1",
      status: WarRoomStatus.RESOLVED_WITH_DECISION,
    });
    prismaMock.explorationCase.update.mockResolvedValue({
      id: "case-1",
      status: ExplorationCaseStatus.ACTIVE_EXPLORATION,
    });

    const result = await service.closeWarRoomSession("company-1", "session-1", {
      resolutionLog: { decision: "ship" },
      status: WarRoomStatus.RESOLVED_WITH_DECISION,
    });

    expect(result.status).toBe(WarRoomStatus.RESOLVED_WITH_DECISION);
    expect(prismaMock.explorationCase.update).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: { status: ExplorationCaseStatus.ACTIVE_EXPLORATION },
    });
  });

  it("throws when closing unknown war room session", async () => {
    prismaMock.warRoomSession.findFirst.mockResolvedValue(null);

    await expect(
      service.closeWarRoomSession("company-1", "missing-session", {
        resolutionLog: { result: "n/a" },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

