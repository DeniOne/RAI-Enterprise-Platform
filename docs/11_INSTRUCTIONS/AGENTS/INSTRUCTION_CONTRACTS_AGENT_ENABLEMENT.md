---
id: DOC-INS-AGT-006
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-09
---

# ИНСТРУКЦИЯ — ВКЛЮЧЕНИЕ CONTRACTS_AGENT

## 1. Назначение

Документ фиксирует практический enablement-путь `contracts_agent` как owner-agent для commerce-контура.

## 2. Что уже включено

- canonical runtime role;
- contracts tools registry;
- intent routing и clarification contracts;
- composer rich output;
- runtime governance policy;
- Control Tower / reliability visibility.

## 3. Что обязательно проверить

1. `заключим договор с ...` маршрутизируется в `contracts_agent`.
2. Если контекста не хватает, открывается clarification panel.
3. Создание договора идёт через `commerce` backend.
4. Obligations / fulfillment / invoices / payments отрабатывают через governed path.
5. `TOOL_FIRST` даёт pending action.
6. `QUARANTINE` блокирует risky write.

## 4. Live smoke pack

- Регистрация контрагента через `crm_agent`.
- Создание договора через `contracts_agent`.
- Создание обязательства.
- Фиксация исполнения.
- Создание счета.
- Подтверждение оплаты или аллокация.
- Проверка runtime governance summary/drilldowns.

## 5. Связанные документы

- [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md)
- [RAI_CONTRACTS_AGENT_CANON.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
