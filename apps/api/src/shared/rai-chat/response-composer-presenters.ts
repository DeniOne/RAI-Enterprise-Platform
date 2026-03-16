import { RaiWorkWindowDto } from "./rai-chat.dto";
import {
  AllocatePaymentResult,
  ConfirmPaymentResult,
  CreateCommerceContractResult,
  CreateCommerceObligationResult,
  CreateCounterpartyRelationResult,
  CreateCrmAccountResult,
  CreateCrmContactResult,
  CreateCrmInteractionResult,
  CreateCrmObligationResult,
  CreateFulfillmentEventResult,
  CreateInvoiceFromFulfillmentResult,
  CreatePaymentResult,
  DeleteCrmContactResult,
  DeleteCrmInteractionResult,
  DeleteCrmObligationResult,
  GetArBalanceResult,
  GetCommerceContractResult,
  GetCrmAccountWorkspaceResult,
  ListCommerceContractsResult,
  PostInvoiceResult,
  RaiToolName,
  RegisterCounterpartyResult,
  UpdateCrmAccountResult,
  UpdateCrmContactResult,
  UpdateCrmInteractionResult,
  UpdateCrmObligationResult,
} from "./rai-tools.types";

export type CrmWindowIntent = Extract<
  RaiWorkWindowDto["payload"]["intentId"],
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
  | "delete_crm_obligation"
>;

export type ContractsWindowIntent = Extract<
  RaiWorkWindowDto["payload"]["intentId"],
  | "create_commerce_contract"
  | "list_commerce_contracts"
  | "review_commerce_contract"
  | "create_contract_obligation"
  | "create_fulfillment_event"
  | "create_invoice_from_fulfillment"
  | "post_invoice"
  | "create_payment"
  | "confirm_payment"
  | "allocate_payment"
  | "review_ar_balance"
>;

type WindowSection = NonNullable<RaiWorkWindowDto["payload"]["sections"]>;

export function buildToolDisplayName(toolName: RaiToolName): string {
  switch (toolName) {
    case RaiToolName.RegisterCounterparty:
      return "регистрация контрагента";
    case RaiToolName.CreateCounterpartyRelation:
      return "создание связи контрагентов";
    case RaiToolName.CreateCrmAccount:
      return "создание CRM-аккаунта";
    case RaiToolName.UpdateCrmAccount:
      return "обновление профиля аккаунта";
    case RaiToolName.CreateCrmContact:
      return "создание контакта";
    case RaiToolName.UpdateCrmContact:
      return "обновление контакта";
    case RaiToolName.DeleteCrmContact:
      return "удаление контакта";
    case RaiToolName.CreateCrmInteraction:
      return "создание взаимодействия";
    case RaiToolName.UpdateCrmInteraction:
      return "обновление взаимодействия";
    case RaiToolName.DeleteCrmInteraction:
      return "удаление взаимодействия";
    case RaiToolName.CreateCrmObligation:
      return "создание обязательства";
    case RaiToolName.UpdateCrmObligation:
      return "обновление обязательства";
    case RaiToolName.DeleteCrmObligation:
      return "удаление обязательства";
    case RaiToolName.CreateCommerceContract:
      return "создание договора";
    case RaiToolName.ListCommerceContracts:
      return "просмотр реестра договоров";
    case RaiToolName.GetCommerceContract:
      return "просмотр карточки договора";
    case RaiToolName.CreateCommerceObligation:
      return "создание договорного обязательства";
    case RaiToolName.CreateFulfillmentEvent:
      return "фиксация исполнения";
    case RaiToolName.CreateInvoiceFromFulfillment:
      return "создание счета";
    case RaiToolName.PostInvoice:
      return "проведение счета";
    case RaiToolName.ListInvoices:
      return "просмотр счетов";
    case RaiToolName.CreatePayment:
      return "создание платежа";
    case RaiToolName.ConfirmPayment:
      return "подтверждение платежа";
    case RaiToolName.AllocatePayment:
      return "аллокация платежа";
    case RaiToolName.GetArBalance:
      return "просмотр дебиторского остатка";
    default:
      return toolName;
  }
}

export function buildCrmTitle(intent: CrmWindowIntent): string {
  switch (intent) {
    case "register_counterparty":
      return "Контрагент зарегистрирован";
    case "create_counterparty_relation":
      return "Связь контрагентов создана";
    case "create_crm_account":
      return "CRM-аккаунт создан";
    case "review_account_workspace":
      return "Рабочее пространство аккаунта";
    case "update_account_profile":
      return "Профиль аккаунта обновлён";
    case "create_crm_contact":
      return "Контакт создан";
    case "update_crm_contact":
      return "Контакт обновлён";
    case "delete_crm_contact":
      return "Контакт удалён";
    case "log_crm_interaction":
      return "CRM-взаимодействие сохранено";
    case "update_crm_interaction":
      return "CRM-взаимодействие обновлено";
    case "delete_crm_interaction":
      return "CRM-взаимодействие удалено";
    case "create_crm_obligation":
      return "Обязательство создано";
    case "update_crm_obligation":
      return "Обязательство обновлено";
    case "delete_crm_obligation":
      return "Обязательство удалено";
    default:
      return "Результат CRM-агента";
  }
}

export function buildCrmSummary(
  intent: CrmWindowIntent,
  data: unknown,
  fallbackText: string,
): string {
  if (intent === "register_counterparty") {
    const result = data as RegisterCounterpartyResult;
    return result.alreadyExisted
      ? `Контрагент уже был в реестре: ${result.legalName}.`
      : `Создана карточка контрагента ${result.legalName}.`;
  }
  if (intent === "create_counterparty_relation") {
    const result = data as CreateCounterpartyRelationResult;
    return `Создана связь ${result.fromPartyId} -> ${result.toPartyId}.`;
  }
  if (intent === "create_crm_account") {
    const result = data as CreateCrmAccountResult;
    return `Создан CRM-аккаунт ${result.name}.`;
  }
  if (intent === "review_account_workspace") {
    const result = data as GetCrmAccountWorkspaceResult;
    const account = result.account as Record<string, unknown>;
    return `Карточка ${String(account?.name ?? account?.id ?? "клиента")} загружена.`;
  }
  if (intent === "update_account_profile") {
    const result = data as UpdateCrmAccountResult;
    return `Профиль аккаунта ${result.accountId} обновлён.`;
  }
  if (intent === "create_crm_contact") {
    const result = data as CreateCrmContactResult;
    return `Контакт ${result.firstName}${result.lastName ? ` ${result.lastName}` : ""} создан.`;
  }
  if (intent === "update_crm_contact") {
    const result = data as UpdateCrmContactResult;
    return `Контакт ${result.contactId} обновлён.`;
  }
  if (intent === "delete_crm_contact") {
    const result = data as DeleteCrmContactResult;
    return `Контакт ${result.contactId} удалён.`;
  }
  if (intent === "log_crm_interaction") {
    const result = data as CreateCrmInteractionResult;
    return `Взаимодействие ${result.interactionId} сохранено.`;
  }
  if (intent === "update_crm_interaction") {
    const result = data as UpdateCrmInteractionResult;
    return `Взаимодействие ${result.interactionId} обновлено.`;
  }
  if (intent === "delete_crm_interaction") {
    const result = data as DeleteCrmInteractionResult;
    return `Взаимодействие ${result.interactionId} удалено.`;
  }
  if (intent === "create_crm_obligation") {
    const result = data as CreateCrmObligationResult;
    return `Обязательство ${result.obligationId} поставлено в работу.`;
  }
  if (intent === "update_crm_obligation") {
    const result = data as UpdateCrmObligationResult;
    return `Обязательство ${result.obligationId} обновлено.`;
  }
  if (intent === "delete_crm_obligation") {
    const result = data as DeleteCrmObligationResult;
    return `Обязательство ${result.obligationId} удалено.`;
  }
  return fallbackText;
}

export function buildCrmSections(intent: CrmWindowIntent, data: unknown): WindowSection {
  if (intent === "register_counterparty") {
    const result = data as RegisterCounterpartyResult;
    return [
      {
        id: "crm_counterparty_registration",
        title: "Карточка",
        items: [
          { label: "Контрагент", value: result.legalName, tone: "positive" },
          { label: "ID", value: result.partyId, tone: "neutral" },
          { label: "ИНН", value: result.inn ?? "не указан", tone: "neutral" },
          { label: "Источник", value: result.source, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "create_counterparty_relation") {
    const result = data as CreateCounterpartyRelationResult;
    return [
      {
        id: "crm_relation",
        title: "Связь",
        items: [
          { label: "Источник", value: result.fromPartyId, tone: "neutral" },
          { label: "Целевой контрагент", value: result.toPartyId, tone: "neutral" },
          { label: "Тип", value: result.relationType, tone: "positive" },
          { label: "Действует с", value: result.validFrom, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "create_crm_account") {
    const result = data as CreateCrmAccountResult;
    return [
      {
        id: "crm_account_create",
        title: "Новая карточка",
        items: [
          { label: "Аккаунт", value: result.name, tone: "positive" },
          { label: "ID", value: result.accountId, tone: "neutral" },
          { label: "ИНН", value: result.inn ?? "не указан", tone: "neutral" },
          { label: "Статус", value: result.status ?? "не указан", tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "review_account_workspace") {
    const result = data as GetCrmAccountWorkspaceResult;
    return [
      {
        id: "crm_workspace_summary",
        title: "Сводка",
        items: [
          {
            label: "Контакты",
            value: `${result.contacts.length}`,
            tone: result.contacts.length > 0 ? "positive" : "warning",
          },
          {
            label: "Взаимодействия",
            value: `${result.interactions.length}`,
            tone: result.interactions.length > 0 ? "positive" : "neutral",
          },
          {
            label: "Обязательства",
            value: `${result.obligations.length}`,
            tone: result.obligations.length > 0 ? "warning" : "neutral",
          },
          {
            label: "Риски",
            value: `${result.risks.length}`,
            tone: result.risks.length > 0 ? "critical" : "neutral",
          },
        ],
      },
    ];
  }
  if (intent === "update_account_profile") {
    const result = data as UpdateCrmAccountResult;
    return [
      {
        id: "crm_account_update",
        title: "Изменения",
        items: [
          { label: "Аккаунт", value: result.accountId, tone: "neutral" },
          { label: "Статус", value: result.status ?? "без изменений", tone: "neutral" },
          { label: "Риск", value: result.riskCategory ?? "без изменений", tone: "warning" },
          {
            label: "Стратегическая ценность",
            value: result.strategicValue ?? "без изменений",
            tone: "neutral",
          },
        ],
      },
    ];
  }
  if (intent === "create_crm_contact") {
    const result = data as CreateCrmContactResult;
    return [
      {
        id: "crm_contact_create",
        title: "Контакт",
        items: [
          { label: "ID", value: result.contactId, tone: "neutral" },
          {
            label: "Имя",
            value: `${result.firstName}${result.lastName ? ` ${result.lastName}` : ""}`,
            tone: "positive",
          },
          { label: "Роль", value: result.role ?? "не указана", tone: "neutral" },
          { label: "Email", value: result.email ?? "не указан", tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "update_crm_contact") {
    const result = data as UpdateCrmContactResult;
    return [
      {
        id: "crm_contact_update",
        title: "Контакт",
        items: [
          { label: "ID", value: result.contactId, tone: "neutral" },
          {
            label: "Имя",
            value: `${result.firstName}${result.lastName ? ` ${result.lastName}` : ""}`,
            tone: "positive",
          },
          { label: "Роль", value: result.role ?? "без изменений", tone: "neutral" },
          { label: "Телефон", value: result.phone ?? "не указан", tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "delete_crm_contact") {
    const result = data as DeleteCrmContactResult;
    return [
      {
        id: "crm_contact_delete",
        title: "Удаление",
        items: [
          { label: "Контакт", value: result.contactId, tone: "warning" },
          { label: "Статус", value: "Удалён", tone: "critical" },
        ],
      },
    ];
  }
  if (intent === "log_crm_interaction") {
    const result = data as CreateCrmInteractionResult;
    return [
      {
        id: "crm_interaction",
        title: "Взаимодействие",
        items: [
          { label: "ID", value: result.interactionId, tone: "neutral" },
          { label: "Тип", value: result.type, tone: "positive" },
          { label: "Дата", value: result.date, tone: "neutral" },
          { label: "Сводка", value: result.summary, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "update_crm_interaction") {
    const result = data as UpdateCrmInteractionResult;
    return [
      {
        id: "crm_interaction_update",
        title: "Взаимодействие",
        items: [
          { label: "ID", value: result.interactionId, tone: "neutral" },
          { label: "Тип", value: result.type, tone: "positive" },
          { label: "Дата", value: result.date, tone: "neutral" },
          { label: "Сводка", value: result.summary, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "delete_crm_interaction") {
    const result = data as DeleteCrmInteractionResult;
    return [
      {
        id: "crm_interaction_delete",
        title: "Удаление",
        items: [
          { label: "Взаимодействие", value: result.interactionId, tone: "warning" },
          { label: "Статус", value: "Удалено", tone: "critical" },
        ],
      },
    ];
  }
  if (intent === "create_crm_obligation") {
    const result = data as CreateCrmObligationResult;
    return [
      {
        id: "crm_obligation",
        title: "Обязательство",
        items: [
          { label: "ID", value: result.obligationId, tone: "neutral" },
          { label: "Срок", value: result.dueDate, tone: "warning" },
          { label: "Статус", value: result.status, tone: "neutral" },
          { label: "Описание", value: result.description, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "update_crm_obligation") {
    const result = data as UpdateCrmObligationResult;
    return [
      {
        id: "crm_obligation_update",
        title: "Обязательство",
        items: [
          { label: "ID", value: result.obligationId, tone: "neutral" },
          { label: "Срок", value: result.dueDate, tone: "warning" },
          { label: "Статус", value: result.status, tone: "neutral" },
          { label: "Описание", value: result.description, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "delete_crm_obligation") {
    const result = data as DeleteCrmObligationResult;
    return [
      {
        id: "crm_obligation_delete",
        title: "Удаление",
        items: [
          { label: "Обязательство", value: result.obligationId, tone: "warning" },
          { label: "Статус", value: "Удалено", tone: "critical" },
        ],
      },
    ];
  }
  return [];
}

export function buildCrmActions(
  intent: CrmWindowIntent,
  data: unknown,
  windowId: string,
): RaiWorkWindowDto["actions"] {
  const openPartiesAction = {
    id: "go_parties_registry",
    kind: "open_route" as const,
    label: "Открыть реестр контрагентов",
    enabled: true,
    targetRoute: "/parties",
  };
  const openCrmAction = {
    id: "go_crm_workspace",
    kind: "open_route" as const,
    label: "Открыть CRM",
    enabled: true,
    targetRoute: "/consulting/crm",
  };

  if (intent === "register_counterparty") {
    const result = data as RegisterCounterpartyResult;
    return [
      {
        id: "focus_registered_counterparty",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      {
        ...openPartiesAction,
        targetRoute: `/parties/${encodeURIComponent(result.partyId)}`,
        label: "Открыть карточку контрагента",
      },
    ];
  }

  if (intent === "create_crm_account") {
    const result = data as CreateCrmAccountResult;
    return [
      {
        id: "open_created_account",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      {
        ...openCrmAction,
        targetRoute: `/crm/accounts/${encodeURIComponent(result.accountId)}`,
        label: "Открыть карточку клиента",
      },
    ];
  }

  if (intent === "review_account_workspace") {
    const { route, label } = resolveCounterpartyRouteFromWorkspaceData(data);
    return [
      {
        id: "focus_crm_workspace_result",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      {
        id: "open_counterparty_from_workspace",
        kind: "open_route",
        label,
        enabled: true,
        targetRoute: route,
      },
    ];
  }

  return [
    {
      id: "focus_crm_window",
      kind: "focus_window",
      label: "Открыть результат",
      enabled: true,
      targetWindowId: windowId,
    },
    intent === "create_counterparty_relation" ? openPartiesAction : openCrmAction,
  ];
}

export function resolveCounterpartyRouteFromWorkspaceData(
  data: unknown,
): { route: string; label: string } {
  const workspace = data as GetCrmAccountWorkspaceResult;
  const linkedParty =
    workspace?.linkedParty && typeof workspace.linkedParty === "object"
      ? (workspace.linkedParty as Record<string, unknown>)
      : null;
  const linkedPartyId =
    linkedParty && typeof linkedParty.id === "string" ? linkedParty.id.trim() : "";
  if (linkedPartyId) {
    return {
      route: `/parties/${encodeURIComponent(linkedPartyId)}`,
      label: "Открыть карточку контрагента",
    };
  }

  const account =
    workspace?.account && typeof workspace.account === "object"
      ? (workspace.account as Record<string, unknown>)
      : null;
  const accountName =
    account && typeof account.name === "string" ? account.name.trim() : "";
  if (accountName) {
    return {
      route: `/parties?entity=${encodeURIComponent(accountName)}`,
      label: "Найти контрагента в реестре",
    };
  }

  return {
    route: "/parties",
    label: "Открыть реестр контрагентов",
  };
}

export function buildCrmNextStepSummary(intent: CrmWindowIntent): string {
  switch (intent) {
    case "register_counterparty":
      return "Проверьте карточку контрагента, связи и реквизиты перед следующими CRM-действиями.";
    case "create_counterparty_relation":
      return "Откройте структуру контрагентов и убедитесь, что связь отражает реальную зависимость.";
    case "create_crm_account":
      return "Откройте новую карточку клиента и проверьте профиль, контакты и следующий шаг продаж.";
    case "review_account_workspace":
      return "Проверьте риски, обязательства и последние взаимодействия перед следующим касанием клиента.";
    case "update_account_profile":
      return "После изменения профиля обновите рабочий контекст и проверьте связанные обязательства.";
    case "create_crm_contact":
      return "Проверьте роль контакта и при необходимости зафиксируйте первое взаимодействие.";
    case "update_crm_contact":
      return "Проверьте, что контактные данные и роль отражают актуальное состояние клиента.";
    case "delete_crm_contact":
      return "Убедитесь, что у клиента остались актуальные контактные лица после удаления.";
    case "log_crm_interaction":
      return "После фиксации взаимодействия при необходимости поставьте follow-up обязательство.";
    case "update_crm_interaction":
      return "Проверьте журнал активностей и убедитесь, что сводка взаимодействия обновлена корректно.";
    case "delete_crm_interaction":
      return "Проверьте таймлайн клиента и убедитесь, что удалено именно ошибочное взаимодействие.";
    case "create_crm_obligation":
      return "Проверьте ответственного и срок, затем откройте CRM для контроля исполнения.";
    case "update_crm_obligation":
      return "После обновления обязательства проверьте срок, статус и ответственного.";
    case "delete_crm_obligation":
      return "Проверьте CRM-карточку и убедитесь, что обязательство больше не требуется.";
    default:
      return "Откройте CRM-контур и проверьте результат операции.";
  }
}

export function buildContractsTitle(intent: ContractsWindowIntent): string {
  switch (intent) {
    case "create_commerce_contract":
      return "Договор создан";
    case "list_commerce_contracts":
      return "Реестр договоров";
    case "review_commerce_contract":
      return "Карточка договора";
    case "create_contract_obligation":
      return "Обязательство создано";
    case "create_fulfillment_event":
      return "Исполнение зафиксировано";
    case "create_invoice_from_fulfillment":
      return "Счёт создан";
    case "post_invoice":
      return "Счёт проведён";
    case "create_payment":
      return "Платёж создан";
    case "confirm_payment":
      return "Платёж подтверждён";
    case "allocate_payment":
      return "Платёж разнесён";
    case "review_ar_balance":
      return "Дебиторский остаток";
    default:
      return "Результат contracts-агента";
  }
}

export function buildContractsSummary(
  intent: ContractsWindowIntent,
  data: unknown,
  fallbackText: string,
): string {
  if (intent === "create_commerce_contract") {
    const result = data as CreateCommerceContractResult;
    return `Создан договор ${result.number}.`;
  }
  if (intent === "list_commerce_contracts") {
    const result = data as ListCommerceContractsResult;
    return `В реестре ${result.items.length} договоров.`;
  }
  if (intent === "review_commerce_contract") {
    const result = data as GetCommerceContractResult;
    return `Открыта карточка договора ${result.number}.`;
  }
  if (intent === "create_contract_obligation") {
    const result = data as CreateCommerceObligationResult;
    return `Создано обязательство ${result.id}.`;
  }
  if (intent === "create_fulfillment_event") {
    const result = data as CreateFulfillmentEventResult;
    return `Событие исполнения ${result.id} зафиксировано.`;
  }
  if (intent === "create_invoice_from_fulfillment") {
    const result = data as CreateInvoiceFromFulfillmentResult;
    return `Счёт ${result.id} создан на сумму ${result.grandTotal.toLocaleString("ru-RU")} ₽.`;
  }
  if (intent === "post_invoice") {
    const result = data as PostInvoiceResult;
    return `Счёт ${result.id} проведён.`;
  }
  if (intent === "create_payment") {
    const result = data as CreatePaymentResult;
    return `Платёж ${result.id} создан.`;
  }
  if (intent === "confirm_payment") {
    const result = data as ConfirmPaymentResult;
    return `Платёж ${result.id} подтверждён.`;
  }
  if (intent === "allocate_payment") {
    const result = data as AllocatePaymentResult;
    return `Платёж ${result.paymentId} разнесён на счёт ${result.invoiceId}.`;
  }
  if (intent === "review_ar_balance") {
    const result = data as GetArBalanceResult;
    return `Остаток по счёту ${result.invoiceId}: ${result.balance.toLocaleString("ru-RU")} ₽.`;
  }
  return fallbackText;
}

export function buildContractsSections(
  intent: ContractsWindowIntent,
  data: unknown,
): WindowSection {
  if (intent === "create_commerce_contract") {
    const result = data as CreateCommerceContractResult;
    return [
      {
        id: "contracts_card",
        title: "Договор",
        items: [
          { label: "Номер", value: result.number, tone: "positive" },
          { label: "ID", value: result.id, tone: "neutral" },
          { label: "Тип", value: result.type, tone: "neutral" },
          { label: "Статус", value: result.status, tone: "neutral" },
          { label: "Ролей сторон", value: `${result.roles.length}`, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "list_commerce_contracts") {
    const result = data as ListCommerceContractsResult;
    return [
      {
        id: "contracts_registry",
        title: "Сводка",
        items: [
          { label: "Договоров", value: `${result.items.length}`, tone: "positive" },
          {
            label: "Последний",
            value: result.items[0]?.number ?? "нет данных",
            tone: "neutral",
          },
        ],
      },
    ];
  }
  if (intent === "review_commerce_contract") {
    const result = data as GetCommerceContractResult;
    return [
      {
        id: "contract_detail",
        title: "Карточка договора",
        items: [
          { label: "Номер", value: result.number, tone: "positive" },
          { label: "ID", value: result.id, tone: "neutral" },
          { label: "Тип", value: result.type, tone: "neutral" },
          { label: "Статус", value: result.status, tone: "neutral" },
          { label: "Сторон", value: `${result.roles.length}`, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "create_contract_obligation") {
    const result = data as CreateCommerceObligationResult;
    return [
      {
        id: "contract_obligation",
        title: "Обязательство",
        items: [
          { label: "ID", value: result.id, tone: "positive" },
          { label: "Договор", value: result.contractId, tone: "neutral" },
          { label: "Тип", value: result.type, tone: "neutral" },
          { label: "Срок", value: result.dueDate ?? "не указан", tone: "warning" },
        ],
      },
    ];
  }
  if (intent === "create_fulfillment_event") {
    const result = data as CreateFulfillmentEventResult;
    return [
      {
        id: "fulfillment_event",
        title: "Исполнение",
        items: [
          { label: "ID", value: result.id, tone: "positive" },
          { label: "Обязательство", value: result.obligationId, tone: "neutral" },
          { label: "Домен", value: result.eventDomain, tone: "neutral" },
          { label: "Тип", value: result.eventType, tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "create_invoice_from_fulfillment") {
    const result = data as CreateInvoiceFromFulfillmentResult;
    return [
      {
        id: "invoice_created",
        title: "Счёт",
        items: [
          { label: "ID", value: result.id, tone: "positive" },
          { label: "Статус", value: result.status, tone: "warning" },
          { label: "Subtotal", value: `${result.subtotal}`, tone: "neutral" },
          { label: "Итого", value: `${result.grandTotal}`, tone: "positive" },
        ],
      },
    ];
  }
  if (intent === "post_invoice") {
    const result = data as PostInvoiceResult;
    return [
      {
        id: "invoice_posted",
        title: "Проведение",
        items: [
          { label: "Счёт", value: result.id, tone: "positive" },
          { label: "Статус", value: result.status, tone: "warning" },
          { label: "Ledger", value: result.ledgerTxId ?? "не создан", tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "create_payment") {
    const result = data as CreatePaymentResult;
    return [
      {
        id: "payment_created",
        title: "Платёж",
        items: [
          { label: "ID", value: result.id, tone: "positive" },
          { label: "Сумма", value: `${result.amount} ${result.currency}`, tone: "neutral" },
          { label: "Метод", value: result.paymentMethod, tone: "neutral" },
          { label: "Статус", value: result.status, tone: "warning" },
        ],
      },
    ];
  }
  if (intent === "confirm_payment") {
    const result = data as ConfirmPaymentResult;
    return [
      {
        id: "payment_confirmed",
        title: "Подтверждение",
        items: [
          { label: "Платёж", value: result.id, tone: "positive" },
          { label: "Статус", value: result.status, tone: "warning" },
          { label: "Ledger", value: result.ledgerTxId ?? "не создан", tone: "neutral" },
        ],
      },
    ];
  }
  if (intent === "allocate_payment") {
    const result = data as AllocatePaymentResult;
    return [
      {
        id: "payment_allocation",
        title: "Аллокация",
        items: [
          { label: "Платёж", value: result.paymentId, tone: "neutral" },
          { label: "Счёт", value: result.invoiceId, tone: "neutral" },
          { label: "Сумма", value: `${result.allocatedAmount}`, tone: "positive" },
        ],
      },
    ];
  }
  if (intent === "review_ar_balance") {
    const result = data as GetArBalanceResult;
    return [
      {
        id: "ar_balance",
        title: "Дебиторка",
        items: [
          { label: "Счёт", value: result.invoiceId, tone: "neutral" },
          {
            label: "Остаток",
            value: `${result.balance}`,
            tone: result.balance > 0 ? "warning" : "positive",
          },
        ],
      },
    ];
  }
  return [];
}

export function buildContractsActions(
  intent: ContractsWindowIntent,
  data: unknown,
  windowId: string,
): RaiWorkWindowDto["actions"] {
  const openContractsAction = {
    id: "go_contracts_registry",
    kind: "open_route" as const,
    label: "Открыть реестр договоров",
    enabled: true,
    targetRoute: "/commerce/contracts",
  };
  const openPaymentsAction = {
    id: "go_payments_registry",
    kind: "open_route" as const,
    label: "Открыть платежи",
    enabled: true,
    targetRoute: "/commerce/payments",
  };

  if (intent === "create_commerce_contract" || intent === "review_commerce_contract") {
    const result = data as CreateCommerceContractResult | GetCommerceContractResult;
    return [
      {
        id: "focus_contract_result",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      {
        ...openContractsAction,
        targetRoute: `/commerce/contracts/${encodeURIComponent(result.id)}`,
        label: "Открыть карточку договора",
      },
    ];
  }

  if (intent === "create_payment" || intent === "confirm_payment") {
    return [
      {
        id: "focus_payment_result",
        kind: "focus_window",
        label: "Открыть результат",
        enabled: true,
        targetWindowId: windowId,
      },
      openPaymentsAction,
    ];
  }

  return [
    {
      id: "focus_contracts_window",
      kind: "focus_window",
      label: "Открыть результат",
      enabled: true,
      targetWindowId: windowId,
    },
    openContractsAction,
  ];
}

export function buildContractsNextStepSummary(intent: ContractsWindowIntent): string {
  switch (intent) {
    case "create_commerce_contract":
      return "Откройте карточку договора и при необходимости добавьте обязательства сторон.";
    case "list_commerce_contracts":
      return "Выберите нужный договор из реестра и продолжите работу по обязательствам или счетам.";
    case "review_commerce_contract":
      return "Проверьте роли сторон и при необходимости создайте обязательство.";
    case "create_contract_obligation":
      return "После создания обязательства можно зафиксировать исполнение или перейти к биллингу.";
    case "create_fulfillment_event":
      return "На основе исполнения можно сформировать счёт.";
    case "create_invoice_from_fulfillment":
      return "Проведите счёт или дождитесь оплаты.";
    case "post_invoice":
      return "После проведения счёта можно контролировать дебиторку и платежи.";
    case "create_payment":
      return "Подтвердите платёж и затем выполните аллокацию на счёт.";
    case "confirm_payment":
      return "После подтверждения разнесите платёж на соответствующий счёт.";
    case "allocate_payment":
      return "Проверьте остаток по счёту и статус взаиморасчётов.";
    case "review_ar_balance":
      return "Если остаток не нулевой, создайте платёж или проверьте аллокации.";
    default:
      return "Откройте commerce-контур и проверьте результат операции.";
  }
}
