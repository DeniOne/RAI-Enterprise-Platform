import { BranchSchedulerService } from "./branch-scheduler.service";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { buildSubIntentGraphFromSemanticFrame } from "../../../shared/rai-chat/sub-intent-graph.builder";
import { DecisionType } from "../../../shared/rai-chat/semantic-routing.types";
import { ConfidenceBand } from "../../../shared/rai-chat/semantic-routing.types";
import { RaiToolName } from "../../../shared/rai-chat/rai-tools.types";

function minimalFrame(): SemanticIngressFrame {
  return {
    version: "v1",
    interactionMode: "free_chat",
    requestShape: "single_intent",
    domainCandidates: [],
    goal: null,
    entities: [],
    requestedOperation: {
      ownerRole: "agronomist",
      intent: "x",
      toolName: RaiToolName.WorkspaceSnapshot,
      payload: { route: "/root" },
      decisionType: DecisionType.Execute,
      source: "fallback_normalization",
    },
    operationAuthority: "delegated_or_autonomous",
    missingSlots: [],
    riskClass: "safe_read",
    requiresConfirmation: false,
    confidenceBand: ConfidenceBand.Medium,
    explanation: "",
    writePolicy: { decision: "execute", reason: "" },
    subIntentGraph: buildSubIntentGraphFromSemanticFrame({
      version: "v1",
      interactionMode: "free_chat",
      requestShape: "single_intent",
      domainCandidates: [],
      goal: null,
      entities: [],
      requestedOperation: {
        ownerRole: "agronomist",
        intent: "x",
        toolName: RaiToolName.WorkspaceSnapshot,
        payload: { route: "/root" },
        decisionType: DecisionType.Execute,
        source: "fallback_normalization",
      },
      operationAuthority: "delegated_or_autonomous",
      missingSlots: [],
      riskClass: "safe_read",
      requiresConfirmation: false,
      confidenceBand: ConfidenceBand.Medium,
      explanation: "",
      writePolicy: { decision: "execute", reason: "" },
    } as SemanticIngressFrame),
  };
}

describe("BranchSchedulerService", () => {
  const svc = new BranchSchedulerService();

  it("buildExecutionPlanFromIngress возвращает план с топологическим порядком", () => {
    const frame = minimalFrame();
    const plan = svc.buildExecutionPlanFromIngress(frame);
    expect(plan).not.toBeNull();
    if (!plan) {
      return;
    }
    expect(plan.branches.length).toBe(1);
    expect(plan.branches[0].payload).toEqual({ route: "/root" });
    const order = svc.computeTopologicalScheduleOrder(plan);
    expect(order).toEqual(["primary"]);
  });

  it("buildInitialSurface задаёт PLANNED и mutation из политики", () => {
    const frame = minimalFrame();
    frame.writePolicy = { decision: "confirm", reason: "r" };
    frame.requiresConfirmation = true;
    const plan = svc.buildExecutionPlanFromIngress(frame);
    expect(plan).not.toBeNull();
    if (!plan) {
      return;
    }
    const surface = svc.buildInitialSurface(plan, frame);
    expect(surface.branches[0].lifecycle).toBe("PLANNED");
    expect(surface.branches[0].mutationState).toBe("PENDING");
  });

  it("dependsOn: порядок a затем b", () => {
    const frame = minimalFrame();
    frame.subIntentGraph = {
      version: "v1",
      graphId: "g_dep",
      branches: [
        {
          branchId: "a",
          ownerRole: "agronomist",
          intent: "i1",
          toolName: RaiToolName.WorkspaceSnapshot,
          payload: { route: "/a" },
          kind: "informational",
          dependsOn: [],
        },
        {
          branchId: "b",
          ownerRole: "agronomist",
          intent: "i2",
          toolName: RaiToolName.WorkspaceSnapshot,
          payload: { route: "/b" },
          kind: "informational",
          dependsOn: ["a"],
        },
      ],
    };
    const plan = svc.buildExecutionPlanFromIngress(frame);
    expect(plan).not.toBeNull();
    expect(svc.computeTopologicalScheduleOrder(plan!)).toEqual(["a", "b"]);
  });

  it("compositePlan parallel → strategy parallel и обе ветки в порядке", () => {
    const base = minimalFrame();
    base.compositePlan = {
      planId: "cp1",
      workflowId: "crm.dual",
      leadOwnerAgent: "crm_agent",
      executionStrategy: "parallel",
      summary: "",
      stages: [
        {
          stageId: "s1",
          order: 0,
          agentRole: "crm_agent",
          intent: "register_a",
          toolName: RaiToolName.RegisterCounterparty,
          label: "A",
          dependsOn: [],
          status: "planned",
        },
        {
          stageId: "s2",
          order: 1,
          agentRole: "crm_agent",
          intent: "register_b",
          toolName: RaiToolName.RegisterCounterparty,
          label: "B",
          dependsOn: [],
          status: "planned",
        },
      ],
    };
    base.subIntentGraph = buildSubIntentGraphFromSemanticFrame(base);
    const plan = svc.buildExecutionPlanFromIngress(base);
    expect(plan?.strategy).toBe("parallel");
    expect(plan?.branches[0].payload).toBeUndefined();
    const order = svc.computeTopologicalScheduleOrder(plan!);
    expect(new Set(order)).toEqual(new Set(["s1", "s2"]));
  });
});
