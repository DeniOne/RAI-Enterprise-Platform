import { Injectable } from "@nestjs/common";
import {
  LookupCounterpartyByInnResult,
  CreateCounterpartyRelationResult,
  CreateCrmAccountResult,
  CreateCrmContactResult,
  CreateCrmInteractionResult,
  CreateCrmObligationResult,
  DeleteCrmContactResult,
  DeleteCrmInteractionResult,
  DeleteCrmObligationResult,
  GetCrmAccountWorkspaceResult,
  RaiToolActorContext,
  RaiToolName,
  RegisterCounterpartyResult,
  UpdateCrmAccountResult,
  UpdateCrmContactResult,
  UpdateCrmInteractionResult,
  UpdateCrmObligationResult,
} from "../tools/rai-tools.types";
import { CrmToolsRegistry } from "../tools/crm-tools.registry";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";

export type CrmAgentIntent =
  | "lookup_counterparty_by_inn"
  | "register_counterparty"
  | "create_counterparty_relation"
  | "create_crm_account"
  | "review_account_workspace"
  | "update_account_profile"
  | "create_crm_contact"
  | "update_crm_contact"
  | "delete_crm_contact"
  | "log_crm_interaction"
  | "update_crm_interaction"
  | "delete_crm_interaction"
  | "create_crm_obligation"
  | "update_crm_obligation"
  | "delete_crm_obligation";

export interface CrmAgentInput {
  companyId: string;
  traceId: string;
  userId?: string;
  userRole?: string;
  userConfirmed?: boolean;
  intent: CrmAgentIntent;
  inn?: string;
  jurisdictionCode?: "RU" | "BY" | "KZ";
  partyType?: "LEGAL_ENTITY" | "IP" | "KFH";
  fromPartyId?: string;
  toPartyId?: string;
  relationType?: "OWNERSHIP" | "MANAGEMENT" | "AFFILIATED" | "AGENCY";
  sharePct?: number;
  validFrom?: string;
  validTo?: string;
  accountId?: string;
  query?: string;
  accountPayload?: {
    name?: string;
    inn?: string;
    type?: string;
    holdingId?: string;
  };
  updatePayload?: {
    name?: string;
    inn?: string | null;
    type?: string;
    status?: string;
    holdingId?: string | null;
    jurisdiction?: string | null;
    riskCategory?: string;
    strategicValue?: string;
  };
  contactId?: string;
  contactPayload?: {
    firstName?: string;
    lastName?: string | null;
    role?: string;
    influenceLevel?: number | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
  };
  interactionPayload?: {
    interactionId?: string;
    type?: string;
    summary?: string;
    date?: string;
    contactId?: string | null;
    relatedEventId?: string | null;
  };
  obligationPayload?: {
    obligationId?: string;
    description?: string;
    dueDate?: string;
    responsibleUserId?: string | null;
    status?: string;
  };
}

export interface CrmAgentResult {
  agentName: "CrmAgent";
  status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
  data: unknown;
  confidence: number;
  missingContext: string[];
  explain: string;
  toolCallsCount: number;
  traceId: string;
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

const INTENT_TOOL: Record<CrmAgentIntent, RaiToolName> = {
  lookup_counterparty_by_inn: RaiToolName.LookupCounterpartyByInn,
  register_counterparty: RaiToolName.RegisterCounterparty,
  create_counterparty_relation: RaiToolName.CreateCounterpartyRelation,
  create_crm_account: RaiToolName.CreateCrmAccount,
  review_account_workspace: RaiToolName.GetCrmAccountWorkspace,
  update_account_profile: RaiToolName.UpdateCrmAccount,
  create_crm_contact: RaiToolName.CreateCrmContact,
  update_crm_contact: RaiToolName.UpdateCrmContact,
  delete_crm_contact: RaiToolName.DeleteCrmContact,
  log_crm_interaction: RaiToolName.CreateCrmInteraction,
  update_crm_interaction: RaiToolName.UpdateCrmInteraction,
  delete_crm_interaction: RaiToolName.DeleteCrmInteraction,
  create_crm_obligation: RaiToolName.CreateCrmObligation,
  update_crm_obligation: RaiToolName.UpdateCrmObligation,
  delete_crm_obligation: RaiToolName.DeleteCrmObligation,
};

function hasAnyDefined(values: Array<unknown>): boolean {
  return values.some((value) => value !== undefined);
}

function explainLookupRegistration(data: RegisterCounterpartyResult): string {
  if (data.alreadyExisted) {
    return `Контрагент уже зарегистрирован: ${data.legalName} (${data.partyId}). Дубликат не создан.`;
  }
  return `Контрагент ${data.legalName} зарегистрирован в реестре. ИНН: ${data.inn ?? "не указан"}, карточка: ${data.partyId}.`;
}

function explainLookupByInn(data: LookupCounterpartyByInnResult): string {
  if (data.status === "NOT_FOUND") {
    return "Контрагент по этому ИНН не найден в источниках и реестре.";
  }
  const legalName = data.result?.legalName ?? data.existingPartyName ?? "контрагент";
  if (data.existingPartyId) {
    return `Контрагент найден: ${legalName}. Уже есть в реестре: ${data.existingPartyId}.`;
  }
  return `Контрагент найден: ${legalName}. Можно зарегистрировать его в реестре.`;
}

function explainRelation(data: CreateCounterpartyRelationResult): string {
  return `Связь контрагентов создана: ${data.fromPartyId} -> ${data.toPartyId}, тип ${data.relationType}.`;
}

function explainAccountCreate(data: CreateCrmAccountResult): string {
  return `CRM-аккаунт ${data.name} создан. Карточка: ${data.accountId}.`;
}

function explainWorkspace(data: GetCrmAccountWorkspaceResult): string {
  const contacts = Array.isArray(data.contacts) ? data.contacts.length : 0;
  const interactions = Array.isArray(data.interactions) ? data.interactions.length : 0;
  const obligations = Array.isArray(data.obligations) ? data.obligations.length : 0;
  const accountName =
    data.account && typeof data.account === "object"
      ? String((data.account as Record<string, unknown>).name ?? (data.account as Record<string, unknown>).id ?? "аккаунт")
      : "аккаунт";
  return `Карточка ${accountName}: контактов ${contacts}, взаимодействий ${interactions}, активных обязательств ${obligations}.`;
}

function explainAccountUpdate(data: UpdateCrmAccountResult): string {
  return `Профиль аккаунта ${data.accountId} обновлён. Статус: ${data.status ?? "без изменений"}, риск: ${data.riskCategory ?? "без изменений"}.`;
}

function explainContactCreate(data: CreateCrmContactResult): string {
  return `Контакт ${data.firstName}${data.lastName ? ` ${data.lastName}` : ""} создан для аккаунта ${data.accountId}.`;
}

function explainContactUpdate(data: UpdateCrmContactResult): string {
  return `Контакт ${data.contactId} обновлён.`;
}

function explainContactDelete(data: DeleteCrmContactResult): string {
  return `Контакт ${data.contactId} удалён из CRM.`;
}

function explainInteraction(data: CreateCrmInteractionResult): string {
  return `CRM-взаимодействие создано для аккаунта ${data.accountId}: ${data.type}, дата ${data.date}.`;
}

function explainInteractionUpdate(data: UpdateCrmInteractionResult): string {
  return `CRM-взаимодействие ${data.interactionId} обновлено.`;
}

function explainInteractionDelete(data: DeleteCrmInteractionResult): string {
  return `CRM-взаимодействие ${data.interactionId} удалено.`;
}

function explainObligation(data: CreateCrmObligationResult): string {
  return `Обязательство создано для аккаунта ${data.accountId} со сроком ${data.dueDate}.`;
}

function explainObligationUpdate(data: UpdateCrmObligationResult): string {
  return `Обязательство ${data.obligationId} обновлено.`;
}

function explainObligationDelete(data: DeleteCrmObligationResult): string {
  return `Обязательство ${data.obligationId} удалено.`;
}

@Injectable()
export class CrmAgent {
  constructor(
    private readonly crmToolsRegistry: CrmToolsRegistry,
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly promptAssembly: AgentPromptAssemblyService,
  ) {}

  async run(
    input: CrmAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<CrmAgentResult> {
    const missingContext = this.resolveMissingContext(input);
    if (missingContext.length > 0) {
      return {
        agentName: "CrmAgent",
        status: "NEEDS_MORE_DATA",
        data: {},
        confidence: 0,
        missingContext,
        explain: `Не хватает контекста: ${missingContext.join(", ")}`,
        toolCallsCount: 0,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: false,
      };
    }

    const actorContext: RaiToolActorContext = {
      companyId: input.companyId,
      traceId: input.traceId,
      userId: input.userId,
      userRole: input.userRole,
      userConfirmed: input.userConfirmed,
    };
    const toolName = INTENT_TOOL[input.intent];

    try {
      const data = await this.executeIntent(toolName, input, actorContext);
      const synthesis = await this.synthesize(
        input.intent,
        data,
        options?.kernel,
        options?.request,
      );
      return {
        agentName: "CrmAgent",
        status: "COMPLETED",
        data,
        confidence: synthesis.fallbackUsed ? 0.86 : 0.91,
        missingContext: [],
        explain: synthesis.text,
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: this.buildEvidence(input.intent, toolName, data),
        fallbackUsed: synthesis.fallbackUsed,
      };
    } catch (err) {
      return {
        agentName: "CrmAgent",
        status: "FAILED",
        data: {},
        confidence: 0,
        missingContext: [],
        explain: String((err as Error).message),
        toolCallsCount: 1,
        traceId: input.traceId,
        evidence: [],
        fallbackUsed: true,
      };
    }
  }

  private resolveMissingContext(input: CrmAgentInput): string[] {
    switch (input.intent) {
      case "lookup_counterparty_by_inn":
        return input.inn ? [] : ["inn"];
      case "register_counterparty":
        return input.inn ? [] : ["inn"];
      case "create_counterparty_relation": {
        const missing: string[] = [];
        if (!input.fromPartyId) missing.push("fromPartyId");
        if (!input.toPartyId) missing.push("toPartyId");
        if (!input.relationType) missing.push("relationType");
        if (!input.validFrom) missing.push("validFrom");
        return missing;
      }
      case "create_crm_account":
        return input.accountPayload?.name ? [] : ["accountName"];
      case "create_crm_contact": {
        const missing: string[] = [];
        if (!input.accountId) missing.push("accountId");
        if (!input.contactPayload?.firstName) missing.push("contactFirstName");
        return missing;
      }
      case "update_crm_contact":
        if (!input.contactId) return ["contactId"];
        return hasAnyDefined([
          input.contactPayload?.firstName,
          input.contactPayload?.lastName,
          input.contactPayload?.role,
          input.contactPayload?.influenceLevel,
          input.contactPayload?.email,
          input.contactPayload?.phone,
          input.contactPayload?.source,
        ])
          ? []
          : ["contactUpdatePayload"];
      case "delete_crm_contact":
        return input.contactId ? [] : ["contactId"];
      case "review_account_workspace":
      case "update_account_profile":
      case "log_crm_interaction": {
        const missing: string[] = [];
        if (
          input.intent === "review_account_workspace" &&
          !input.accountId &&
          !input.query
        ) {
          missing.push("accountId");
        } else if (input.intent !== "review_account_workspace" && !input.accountId) {
          missing.push("accountId");
        }
        if (input.intent === "log_crm_interaction" && !input.interactionPayload?.summary) {
          missing.push("interactionSummary");
        }
        return missing;
      }
      case "update_crm_interaction":
        if (!input.interactionPayload?.interactionId) return ["interactionId"];
        return hasAnyDefined([
          input.interactionPayload?.type,
          input.interactionPayload?.summary,
          input.interactionPayload?.date,
          input.interactionPayload?.contactId,
          input.interactionPayload?.relatedEventId,
        ])
          ? []
          : ["interactionUpdatePayload"];
      case "delete_crm_interaction":
        return input.interactionPayload?.interactionId ? [] : ["interactionId"];
      case "create_crm_obligation": {
        const missing: string[] = [];
        if (!input.accountId) missing.push("accountId");
        if (!input.obligationPayload?.description) missing.push("obligationDescription");
        if (!input.obligationPayload?.dueDate) missing.push("dueDate");
        return missing;
      }
      case "update_crm_obligation":
        if (!input.obligationPayload?.obligationId) return ["obligationId"];
        return hasAnyDefined([
          input.obligationPayload?.description,
          input.obligationPayload?.dueDate,
          input.obligationPayload?.responsibleUserId,
          input.obligationPayload?.status,
        ])
          ? []
          : ["obligationUpdatePayload"];
      case "delete_crm_obligation":
        return input.obligationPayload?.obligationId ? [] : ["obligationId"];
      default:
        return [];
    }
  }

  private async executeIntent(
    toolName: RaiToolName,
    input: CrmAgentInput,
    actorContext: RaiToolActorContext,
  ) {
    switch (toolName) {
      case RaiToolName.LookupCounterpartyByInn:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            inn: input.inn!,
            jurisdictionCode: input.jurisdictionCode,
            partyType: input.partyType,
          },
          actorContext,
        );
      case RaiToolName.RegisterCounterparty:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            inn: input.inn!,
            jurisdictionCode: input.jurisdictionCode,
            partyType: input.partyType,
          },
          actorContext,
        );
      case RaiToolName.CreateCounterpartyRelation:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            fromPartyId: input.fromPartyId!,
            toPartyId: input.toPartyId!,
            relationType: input.relationType!,
            sharePct: input.sharePct,
            validFrom: input.validFrom!,
            validTo: input.validTo,
          },
          actorContext,
        );
      case RaiToolName.CreateCrmAccount:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            name: input.accountPayload?.name!,
            inn: input.accountPayload?.inn,
            type: input.accountPayload?.type,
            holdingId: input.accountPayload?.holdingId,
          },
          actorContext,
        );
      case RaiToolName.GetCrmAccountWorkspace:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            ...(input.accountId ? { accountId: input.accountId } : {}),
            ...(input.query ? { query: input.query } : {}),
          },
          actorContext,
        );
      case RaiToolName.UpdateCrmAccount:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            accountId: input.accountId!,
            ...(input.updatePayload ?? {}),
          },
          actorContext,
        );
      case RaiToolName.CreateCrmContact:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            accountId: input.accountId!,
            firstName: input.contactPayload?.firstName!,
            lastName: input.contactPayload?.lastName ?? undefined,
            role: input.contactPayload?.role,
            influenceLevel: input.contactPayload?.influenceLevel ?? undefined,
            email: input.contactPayload?.email ?? undefined,
            phone: input.contactPayload?.phone ?? undefined,
            source: input.contactPayload?.source ?? undefined,
          },
          actorContext,
        );
      case RaiToolName.UpdateCrmContact:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            contactId: input.contactId!,
            firstName: input.contactPayload?.firstName,
            lastName: input.contactPayload?.lastName,
            role: input.contactPayload?.role,
            influenceLevel: input.contactPayload?.influenceLevel,
            email: input.contactPayload?.email,
            phone: input.contactPayload?.phone,
            source: input.contactPayload?.source,
          },
          actorContext,
        );
      case RaiToolName.DeleteCrmContact:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            contactId: input.contactId!,
          },
          actorContext,
        );
      case RaiToolName.CreateCrmInteraction:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            accountId: input.accountId!,
            type: input.interactionPayload?.type ?? "CALL",
            summary: input.interactionPayload?.summary!,
            date: input.interactionPayload?.date,
            contactId: input.interactionPayload?.contactId,
            relatedEventId: input.interactionPayload?.relatedEventId,
          },
          actorContext,
        );
      case RaiToolName.UpdateCrmInteraction:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            interactionId: input.interactionPayload?.interactionId!,
            type: input.interactionPayload?.type,
            summary: input.interactionPayload?.summary,
            date: input.interactionPayload?.date,
            contactId: input.interactionPayload?.contactId,
            relatedEventId: input.interactionPayload?.relatedEventId,
          },
          actorContext,
        );
      case RaiToolName.DeleteCrmInteraction:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            interactionId: input.interactionPayload?.interactionId!,
          },
          actorContext,
        );
      case RaiToolName.CreateCrmObligation:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            accountId: input.accountId!,
            description: input.obligationPayload?.description!,
            dueDate: input.obligationPayload?.dueDate!,
            responsibleUserId: input.obligationPayload?.responsibleUserId,
            status: input.obligationPayload?.status,
          },
          actorContext,
        );
      case RaiToolName.UpdateCrmObligation:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            obligationId: input.obligationPayload?.obligationId!,
            description: input.obligationPayload?.description,
            dueDate: input.obligationPayload?.dueDate,
            responsibleUserId: input.obligationPayload?.responsibleUserId,
            status: input.obligationPayload?.status,
          },
          actorContext,
        );
      case RaiToolName.DeleteCrmObligation:
        return this.crmToolsRegistry.execute(
          toolName,
          {
            obligationId: input.obligationPayload?.obligationId!,
          },
          actorContext,
        );
      default:
        throw new Error(`CRM intent tool not supported: ${toolName}`);
    }
  }

  private async synthesize(
    intent: CrmAgentIntent,
    data: unknown,
    kernel?: EffectiveAgentKernelEntry,
    request?: AgentExecutionRequest,
  ): Promise<{ text: string; fallbackUsed: boolean }> {
    const fallbackText = this.buildFallbackExplain(intent, data);
    if (!kernel || !request) {
      return { text: fallbackText, fallbackUsed: true };
    }

    try {
      const llm = await this.openRouterGateway.generate({
        traceId: request.traceId,
        agentRole: "crm_agent",
        model: kernel.runtimeProfile.model,
        messages: this.promptAssembly.buildMessages(kernel, request).concat([
          {
            role: "user",
            content: `CRM-результат: ${JSON.stringify(data)}. Объясни результат строго по данным, без выдумывания фактов и с акцентом на следующий управленческий шаг.`,
          },
        ]),
        temperature: kernel.runtimeProfile.temperature,
        maxTokens: kernel.runtimeProfile.maxOutputTokens,
        timeoutMs: kernel.runtimeProfile.timeoutMs,
      });
      return { text: llm.outputText, fallbackUsed: false };
    } catch {
      return { text: fallbackText, fallbackUsed: true };
    }
  }

  private buildFallbackExplain(intent: CrmAgentIntent, data: unknown): string {
    switch (intent) {
      case "lookup_counterparty_by_inn":
        return explainLookupByInn(data as LookupCounterpartyByInnResult);
      case "register_counterparty":
        return explainLookupRegistration(data as RegisterCounterpartyResult);
      case "create_counterparty_relation":
        return explainRelation(data as CreateCounterpartyRelationResult);
      case "create_crm_account":
        return explainAccountCreate(data as CreateCrmAccountResult);
      case "review_account_workspace":
        return explainWorkspace(data as GetCrmAccountWorkspaceResult);
      case "update_account_profile":
        return explainAccountUpdate(data as UpdateCrmAccountResult);
      case "create_crm_contact":
        return explainContactCreate(data as CreateCrmContactResult);
      case "update_crm_contact":
        return explainContactUpdate(data as UpdateCrmContactResult);
      case "delete_crm_contact":
        return explainContactDelete(data as DeleteCrmContactResult);
      case "log_crm_interaction":
        return explainInteraction(data as CreateCrmInteractionResult);
      case "update_crm_interaction":
        return explainInteractionUpdate(data as UpdateCrmInteractionResult);
      case "delete_crm_interaction":
        return explainInteractionDelete(data as DeleteCrmInteractionResult);
      case "create_crm_obligation":
        return explainObligation(data as CreateCrmObligationResult);
      case "update_crm_obligation":
        return explainObligationUpdate(data as UpdateCrmObligationResult);
      case "delete_crm_obligation":
        return explainObligationDelete(data as DeleteCrmObligationResult);
      default:
        return "CRM-операция выполнена.";
    }
  }

  private buildEvidence(
    intent: CrmAgentIntent,
    toolName: RaiToolName,
    data: unknown,
  ): EvidenceReference[] {
    const claim =
      intent === "lookup_counterparty_by_inn"
        ? `Поиск контрагента по ИНН подтвержден результатом ${toolName}.`
      : intent === "register_counterparty"
        ? `Регистрация контрагента подтверждена результатом ${toolName}.`
        : intent === "create_counterparty_relation"
          ? `Связь контрагентов подтверждена результатом ${toolName}.`
          : intent === "create_crm_account"
            ? `Создание CRM-аккаунта подтверждено результатом ${toolName}.`
          : intent === "review_account_workspace"
            ? `CRM-карточка подтверждена данными ${toolName}.`
            : intent === "update_account_profile"
              ? `Изменение профиля подтверждено результатом ${toolName}.`
              : intent === "create_crm_contact"
                ? `Создание контакта подтверждено результатом ${toolName}.`
                : intent === "update_crm_contact"
                  ? `Обновление контакта подтверждено результатом ${toolName}.`
                  : intent === "delete_crm_contact"
                    ? `Удаление контакта подтверждено результатом ${toolName}.`
                : intent === "log_crm_interaction"
                  ? `Взаимодействие подтверждено результатом ${toolName}.`
                  : intent === "update_crm_interaction"
                    ? `Обновление взаимодействия подтверждено результатом ${toolName}.`
                    : intent === "delete_crm_interaction"
                      ? `Удаление взаимодействия подтверждено результатом ${toolName}.`
                      : intent === "create_crm_obligation"
                        ? `Обязательство подтверждено результатом ${toolName}.`
                        : intent === "update_crm_obligation"
                          ? `Обновление обязательства подтверждено результатом ${toolName}.`
                          : `Удаление обязательства подтверждено результатом ${toolName}.`;

    const confidence =
      intent === "review_account_workspace" ? 0.9 : 0.92;

    return [
      {
        claim,
        sourceType: "TOOL_RESULT",
        sourceId: toolName,
        confidenceScore: confidence,
      },
      {
        claim: `Структурный CRM-результат: ${JSON.stringify(data).slice(0, 240)}`,
        sourceType: "TOOL_RESULT",
        sourceId: `${toolName}_preview`,
        confidenceScore: 0.8,
      },
    ];
  }
}
