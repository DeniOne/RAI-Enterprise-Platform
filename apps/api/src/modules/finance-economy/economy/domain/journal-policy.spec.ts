import { EconomicEventType } from "@rai/prisma-client";
import {
  assertBalancedPostings,
  resolveJournalPhase,
  resolveSettlementRef,
} from "./journal-policy";

describe("journal-policy", () => {
  it("maps economic event types to journal phases", () => {
    expect(resolveJournalPhase(EconomicEventType.COST_INCURRED)).toBe(
      "ACCRUAL",
    );
    expect(resolveJournalPhase(EconomicEventType.OBLIGATION_SETTLED)).toBe(
      "SETTLEMENT",
    );
    expect(resolveJournalPhase(EconomicEventType.ADJUSTMENT)).toBe(
      "ADJUSTMENT",
    );
  });

  it("resolves settlement ref for settlement events", () => {
    expect(
      resolveSettlementRef(EconomicEventType.OBLIGATION_SETTLED, {
        obligationId: "obl-1",
      }),
    ).toBe("obligation:obl-1");
    expect(
      resolveSettlementRef(EconomicEventType.COST_INCURRED, {
        obligationId: "obl-1",
      }),
    ).toBeNull();
  });

  it("asserts balanced postings", () => {
    expect(() =>
      assertBalancedPostings([
        { type: "DEBIT", amount: 10.1234 },
        { type: "CREDIT", amount: 10.1234 },
      ]),
    ).not.toThrow();

    expect(() =>
      assertBalancedPostings([
        { type: "DEBIT", amount: 10.1234 },
        { type: "CREDIT", amount: 9.1234 },
      ]),
    ).toThrow(/Unbalanced journal postings/);
  });
});
