import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { IncidentOpsService } from "./incident-ops.service";
import {
  IncidentRunbookAction,
  SystemIncidentStatus,
  SystemIncidentType,
} from "@rai/prisma-client";

describe("IncidentOpsService", () => {
  let service: IncidentOpsService;
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const updateManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateMock = jest.fn();
  const prisma = {
    systemIncident: {
      create: createMock,
      findMany: findManyMock,
      updateMany: updateManyMock,
      findFirst: findFirstMock,
      update: updateMock,
    },
    incidentRunbookExecution: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    agentConfigChangeRequest: { findFirst: jest.fn(), update: jest.fn() },
    agentConfiguration: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentOpsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(IncidentOpsService);
  });

  it("logIncident создаёт запись в systemIncident", () => {
    createMock.mockResolvedValue({ id: "inc1" });
    service.logIncident({
      companyId: "c1",
      traceId: "tr1",
      incidentType: SystemIncidentType.PII_LEAK,
      severity: "MEDIUM",
      details: { x: 1 },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        traceId: "tr1",
        incidentType: SystemIncidentType.PII_LEAK,
        status: SystemIncidentStatus.OPEN,
        severity: "MEDIUM",
        details: { x: 1 },
      },
    });
  });

  it("getIncidentsFeed возвращает записи с status", async () => {
    const row = {
      id: "inc1",
      companyId: "c1",
      traceId: "tr1",
      incidentType: SystemIncidentType.PII_LEAK,
      status: SystemIncidentStatus.OPEN,
      severity: "MEDIUM",
      details: {},
      createdAt: new Date("2026-03-05T12:00:00Z"),
      resolvedAt: null as Date | null,
      resolveComment: null as string | null,
    };
    findManyMock.mockResolvedValue([row]);
    const feed = await service.getIncidentsFeed("c1", 10, 0);
    expect(feed[0].status).toBe("OPEN");
  });

  it("resolveIncident обновляет explicit status", async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    await service.resolveIncident("inc1", "c1", "Fixed");
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: "inc1", companyId: "c1" },
      data: {
        status: SystemIncidentStatus.RESOLVED,
        resolvedAt: expect.any(Date),
        resolveComment: "Fixed",
      },
    });
  });

  it("getGovernanceCounters учитывает autonomy/policy incident types отдельно", async () => {
    findManyMock.mockResolvedValue([
      { incidentType: "AUTONOMY_QUARANTINE", details: {}, status: SystemIncidentStatus.OPEN },
      { incidentType: "AUTONOMY_TOOL_FIRST", details: {}, status: SystemIncidentStatus.OPEN },
      { incidentType: "POLICY_BLOCKED_CRITICAL_ACTION", details: {}, status: SystemIncidentStatus.RUNBOOK_EXECUTED },
      { incidentType: "PROMPT_CHANGE_ROLLBACK", details: {}, status: SystemIncidentStatus.RESOLVED },
      { incidentType: "UNKNOWN", details: { subtype: "QUALITY_BS_DRIFT" }, status: SystemIncidentStatus.OPEN },
    ]);
    const counters = await service.getGovernanceCounters("c1");
    expect(counters.autonomyPolicyIncidents).toBe(3);
    expect(counters.promptChangeRollback).toBe(1);
    expect(counters.qualityBsDrift).toBe(1);
    expect(counters.openIncidents).toBe(3);
    expect(counters.resolvedIncidents).toBe(1);
    expect(counters.runbookExecutedIncidents).toBe(1);
  });

  it("executeRunbook выполняет require_human_review и пишет audit evidence", async () => {
    findFirstMock.mockResolvedValue({
      id: "inc1",
      companyId: "c1",
      traceId: "tr1",
      incidentType: SystemIncidentType.AUTONOMY_QUARANTINE,
      status: SystemIncidentStatus.OPEN,
      details: {},
    });
    updateMock.mockResolvedValue({});
    const result = await service.executeRunbook({
      incidentId: "inc1",
      companyId: "c1",
      action: IncidentRunbookAction.REQUIRE_HUMAN_REVIEW,
      comment: "Escalated to human",
    });
    expect(prisma.incidentRunbookExecution.create).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    expect(result.result.fallback).toBe("require_human_review");
  });

  it("executeRunbook rollback_change_request восстанавливает previous config", async () => {
    findFirstMock.mockResolvedValue({
      id: "inc2",
      companyId: "c1",
      traceId: null,
      incidentType: SystemIncidentType.PROMPT_CHANGE_ROLLBACK,
      status: SystemIncidentStatus.OPEN,
      details: { changeRequestId: "chg-1" },
    });
    (prisma.agentConfigChangeRequest.findFirst as jest.Mock).mockResolvedValue({
      id: "chg-1",
      role: "agronomist",
      scope: "TENANT",
      previousConfig: {
        name: "Agronom",
        systemPrompt: "Prev",
        llmModel: "gpt-4o",
        maxTokens: 16000,
        isActive: true,
        capabilities: ["AgroToolsRegistry"],
      },
    });
    (prisma.agentConfiguration.findUnique as jest.Mock).mockResolvedValue({
      id: "cfg-1",
    });
    updateMock.mockResolvedValue({});
    const result = await service.executeRunbook({
      incidentId: "inc2",
      companyId: "c1",
      action: IncidentRunbookAction.ROLLBACK_CHANGE_REQUEST,
      comment: "Rollback config",
    });
    expect(prisma.agentConfiguration.update).toHaveBeenCalled();
    expect(prisma.agentConfigChangeRequest.update).toHaveBeenCalled();
    expect(result.result.fallback).toBe("rollback_change_request");
  });

  it("executeRunbook запрещён для не-OPEN incident lifecycle", async () => {
    findFirstMock.mockResolvedValue({
      id: "inc3",
      companyId: "c1",
      traceId: null,
      incidentType: SystemIncidentType.AUTONOMY_QUARANTINE,
      status: SystemIncidentStatus.RUNBOOK_EXECUTED,
      details: {},
    });

    await expect(
      service.executeRunbook({
        incidentId: "inc3",
        companyId: "c1",
        action: IncidentRunbookAction.REQUIRE_HUMAN_REVIEW,
      }),
    ).rejects.toThrow("Runbook can only be executed for OPEN incidents");
  });

  it("rollback runbook запрещён для incident type вне PROMPT_CHANGE_ROLLBACK", async () => {
    findFirstMock.mockResolvedValue({
      id: "inc4",
      companyId: "c1",
      traceId: "tr4",
      incidentType: SystemIncidentType.AUTONOMY_QUARANTINE,
      status: SystemIncidentStatus.OPEN,
      details: {},
    });

    await expect(
      service.executeRunbook({
        incidentId: "inc4",
        companyId: "c1",
        action: IncidentRunbookAction.ROLLBACK_CHANGE_REQUEST,
      }),
    ).rejects.toThrow(
      "ROLLBACK_CHANGE_REQUEST runbook is allowed only for PROMPT_CHANGE_ROLLBACK incidents",
    );
  });
});
