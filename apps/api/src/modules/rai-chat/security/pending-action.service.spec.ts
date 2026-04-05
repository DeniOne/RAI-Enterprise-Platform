import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PendingActionStatus, UserRole } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { PendingActionService } from "./pending-action.service";

describe("PendingActionService", () => {
  let service: PendingActionService;
  let prisma: PrismaService;

  const companyId = "company-1";
  const traceId = "trace-1";

  const mockCreate = jest.fn();
  const mockFindFirst = jest.fn();
  const mockUpdate = jest.fn();
  const mockUpdateMany = jest.fn();
  const mockFindMany = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingActionService,
        {
          provide: PrismaService,
          useValue: {
            pendingAction: {
              create: mockCreate,
              findFirst: mockFindFirst,
              update: mockUpdate,
              updateMany: mockUpdateMany,
              findMany: mockFindMany,
            },
          },
        },
      ],
    }).compile();
    service = module.get(PendingActionService);
    prisma = module.get(PrismaService);
  });

  it("create returns action with PENDING and expiresAt +1h", async () => {
    const created = {
      id: "pa-1",
      status: PendingActionStatus.PENDING,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      companyId,
      traceId,
      toolName: "emit_alerts",
      riskLevel: "WRITE",
      requestedByUserId: null,
    };
    mockCreate.mockResolvedValue(created);
    const result = await service.create({
      companyId,
      traceId,
      toolName: "emit_alerts",
      payload: { severity: "S3" },
      riskLevel: "WRITE",
    });
    expect(result.status).toBe(PendingActionStatus.PENDING);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId,
        traceId,
        toolName: "emit_alerts",
        riskLevel: "WRITE",
        status: PendingActionStatus.PENDING,
        requestedByUserId: null,
      }),
    });
  });

  it("approveFirst updates to APPROVED_FIRST", async () => {
    const action = { id: "pa-1", status: PendingActionStatus.PENDING, expiresAt: new Date(Date.now() + 3600 * 1000) };
    mockFindFirst.mockResolvedValue(action);
    mockUpdate.mockResolvedValue({ ...action, status: PendingActionStatus.APPROVED_FIRST, approvedFirstBy: "u1" });
    await service.approveFirst("pa-1", companyId, "u1", UserRole.AGRONOMIST);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "pa-1" },
      data: { status: PendingActionStatus.APPROVED_FIRST, approvedFirstBy: "u1" },
    });
  });

  it("approveFinal requires APPROVED_FIRST", async () => {
    mockFindFirst.mockResolvedValue({ id: "pa-1", status: PendingActionStatus.PENDING });
    await expect(service.approveFinal("pa-1", companyId, "u2", UserRole.CEO)).rejects.toThrow(
      "PENDING_ACTION_INVALID_STATE",
    );
  });

  it("approveFinal updates to APPROVED_FINAL", async () => {
    const action = {
      id: "pa-1",
      status: PendingActionStatus.APPROVED_FIRST,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    };
    mockFindFirst.mockResolvedValue(action);
    mockUpdate.mockResolvedValue({ ...action, status: PendingActionStatus.APPROVED_FINAL });
    await service.approveFinal("pa-1", companyId, "u2", UserRole.CEO);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "pa-1" },
      data: { status: PendingActionStatus.APPROVED_FINAL, approvedFinalBy: "u2" },
    });
  });

  it("reject updates to REJECTED", async () => {
    mockFindFirst.mockResolvedValue({ id: "pa-1", status: PendingActionStatus.PENDING });
    mockUpdate.mockResolvedValue({ id: "pa-1", status: PendingActionStatus.REJECTED });
    await service.reject("pa-1", companyId);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "pa-1" },
      data: { status: PendingActionStatus.REJECTED },
    });
  });

  it("getByIdAndCompany throws NotFoundException when not found", async () => {
    mockFindFirst.mockResolvedValue(null);
    await expect(service.approveFirst("missing", companyId, "u1", UserRole.ADMIN)).rejects.toThrow(NotFoundException);
  });

  it("requiresTwoPerson", () => {
    expect(service.requiresTwoPerson("REQUIRES_TWO_PERSON_APPROVAL")).toBe(true);
    expect(service.requiresTwoPerson("REQUIRES_USER_CONFIRMATION")).toBe(false);
  });

  it("requiresConfirmation", () => {
    expect(service.requiresConfirmation("ALLOWED")).toBe(false);
    expect(service.requiresConfirmation("REQUIRES_USER_CONFIRMATION")).toBe(true);
    expect(service.requiresConfirmation("REQUIRES_TWO_PERSON_APPROVAL")).toBe(true);
  });

  it("list syncs expired actions before reading queue", async () => {
    const nowAction = {
      id: "pa-2",
      createdAt: new Date("2026-03-11T10:00:00.000Z"),
      expiresAt: new Date("2026-03-11T11:00:00.000Z"),
      traceId,
      companyId,
      toolName: "generate_tech_map_draft",
      payload: {},
      riskLevel: "WRITE",
      status: PendingActionStatus.PENDING,
      requestedByUserId: "u1",
      approvedFirstBy: null,
      approvedFinalBy: null,
    };
    mockUpdateMany.mockResolvedValue({ count: 1 });
    mockFindMany.mockResolvedValue([nowAction]);

    const result = await service.list(companyId, { limit: 10 });

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        companyId,
        status: {
          in: [PendingActionStatus.PENDING, PendingActionStatus.APPROVED_FIRST],
        },
        expiresAt: { lt: expect.any(Date) },
      },
      data: { status: PendingActionStatus.EXPIRED },
    });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    expect(result).toEqual([nowAction]);
  });

  it("assertApprovedFinalForPlannerResume: проходит при APPROVED_FINAL", async () => {
    mockFindFirst.mockResolvedValue({
      id: "pa-final",
      companyId,
      status: PendingActionStatus.APPROVED_FINAL,
    });
    await expect(
      service.assertApprovedFinalForPlannerResume("pa-final", companyId),
    ).resolves.toBeUndefined();
  });

  it("assertApprovedFinalForPlannerResume: ошибка если не APPROVED_FINAL", async () => {
    mockFindFirst.mockResolvedValue({
      id: "pa-wait",
      companyId,
      status: PendingActionStatus.PENDING,
    });
    await expect(
      service.assertApprovedFinalForPlannerResume("pa-wait", companyId),
    ).rejects.toThrow(/PLANNER_RESUME_PENDING_ACTION_NOT_FINAL/);
  });
});
