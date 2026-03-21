---
id: DOC-INS-AGENTS-INSTRUCTION-CONTRACTS-AGENT-ENABLEM-CFDZ
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ВКЛЮЧЕНИЕ CONTRACTS_AGENT

## 1. Назначение

Документ фиксирует практический enablement-путь `contracts_agent` как owner-agent для commerce-контура.

Routing, handoff и ownership-границы этого enablement-пути нужно сверять с:

- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md)

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

- [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [RAI_CONTRACTS_AGENT_CANON.md](../../00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)

