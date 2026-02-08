import { aggregateEngramScore, resolveEngramOutcome } from "./engram-rules";

describe("engram-rules", () => {
  it("должен определять outcome по metadata", () => {
    expect(resolveEngramOutcome({ outcome: "POSITIVE" })).toBe("POSITIVE");
    expect(resolveEngramOutcome({ label: "negative" })).toBe("NEGATIVE");
    expect(resolveEngramOutcome({ result: "SUCCESS" })).toBe("POSITIVE");
    expect(resolveEngramOutcome({ anything: "x" })).toBe("UNKNOWN");
  });

  it("должен считать агрегированный score", () => {
    const result = aggregateEngramScore([
      "POSITIVE",
      "NEGATIVE",
      "POSITIVE",
      "UNKNOWN",
    ]);

    expect(result.positive).toBe(2);
    expect(result.negative).toBe(1);
    expect(result.unknown).toBe(1);
    expect(result.score).toBeCloseTo(0.3333, 4);
  });
});
