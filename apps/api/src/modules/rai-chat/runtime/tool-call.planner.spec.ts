import { RaiToolName } from "../tools/rai-tools.types";
import {
  buildExecutionBatches,
  planByToolCalls,
  planByIntents,
} from "./tool-call.planner";
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
      expect(plan.frontOffice).toEqual([]);
      expect(plan.other).toEqual([]);
    });

    it("front-office инструменты попадают в frontOffice", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.ClassifyDialogThread, payload: { channel: "web_chat", messageText: "Нужно в работу" } },
      ]);
      expect(plan.frontOffice).toHaveLength(1);
      expect(plan.frontOffice[0].name).toBe(RaiToolName.ClassifyDialogThread);
    });

    it("contracts инструменты попадают в contracts", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.CreateCommerceContract, payload: { number: "DOG-1" } },
      ]);
      expect(plan.contracts).toHaveLength(1);
      expect(plan.contracts[0].name).toBe(RaiToolName.CreateCommerceContract);
    });
  });

  describe("planByIntents", () => {
    it("группирует интенты по агентам", () => {
      const intents: IntentClassification[] = [
        { targetRole: "agronomist", intent: "tech_map_draft", toolName: RaiToolName.GenerateTechMapDraft, confidence: 0.8, method: "regex", reason: "a" },
        { targetRole: "economist", intent: "compute_plan_fact", toolName: RaiToolName.ComputePlanFact, confidence: 0.7, method: "regex", reason: "b" },
      ];
      const { agronom, economist, knowledge, frontOffice } = planByIntents(intents);
      expect(agronom).toHaveLength(1);
      expect(agronom[0].toolName).toBe(RaiToolName.GenerateTechMapDraft);
      expect(economist).toHaveLength(1);
      expect(economist[0].toolName).toBe(RaiToolName.ComputePlanFact);
      expect(knowledge).toHaveLength(0);
      expect(frontOffice).toHaveLength(0);
    });

    it("QueryKnowledge попадает в knowledge", () => {
      const { knowledge } = planByIntents([
        { targetRole: "knowledge", intent: "query_knowledge", toolName: RaiToolName.QueryKnowledge, confidence: 0.9, method: "regex", reason: "q" },
      ]);
      expect(knowledge).toHaveLength(1);
      expect(knowledge[0].toolName).toBe(RaiToolName.QueryKnowledge);
    });

    it("игнорирует null toolName", () => {
      const { agronom, economist, knowledge, frontOffice } = planByIntents([
        { targetRole: null, intent: null, toolName: null, confidence: 0, method: "regex", reason: "no_match" },
      ]);
      expect(agronom).toHaveLength(0);
      expect(economist).toHaveLength(0);
      expect(knowledge).toHaveLength(0);
      expect(frontOffice).toHaveLength(0);
    });

    it("front-office intent попадает в frontOffice", () => {
      const { frontOffice } = planByIntents([
        {
          targetRole: "front_office_agent",
          intent: "create_front_office_escalation",
          toolName: RaiToolName.CreateFrontOfficeEscalation,
          confidence: 0.9,
          method: "regex",
          reason: "front_office",
        },
      ]);
      expect(frontOffice).toHaveLength(1);
      expect(frontOffice[0].toolName).toBe(RaiToolName.CreateFrontOfficeEscalation);
    });

    it("contracts intent попадает в contracts", () => {
      const { contracts } = planByIntents([
        {
          targetRole: "contracts_agent",
          intent: "create_commerce_contract",
          toolName: RaiToolName.CreateCommerceContract,
          confidence: 0.92,
          method: "regex",
          reason: "contracts",
        },
      ]);
      expect(contracts).toHaveLength(1);
      expect(contracts[0].toolName).toBe(RaiToolName.CreateCommerceContract);
    });
  });

  describe("buildExecutionBatches", () => {
    it("уважает maxParallelGroups и maxParallelToolCalls", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.GenerateTechMapDraft, payload: { fieldRef: "f1" } },
        { name: RaiToolName.ComputePlanFact, payload: { scope: { seasonId: "s1" } } },
        { name: RaiToolName.QueryKnowledge, payload: { query: "рапс" } },
      ]);

      const batches = buildExecutionBatches(plan, {
        maxParallelToolCalls: 2,
        maxParallelGroups: 2,
        deadlineMs: 10_000,
      });

      expect(batches).toHaveLength(2);
      expect(batches[0].map((call) => call.name)).toEqual([
        RaiToolName.GenerateTechMapDraft,
        RaiToolName.ComputePlanFact,
      ]);
      expect(batches[1].map((call) => call.name)).toEqual([
        RaiToolName.QueryKnowledge,
      ]);
    });

    it("разбивает большой batch, если превышен maxParallelToolCalls", () => {
      const plan = planByToolCalls([
        { name: RaiToolName.CreateCrmContact, payload: { accountId: "a1" } },
        { name: RaiToolName.UpdateCrmContact, payload: { contactId: "c1" } },
        { name: RaiToolName.DeleteCrmContact, payload: { contactId: "c2" } },
      ]);

      const batches = buildExecutionBatches(plan, {
        maxParallelToolCalls: 2,
        maxParallelGroups: 1,
        deadlineMs: 10_000,
      });

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(1);
    });
  });
});
