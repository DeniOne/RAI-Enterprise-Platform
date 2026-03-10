---
id: DOC-INS-AGT-PROFILE-002
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА ECONOMIST

## 1. Назначение

Документ фиксирует рамки и предельный функционал агента `economist`.

## 2. Когда применять

Использовать документ, когда:

- добавляются новые finance-intent-ы;
- обсуждается handoff между `economist` и `agronomist`;
- проектируются risk- и plan/fact-сценарии;
- нужно проверить, не ушёл ли агент в чужой operational domain.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `finance`.
- Adapter role: `economist`.

## 4. Стратегический образ агента в Stage 2

По Stage 2 `economist` должен быть owner-agent для:

- plan/fact анализа;
- сценарного моделирования;
- оценки финансовых и экономических компромиссов;
- deterministic analytics с evidence и caveats.

Агент не должен превращаться в:

- CRM-оператора;
- агронома;
- юридического советника;
- универсального knowledge-бота.

## 5. Фактическое состояние агента по коду

Агент подтверждён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-execution-adapter.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [economist-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/economist-agent.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически сейчас реализованы intent-ы:

- `compute_plan_fact`
- `simulate_scenario`
- `compute_risk_assessment`

Исполнение идёт через `FinanceToolsRegistry`.

## 6. Домены ответственности

- экономика и финансы;
- plan/fact;
- ROI, EBITDA, cost deltas;
- сценарии и риск-оценка.

## 7. Что агент обязан делать

- Использовать детерминированные финансовые расчёты как truth-source.
- Возвращать caveats и ограничения интерпретации.
- Запрашивать обязательный контекст, если без него расчёт невозможен.
- Не переходить в операционные write-действия.

## 8. Что агенту запрещено делать

- Брать на себя CRM и контрагентов.
- Выполнять агрономические операции.
- Подменять legal и knowledge ownership.
- Делать платёжные, учётные или иные критичные write-действия без отдельного governed path.

## 9. Текущий фактический функционал

- Plan/fact по плану или сезону.
- Scenario simulation.
- Risk assessment.
- `NEEDS_MORE_DATA` при отсутствии нужного контекста для `compute_plan_fact`.
- LLM-синтез поверх детерминированных результатов.

## 10. Максимально допустимый функционал

В целевой модели агент может покрывать:

- расширенную финансовую аналитику;
- portfolio и scenario comparison;
- explainable budget deviations;
- safe handoff в strategy или controller контур через оркестратор.

Не должен покрывать:

- договоры;
- CRM-карточки и взаимодействия;
- агрономические расчёты;
- произвольный non-finance advisory без ownership.

## 11. Связи с оркестратором

- Вызов только через центральный orchestration spine.
- Runtime activation через `AgentExecutionAdapterService`.
- Peer-to-peer маршрут к другим агентам как норма не подтверждён.

## 12. Связи с другими агентами

- С `agronomist`: handoff для economics follow-up на основе агроданных.
- С `knowledge`: handoff для политики и регламентов.
- С `monitoring`: handoff по signal escalation допустим только через оркестратор.
- С `crm_agent`: прямой overlap запрещён.
- С `contracts_agent`: advisory handoff по финансовым последствиям договора, счетов, оплат и дебиторки.

## 13. Связи с доменными модулями

- `FinanceToolsRegistry`
- deterministic finance contour
- `consulting` / economic analysis modules

## 14. Required Context Contract

- Для `compute_plan_fact` обязателен хотя бы `planId` или `seasonId`.
- Для сценария и риска фактический контракт шире и зависит от входного `scope`.

## 15. Intent Catalog

- `compute_plan_fact`
- `simulate_scenario`
- `compute_risk_assessment`

## 16. Tool surface

- `ComputePlanFact`
- `SimulateScenario`
- `ComputeRiskAssessment`

## 17. UI surface

- рабочие окна с метриками;
- секции `summary`, `metrics`, `risks`, `caveats`;
- clarification при недостатке контекста.

## 18. Guardrails

- Запрещены intent-ы агрономии, CRM, knowledge-owner и monitoring-owner.
- Запрещены operational writes по учёту и платежам.
- Агент advisory-first и grounded-in-metrics.

## 19. Основные риски и failure modes

- Финансовые выводы без достаточного входного `scope`.
- Смешение сценарного advisory и реального transaction/write path.
- Drift в стратегию или CRM без ownership.
- Слишком широкая интерпретация economic risk как общего business ownership.

## 20. Требования к тестам

- Классификация по каждому finance-intent.
- `NEEDS_MORE_DATA` для plan/fact.
- Deterministic execution и evidence.
- Guardrail-tests против cross-domain intent-ов.

## 21. Критерии production-ready

- Финансовые intent-ы маршрутизируются устойчиво.
- Все ответы grounded в `FinanceToolsRegistry`.
- Нет несанкционированного write-path.
- Есть smoke-набор для plan/fact, scenario и risk.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [economist-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/economist-agent.service.ts)
