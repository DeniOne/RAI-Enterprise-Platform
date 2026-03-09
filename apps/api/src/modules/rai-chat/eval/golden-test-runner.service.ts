import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { RaiToolName } from "../tools/rai-tools.types";
import type { AgentRuntimeRole } from "../agent-registry.service";

export interface GoldenTestCase {
  id: string;
  requestText: string;
  expectedIntent: string;
  expectedToolCalls: string[];
}

export interface EvalRunCaseResult {
  caseId: string;
  status: "passed" | "failed" | "skipped";
  reasons: string[];
  expectedIntent: string;
  expectedTools: RaiToolName[];
}

export interface AgentEvalCandidate {
  role: AgentRuntimeRole;
  promptVersion: string;
  modelName: string;
  maxTokens: number;
  capabilities: string[];
  tools?: RaiToolName[];
  isActive: boolean;
}

export interface EvalRunResult {
  id: string;
  timestamp: Date;
  role: AgentRuntimeRole;
  agentName: string;
  promptVersion: string;
  modelName: string;
  corpusSummary: {
    totalCases: number;
    executableCases: number;
    passed: number;
    failed: number;
    skipped: number;
    coveragePct: number;
    regressions: string[];
  };
  caseResults: EvalRunCaseResult[];
  verdict: "APPROVED" | "ROLLBACK" | "REVIEW_REQUIRED";
  verdictBasis: {
    failedCaseIds: string[];
    skippedCaseIds: string[];
    coveragePct: number;
    executableCases: number;
    policy: "FAIL_ON_REGRESSION" | "REVIEW_ON_DEGRADED_COVERAGE" | "APPROVED";
  };
}

@Injectable()
export class GoldenTestRunnerService {
  runEval(
    agentName: string,
    testSet: GoldenTestCase[],
    candidate?: AgentEvalCandidate,
  ): EvalRunResult {
    const caseResults: EvalRunCaseResult[] = [];
    const results = { passed: 0, failed: 0, skipped: 0, regressions: [] as string[] };
    for (const tc of testSet) {
      const caseResult = this.evaluateCase(agentName, tc, candidate);
      caseResults.push(caseResult);
      if (caseResult.status === "passed") {
        results.passed++;
      } else if (caseResult.status === "skipped") {
        results.skipped++;
      } else {
        results.failed++;
        results.regressions.push(tc.id);
      }
    }
    const executableCases = results.passed + results.failed;
    const coveragePct =
      testSet.length === 0 ? 0 : Number((executableCases / testSet.length).toFixed(4));
    const skippedCaseIds = caseResults
      .filter((entry) => entry.status === "skipped")
      .map((entry) => entry.caseId);
    const verdict =
      results.failed > 0
        ? "ROLLBACK"
        : coveragePct < 0.75 || executableCases === 0
          ? "REVIEW_REQUIRED"
          : "APPROVED";
    return {
      id: `eval-${Date.now()}`,
      timestamp: new Date(),
      role: candidate?.role ?? "knowledge",
      agentName,
      promptVersion: candidate?.promptVersion ?? "unknown",
      modelName: candidate?.modelName ?? "unknown",
      corpusSummary: {
        totalCases: testSet.length,
        executableCases,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        coveragePct,
        regressions: results.regressions,
      },
      caseResults,
      verdict,
      verdictBasis: {
        failedCaseIds: results.regressions,
        skippedCaseIds,
        coveragePct,
        executableCases,
        policy:
          results.failed > 0
            ? "FAIL_ON_REGRESSION"
            : coveragePct < 0.75 || executableCases === 0
              ? "REVIEW_ON_DEGRADED_COVERAGE"
              : "APPROVED",
      },
    };
  }

  loadGoldenSet(agentName: string): GoldenTestCase[] {
    const base = path.join(__dirname, "golden-data");
    const fileMap: Record<string, string> = {
      AgronomAgent: "agronom-golden-set.json",
      EconomistAgent: "economist-golden-set.json",
      KnowledgeAgent: "knowledge-golden-set.json",
      MonitoringAgent: "monitoring-golden-set.json",
      CrmAgent: "crm-golden-set.json",
      FrontOfficeAgent: "front-office-golden-set.json",
    };
    const file = fileMap[agentName] ?? null;
    if (!file) return [];
    const raw = fs.readFileSync(path.join(base, file), "utf-8");
    return JSON.parse(raw) as GoldenTestCase[];
  }

  private evaluateCase(
    agentName: string,
    tc: GoldenTestCase,
    candidate?: AgentEvalCandidate,
  ): EvalRunCaseResult {
    const supportedExpectedCalls = this.normalizeExpectedToolCalls(tc.expectedToolCalls);
    const expectedTool = this.mapExpectedIntentToTool(tc.expectedIntent);
    const reasons: string[] = [];
    if (!tc.id || !tc.requestText || !Array.isArray(tc.expectedToolCalls)) {
      return this.buildCaseResult(tc, expectedTool, supportedExpectedCalls, "failed", [
        "INVALID_TEST_CASE",
      ]);
    }
    if (!candidate) {
      return this.buildCaseResult(tc, expectedTool, supportedExpectedCalls, "failed", [
        "MISSING_CANDIDATE",
      ]);
    }
    if (!candidate.isActive) {
      reasons.push("CANDIDATE_INACTIVE");
    }
    if (!candidate.promptVersion.trim() || !candidate.modelName.trim()) {
      reasons.push("MISSING_CANDIDATE_VERSIONING");
    }

    const hasIntentExpectation = expectedTool !== null;
    const hasToolExpectation = supportedExpectedCalls.length > 0;

    if (!hasIntentExpectation && !hasToolExpectation) {
      return this.buildCaseResult(tc, expectedTool, supportedExpectedCalls, "skipped", [
        "UNSUPPORTED_EXPECTATION",
      ]);
    }

    if (hasIntentExpectation && !this.agentSupportsIntent(agentName, tc.expectedIntent)) {
      reasons.push("AGENT_INTENT_MISMATCH");
    }

    if (!this.candidateSupportsTool(candidate, expectedTool, supportedExpectedCalls)) {
      reasons.push("TOOL_OR_CAPABILITY_MISMATCH");
    }

    if (!this.candidateMeetsBudget(agentName, candidate.maxTokens)) {
      reasons.push("TOKEN_BUDGET_TOO_LOW");
    }

    return this.buildCaseResult(
      tc,
      expectedTool,
      supportedExpectedCalls,
      reasons.length > 0 ? "failed" : "passed",
      reasons,
    );
  }

  private agentSupportsIntent(agentName: string, expectedIntent: string): boolean {
    const supported: Record<string, string[]> = {
      AgronomAgent: ["compute_deviations", "tech_map_draft"],
      EconomistAgent: [
        "compute_plan_fact",
        "simulate_scenario",
        "compute_risk_assessment",
      ],
      KnowledgeAgent: ["query_knowledge"],
      MonitoringAgent: ["emit_alerts", "get_weather_forecast"],
      CrmAgent: [
        "register_counterparty",
        "create_counterparty_relation",
        "create_crm_account",
        "review_account_workspace",
        "update_account_profile",
        "create_crm_contact",
        "update_crm_contact",
        "delete_crm_contact",
        "log_crm_interaction",
        "create_crm_obligation",
        "update_crm_interaction",
        "delete_crm_interaction",
        "update_crm_obligation",
        "delete_crm_obligation",
      ],
      FrontOfficeAgent: [
        "log_dialog_message",
        "classify_dialog_thread",
        "create_front_office_escalation",
      ],
    };
    return supported[agentName]?.includes(expectedIntent) ?? false;
  }

  private candidateSupportsTool(
    candidate: AgentEvalCandidate,
    expectedTool: RaiToolName | null,
    supportedExpectedCalls: RaiToolName[],
  ): boolean {
    const requiredCapabilities = new Set<string>();
    const expectedTools = new Set<RaiToolName>();

    if (expectedTool) {
      expectedTools.add(expectedTool);
      const capability = this.getRequiredCapability(expectedTool);
      if (capability) {
        requiredCapabilities.add(capability);
      }
    }
    for (const tool of supportedExpectedCalls) {
      expectedTools.add(tool);
      const capability = this.getRequiredCapability(tool);
      if (capability) {
        requiredCapabilities.add(capability);
      }
    }

    return (
      [...requiredCapabilities].every((capability) =>
        candidate.capabilities.includes(capability),
      ) &&
      [...expectedTools].every(
        (tool) =>
          (candidate.tools ?? []).includes(tool) ||
          candidate.capabilities.includes(tool) ||
          candidate.capabilities.includes(this.getRequiredCapability(tool) ?? ""),
      )
    );
  }

  private candidateMeetsBudget(agentName: string, maxTokens: number): boolean {
    const minBudget: Record<string, number> = {
      AgronomAgent: 4000,
      EconomistAgent: 2000,
      KnowledgeAgent: 1000,
      MonitoringAgent: 1000,
      CrmAgent: 2000,
      FrontOfficeAgent: 1500,
    };
    return maxTokens >= (minBudget[agentName] ?? 1000);
  }

  private getRequiredCapability(tool: RaiToolName): string | null {
    switch (tool) {
      case RaiToolName.ComputeDeviations:
      case RaiToolName.GenerateTechMapDraft:
        return "AgroToolsRegistry";
      case RaiToolName.ComputePlanFact:
      case RaiToolName.SimulateScenario:
      case RaiToolName.ComputeRiskAssessment:
        return "FinanceToolsRegistry";
      case RaiToolName.QueryKnowledge:
        return "KnowledgeToolsRegistry";
      case RaiToolName.EmitAlerts:
      case RaiToolName.GetWeatherForecast:
        return "RiskToolsRegistry";
      case RaiToolName.LookupCounterpartyByInn:
      case RaiToolName.RegisterCounterparty:
      case RaiToolName.CreateCounterpartyRelation:
      case RaiToolName.CreateCrmAccount:
      case RaiToolName.GetCrmAccountWorkspace:
      case RaiToolName.UpdateCrmAccount:
      case RaiToolName.CreateCrmContact:
      case RaiToolName.UpdateCrmContact:
      case RaiToolName.DeleteCrmContact:
      case RaiToolName.CreateCrmInteraction:
      case RaiToolName.UpdateCrmInteraction:
      case RaiToolName.DeleteCrmInteraction:
      case RaiToolName.CreateCrmObligation:
      case RaiToolName.UpdateCrmObligation:
      case RaiToolName.DeleteCrmObligation:
        return "CrmToolsRegistry";
      case RaiToolName.LogDialogMessage:
      case RaiToolName.ClassifyDialogThread:
      case RaiToolName.CreateFrontOfficeEscalation:
        return "FrontOfficeToolsRegistry";
      default:
        return null;
    }
  }

  private mapExpectedIntentToTool(expectedIntent: string): RaiToolName | null {
    switch (expectedIntent) {
      case "compute_deviations":
        return RaiToolName.ComputeDeviations;
      case "tech_map_draft":
        return RaiToolName.GenerateTechMapDraft;
      case "compute_plan_fact":
        return RaiToolName.ComputePlanFact;
      case "simulate_scenario":
        return RaiToolName.SimulateScenario;
      case "compute_risk_assessment":
        return RaiToolName.ComputeRiskAssessment;
      case "query_knowledge":
        return RaiToolName.QueryKnowledge;
      case "emit_alerts":
        return RaiToolName.EmitAlerts;
      case "get_weather_forecast":
        return RaiToolName.GetWeatherForecast;
      case "register_counterparty":
        return RaiToolName.RegisterCounterparty;
      case "create_counterparty_relation":
        return RaiToolName.CreateCounterpartyRelation;
      case "create_crm_account":
        return RaiToolName.CreateCrmAccount;
      case "review_account_workspace":
        return RaiToolName.GetCrmAccountWorkspace;
      case "update_account_profile":
        return RaiToolName.UpdateCrmAccount;
      case "create_crm_contact":
        return RaiToolName.CreateCrmContact;
      case "update_crm_contact":
        return RaiToolName.UpdateCrmContact;
      case "delete_crm_contact":
        return RaiToolName.DeleteCrmContact;
      case "log_crm_interaction":
        return RaiToolName.CreateCrmInteraction;
      case "update_crm_interaction":
        return RaiToolName.UpdateCrmInteraction;
      case "delete_crm_interaction":
        return RaiToolName.DeleteCrmInteraction;
      case "create_crm_obligation":
        return RaiToolName.CreateCrmObligation;
      case "update_crm_obligation":
        return RaiToolName.UpdateCrmObligation;
      case "delete_crm_obligation":
        return RaiToolName.DeleteCrmObligation;
      case "log_dialog_message":
        return RaiToolName.LogDialogMessage;
      case "classify_dialog_thread":
        return RaiToolName.ClassifyDialogThread;
      case "create_front_office_escalation":
        return RaiToolName.CreateFrontOfficeEscalation;
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
      } else if (name === "compute_plan_fact") {
        normalized.push(RaiToolName.ComputePlanFact);
      } else if (name === "simulate_scenario") {
        normalized.push(RaiToolName.SimulateScenario);
      } else if (name === "query_knowledge") {
        normalized.push(RaiToolName.QueryKnowledge);
      } else if (name === "emit_alerts") {
        normalized.push(RaiToolName.EmitAlerts);
      } else if (name === "get_weather_forecast") {
        normalized.push(RaiToolName.GetWeatherForecast);
      } else if (name === "lookup_counterparty_by_inn") {
        normalized.push(RaiToolName.LookupCounterpartyByInn);
      } else if (name === "register_counterparty") {
        normalized.push(RaiToolName.RegisterCounterparty);
      } else if (name === "create_counterparty_relation") {
        normalized.push(RaiToolName.CreateCounterpartyRelation);
      } else if (name === "create_crm_account") {
        normalized.push(RaiToolName.CreateCrmAccount);
      } else if (name === "get_crm_account_workspace") {
        normalized.push(RaiToolName.GetCrmAccountWorkspace);
      } else if (name === "update_crm_account") {
        normalized.push(RaiToolName.UpdateCrmAccount);
      } else if (name === "create_crm_contact") {
        normalized.push(RaiToolName.CreateCrmContact);
      } else if (name === "update_crm_contact") {
        normalized.push(RaiToolName.UpdateCrmContact);
      } else if (name === "delete_crm_contact") {
        normalized.push(RaiToolName.DeleteCrmContact);
      } else if (name === "create_crm_interaction") {
        normalized.push(RaiToolName.CreateCrmInteraction);
      } else if (name === "update_crm_interaction") {
        normalized.push(RaiToolName.UpdateCrmInteraction);
      } else if (name === "delete_crm_interaction") {
        normalized.push(RaiToolName.DeleteCrmInteraction);
      } else if (name === "create_crm_obligation") {
        normalized.push(RaiToolName.CreateCrmObligation);
      } else if (name === "update_crm_obligation") {
        normalized.push(RaiToolName.UpdateCrmObligation);
      } else if (name === "delete_crm_obligation") {
        normalized.push(RaiToolName.DeleteCrmObligation);
      }
    }
    return normalized;
  }

  private buildCaseResult(
    tc: GoldenTestCase,
    expectedTool: RaiToolName | null,
    supportedExpectedCalls: RaiToolName[],
    status: "passed" | "failed" | "skipped",
    reasons: string[],
  ): EvalRunCaseResult {
    return {
      caseId: tc.id,
      status,
      reasons,
      expectedIntent: tc.expectedIntent,
      expectedTools: expectedTool
        ? [...new Set([expectedTool, ...supportedExpectedCalls])]
        : supportedExpectedCalls,
    };
  }
}
