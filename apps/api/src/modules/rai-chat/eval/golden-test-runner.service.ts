import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";

export interface GoldenTestCase {
  id: string;
  requestText: string;
  expectedIntent: string;
  expectedToolCalls: string[];
}

export interface EvalRunResult {
  id: string;
  timestamp: Date;
  agentName: string;
  promptVersion: string;
  modelName: string;
  goldenTestResults: { passed: number; failed: number; regressions: string[] };
  verdict: "APPROVED" | "ROLLBACK" | "REVIEW_REQUIRED";
}

@Injectable()
export class GoldenTestRunnerService {
  runEval(agentName: string, testSet: GoldenTestCase[]): EvalRunResult {
    const results = { passed: 0, failed: 0, regressions: [] as string[] };
    for (const tc of testSet) {
      const stubOk = this.stubCheck(tc);
      if (stubOk) results.passed++;
      else {
        results.failed++;
        results.regressions.push(tc.id);
      }
    }
    const verdict =
      results.failed === 0 ? "APPROVED" : results.regressions.length > 0 ? "ROLLBACK" : "REVIEW_REQUIRED";
    return {
      id: `eval-${Date.now()}`,
      timestamp: new Date(),
      agentName,
      promptVersion: "stub",
      modelName: "stub",
      goldenTestResults: results,
      verdict,
    };
  }

  loadGoldenSet(agentName: string): GoldenTestCase[] {
    const base = path.join(__dirname, "golden-data");
    const file = agentName === "AgronomAgent" ? "agronom-golden-set.json" : null;
    if (!file) return [];
    const raw = fs.readFileSync(path.join(base, file), "utf-8");
    return JSON.parse(raw) as GoldenTestCase[];
  }

  private stubCheck(tc: GoldenTestCase): boolean {
    return !!tc.id && !!tc.requestText && Array.isArray(tc.expectedToolCalls);
  }
}
