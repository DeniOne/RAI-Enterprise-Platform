---
id: DOC-INS-AGT-PROFILE-013
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА CONTRACTS_AGENT

## 1. Назначение

Документ фиксирует профиль `contracts_agent` как канонического owner-agent для полного `commerce`-контура первой волны.

## 2. Когда применять

Использовать документ, когда:

- проектируются договорные и commerce-сценарии;
- обсуждается граница между `crm_agent`, `contracts_agent`, `legal_advisor` и `economist`;
- подключаются новые commerce tools;
- проверяется governed write path в commerce.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `commerce`.
- Adapter role: `contracts_agent`.

## 4. Стратегический образ агента в Stage 2

`contracts_agent` должен быть primary execution owner для:

- договоров;
- договорных ролей;
- обязательств;
- исполнения;
- счетов;
- платежей;
- аллокаций;
- AR balance.

## 5. Фактическое состояние агента по коду

Подтверждён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [contracts-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/contracts-agent.service.ts)
- [contracts-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически сейчас реализованы:

- создание, просмотр и реестр договоров;
- создание обязательства;
- фиксация исполнения;
- создание и проведение счета;
- создание, подтверждение и аллокация платежа;
- просмотр AR balance;
- clarification path и rich output в чате.

Также роль уже включена в:

- `Runtime Governance` как canonical commerce execution role;
- `Control Tower` как часть reliability, fallback и lifecycle surfaces;
- `Lifecycle Board` как canonical business agent с freeze/retire/version compare.

## 6. Домены ответственности

- `commerce/contracts`
- `commerce/obligations`
- `commerce/fulfillment`
- `commerce/invoices`
- `commerce/payments`
- `commerce/payment-allocations`
- `ar-balance`

## 7. Что агент обязан делать

- Распознавать договорные и commerce-intent-ы.
- Уходить в `NEEDS_MORE_DATA`, если для write-path не хватает обязательного контекста.
- Выполнять commerce write через governed tool path.
- Сохранять explainability и evidence trail.
- Не подменять legal authority и finance strategy ownership.

## 8. Что агенту запрещено делать

- Брать ownership по CRM-карточкам и контактам.
- Брать ownership по legal review и policy interpretation.
- Делать peer-to-peer вызовы другим агентам.
- Маскировать blocked / pending / failed commerce action как успех.

## 9. Текущий фактический функционал

- `create_commerce_contract`
- `list_commerce_contracts`
- `review_commerce_contract`
- `create_contract_obligation`
- `create_fulfillment_event`
- `create_invoice_from_fulfillment`
- `post_invoice`
- `create_payment`
- `confirm_payment`
- `allocate_payment`
- `review_ar_balance`

## 10. Максимально допустимый функционал

В пределах своего домена агент может покрывать:

- полный governed contract lifecycle;
- commerce execution по исполнению, счетам и оплатам;
- handoff в `legal_advisor`, `economist` и `knowledge` через оркестратор;
- rich work windows для contract and billing workflow.

## 11. Связи с оркестратором

- Только через `SupervisorAgent -> Runtime -> Adapter`.
- Handoff идёт только через центральный orchestration spine.

## 12. Связи с другими агентами

- С `crm_agent`: handoff из клиентского контекста в договорный процесс.
- С `front_office_agent`: handoff из communicator ingress в договорный процесс.
- С `legal_advisor`: advisory handoff по clause review и legal risk.
- С `economist`: advisory handoff по financial impact.
- С `knowledge`: evidence/grounding.

## 13. Связи с доменными модулями

- [commerce.controller.ts](/root/RAI_EP/apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/commerce-contract.service.ts)
- [fulfillment.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/fulfillment.service.ts)
- [billing.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/billing.service.ts)

## 14. Required Context Contract

Минимальные обязательные контексты:

- для договора: `number`, `type`, `validFrom`, `jurisdictionId`, `roles[]`;
- для обязательства: `contractId`, `type`;
- для исполнения: `obligationId`, `eventDomain`, `eventType`, `eventDate`;
- для счета: `fulfillmentEventId`, `sellerJurisdiction`, `buyerJurisdiction`, `supplyType`, `vatPayerStatus`, `subtotal`;
- для платежа: `payerPartyId`, `payeePartyId`, `amount`, `currency`, `paymentMethod`;
- для аллокации: `paymentId`, `invoiceId`, `allocatedAmount`;
- для AR balance: `invoiceId`.

## 15. Intent Catalog

- `create_commerce_contract`
- `list_commerce_contracts`
- `review_commerce_contract`
- `create_contract_obligation`
- `create_fulfillment_event`
- `create_invoice_from_fulfillment`
- `post_invoice`
- `create_payment`
- `confirm_payment`
- `allocate_payment`
- `review_ar_balance`

## 16. Tool surface

- `CreateCommerceContract`
- `ListCommerceContracts`
- `GetCommerceContract`
- `CreateCommerceObligation`
- `CreateFulfillmentEvent`
- `ListFulfillmentEvents`
- `CreateInvoiceFromFulfillment`
- `PostInvoice`
- `ListInvoices`
- `CreatePayment`
- `ConfirmPayment`
- `AllocatePayment`
- `GetArBalance`

## 17. UI surface

- rich result panel договора;
- clarification panel для commerce context;
- route actions в `/commerce/contracts` и `/commerce/contracts/create`;
- structured result для obligation / fulfillment / invoice / payment / AR.

## 18. Guardrails

- primary owner только для `commerce`;
- `legal_advisor` и `economist` не заменяются;
- `QUARANTINE` блокирует write tools;
- `TOOL_FIRST` форсирует governed confirmation для risky writes.

## 19. Основные риски и failure modes

- неполный contract context;
- blocked/pending commerce writes;
- попытка расползания в CRM или legal ownership;
- ложный fallback вместо real contract path.

## 20. Требования к тестам

- intent routing по договорам и commerce flows;
- clarification tests;
- registry tests для contract/invoice/payment paths;
- composer rich output tests;
- autonomy / pending-action gating tests.

## 21. Критерии production-ready

- Чатовый запрос на договор реально уходит в `contracts_agent`.
- Commerce backend вызывается по реальным tool paths.
- Нет маскировки fallback backlog вместо результата.
- Agent виден в runtime governance и reliability.
- Есть smoke-набор по CRM -> contracts -> governance.
- Роль видна в `Swarm Control Tower` и `Lifecycle Board` как отдельный owner-agent, а не как gap.

## 22. Связанные файлы и точки кода

- [RAI_CONTRACTS_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [contracts-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/contracts-agent.service.ts)
- [contracts-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
