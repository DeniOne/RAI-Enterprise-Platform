export type EngramOutcome = "POSITIVE" | "NEGATIVE" | "UNKNOWN";

export interface EngramScore {
  positive: number;
  negative: number;
  unknown: number;
  score: number;
}

export function resolveEngramOutcome(metadata: Record<string, unknown>): EngramOutcome {
  const raw = metadata.outcome ?? metadata.label ?? metadata.result;
  if (typeof raw !== "string") return "UNKNOWN";

  const normalized = raw.toUpperCase();
  if (normalized === "POSITIVE" || normalized === "SUCCESS" || normalized === "GOOD") {
    return "POSITIVE";
  }
  if (normalized === "NEGATIVE" || normalized === "FAIL" || normalized === "BAD") {
    return "NEGATIVE";
  }
  return "UNKNOWN";
}

export function aggregateEngramScore(outcomes: EngramOutcome[]): EngramScore {
  const positive = outcomes.filter((o) => o === "POSITIVE").length;
  const negative = outcomes.filter((o) => o === "NEGATIVE").length;
  const unknown = outcomes.filter((o) => o === "UNKNOWN").length;
  const known = positive + negative;
  const score = known === 0 ? 0 : (positive - negative) / known;

  return {
    positive,
    negative,
    unknown,
    score: Number(score.toFixed(4)),
  };
}
