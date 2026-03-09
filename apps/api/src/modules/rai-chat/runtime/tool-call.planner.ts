import { RaiToolName } from "../tools/rai-tools.types";
import { IntentClassification } from "../intent-router/intent-router.types";
import { RuntimeConcurrencyEnvelope } from "../runtime-governance/runtime-governance-policy.types";

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
const FRONT_OFFICE_TOOLS: RaiToolName[] = [
  RaiToolName.LogDialogMessage,
  RaiToolName.ClassifyDialogThread,
  RaiToolName.CreateFrontOfficeEscalation,
];
const CONTRACTS_TOOLS: RaiToolName[] = [
  RaiToolName.CreateCommerceContract,
  RaiToolName.ListCommerceContracts,
  RaiToolName.GetCommerceContract,
  RaiToolName.CreateCommerceObligation,
  RaiToolName.CreateFulfillmentEvent,
  RaiToolName.ListFulfillmentEvents,
  RaiToolName.CreateInvoiceFromFulfillment,
  RaiToolName.PostInvoice,
  RaiToolName.ListInvoices,
  RaiToolName.CreatePayment,
  RaiToolName.ConfirmPayment,
  RaiToolName.AllocatePayment,
  RaiToolName.GetArBalance,
];

export interface AgentExecutionPlan {
  agronom: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  economist: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  knowledge: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  crm: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  frontOffice: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  contracts: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
  other: Array<{ name: RaiToolName; payload: Record<string, unknown> }>;
}

export type ToolCallInput = { name: RaiToolName; payload: Record<string, unknown> };

const PLAN_GROUP_ORDER = [
  "agronom",
  "economist",
  "knowledge",
  "crm",
  "frontOffice",
  "contracts",
  "other",
] as const satisfies ReadonlyArray<keyof AgentExecutionPlan>;

/**
 * Строит план выполнения: группирует tool calls по агентам для параллельного fan-out.
 * Agronom / Economist / Knowledge запускаются параллельно; other — через общий registry.
 */
export function planByToolCalls(toolCalls: ToolCallInput[]): AgentExecutionPlan {
  const agronom: ToolCallInput[] = [];
  const economist: ToolCallInput[] = [];
  const knowledge: ToolCallInput[] = [];
  const crm: ToolCallInput[] = [];
  const frontOffice: ToolCallInput[] = [];
  const contracts: ToolCallInput[] = [];
  const other: ToolCallInput[] = [];
  for (const call of toolCalls) {
    if (AGRONOM_TOOLS.includes(call.name)) agronom.push(call);
    else if (ECONOMIST_TOOLS.includes(call.name)) economist.push(call);
    else if (KNOWLEDGE_TOOLS.includes(call.name)) knowledge.push(call);
    else if (CRM_TOOLS.includes(call.name)) crm.push(call);
    else if (FRONT_OFFICE_TOOLS.includes(call.name)) frontOffice.push(call);
    else if (CONTRACTS_TOOLS.includes(call.name)) contracts.push(call);
    else other.push(call);
  }
  return { agronom, economist, knowledge, crm, frontOffice, contracts, other };
}

export function buildExecutionBatches(
  plan: AgentExecutionPlan,
  envelope: RuntimeConcurrencyEnvelope,
): ToolCallInput[][] {
  const nonEmptyGroups = PLAN_GROUP_ORDER
    .map((groupName) => ({ groupName, calls: plan[groupName] }))
    .filter((group) => group.calls.length > 0);

  if (nonEmptyGroups.length === 0) {
    return [];
  }

  const maxParallelGroups = Math.max(1, envelope.maxParallelGroups);
  const maxParallelToolCalls = Math.max(1, envelope.maxParallelToolCalls);
  const batches: ToolCallInput[][] = [];

  for (let groupIndex = 0; groupIndex < nonEmptyGroups.length; groupIndex += maxParallelGroups) {
    const groupSlice = nonEmptyGroups.slice(groupIndex, groupIndex + maxParallelGroups);
    const flattened = groupSlice.flatMap((group) => group.calls);
    for (
      let callIndex = 0;
      callIndex < flattened.length;
      callIndex += maxParallelToolCalls
    ) {
      batches.push(flattened.slice(callIndex, callIndex + maxParallelToolCalls));
    }
  }

  return batches;
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
  frontOffice: IntentClassification[];
  contracts: IntentClassification[];
} {
  const agronom: IntentClassification[] = [];
  const economist: IntentClassification[] = [];
  const knowledge: IntentClassification[] = [];
  const crm: IntentClassification[] = [];
  const frontOffice: IntentClassification[] = [];
  const contracts: IntentClassification[] = [];
  for (const c of intents) {
    if (!c.toolName) continue;
    if (AGRONOM_TOOLS.includes(c.toolName)) agronom.push(c);
    else if (ECONOMIST_TOOLS.includes(c.toolName)) economist.push(c);
    else if (KNOWLEDGE_TOOLS.includes(c.toolName)) knowledge.push(c);
    else if (CRM_TOOLS.includes(c.toolName)) crm.push(c);
    else if (FRONT_OFFICE_TOOLS.includes(c.toolName)) frontOffice.push(c);
    else if (CONTRACTS_TOOLS.includes(c.toolName)) contracts.push(c);
  }
  return { agronom, economist, knowledge, crm, frontOffice, contracts };
}
