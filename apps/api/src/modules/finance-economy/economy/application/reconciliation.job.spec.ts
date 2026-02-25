import { ReconciliationJob } from "./reconciliation.job";
import { InvariantMetrics } from "../../../../shared/invariants/invariant-metrics";

describe("ReconciliationJob alert path", () => {
  const build = () => {
    const prisma = {
      economicEvent: {
        findMany: jest.fn(),
      },
      outboxMessage: {
        create: jest.fn(),
      },
    } as any;
    const outbox = {
      createEvent: jest
        .fn()
        .mockReturnValue({ type: "finance.reconciliation.alert", payload: {} }),
    } as any;
    const job = new ReconciliationJob(prisma, outbox);
    return { job, prisma, outbox };
  };

  it("creates outbox alert when event has no ledger entries", async () => {
    const { job, prisma, outbox } = build();
    prisma.economicEvent.findMany
      .mockResolvedValueOnce([
        {
          id: "evt-1",
          companyId: "c1",
          type: "COST_INCURRED",
          createdAt: new Date("2026-02-16T12:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([]);

    const before = InvariantMetrics.snapshot().reconciliation_alerts_total;
    await job.run();
    const after = InvariantMetrics.snapshot().reconciliation_alerts_total;

    expect(after).toBe(before + 1);
    expect(outbox.createEvent).toHaveBeenCalledWith(
      "c1:MISSING_LEDGER_ENTRIES",
      "FinanceReconciliation",
      "finance.reconciliation.alert",
      expect.objectContaining({
        companyId: "c1",
        anomalyType: "MISSING_LEDGER_ENTRIES",
      }),
    );
    expect(prisma.outboxMessage.create).toHaveBeenCalledTimes(1);
  });

  it("creates outbox alert when debit/credit mismatch is detected", async () => {
    const { job, prisma, outbox } = build();
    prisma.economicEvent.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "evt-2",
          companyId: "c1",
          ledgerEntries: [
            { type: "DEBIT", amount: 120 },
            { type: "CREDIT", amount: 100 },
          ],
        },
      ]);

    await job.run();

    expect(outbox.createEvent).toHaveBeenCalledWith(
      "c1:DOUBLE_ENTRY_MISMATCH",
      "FinanceReconciliation",
      "finance.reconciliation.alert",
      expect.objectContaining({
        companyId: "c1",
        anomalyType: "DOUBLE_ENTRY_MISMATCH",
      }),
    );
    expect(prisma.outboxMessage.create).toHaveBeenCalledTimes(1);
  });
});
