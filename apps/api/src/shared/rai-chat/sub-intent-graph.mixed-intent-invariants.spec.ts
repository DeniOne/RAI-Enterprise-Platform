import { buildSubIntentGraphFromSemanticFrame } from "./sub-intent-graph.builder";
import { validateSubIntentGraphAntiTunnel } from "./sub-intent-graph.mixed-intent-invariants";
import { ConfidenceBand, DecisionType } from "./semantic-routing.types";
import type { SemanticIngressFrame } from "./semantic-ingress.types";
import type { SubIntentGraph } from "./execution-target-state.types";
import { RaiToolName } from "./rai-tools.types";

function baseFrame(partial: Partial<SemanticIngressFrame>): SemanticIngressFrame {
  return {
    version: "v1",
    interactionMode: "free_chat",
    requestShape: "single_intent",
    domainCandidates: [],
    goal: null,
    entities: [],
    requestedOperation: {
      ownerRole: "agronomist",
      intent: "test",
      toolName: RaiToolName.GenerateTechMapDraft,
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
    ...partial,
  } as SemanticIngressFrame;
}

describe("sub-intent-graph.mixed-intent-invariants", () => {
  it("TECH_MAP_CLARIFY: builder + инвариант согласованы", () => {
    const frame = baseFrame({
      techMapFrame: {
        workflowKind: "tech_map",
        userIntent: "create_new",
        workflowStageHint: "intake",
        requestedArtifact: "workflow_draft",
        scope: { fieldIds: [] },
        contextReadiness: "S1_SCOPED",
        requiredActions: ["clarify", "execute"],
        policyPosture: "governed",
        policyConstraints: [],
        resultConstraints: [],
      },
    });
    const g = buildSubIntentGraphFromSemanticFrame(frame);
    expect(validateSubIntentGraphAntiTunnel(frame, g)).toEqual({ ok: true });
  });

  it("TECH_MAP_CLARIFY: туннель в primary — отклоняется", () => {
    const frame = baseFrame({
      techMapFrame: {
        workflowKind: "tech_map",
        userIntent: "create_new",
        workflowStageHint: "intake",
        requestedArtifact: "workflow_draft",
        scope: { fieldIds: [] },
        contextReadiness: "S1_SCOPED",
        requiredActions: ["clarify", "execute"],
        policyPosture: "governed",
        policyConstraints: [],
        resultConstraints: [],
      },
    });
    const badGraph: SubIntentGraph = {
      version: "v1",
      graphId: "g_x",
      branches: [
        {
          branchId: "primary",
          ownerRole: "agronomist",
          intent: "x",
          toolName: null,
          kind: "informational",
          dependsOn: [],
        },
      ],
    };
    const r = validateSubIntentGraphAntiTunnel(frame, badGraph);
    expect(r).toEqual(
      expect.objectContaining({
        ok: false,
        caseId: "TECH_MAP_CLARIFY_DUAL_BRANCH",
      }),
    );
  });

  it("COMPOSITE_STAGE_GRAPH_PARITY: стадии и ветки совпадают", () => {
    const frame = baseFrame({
      requestShape: "composite",
      compositePlan: {
        planId: "cp",
        workflowId: "agro.test",
        leadOwnerAgent: "agronomist",
        executionStrategy: "sequential",
        summary: "s",
        stages: [
          {
            stageId: "a",
            order: 0,
            agentRole: "agronomist",
            intent: "i",
            toolName: RaiToolName.EchoMessage,
            label: "a",
            dependsOn: [],
            status: "planned",
          },
          {
            stageId: "b",
            order: 1,
            agentRole: "agronomist",
            intent: "i2",
            toolName: RaiToolName.EchoMessage,
            label: "b",
            dependsOn: ["a"],
            status: "planned",
          },
        ],
      },
    });
    const g = buildSubIntentGraphFromSemanticFrame(frame);
    expect(validateSubIntentGraphAntiTunnel(frame, g)).toEqual({ ok: true });
  });

  it("MULTI_EXPLICIT_TOOL_PARITY: согласованность с explicitPlannerToolCalls", () => {
    const frame = baseFrame({
      requestShape: "composite",
      explicitPlannerToolCalls: [
        {
          toolName: RaiToolName.ComputeDeviations,
          ownerRole: "agronomist",
          intent: "compute_deviations",
          payload: {},
        },
        {
          toolName: RaiToolName.QueryKnowledge,
          ownerRole: "knowledge",
          intent: "query_knowledge",
          payload: {},
        },
      ],
    });
    const g = buildSubIntentGraphFromSemanticFrame(frame);
    expect(validateSubIntentGraphAntiTunnel(frame, g)).toEqual({ ok: true });
  });

  it("MULTI_EXPLICIT_TOOL_PARITY: неверный порядок toolName — отклоняется", () => {
    const frame = baseFrame({
      explicitPlannerToolCalls: [
        {
          toolName: RaiToolName.ComputeDeviations,
          ownerRole: "agronomist",
          intent: "compute_deviations",
          payload: {},
        },
        {
          toolName: RaiToolName.QueryKnowledge,
          ownerRole: "knowledge",
          intent: "query_knowledge",
          payload: {},
        },
      ],
    });
    const badGraph: SubIntentGraph = {
      version: "v1",
      graphId: "g_x",
      branches: [
        {
          branchId: "a",
          ownerRole: "knowledge",
          intent: "query_knowledge",
          toolName: RaiToolName.QueryKnowledge,
          kind: "informational",
          dependsOn: [],
        },
        {
          branchId: "b",
          ownerRole: "agronomist",
          intent: "compute_deviations",
          toolName: RaiToolName.ComputeDeviations,
          kind: "informational",
          dependsOn: [],
        },
      ],
    };
    expect(validateSubIntentGraphAntiTunnel(frame, badGraph)).toEqual(
      expect.objectContaining({
        ok: false,
        caseId: "MULTI_EXPLICIT_TOOL_PARITY",
      }),
    );
  });

  it("COMPOSITE_STAGE_GRAPH_PARITY: лишняя ветка — отклоняется", () => {
    const frame = baseFrame({
      compositePlan: {
        planId: "cp",
        workflowId: "agro.test",
        leadOwnerAgent: "agronomist",
        executionStrategy: "sequential",
        summary: "s",
        stages: [
          {
            stageId: "a",
            order: 0,
            agentRole: "agronomist",
            intent: "i",
            toolName: RaiToolName.EchoMessage,
            label: "a",
            dependsOn: [],
            status: "planned",
          },
        ],
      },
    });
    const badGraph: SubIntentGraph = {
      version: "v1",
      graphId: "g_x",
      branches: [
        {
          branchId: "a",
          ownerRole: "agronomist",
          intent: "i",
          toolName: RaiToolName.EchoMessage,
          kind: "analytical",
          dependsOn: [],
        },
        {
          branchId: "ghost",
          ownerRole: "agronomist",
          intent: "i",
          toolName: null,
          kind: "analytical",
          dependsOn: [],
        },
      ],
    };
    const r = validateSubIntentGraphAntiTunnel(frame, badGraph);
    expect(r).toEqual(
      expect.objectContaining({
        ok: false,
        caseId: "COMPOSITE_STAGE_GRAPH_PARITY",
      }),
    );
  });
});
