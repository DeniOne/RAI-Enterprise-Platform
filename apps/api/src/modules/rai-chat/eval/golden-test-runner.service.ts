import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { IntentRouterService } from "../intent-router/intent-router.service";
import { RaiToolName } from "../tools/rai-tools.types";

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
  goldenTestResults: { passed: number; failed: number; skipped: number; regressions: string[] };
  verdict: "APPROVED" | "ROLLBACK" | "REVIEW_REQUIRED";
}

@Injectable()
export class GoldenTestRunnerService {
  private readonly intentRouter = new IntentRouterService();

  runEval(agentName: string, testSet: GoldenTestCase[]): EvalRunResult {
    const results = { passed: 0, failed: 0, skipped: 0, regressions: [] as string[] };
    for (const tc of testSet) {
      const verdict = this.evaluateCase(tc);
      if (verdict === "passed") {
        results.passed++;
      } else if (verdict === "skipped") {
        results.skipped++;
      } else {
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

  private evaluateCase(tc: GoldenTestCase): "passed" | "failed" | "skipped" {
    if (!tc.id || !tc.requestText || !Array.isArray(tc.expectedToolCalls)) {
      return "failed";
    }

    const classification = this.intentRouter.classify(tc.requestText);
    const expectedTool = this.mapExpectedIntentToTool(tc.expectedIntent);
    const supportedExpectedCalls = this.normalizeExpectedToolCalls(tc.expectedToolCalls);

    const hasIntentExpectation = expectedTool !== null;
    const hasToolExpectation = supportedExpectedCalls.length > 0;

    if (!hasIntentExpectation && !hasToolExpectation) {
      return "skipped";
    }

    if (hasIntentExpectation && classification.toolName !== expectedTool) {
      return "failed";
    }

    if (hasToolExpectation) {
      const predicted = classification.toolName;
      if (!predicted || !supportedExpectedCalls.includes(predicted)) {
        return "failed";
      }
    }

    return "passed";
  }

  private mapExpectedIntentToTool(expectedIntent: string): RaiToolName | null {
    switch (expectedIntent) {
      case "compute_deviations":
        return RaiToolName.ComputeDeviations;
      case "tech_map_draft":
        return RaiToolName.GenerateTechMapDraft;
      default:
        return null;
    }
  }

  private normalizeExpectedToolCalls(expectedToolCalls: string[]): RaiToolName[] {
    const normalized: RaiToolName[] = [];
    for (const name of expectedToolCalls) {
      if (name === "compute_deviations") {
        normalized.push(RaiToolName.ComputeDeviations);
      } else if (name === "generate_tech_map_draft") {
        normalized.push(RaiToolName.GenerateTechMapDraft);
      }
    }
    return normalized;
  }
}
