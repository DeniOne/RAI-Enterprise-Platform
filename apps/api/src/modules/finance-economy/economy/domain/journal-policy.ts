import { EconomicEventType } from "@rai/prisma-client";
import { roundMoney } from "../../finance/domain/policies/monetary-rounding.policy";

export type JournalPhase =
  | "ACCRUAL"
  | "SETTLEMENT"
  | "ADJUSTMENT"
  | "BOOTSTRAP"
  | "OTHER";

export interface JournalPosting {
  type: "DEBIT" | "CREDIT";
  amount: number;
}

export function resolveJournalPhase(type: EconomicEventType): JournalPhase {
  switch (type) {
    case EconomicEventType.COST_INCURRED:
    case EconomicEventType.REVENUE_RECOGNIZED:
    case EconomicEventType.OBLIGATION_CREATED:
    case EconomicEventType.RESERVE_ALLOCATED:
      return "ACCRUAL";
    case EconomicEventType.OBLIGATION_SETTLED:
      return "SETTLEMENT";
    case EconomicEventType.ADJUSTMENT:
      return "ADJUSTMENT";
    case EconomicEventType.BOOTSTRAP:
      return "BOOTSTRAP";
    default:
      return "OTHER";
  }
}

export function resolveSettlementRef(
  type: EconomicEventType,
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (type !== EconomicEventType.OBLIGATION_SETTLED) {
    return null;
  }
  const direct = metadata?.settlementRef;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct.trim();
  }
  const obligation = metadata?.obligationId;
  if (typeof obligation === "string" && obligation.trim().length > 0) {
    return `obligation:${obligation.trim()}`;
  }
  return null;
}

export function assertBalancedPostings(postings: JournalPosting[]): void {
  let debit = 0;
  let credit = 0;
  for (const p of postings) {
    const value = roundMoney(p.amount);
    if (p.type === "DEBIT") debit += value;
    if (p.type === "CREDIT") credit += value;
  }
  const delta = roundMoney(debit - credit);
  if (Math.abs(delta) > 0) {
    throw new Error(
      `Unbalanced journal postings: debit=${debit}, credit=${credit}, delta=${delta}`,
    );
  }
}
