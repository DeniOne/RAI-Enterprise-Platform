import type { BranchVerdict } from "./branch-trust.types";
import {
  resolveOverallBranchVerdictFromCounts,
  resolveRecommendedVerdictFromTruthfulnessAccounting,
} from "./branch-verdict-rules";

describe("branch-verdict-rules (детерминизм, без сети)", () => {
  describe("resolveRecommendedVerdictFromTruthfulnessAccounting", () => {
    const cases: Array<{
      name: string;
      accounting: {
        total: number;
        verified: number;
        unverified: number;
        invalid: number;
      };
      expected: BranchVerdict;
    }> = [
      { name: "пустой total", accounting: { total: 0, verified: 0, unverified: 0, invalid: 0 }, expected: "UNVERIFIED" },
      { name: "все verified", accounting: { total: 3, verified: 3, unverified: 0, invalid: 0 }, expected: "VERIFIED" },
      { name: "verified + invalid", accounting: { total: 2, verified: 1, unverified: 0, invalid: 1 }, expected: "CONFLICTED" },
      { name: "все invalid", accounting: { total: 2, verified: 0, unverified: 0, invalid: 2 }, expected: "REJECTED" },
      { name: "все unverified", accounting: { total: 2, verified: 0, unverified: 2, invalid: 0 }, expected: "UNVERIFIED" },
      { name: "verified + unverified", accounting: { total: 2, verified: 1, unverified: 1, invalid: 0 }, expected: "PARTIAL" },
      { name: "invalid + unverified (без verified)", accounting: { total: 2, verified: 0, unverified: 1, invalid: 1 }, expected: "UNVERIFIED" },
      { name: "fallback partial", accounting: { total: 1, verified: 0, unverified: 0, invalid: 0 }, expected: "PARTIAL" },
    ];

    it.each(cases)("$name → $expected", ({ accounting, expected }) => {
      expect(resolveRecommendedVerdictFromTruthfulnessAccounting(accounting)).toBe(
        expected,
      );
    });
  });

  describe("resolveOverallBranchVerdictFromCounts", () => {
    const base: Record<BranchVerdict, number> = {
      VERIFIED: 0,
      PARTIAL: 0,
      UNVERIFIED: 0,
      CONFLICTED: 0,
      REJECTED: 0,
    };

    const cases: Array<{
      name: string;
      counts: Partial<Record<BranchVerdict, number>>;
      expected: BranchVerdict;
    }> = [
      { name: "CONFLICTED побеждает", counts: { CONFLICTED: 1, VERIFIED: 2 }, expected: "CONFLICTED" },
      { name: "VERIFIED + UNVERIFIED → PARTIAL", counts: { VERIFIED: 1, UNVERIFIED: 1 }, expected: "PARTIAL" },
      { name: "только PARTIAL", counts: { PARTIAL: 2 }, expected: "PARTIAL" },
      { name: "REJECTED без VERIFIED", counts: { REJECTED: 1 }, expected: "REJECTED" },
      { name: "только UNVERIFIED", counts: { UNVERIFIED: 1 }, expected: "UNVERIFIED" },
      { name: "только VERIFIED", counts: { VERIFIED: 2 }, expected: "VERIFIED" },
      {
        name: "все нули (пустой список веток)",
        counts: {},
        expected: "VERIFIED",
      },
    ];

    it.each(cases)("$name → $expected", ({ counts, expected }) => {
      expect(resolveOverallBranchVerdictFromCounts({ ...base, ...counts })).toBe(
        expected,
      );
    });
  });
});
