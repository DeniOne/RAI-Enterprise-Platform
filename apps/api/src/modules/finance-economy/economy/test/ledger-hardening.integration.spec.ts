import { Test, TestingModule } from "@nestjs/testing";
import { EconomyService } from "../application/economy.service";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import { OutboxService } from "../../../../shared/outbox/outbox.service";
import { FinanceConfigService } from "../../finance/config/finance-config.service";
import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { EconomicEventType, Prisma } from "@rai/prisma-client";

describe("Ledger Architectural Hardening (G1-G4 Verification)", () => {
  const sqlText = (query: unknown): string => {
    if (query && typeof query === "object" && "strings" in (query as any)) {
      return ((query as any).strings as readonly string[]).join("?");
    }
    return String(query);
  };

  let service: EconomyService;
  let prisma: PrismaService;
  let currentSessionTenant = "";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            $executeRaw: jest.fn(async (sql: unknown) => {
              const text = sqlText(sql);
              if (text.includes("set_config('app.current_company_id'")) {
                const values =
                  sql && typeof sql === "object" && "values" in (sql as any)
                    ? ((sql as any).values as unknown[])
                    : [];
                currentSessionTenant =
                  typeof values[0] === "string"
                    ? values[0]
                    : currentSessionTenant;
              }
              return 1;
            }),
            $queryRaw: jest.fn(async (sql: unknown) => {
              if (sqlText(sql).includes("current_setting('app.current_company_id')")) {
                return [{ tenant: currentSessionTenant }];
              }
              return [];
            }),
            tenantState: {
              findUnique: jest.fn(),
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
            economicEvent: { create: jest.fn(), findFirst: jest.fn() },
            ledgerEntry: { createMany: jest.fn(), count: jest.fn().mockResolvedValue(2) },
            currencyPrecision: { findUnique: jest.fn().mockResolvedValue({ scale: 2 }) },
            outboxMessage: { create: jest.fn() },
          },
        },
        {
          provide: OutboxService,
          useValue: {
            createEvent: jest.fn(),
            persistEvent: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: FinanceConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "panicThreshold") return 5;
              if (key === "requireIdempotency") return true;
              if (key === "contractCompatibilityMode") return "strict";
              if (key === "defaultCurrency") return "RUB";
              if (key === "defaultScale") return 2;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentSessionTenant = "";
    ((prisma as any).tenantState.updateMany as jest.Mock).mockResolvedValue({
      count: 1,
    });
  });

  it("G3: Enforces mandatory idempotency (Fail Fast)", async () => {
    await expect(
      service.ingestEvent({
        type: EconomicEventType.COST_INCURRED,
        amount: 100,
        companyId: "tenant-1",
        metadata: {}, // MISSING idempotencyKey
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("G1: Injects RLS context into database session", async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      return await cb(prisma);
    });
    ((prisma as any).tenantState.findUnique as jest.Mock).mockResolvedValue({
      mode: "ACTIVE",
    });
    ((prisma as any).economicEvent.create as jest.Mock).mockResolvedValue({
      id: "evt_123",
      companyId: "tenant-1",
      metadata: { idempotencyKey: "idem_123" },
    });

    await service.ingestEvent({
      type: EconomicEventType.COST_INCURRED,
      amount: 50,
      companyId: "tenant-1",
      metadata: { idempotencyKey: "idem_123" },
    });

    const rawCalls = ((prisma as any).$executeRaw as jest.Mock).mock.calls;
    expect(rawCalls.some((call) =>
      sqlText(call[0]).includes("set_config('app.current_company_id'")
    )).toBe(true);
  });

  it("G2: Triggers Autonomous Panic (READ_ONLY) when Integrity Violation occurs", async () => {
    const integrityError = new Prisma.PrismaClientKnownRequestError(
      "Imbalanced",
      {
        code: "P2002",
        clientVersion: "5.x",
        meta: { db_error_code: "P0001" },
      },
    );

    (prisma.$transaction as jest.Mock).mockRejectedValue(integrityError);
    ((prisma as any).tenantState.findUnique as jest.Mock).mockResolvedValue({
      mode: "ACTIVE",
    });

    await expect(
      service.ingestEvent({
        type: EconomicEventType.COST_INCURRED,
        amount: 100,
        companyId: "tenant-violation",
        metadata: { idempotencyKey: "idem_violation" },
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect((prisma as any).tenantState.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: "tenant-violation" }),
        data: { mode: "READ_ONLY" },
      }),
    );
  });

  it("G1 (Fail-Closed): Blocks ingestion when tenant is HALTED (P0003)", async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      return await cb(prisma);
    });
    ((prisma as any).tenantState.findUnique as jest.Mock).mockResolvedValue({
      mode: "HALTED",
    });

    await expect(
      service.ingestEvent({
        type: EconomicEventType.COST_INCURRED,
        amount: 100,
        companyId: "tenant-halted",
        metadata: { idempotencyKey: "idem_halt" },
      }),
    ).rejects.toThrow(/ОСТАНОВЛЕНА/);
  });

  it("G3: Handles Replay/Duplicate with target check (P2002 replayKey)", async () => {
    const conflictError = new Prisma.PrismaClientKnownRequestError("Conflict", {
      code: "P2002",
      clientVersion: "5.x",
      meta: { target: ["replayKey"] },
    });

    (prisma.$transaction as jest.Mock).mockRejectedValue(conflictError);
    ((prisma as any).economicEvent.findFirst as jest.Mock).mockResolvedValue({
      id: "existing_evt",
    });
    ((prisma as any).ledgerEntry.count as jest.Mock).mockResolvedValue(2);

    const result = await service.ingestEvent({
      type: EconomicEventType.COST_INCURRED,
      amount: 100,
      companyId: "tenant-1",
      metadata: { idempotencyKey: "idem_replay" },
    });

    expect(result).toEqual({ id: "existing_evt" });
  });
});
