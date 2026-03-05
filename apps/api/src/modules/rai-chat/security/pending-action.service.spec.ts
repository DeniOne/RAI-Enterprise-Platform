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
});
