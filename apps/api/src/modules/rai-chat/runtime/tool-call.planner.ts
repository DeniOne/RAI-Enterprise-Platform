import { RaiToolName } from "../tools/rai-tools.types";
import { IntentClassification } from "../intent-router/intent-router.types";

const AGRONOM_TOOLS: RaiToolName[] = [
  RaiToolName.GenerateTechMapDraft,
  RaiToolName.ComputeDeviations,
];
const ECONOMIST_TOOLS: RaiToolName[] = [
  RaiToolName.ComputePlanFact,
  RaiToolName.SimulateScenario,
  RaiToolName.ComputeRiskAssessment,
];
const KNOWLEDGE_TOOLS: RaiToolName[] = [RaiToolName.QueryKnowledge];
const CRM_TOOLS: RaiToolName[] = [
  RaiToolName.LookupCounterpartyByInn,
  RaiToolName.RegisterCounterparty,
  RaiToolName.CreateCounterpartyRelation,
  RaiToolName.CreateCrmAccount,
  RaiToolName.GetCrmAccountWorkspace,
  RaiToolName.UpdateCrmAccount,
  RaiToolName.CreateCrmContact,
  RaiToolName.UpdateCrmContact,
  RaiToolName.DeleteCrmContact,
  RaiToolName.CreateCrmInteraction,
  RaiToolName.UpdateCrmInteraction,
  RaiToolName.DeleteCrmInteraction,
  RaiToolName.CreateCrmObligation,
  RaiToolName.UpdateCrmObligation,
  RaiToolName.DeleteCrmObligation,
];

export interface AgentExecutionPlan {
  agronom: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  economist: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  knowledge: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  crm: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  other: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
}

export type ToolCallInput = { name: RaiToolName; payload: Record<string, unknown> };

/**
 * Строит план выполнения: группирует tool calls по агентам для параллельного fan-out.
 * Agronom / Economist / Knowledge запускаются параллельно; other — через общий registry.
 */
export function planByToolCalls(toolCalls: ToolCallInput[]): AgentExecutionPlan {
  const agronom: ToolCallInput[] = [];
  const economist: ToolCallInput[] = [];
  const knowledge: ToolCallInput[] = [];
  const crm: ToolCallInput[] = [];
  const other: ToolCallInput[] = [];
  for (const call of toolCalls) {
    if (AGRONOM_TOOLS.includes(call.name)) agronom.push(call);
    else if (ECONOMIST_TOOLS.includes(call.name)) economist.push(call);
    else if (KNOWLEDGE_TOOLS.includes(call.name)) knowledge.push(call);
    else if (CRM_TOOLS.includes(call.name)) crm.push(call);
    else other.push(call);
  }
  return { agronom, economist, knowledge, crm, other };
}

/**
 * По классификациям интентов строит план (без payload — только группировка по агентам).
 * Для построения вызовов с payload используй planByToolCalls с готовыми RaiToolCall[].
 */
export function planByIntents(intents: IntentClassification[]): {
  agronom: IntentClassification[];
  economist: IntentClassification[];
  knowledge: IntentClassification[];
  crm: IntentClassification[];
} {
  const agronom: IntentClassification[] = [];
  const economist: IntentClassification[] = [];
  const knowledge: IntentClassification[] = [];
  const crm: IntentClassification[] = [];
  for (const c of intents) {
    if (!c.toolName) continue;
    if (AGRONOM_TOOLS.includes(c.toolName)) agronom.push(c);
    else if (ECONOMIST_TOOLS.includes(c.toolName)) economist.push(c);
    else if (KNOWLEDGE_TOOLS.includes(c.toolName)) knowledge.push(c);
    else if (CRM_TOOLS.includes(c.toolName)) crm.push(c);
  }
  return { agronom, economist, knowledge, crm };
}
