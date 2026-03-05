import { RaiToolName } from "../tools/rai-tools.types";
import { planByToolCalls, planByIntents } from "./tool-call.planner";
import type { IntentClassification } from "../intent-router/intent-router.types";

describe("ToolCallPlanner", () => {
  describe("planByToolCalls", () => {
    it("группирует агро- и экономист-инструменты", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.GenerateTechMapDraft, payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" } },
        { name: RaiToolName.ComputePlanFact, payload: { scope: { seasonId: "s1" } } },
        { name: RaiToolName.EchoMessage, payload: { message: "hi" } },
      ]);
      expect(plan.agronom).toHaveLength(1);
      expect(plan.agronom[0].name).toBe(RaiToolName.GenerateTechMapDraft);
      expect(plan.economist).toHaveLength(1);
      expect(plan.economist[0].name).toBe(RaiToolName.ComputePlanFact);
      expect(plan.other).toHaveLength(1);
      expect(plan.other[0].name).toBe(RaiToolName.EchoMessage);
    });

    it("несколько интентов одного агента попадают в одну группу", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.ComputeDeviations, payload: { scope: {} } },
        { name: RaiToolName.ComputePlanFact, payload: { scope: {} } },
        { name: RaiToolName.SimulateScenario, payload: {} },
      ]);
      expect(plan.agronom).toHaveLength(1);
      expect(plan.economist).toHaveLength(2);
      expect(plan.other).toHaveLength(0);
    });

    it("QueryKnowledge попадает в knowledge", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.QueryKnowledge, payload: { query: "рапс" } },
      ]);
      expect(plan.knowledge).toHaveLength(1);
      expect(plan.knowledge[0].name).toBe(RaiToolName.QueryKnowledge);
      expect(plan.agronom).toHaveLength(0);
      expect(plan.economist).toHaveLength(0);
      expect(plan.other).toHaveLength(0);
    });

    it("пустой массив даёт пустой план", () => {
      const plan = planByToolCalls([]);
      expect(plan.agronom).toEqual([]);
      expect(plan.economist).toEqual([]);
      expect(plan.knowledge).toEqual([]);
      expect(plan.other).toEqual([]);
    });
  });

  describe("planByIntents", () => {
    it("группирует интенты по агентам", () => {
      const intents: IntentClassification[] = [
        { toolName: RaiToolName.GenerateTechMapDraft, confidence: 0.8, method: "regex", reason: "a" },
        { toolName: RaiToolName.ComputePlanFact, confidence: 0.7, method: "regex", reason: "b" },
      ];
      const { agronom, economist, knowledge } = planByIntents(intents);
      expect(agronom).toHaveLength(1);
      expect(agronom[0].toolName).toBe(RaiToolName.GenerateTechMapDraft);
      expect(economist).toHaveLength(1);
      expect(economist[0].toolName).toBe(RaiToolName.ComputePlanFact);
      expect(knowledge).toHaveLength(0);
    });

    it("QueryKnowledge попадает в knowledge", () => {
      const { knowledge } = planByIntents([
        { toolName: RaiToolName.QueryKnowledge, confidence: 0.9, method: "regex", reason: "q" },
      ]);
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].toolName).toBe(RaiToolName.QueryKnowledge);
    });

    it("игнорирует null toolName", () => {
      const { agronom, economist, knowledge } = planByIntents([
        { toolName: null, confidence: 0, method: "regex", reason: "no_match" },
      ]);
      expect(agronom).toHaveLength(0);
      expect(economist).toHaveLength(0);
      expect(knowledge).toHaveLength(0);
    });
  });
});
