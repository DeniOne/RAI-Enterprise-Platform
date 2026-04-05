import type { BranchVerdict } from "./branch-trust.types";

/** Подмножество полей `TruthfulnessAccounting`, достаточное для выбора вердикта. */
export interface TruthfulnessVerdictAccounting {
  total: number;
  verified: number;
  unverified: number;
  invalid: number;
}

/**
 * Детерминированное отображение счётчиков claim-статусов → `BranchVerdict`.
 * Используется `TruthfulnessEngineService` и покрыто `branch-verdict-rules.spec.ts` (без сети).
 */
export function resolveRecommendedVerdictFromTruthfulnessAccounting(
  accounting: TruthfulnessVerdictAccounting,
): BranchVerdict {
  if (accounting.total === 0) {
    return "UNVERIFIED";
  }
  if (accounting.verified === accounting.total) {
    return "VERIFIED";
  }
  if (accounting.invalid > 0 && accounting.verified > 0) {
    return "CONFLICTED";
  }
  if (accounting.invalid === accounting.total) {
    return "REJECTED";
  }
  if (accounting.unverified === accounting.total) {
    return "UNVERIFIED";
  }
  if (accounting.verified > 0 && accounting.unverified > 0) {
    return "PARTIAL";
  }
  if (accounting.invalid > 0 && accounting.unverified > 0) {
    return "UNVERIFIED";
  }
  return "PARTIAL";
}

const ZERO_COUNTS: Record<BranchVerdict, number> = {
  VERIFIED: 0,
  PARTIAL: 0,
  UNVERIFIED: 0,
  CONFLICTED: 0,
  REJECTED: 0,
};

/**
 * Агрегация вердиктов веток для summary (как в `ResponseComposer`).
 */
export function resolveOverallBranchVerdictFromCounts(
  counts: Record<BranchVerdict, number>,
): BranchVerdict {
  const c = { ...ZERO_COUNTS, ...counts };
  const hasVerified = c.VERIFIED > 0;
  const hasMixedCoverage =
    c.PARTIAL + c.UNVERIFIED + c.REJECTED > 0;

  if (c.CONFLICTED > 0) {
    return "CONFLICTED";
  }
  if (hasVerified && hasMixedCoverage) {
    return "PARTIAL";
  }
  if (c.PARTIAL > 0) {
    return "PARTIAL";
  }
  if (c.REJECTED > 0 && c.VERIFIED === 0) {
    return "REJECTED";
  }
  if (c.UNVERIFIED > 0) {
    return "UNVERIFIED";
  }
  return "VERIFIED";
}
