import { Test, TestingModule } from "@nestjs/testing";
import { EconomyService } from "../application/economy.service";
import { PrismaService } from "../../../../shared/prisma/prisma.service";
import { OutboxService } from "../../../../shared/outbox/outbox.service";
import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { EconomicEventType, Prisma } from "@rai/prisma-client";

describe("Ledger Architectural Hardening (G1-G4 Verification)", () => {
  let service: EconomyService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomyService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            $executeRawUnsafe: jest.fn(),
            tenantState: { findUnique: jest.fn(), upsert: jest.fn() },
            economicEvent: { create: jest.fn(), findFirst: jest.fn() },
            ledgerEntry: { createMany: jest.fn() },
            outboxMessage: { create: jest.fn() },
          },
        },
        {
          provide: OutboxService,
          useValue: { createEvent: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<EconomyService>(EconomyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining("SET LOCAL app.current_company_id = 'tenant-1'"),
    );
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

    expect((prisma as any).tenantState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "tenant-violation" },
        update: { mode: "READ_ONLY" },
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
    ).rejects.toThrow(/is HALTED/);
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

    const result = await service.ingestEvent({
      type: EconomicEventType.COST_INCURRED,
      amount: 100,
      companyId: "tenant-1",
      metadata: { idempotencyKey: "idem_replay" },
    });

    expect(result).toEqual({ id: "existing_evt" });
  });
});
