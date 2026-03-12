import { AuditService } from "./audit.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { SecretsService } from "../config/secrets.service";
import { AuditNotarizationService } from "./audit-notarization.service";

describe("AuditService", () => {
  let service: AuditService;
  let prisma: {
    $transaction: jest.Mock;
    auditLog: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
  };
  let auditNotarizationService: {
    persistAuditedEvent: jest.Mock;
    findProofByAuditLogId: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (callback: any) =>
        callback({
          auditLog: {
            create: jest.fn().mockResolvedValue(undefined),
          },
          auditNotarizationRecord: {
            findFirst: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(undefined),
          },
          $executeRaw: jest.fn().mockResolvedValue(1),
          $queryRaw: jest.fn().mockResolvedValue([]),
        }),
      ),
      auditLog: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    auditNotarizationService = {
      persistAuditedEvent: jest.fn().mockResolvedValue(undefined),
      findProofByAuditLogId: jest.fn().mockResolvedValue(null),
    };

    service = new AuditService(
      prisma as unknown as PrismaService,
      new SecretsService(
        new ConfigService({
          JWT_SECRET: "jwt-secret-for-tests",
        }),
      ),
      auditNotarizationService as unknown as AuditNotarizationService,
    );
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("persists audit events through create-only contract with tamper-evident metadata", async () => {
    prisma.auditLog.findUniqueOrThrow.mockResolvedValue({
      id: "audit-1",
      action: "USER_LOGIN",
    });

    await service.log({
      action: "USER_LOGIN",
      companyId: "company-1",
      userId: "user-1",
      metadata: { traceId: "trace-1" },
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditNotarizationService.persistAuditedEvent).toHaveBeenCalledTimes(1);
    expect(auditNotarizationService.persistAuditedEvent).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        id: expect.any(String),
        action: "USER_LOGIN",
        companyId: "company-1",
        userId: "user-1",
        metadata: expect.objectContaining({
          traceId: "trace-1",
          _tamperEvident: expect.objectContaining({
            algorithm: "sha256",
            hash: expect.any(String),
            timestamp: expect.any(String),
          }),
        }),
      }),
    );
    expect(prisma.auditLog.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: expect.any(String) },
    });
  });

  it("applies filters and pagination for audit log reads", async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);

    await service.findAll(
      {
        action: "LOGIN",
        userId: "user-1",
        dateFrom: new Date("2026-03-01T00:00:00.000Z"),
        dateTo: new Date("2026-03-12T00:00:00.000Z"),
      },
      { page: 2, limit: 200 },
    );

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
      where: {
        action: { contains: "LOGIN", mode: "insensitive" },
        userId: "user-1",
        createdAt: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lte: new Date("2026-03-12T00:00:00.000Z"),
        },
      },
      skip: 100,
      take: 100,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.auditLog.count).toHaveBeenCalledWith({
      where: {
        action: { contains: "LOGIN", mode: "insensitive" },
        userId: "user-1",
        createdAt: {
          gte: new Date("2026-03-01T00:00:00.000Z"),
          lte: new Date("2026-03-12T00:00:00.000Z"),
        },
      },
    });
  });

  it("returns notarization proof for audit log", async () => {
    auditNotarizationService.findProofByAuditLogId.mockResolvedValue({
      auditLogId: "audit-1",
      chainHash: "chain-1",
    });

    await expect(service.findProofById("audit-1")).resolves.toEqual({
      auditLogId: "audit-1",
      chainHash: "chain-1",
    });
  });
});
