import { GoldenTestRunnerService, GoldenTestCase } from "./golden-test-runner.service";

describe("GoldenTestRunnerService", () => {
  let service: GoldenTestRunnerService;

  beforeEach(() => {
    service = new GoldenTestRunnerService();
  });

  it("runEval возвращает EvalRun с passed/failed и verdict", () => {
    const set: GoldenTestCase[] = [
      { id: "t1", requestText: "покажи отклонения по полю", expectedIntent: "compute_deviations", expectedToolCalls: ["compute_deviations"] },
      { id: "t2", requestText: "сделай техкарту рапса", expectedIntent: "tech_map_draft", expectedToolCalls: ["generate_tech_map_draft"] },
    ];
    const result = service.runEval("AgronomAgent", set, {
      role: "agronomist",
      promptVersion: "prompt-v1",
      modelName: "gpt-4o",
      maxTokens: 16000,
      capabilities: ["AgroToolsRegistry"],
      tools: ["compute_deviations", "generate_tech_map_draft"] as any,
      isActive: true,
    });
    expect(result.agentName).toBe("AgronomAgent");
    expect(result.corpusSummary.passed).toBe(2);
    expect(result.corpusSummary.failed).toBe(0);
    expect(result.corpusSummary.skipped).toBe(0);
    expect(result.verdictBasis.policy).toBe("APPROVED");
    expect(result.verdict).toBe("APPROVED");
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("runEval при невалидном кейсе увеличивает failed и regressions", () => {
    const set: GoldenTestCase[] = [
      { id: "bad", requestText: "", expectedIntent: "x", expectedToolCalls: "not-array" as any },
    ];
    const result = service.runEval("AgronomAgent", set, {
      role: "agronomist",
      promptVersion: "prompt-v1",
      modelName: "gpt-4o",
      maxTokens: 16000,
      capabilities: ["AgroToolsRegistry"],
      tools: ["compute_deviations"] as any,
      isActive: true,
    });
    expect(result.corpusSummary.failed).toBe(1);
    expect(result.caseResults[0].reasons).toContain("INVALID_TEST_CASE");
    expect(result.verdict).toBe("ROLLBACK");
  });

  it("runEval переводит run в REVIEW_REQUIRED при degraded coverage", () => {
    const set: GoldenTestCase[] = [
      { id: "skip-1", requestText: "общий агровопрос", expectedIntent: "agro_query", expectedToolCalls: ["get_soil_profile"] },
      { id: "pass-1", requestText: "покажи отклонения", expectedIntent: "compute_deviations", expectedToolCalls: ["compute_deviations"] },
    ];
    const result = service.runEval("AgronomAgent", set, {
      role: "agronomist",
      promptVersion: "prompt-v1",
      modelName: "gpt-4o",
      maxTokens: 16000,
      capabilities: ["AgroToolsRegistry"],
      tools: ["compute_deviations"] as any,
      isActive: true,
    });
    expect(result.corpusSummary.skipped).toBe(1);
    expect(result.corpusSummary.passed).toBe(1);
    expect(result.corpusSummary.coveragePct).toBe(0.5);
    expect(result.verdict).toBe("REVIEW_REQUIRED");
    expect(result.verdictBasis.policy).toBe("REVIEW_ON_DEGRADED_COVERAGE");
  });

  it("loadGoldenSet для AgronomAgent возвращает массив из JSON", () => {
    const loaded = service.loadGoldenSet("AgronomAgent");
    expect(Array.isArray(loaded)).toBe(true);
    expect(loaded.length).toBeGreaterThanOrEqual(2);
    expect(loaded[0]).toHaveProperty("id");
    expect(loaded[0]).toHaveProperty("requestText");
    expect(loaded[0]).toHaveProperty("expectedToolCalls");
  });

  it("runEval фейлит candidate без required capability even if golden set matches", () => {
    const set: GoldenTestCase[] = [
      {
        id: "econ-1",
        requestText: "покажи план факт",
        expectedIntent: "compute_plan_fact",
        expectedToolCalls: ["compute_plan_fact"],
      },
    ];
    const result = service.runEval("EconomistAgent", set, {
      role: "economist",
      promptVersion: "prompt-v2",
      modelName: "gpt-4o-mini",
      maxTokens: 8000,
      capabilities: ["KnowledgeToolsRegistry"],
      tools: ["query_knowledge"] as any,
      isActive: true,
    });
    expect(result.corpusSummary.failed).toBe(1);
    expect(result.caseResults[0].reasons).toContain("TOOL_OR_CAPABILITY_MISMATCH");
    expect(result.verdict).toBe("ROLLBACK");
  });
});
