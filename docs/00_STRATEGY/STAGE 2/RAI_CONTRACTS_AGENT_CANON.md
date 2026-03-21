---
id: DOC-STR-STAGE-2-RAI-CONTRACTS-AGENT-CANON-8R6O
layer: Strategy
type: Vision
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-STR-STAGE2-CONTRACTS-AGENT-CANON
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/00_STRATEGY/STAGE 2/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md;docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md;apps/api/src/modules/commerce
---
# RAI Contracts Agent Canon

## CLAIM
id: CLAIM-STR-STAGE2-CONTRACTS-AGENT-CANON
status: asserted
verified_by: manual
last_verified: 2026-03-21

Этот документ является действующим каноном `contracts_agent` как owner-агента для `commerce`-контура первой волны. Он обязателен для проектирования и маршрутизации, а конкретные runtime-возможности нужно проверять по коду и тестам.


> Версия: 1.0  
> Дата: 2026-03-09  
> Статус: Active Canon  
> Назначение: зафиксировать канонический scope `contracts_agent` как primary execution owner для полного `commerce`-контура первой волны.

---

## 1. Назначение

`contracts_agent` является каноническим owner-agent для первого полного `commerce`-контура:

- договоры;
- договорные роли;
- обязательства;
- fulfillment events;
- invoices;
- payments;
- allocations;
- AR balance.

---

## 2. Ownership

- Primary owner-agent: `contracts_agent`
- Owner domain: `commerce`
- Execution scope: governed commerce execution
- Secondary read / evidence owner: `knowledge`
- Secondary advisory owner:
  - `legal_advisor`
  - `economist`

---

## 3. Что входит в scope

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

---

## 4. Что не входит в scope

- legal authority и final legal commitments;
- finance strategy ownership;
- CRM ownership по контрагентам и карточкам;
- communicator ingress ownership;
- direct peer-to-peer вызовы других агентов.

---

## 5. Handoff

Нормативные handoff paths:

- `front_office_agent -> orchestrator -> contracts_agent`
- `crm_agent -> orchestrator -> contracts_agent`
- `contracts_agent -> orchestrator -> legal_advisor`
- `contracts_agent -> orchestrator -> economist`
- `contracts_agent -> orchestrator -> knowledge`

---

## 6. Runtime и governance

`contracts_agent`:

- зарегистрирован как canonical runtime role;
- включён в `agent registry`;
- имеет собственный `contracts tools registry`;
- включён в runtime governance, reliability и drilldowns;
- подчиняется autonomy / pending-action / risk-policy enforcement.

---

## 7. Связанные файлы

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [contracts-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/contracts-agent.service.ts)
- [contracts-tools.registry.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/tools/contracts-tools.registry.ts)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
