import { BranchSchedulerService } from "../planner/branch-scheduler.service";
import { buildMicroRoutingRegressionFrame } from "./model-routing.fixtures";
import {
  measurePlannerHotPathMs,
  percentileNearestRank,
  readModelRoutingBaselineP95MsMax,
  structuralRoutingCost,
} from "./model-routing.baseline";

describe("model-routing baseline gate (latency p95 + structural cost, без сети)", () => {
  const svc = new BranchSchedulerService();

  afterEach(() => {
    delete process.env.RAI_ORCHESTRATOR_MODEL_ID;
  });

  it("структурная стоимость плана для микро-фикстуры зафиксирована (регрессия «cost»)", () => {
    const f = buildMicroRoutingRegressionFrame();
    const plan = svc.buildExecutionPlanFromIngress(f);
    expect(plan).not.toBeNull();
    expect(structuralRoutingCost(plan!)).toBe(1);
  });

  it("p95 времени buildPlan+topo ниже порога (регрессия latency)", () => {
    const f = buildMicroRoutingRegressionFrame();
    const maxMs = readModelRoutingBaselineP95MsMax();
    const warmup = 50;
    const n = 400;
    for (let i = 0; i < warmup; i += 1) {
      measurePlannerHotPathMs(svc, f);
    }
    const samples: number[] = [];
    for (let i = 0; i < n; i += 1) {
      samples.push(measurePlannerHotPathMs(svc, f));
    }
    samples.sort((a, b) => a - b);
    const p95 = percentileNearestRank(samples, 0.95);
    expect(p95).toBeLessThan(maxMs);
  });
});
