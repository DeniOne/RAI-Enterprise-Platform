import { BranchSchedulerService } from "../planner/branch-scheduler.service";
import { buildMicroRoutingRegressionFrame } from "./model-routing.fixtures";

describe("model-routing regression (планировщик не зависит от MODEL_ID)", () => {
  const svc = new BranchSchedulerService();

  afterEach(() => {
    delete process.env.RAI_ORCHESTRATOR_MODEL_ID;
  });

  it("топологический порядок одинаков при разных MODEL_ID в env", () => {
    const f = buildMicroRoutingRegressionFrame();
    process.env.RAI_ORCHESTRATOR_MODEL_ID = "model-a";
    const o1 = svc.computeTopologicalScheduleOrder(
      svc.buildExecutionPlanFromIngress(f)!,
    );
    process.env.RAI_ORCHESTRATOR_MODEL_ID = "model-b";
    const o2 = svc.computeTopologicalScheduleOrder(
      svc.buildExecutionPlanFromIngress(f)!,
    );
    expect(o1).toEqual(o2);
  });
});
