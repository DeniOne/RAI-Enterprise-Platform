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
    const result = service.runEval("AgronomAgent", set);
    expect(result.agentName).toBe("AgronomAgent");
    expect(result.goldenTestResults.passed).toBe(2);
    expect(result.goldenTestResults.failed).toBe(0);
    expect(result.goldenTestResults.skipped).toBe(0);
    expect(result.verdict).toBe("APPROVED");
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it("runEval при невалидном кейсе увеличивает failed и regressions", () => {
    const set: GoldenTestCase[] = [
      { id: "bad", requestText: "", expectedIntent: "x", expectedToolCalls: "not-array" as any },
    ];
    const result = service.runEval("AgronomAgent", set);
    expect(result.goldenTestResults.failed).toBe(1);
    expect(result.verdict).toBe("ROLLBACK");
  });

  it("runEval пропускает unsupported кейсы вместо фейкового PASS", () => {
    const set: GoldenTestCase[] = [
      { id: "skip-1", requestText: "общий агровопрос", expectedIntent: "agro_query", expectedToolCalls: ["get_soil_profile"] },
    ];
    const result = service.runEval("AgronomAgent", set);
    expect(result.goldenTestResults.skipped).toBe(1);
    expect(result.goldenTestResults.passed).toBe(0);
    expect(result.goldenTestResults.failed).toBe(0);
  });

  it("loadGoldenSet для AgronomAgent возвращает массив из JSON", () => {
    const loaded = service.loadGoldenSet("AgronomAgent");
    expect(Array.isArray(loaded)).toBe(true);
    expect(loaded.length).toBeGreaterThanOrEqual(2);
    expect(loaded[0]).toHaveProperty("id");
    expect(loaded[0]).toHaveProperty("requestText");
    expect(loaded[0]).toHaveProperty("expectedToolCalls");
  });
});
