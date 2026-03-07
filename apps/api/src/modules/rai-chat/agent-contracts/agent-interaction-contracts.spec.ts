import { RaiToolName } from "../tools/rai-tools.types";
import {
  buildAutoToolCallFromContracts,
  buildPendingClarificationItems,
  buildResumeExecutionPlan,
  classifyByAgentContracts,
  detectClarificationContract,
  resolveContextValues,
  resolveMissingContextKeys,
} from "./agent-interaction-contracts";

describe("agent interaction contracts", () => {
  it("классифицирует техкарту через единый contract source", () => {
    const result = classifyByAgentContracts("Составь техкарту по озимому рапсу", {
      route: "/consulting/dashboard",
    });

    expect(result.targetRole).toBe("agronomist");
    expect(result.intent).toBe("tech_map_draft");
    expect(result.toolName).toBe(RaiToolName.GenerateTechMapDraft);
  });

  it("строит auto tool call для план-факта из workspace filters", () => {
    const classification = classifyByAgentContracts("покажи план-факт", {
      route: "/finance/cashflow",
      filters: { seasonId: "season-2026", planId: "plan-77" },
    });

    const toolCall = buildAutoToolCallFromContracts(
      {
        message: "покажи план-факт",
        workspaceContext: {
          route: "/finance/cashflow",
          filters: { seasonId: "season-2026", planId: "plan-77" },
        },
      },
      classification,
    );

    expect(toolCall).toEqual({
      name: RaiToolName.ComputePlanFact,
      payload: {
        scope: {
          planId: "plan-77",
          seasonId: "season-2026",
        },
      },
    });
  });

  it("строит resume plan и required context для agronomist clarification", () => {
    const request = {
      message: "продолжай",
      threadId: "thread-1",
      clarificationResume: {
        windowId: "win-techmap-thread-1",
        intentId: "tech_map_draft" as const,
        agentRole: "agronomist" as const,
        collectedContext: {
          fieldRef: "field-12",
          seasonRef: "season-2026",
        },
      },
      workspaceContext: {
        route: "/consulting/techmaps/active",
      },
    };

    const plan = buildResumeExecutionPlan(request);
    const context = resolveContextValues(request);
    const contract = detectClarificationContract(
      request,
      {
        executedTools: [],
        runtimeBudget: null,
        agentExecution: {
          role: "agronomist",
          text: "need context",
          fallbackUsed: false,
          validation: { actionAllowed: true, explain: "" },
          outputContractVersion: "v1",
          toolCalls: [{ name: RaiToolName.GenerateTechMapDraft, result: {} }],
          confidence: 0,
          evidence: [],
          structuredOutput: undefined,
          status: "NEEDS_MORE_DATA",
        },
      } as never,
    );

    expect(plan?.classification.intent).toBe("tech_map_draft");
    expect(plan?.requestedToolCalls?.[0]).toEqual({
      name: RaiToolName.GenerateTechMapDraft,
      payload: {
        fieldRef: "field-12",
        seasonRef: "season-2026",
      },
    });
    expect(contract?.intentId).toBe("tech_map_draft");
    expect(resolveMissingContextKeys(contract!, context)).toEqual([]);
    expect(buildPendingClarificationItems(contract!, context)).toEqual([
      expect.objectContaining({ key: "fieldRef", status: "resolved" }),
      expect.objectContaining({ key: "seasonRef", status: "resolved" }),
    ]);
  });
});
