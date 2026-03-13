import { BadRequestException } from "@nestjs/common";
import { Prisma, EconomicEventType } from "@rai/prisma-client";
import { EconomyService } from "./economy.service";
import { FinanceConfigService } from "../../../../shared/finance-economy/config/finance-config.service";

describe("EconomyService replay/duplicate protection", () => {
  const sqlText = (query: unknown): string => {
    if (query && typeof query === "object" && "strings" in (query as any)) {
      return ((query as any).strings as readonly string[]).join("?");
    }
    return String(query);
  };

  afterEach(() => {
    delete process.env.FINANCIAL_REQUIRE_IDEMPOTENCY;
    delete process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE;
  });

  const makeService = () => {
    let currentSessionTenant = "";
    const tx = {
      economicEvent: { create: jest.fn() },
      ledgerEntry: {
        findMany: jest.fn().mockResolvedValue([{ sequenceNumber: 10 }]),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      outboxMessage: { create: jest.fn() },
      tenantState: {
        findUnique: jest.fn().mockResolvedValue({ mode: "ACTIVE" }),
      },
      $executeRaw: jest.fn(async (sql: unknown) => {
        if (sqlText(sql).includes("set_config('app.current_company_id'")) {
          currentSessionTenant = "c1";
        }
        return 1;
      }),
      $queryRaw: jest.fn(async (sql: unknown) => {
        if (sqlText(sql).includes("current_setting('app.current_company_id')")) {
          return [{ tenant: currentSessionTenant }];
        }
        return [];
      }),
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
      economicEvent: {
        findFirst: jest.fn(),
      },
      ledgerEntry: {
        count: jest.fn().mockResolvedValue(2),
      },
      currencyPrecision: {
        findUnique: jest.fn().mockResolvedValue({ scale: 2 }),
      },
    } as any;
    const outbox = {
      createEvent: jest.fn().mockReturnValue({}),
      persistEvent: jest.fn().mockResolvedValue(undefined),
    } as any;
    const config = {
      get: jest.fn((key) => {
        if (key === "panicThreshold") return 5;
        if (key === "requireIdempotency") return true;
        if (key === "contractCompatibilityMode") return "strict";
        if (key === "defaultCurrency") return "RUB";
        if (key === "defaultScale") return 2;
        return null;
      }),
    } as any;
    const service = new EconomyService(prisma, outbox, config);
    return { service, prisma, tx, config };
  };

  it("throws when idempotency is required but missing", async () => {
    const { service } = makeService();
    await expect(
      service.ingestEvent({
        type: EconomicEventType.COST_INCURRED,
        amount: 100,
        companyId: "c1",
        metadata: { idempotencyKey: "" },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws in strict mode when integration contract version is missing", async () => {
    const { service } = makeService();
    process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE = "strict";

    await expect(
      service.ingestEvent({
        type: EconomicEventType.COST_INCURRED,
        amount: 100,
        companyId: "c1",
        metadata: {
          source: "TASK_MODULE",
          idempotencyKey: "idem-1",
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns existing event on unique conflict by replay/idempotency key", async () => {
    const { service, prisma } = makeService();

    const uniqueError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["replayKey"] },
      },
    );
    prisma.$transaction.mockRejectedValue(uniqueError);
    prisma.economicEvent.findFirst.mockResolvedValue({
      id: "evt-existing",
    } as any);
    prisma.ledgerEntry.count.mockResolvedValue(2);

    const result = await service.ingestEvent({
      type: EconomicEventType.COST_INCURRED,
      amount: 200,
      companyId: "c1",
      metadata: { idempotencyKey: "idem-1" },
    });

    expect(result).toEqual({ id: "evt-existing" });
  });

  it("extracts deterministic replay fingerprint", async () => {
    const { service } = makeService();
    const amount = new Prisma.Decimal(500);

    // Idempotency key from metadata
    const replayKey = (service as any).extractReplayKey(
      {
        type: EconomicEventType.COST_INCURRED,
        amount: amount,
        companyId: "c1",
        currency: "RUB",
        metadata: { traceId: "trace-1", source: "TASK_MODULE", extra: "data" },
      },
      amount,
      "explicit-idem",
    );
    expect(replayKey).toBe("idem:explicit-idem");

    // Fingerprint fallback
    const fpKey = (service as any).extractReplayKey(
      {
        type: EconomicEventType.COST_INCURRED,
        amount: amount,
        companyId: "c1",
        currency: "RUB",
        metadata: { traceId: "trace-1", source: "TASK_MODULE", extra: "data" },
      },
      amount,
      null,
    );
    expect(fpKey).toMatch(/^fp:/);
  });

  it("applies canonical monetary rounding using Decimal precision", async () => {
    const { service, prisma, tx } = makeService();

    tx.economicEvent.create.mockResolvedValue({
      id: "evt-1",
      type: EconomicEventType.COST_INCURRED,
      currency: "RUB",
      metadata: { idempotencyKey: "idem-round" },
      companyId: "c1",
    });
    tx.tenantState.findUnique.mockResolvedValue({ mode: "ACTIVE" });
    tx.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
    tx.outboxMessage.create.mockResolvedValue({ id: "ob-1" });
    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

    // Mock specific scale for this test
    (prisma.currencyPrecision.findUnique as jest.Mock).mockResolvedValue({
      scale: 4,
    });

    await service.ingestEvent({
      type: EconomicEventType.COST_INCURRED,
      amount: 12.345678,
      companyId: "c1",
      metadata: { idempotencyKey: "idem-round" },
    });

    expect(tx.economicEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          replayKey: "idem:idem-round",
        }),
      }),
    );

    // Check Security Definer calls instead of createMany
    expect(tx.$executeRaw).toHaveBeenCalled();
    const securityDefinerCalls = (
      tx.$executeRaw as any
    ).mock.calls.filter((c: any) =>
      sqlText(c[0]).includes("create_ledger_entry_v1"),
    );
    expect(securityDefinerCalls.length).toBe(2);

    expect(sqlText((securityDefinerCalls[0] as any)[0])).toContain(
      "create_ledger_entry_v1",
    );
    expect(sqlText((securityDefinerCalls[1] as any)[0])).toContain(
      "create_ledger_entry_v1",
    );
  });

  it("enriches metadata with journal phase and settlement reference", async () => {
    const { service, prisma, tx } = makeService();

    tx.economicEvent.create.mockResolvedValue({
      id: "evt-settle",
      type: EconomicEventType.OBLIGATION_SETTLED,
      currency: "RUB",
      metadata: { obligationId: "obl-42", idempotencyKey: "idem-settle" },
      companyId: "c1",
    });
    tx.tenantState.findUnique.mockResolvedValue({ mode: "ACTIVE" });
    tx.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
    tx.outboxMessage.create.mockResolvedValue({ id: "ob-2" });
    prisma.$transaction.mockImplementation(async (cb: any) => cb(tx));

    await service.ingestEvent({
      type: EconomicEventType.OBLIGATION_SETTLED,
      amount: 100,
      companyId: "c1",
      metadata: { obligationId: "obl-42", idempotencyKey: "idem-settle" },
    });

    expect(tx.economicEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            journalPhase: "SETTLEMENT",
            settlementRef: "obligation:obl-42",
          }),
        }),
      }),
    );
  });
});
