import { IntentRouterService } from "./intent-router.service";
import { RaiToolName } from "../tools/rai-tools.types";

describe("IntentRouterService", () => {
  let service: IntentRouterService;

  beforeEach(() => {
    service = new IntentRouterService();
  });

  it("classifies deviation intent", () => {
    const r = service.classify("покажи отклонения по полю");
    expect(r.toolName).toBe(RaiToolName.ComputeDeviations);
    expect(r.confidence).toBe(0.7);
    expect(r.method).toBe("regex");
  });

  it("classifies plan-fact/KPI intent", () => {
    const r = service.classify("план факт по сезону");
    expect(r.toolName).toBe(RaiToolName.ComputePlanFact);
    expect(r.confidence).toBe(0.75);
  });

  it("prioritizes economist for finance cash-flow prompts even when deviations are mentioned", () => {
    const r = service.classify("Compare plan vs fact cash flow risks and deviations for March", {
      route: "/finance/dashboard",
    });
    expect(r.targetRole).toBe("economist");
    expect(r.toolName).toBe(RaiToolName.ComputePlanFact);
  });

  it("classifies alerts intent", () => {
    const r = service.classify("есть алерт эскалация");
    expect(r.toolName).toBe(RaiToolName.EmitAlerts);
    expect(r.confidence).toBe(0.7);
  });

  it("classifies techmap draft intent", () => {
    const r = service.classify("сделай техкарту рапса");
    expect(r.toolName).toBe(RaiToolName.GenerateTechMapDraft);
    expect(r.confidence).toBe(0.7);
  });

  it("does not classify read-only techmap request as draft intent", () => {
    const r = service.classify("покажи все техкарты", {
      route: "/consulting/techmaps",
    });
    expect(r.toolName).toBeNull();
    expect(r.intent).toBeNull();
    expect(r.reason).toBe("no_match");
  });

  it("returns null intent for unknown message", () => {
    const r = service.classify("какая погода завтра?");
    expect(r.toolName).toBeNull();
    expect(r.confidence).toBe(0);
    expect(r.reason).toBe("no_match");
  });

  it("returns null intent for empty/generic message", () => {
    const r = service.classify("привет");
    expect(r.toolName).toBeNull();
  });

  it("buildAutoToolCall returns payload for deviations with context", () => {
    const call = service.buildAutoToolCall(
      "покажи отклонения",
      {
        message: "x",
        workspaceContext: {
          route: "/consulting",
          activeEntityRefs: [{ kind: "field", id: "f1" }],
          filters: { seasonId: "s1" },
        },
      } as any,
    );
    expect(call?.name).toBe(RaiToolName.ComputeDeviations);
    expect(call?.payload).toEqual({
      scope: { seasonId: "s1", fieldId: "f1" },
    });
  });

  it("buildAutoToolCall returns null for techmap without field/season", () => {
    const call = service.buildAutoToolCall("сделай техкарту", {
      message: "x",
      workspaceContext: { route: "/consulting" },
    } as any);
    expect(call).toBeNull();
  });
});
