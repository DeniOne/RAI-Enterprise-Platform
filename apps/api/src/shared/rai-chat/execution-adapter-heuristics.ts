import { RaiToolName } from "./rai-tools.types";
import { RaiToolCallDto } from "./rai-chat.dto";
import { AgentExecutionRequest } from "../../modules/rai-chat/agent-platform/agent-platform.types";
import { CrmAgentIntent } from "../../modules/rai-chat/agents/crm-agent.service";
import { FrontOfficeAgentIntent } from "../../modules/rai-chat/agents/front-office-agent.service";
import type { DataScientistAgentInput } from "../../modules/rai-chat/agents/data-scientist-agent.service";
import {
  ContractsAgentInput,
  ContractsAgentIntent,
} from "../../modules/rai-chat/agents/contracts-agent.service";

const CREATE_ACTION_SIGNAL =
  /созд(ай|ать)|сдела(й|ть)|добав(ь|ить)|зарегистр|оформ(и|ить)|заключ(и|ить)|сформир|зафиксир|постав(ь|ить)/i;
const UPDATE_ACTION_SIGNAL = /обнови|измени|правь|перенеси|скорректир/i;
const DELETE_ACTION_SIGNAL = /удали|убери|снеси|сними/i;

function extractQuotedFragment(message: string): string | undefined {
  const match = message.match(/[«"]([^"»]+)[»"]/u);
  return match?.[1]?.trim() || undefined;
}

export function isKnowledgeNoHit(data: unknown): boolean {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }
  return (
    typeof (data as { hits?: unknown }).hits === "number" &&
    (data as { hits: number }).hits === 0
  );
}

export function detectDataScientistIntent(
  message: string,
): DataScientistAgentInput["intent"] {
  const msg = message.toLowerCase();
  if (msg.includes("что если")) return "what_if";
  if (msg.includes("урожа")) return "yield_prediction";
  if (msg.includes("риск") || msg.includes("болезн")) return "disease_risk";
  if (
    msg.includes("оптимиз") ||
    msg.includes("затрат") ||
    msg.includes("экономи")
  ) {
    return "cost_optimization";
  }
  if (msg.includes("отчет") || msg.includes("итог")) return "seasonal_report";
  if (msg.includes("паттерн") || msg.includes("закономерн")) return "pattern_mining";
  if (
    msg.includes("прогноз") ||
    msg.includes("сценар") ||
    msg.includes("стратег") ||
    msg.includes("cash flow") ||
    msg.includes("кэш") ||
    msg.includes("марж") ||
    msg.includes("выруч") ||
    msg.includes("p50") ||
    msg.includes("p90")
  ) {
    return "strategy_forecast";
  }
  return "seasonal_report";
}

export function firstPayload(
  toolCalls: RaiToolCallDto[],
): Record<string, unknown> {
  return toolCalls[0]?.payload ?? {};
}

export function detectEconomistTool(toolCalls: RaiToolCallDto[]): RaiToolName {
  if (toolCalls.some((call) => call.name === RaiToolName.ComputeRiskAssessment)) {
    return RaiToolName.ComputeRiskAssessment;
  }
  if (toolCalls.some((call) => call.name === RaiToolName.SimulateScenario)) {
    return RaiToolName.SimulateScenario;
  }
  return RaiToolName.ComputePlanFact;
}

export function detectCrmIntent(
  toolCalls: RaiToolCallDto[],
  message: string,
): CrmAgentIntent {
  if (toolCalls.some((call) => call.name === RaiToolName.LookupCounterpartyByInn)) {
    return "lookup_counterparty_by_inn";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.RegisterCounterparty)) {
    return "register_counterparty";
  }
  if (
    toolCalls.some((call) => call.name === RaiToolName.CreateCounterpartyRelation)
  ) {
    return "create_counterparty_relation";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmAccount)) {
    return "create_crm_account";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.GetCrmAccountWorkspace)) {
    return "review_account_workspace";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmAccount)) {
    return "update_account_profile";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmContact)) {
    return "create_crm_contact";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmContact)) {
    return "update_crm_contact";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmContact)) {
    return "delete_crm_contact";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmInteraction)) {
    return "log_crm_interaction";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmInteraction)) {
    return "update_crm_interaction";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmInteraction)) {
    return "delete_crm_interaction";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreateCrmObligation)) {
    return "create_crm_obligation";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.UpdateCrmObligation)) {
    return "update_crm_obligation";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.DeleteCrmObligation)) {
    return "delete_crm_obligation";
  }

  const normalized = message.toLowerCase();
  if (/контакт/i.test(normalized)) {
    return DELETE_ACTION_SIGNAL.test(normalized)
      ? "delete_crm_contact"
      : UPDATE_ACTION_SIGNAL.test(normalized)
        ? "update_crm_contact"
        : CREATE_ACTION_SIGNAL.test(normalized)
          ? "create_crm_contact"
          : "review_account_workspace";
  }
  if (/взаимодейств|звон|встреч|созвон/i.test(normalized)) {
    return DELETE_ACTION_SIGNAL.test(normalized)
      ? "delete_crm_interaction"
      : UPDATE_ACTION_SIGNAL.test(normalized)
        ? "update_crm_interaction"
        : CREATE_ACTION_SIGNAL.test(normalized)
          ? "log_crm_interaction"
          : "review_account_workspace";
  }
  if (/обязательств|follow up|дедлайн|напомин/i.test(normalized)) {
    return DELETE_ACTION_SIGNAL.test(normalized)
      ? "delete_crm_obligation"
      : UPDATE_ACTION_SIGNAL.test(normalized)
        ? "update_crm_obligation"
        : CREATE_ACTION_SIGNAL.test(normalized)
          ? "create_crm_obligation"
          : "review_account_workspace";
  }
  if (/созд(ай|ать).*(аккаунт|клиент|карточк)|заведи.*аккаунт/i.test(normalized)) {
    return "create_crm_account";
  }
  if (
    (/инн|контрагент|контрагента|зарегистр/i.test(normalized) &&
      CREATE_ACTION_SIGNAL.test(normalized)) ||
    /зарегистр/i.test(normalized)
  ) {
    return "register_counterparty";
  }
  if (extractInnFromMessage(message)) {
    return "lookup_counterparty_by_inn";
  }
  return "review_account_workspace";
}

export function detectCrmTool(
  toolCalls: RaiToolCallDto[],
  intent: CrmAgentIntent,
): RaiToolName {
  const explicit = toolCalls[0]?.name;
  if (explicit) {
    return explicit;
  }
  switch (intent) {
    case "lookup_counterparty_by_inn":
      return RaiToolName.LookupCounterpartyByInn;
    case "register_counterparty":
      return RaiToolName.RegisterCounterparty;
    case "create_counterparty_relation":
      return RaiToolName.CreateCounterpartyRelation;
    case "create_crm_account":
      return RaiToolName.CreateCrmAccount;
    case "review_account_workspace":
      return RaiToolName.GetCrmAccountWorkspace;
    case "update_account_profile":
      return RaiToolName.UpdateCrmAccount;
    case "create_crm_contact":
      return RaiToolName.CreateCrmContact;
    case "update_crm_contact":
      return RaiToolName.UpdateCrmContact;
    case "delete_crm_contact":
      return RaiToolName.DeleteCrmContact;
    case "log_crm_interaction":
      return RaiToolName.CreateCrmInteraction;
    case "update_crm_interaction":
      return RaiToolName.UpdateCrmInteraction;
    case "delete_crm_interaction":
      return RaiToolName.DeleteCrmInteraction;
    case "create_crm_obligation":
      return RaiToolName.CreateCrmObligation;
    case "update_crm_obligation":
      return RaiToolName.UpdateCrmObligation;
    case "delete_crm_obligation":
      return RaiToolName.DeleteCrmObligation;
    default:
      return RaiToolName.GetCrmAccountWorkspace;
  }
}

export function extractInnFromMessage(message: string): string | undefined {
  const match = message.replace(/\s+/g, "").match(/\b\d{10}(?:\d{2})?\b/);
  return match?.[0];
}

export function extractCrmWorkspaceQuery(message: string): string | undefined {
  const explicit = extractQuotedFragment(message);
  if (explicit) {
    return explicit;
  }

  const directorQuestionMatch = message.match(
    /^(?:кто|как\s+зовут)\s+(?:у\s+)?(?:генеральн(?:ый|ого)\s+)?(?:директор(?:а|у|ом)?|гендир(?:ектор)?(?:а|у|ом)?|руководител(?:я|ь))\s+(.+?)\??$/iu,
  );
  if (directorQuestionMatch?.[1]) {
    const companyQuery = directorQuestionMatch[1]
      .replace(/^(?:в|у|для)\s+/iu, "")
      .replace(/[«»"]/g, "")
      .trim();
    if (companyQuery.length >= 2) {
      return companyQuery;
    }
  }

  const cleaned = message
    .replace(/^(открой|открыть|покажи|показать)\s+/i, "")
    .replace(
      /^(?:кто|как\s+зовут)\s+(?:у\s+)?(?:генеральн(?:ый|ого)\s+)?(?:директор(?:а|у|ом)?|гендир(?:ектор)?(?:а|у|ом)?|руководител(?:я|ь))\s+/iu,
      "",
    )
    .replace(/(?:^|\s)(card|workspace)(?=\s|$)/gi, " ")
    .replace(
      /(?:^|\s)(crm|карточк(?:у|а|и|е|ой)?|контрагента|контрагент|клиента|клиент|аккаунта|аккаунт|профиль)(?=\s|$)/gi,
      " ",
    )
    .replace(/[«»"]/g, "")
    .replace(/[?.!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.length >= 2 ? cleaned : undefined;
}

export function detectFrontOfficeIntent(
  toolCalls: RaiToolCallDto[],
): FrontOfficeAgentIntent {
  if (
    toolCalls.some((call) => call.name === RaiToolName.CreateFrontOfficeEscalation)
  ) {
    return "create_front_office_escalation";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.ClassifyDialogThread)) {
    return "classify_dialog_thread";
  }
  return "log_dialog_message";
}

export function detectContractsIntent(
  toolCalls: RaiToolCallDto[],
  message: string,
): ContractsAgentIntent {
  if (toolCalls.some((call) => call.name === RaiToolName.CreateCommerceContract)) {
    return "create_commerce_contract";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.ListCommerceContracts)) {
    return "list_commerce_contracts";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.GetCommerceContract)) {
    return "review_commerce_contract";
  }
  if (
    toolCalls.some((call) => call.name === RaiToolName.CreateCommerceObligation)
  ) {
    return "create_contract_obligation";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreateFulfillmentEvent)) {
    return "create_fulfillment_event";
  }
  if (
    toolCalls.some((call) => call.name === RaiToolName.CreateInvoiceFromFulfillment)
  ) {
    return "create_invoice_from_fulfillment";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.PostInvoice)) {
    return "post_invoice";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.CreatePayment)) {
    return "create_payment";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.ConfirmPayment)) {
    return "confirm_payment";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.AllocatePayment)) {
    return "allocate_payment";
  }
  if (toolCalls.some((call) => call.name === RaiToolName.GetArBalance)) {
    return "review_ar_balance";
  }

  const normalized = message.toLowerCase();
  if (/дебитор|ar balance|остаток.*счет|задолжен/i.test(normalized)) {
    return "review_ar_balance";
  }
  if (/разнес|аллокац/i.test(normalized)) {
    return "allocate_payment";
  }
  if (/подтверд.*оплат/i.test(normalized)) {
    return "confirm_payment";
  }
  if (CREATE_ACTION_SIGNAL.test(normalized) && /(платеж|оплат)/i.test(normalized)) {
    return "create_payment";
  }
  if (/провед.*счет|опубликуй.*счет|post invoice/i.test(normalized)) {
    return "post_invoice";
  }
  if (/сформир.*счет|созд(ай|ать).*(счет|инвойс)/i.test(normalized)) {
    return "create_invoice_from_fulfillment";
  }
  if (
    CREATE_ACTION_SIGNAL.test(normalized) &&
    /исполнени|отгрузк|shipment/i.test(normalized)
  ) {
    return "create_fulfillment_event";
  }
  if (CREATE_ACTION_SIGNAL.test(normalized) && /обязательств/i.test(normalized)) {
    return "create_contract_obligation";
  }
  if (isContractsReviewQuery(normalized)) {
    return "review_commerce_contract";
  }
  if (isContractsListQuery(normalized)) {
    return "list_commerce_contracts";
  }
  if (
    CREATE_ACTION_SIGNAL.test(normalized) &&
    /(договор|контракт)/i.test(normalized)
  ) {
    return "create_commerce_contract";
  }
  return "list_commerce_contracts";
}

export function detectContractsTool(
  toolCalls: RaiToolCallDto[],
  intent: ContractsAgentIntent,
): RaiToolName {
  const explicit = toolCalls[0]?.name;
  if (explicit) {
    return explicit;
  }
  switch (intent) {
    case "create_commerce_contract":
      return RaiToolName.CreateCommerceContract;
    case "list_commerce_contracts":
      return RaiToolName.ListCommerceContracts;
    case "review_commerce_contract":
      return RaiToolName.GetCommerceContract;
    case "create_contract_obligation":
      return RaiToolName.CreateCommerceObligation;
    case "create_fulfillment_event":
      return RaiToolName.CreateFulfillmentEvent;
    case "create_invoice_from_fulfillment":
      return RaiToolName.CreateInvoiceFromFulfillment;
    case "post_invoice":
      return RaiToolName.PostInvoice;
    case "create_payment":
      return RaiToolName.CreatePayment;
    case "confirm_payment":
      return RaiToolName.ConfirmPayment;
    case "allocate_payment":
      return RaiToolName.AllocatePayment;
    case "review_ar_balance":
      return RaiToolName.GetArBalance;
    default:
      return RaiToolName.ListCommerceContracts;
  }
}

export function detectFrontOfficeTool(
  toolCalls: RaiToolCallDto[],
  intent: FrontOfficeAgentIntent,
): RaiToolName {
  const explicit = toolCalls[0]?.name;
  if (explicit) {
    return explicit;
  }
  switch (intent) {
    case "classify_dialog_thread":
      return RaiToolName.ClassifyDialogThread;
    case "create_front_office_escalation":
      return RaiToolName.CreateFrontOfficeEscalation;
    default:
      return RaiToolName.LogDialogMessage;
  }
}

export function resolveEntityId(
  request: AgentExecutionRequest,
  kinds: string[],
): string | undefined {
  const selected = request.workspaceContext?.selectedRowSummary;
  if (
    selected?.id &&
    selected.kind &&
    kinds.includes(selected.kind.toLowerCase())
  ) {
    return selected.id;
  }
  const activeRef = request.workspaceContext?.activeEntityRefs?.find((item) =>
    kinds.includes(item.kind),
  );
  return activeRef?.id;
}

export function resolveAccountId(
  request: AgentExecutionRequest,
): string | undefined {
  const selected = request.workspaceContext?.selectedRowSummary;
  if (
    selected?.id &&
    (!selected.kind ||
      ["account", "party", "farm", "holding"].includes(
        selected.kind.toLowerCase(),
      ))
  ) {
    return selected.id;
  }
  const activeRef = request.workspaceContext?.activeEntityRefs?.find((item) =>
    ["party", "account", "farm", "holding"].includes(item.kind),
  );
  return activeRef?.id;
}

export function buildInteractionSummary(message: string): string {
  return message.trim().slice(0, 500);
}

export function buildObligationDescription(message: string): string {
  return message.trim().slice(0, 500);
}

export function extractContractNumber(message: string): string | undefined {
  const match = message.match(/\b([A-ZА-Я]{1,4}-?\d{2,4}-?\d{1,6})\b/u);
  return match?.[1];
}

export function extractContractReviewQuery(message: string): string | undefined {
  const explicit = extractQuotedFragment(message);
  if (explicit) {
    return explicit;
  }

  const contractNumber = extractContractNumber(message);
  if (contractNumber) {
    return contractNumber;
  }

  const descriptorMatch = message.match(
    /(?:договор|контракт)\s+№?\s*([A-ZА-Я0-9-]{3,})/iu,
  );
  const candidate = descriptorMatch?.[1]?.trim();
  if (candidate && !/^(все|реестр|список)$/iu.test(candidate)) {
    return candidate;
  }

  return undefined;
}

function hasContractsWriteSignal(message: string): boolean {
  return (
    CREATE_ACTION_SIGNAL.test(message) ||
    UPDATE_ACTION_SIGNAL.test(message) ||
    DELETE_ACTION_SIGNAL.test(message) ||
    /счет|инвойс|invoice|оплат|платеж|разнес|аллокац|обязательств|исполнени|отгрузк|shipment/i.test(
      message,
    )
  );
}

function isContractsListQuery(message: string): boolean {
  return (
    /(договор|контракт)/i.test(message) &&
    /(реестр|список|перечень|все\s+(?:договор|контракт)|договоры|контракты|какие\s+(?:договоры|контракты))/i.test(
      message,
    )
  );
}

function isContractsReviewQuery(message: string): boolean {
  if (!/(договор|контракт)/i.test(message)) {
    return false;
  }
  if (hasContractsWriteSignal(message)) {
    return false;
  }
  return (
    /(карточк|открой|подробн|детал|номер|№)/i.test(message) ||
    Boolean(extractContractReviewQuery(message))
  );
}

export function extractContractType(message: string): string | undefined {
  const normalized = message.toLowerCase();
  if (/аренд/i.test(normalized)) return "LEASE";
  if (/агент/i.test(normalized)) return "AGENCY";
  if (/услуг/i.test(normalized)) return "SERVICE";
  if (/поставк|договор/i.test(normalized)) return "SUPPLY";
  return undefined;
}

export function extractObligationType(
  message: string,
): "DELIVER" | "PAY" | "PERFORM" | undefined {
  const normalized = message.toLowerCase();
  if (/оплат/i.test(normalized)) return "PAY";
  if (/исполн|услуг/i.test(normalized)) return "PERFORM";
  if (/постав|отгруз/i.test(normalized)) return "DELIVER";
  return undefined;
}

export function extractEventDomain(
  message: string,
): "COMMERCIAL" | "PRODUCTION" | "LOGISTICS" | "FINANCE_ADJ" | undefined {
  const normalized = message.toLowerCase();
  if (/логист/i.test(normalized)) return "LOGISTICS";
  if (/производ|урож|материал/i.test(normalized)) return "PRODUCTION";
  if (/финанс/i.test(normalized)) return "FINANCE_ADJ";
  if (/исполн|отгруз|shipment|service/i.test(normalized)) return "COMMERCIAL";
  return undefined;
}

export function isKnownFulfillmentEventType(
  value: unknown,
): value is ContractsAgentInput["eventType"] {
  return (
    value === "GOODS_SHIPMENT" ||
    value === "SERVICE_ACT" ||
    value === "LEASE_USAGE" ||
    value === "MATERIAL_CONSUMPTION" ||
    value === "HARVEST" ||
    value === "INTERNAL_TRANSFER" ||
    value === "WRITE_OFF"
  );
}

export function extractEventType(
  message: string,
): ContractsAgentInput["eventType"] {
  const normalized = message.toLowerCase();
  if (/отгруз|shipment/i.test(normalized)) return "GOODS_SHIPMENT";
  if (/аренд/i.test(normalized)) return "LEASE_USAGE";
  if (/урож/i.test(normalized)) return "HARVEST";
  if (/списа/i.test(normalized)) return "WRITE_OFF";
  if (/перемещ/i.test(normalized)) return "INTERNAL_TRANSFER";
  if (/материал/i.test(normalized)) return "MATERIAL_CONSUMPTION";
  return "SERVICE_ACT";
}

export function extractSupplyType(
  message: string,
): "GOODS" | "SERVICE" | "LEASE" | undefined {
  const normalized = message.toLowerCase();
  if (/аренд/i.test(normalized)) return "LEASE";
  if (/услуг|service/i.test(normalized)) return "SERVICE";
  if (/товар|постав|отгруз|goods/i.test(normalized)) return "GOODS";
  return undefined;
}
