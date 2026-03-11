---
id: DOC-INS-AGT-PROFILE-001
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА AGRONOMIST

## 1. Назначение

Документ фиксирует стратегический образ, фактическое состояние и предельную допустимую зону ответственности агента `agronomist`.

## 2. Когда применять

Использовать документ, когда:

- уточняется scope агрономического агента;
- проектируется handoff между `agronomist` и другими агентами;
- добавляются новые agro-intent-ы или tools;
- нужно проверить, не вышел ли агент за пределы агрономического домена.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `agro`.
- Adapter role: `agronomist`.

## 4. Стратегический образ агента в Stage 2

По Stage 2 `agronomist` должен быть owner-agent для агрономических сценариев, где требуется:

- генерация и разбор техкарт;
- разбор отклонений по полевым операциям;
- агрономические рекомендации с governed execution;
- работа через `Focus Contract`, `Intent Catalog`, `Required Context Contract`, `UI Action Surface Contract`.

Стратегически агент не должен подменять:

- экономический анализ;
- CRM-операции;
- knowledge-owner для регламентов;
- legal и contract контуры.

## 5. Фактическое состояние агента по коду

По коду агент подтверждён как canonical runtime role и подключён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-execution-adapter.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [agronom-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически сейчас реализованы два intent-а:

- `tech_map_draft`
- `compute_deviations`

Исполнение идёт через `AgroToolsRegistry` и deterministic agro facade с LLM-синтезом поверх детерминированного результата.

Также агент уже включён в:

- `Runtime Governance` как canonical runtime role с reliability и quality telemetry;
- `Control Tower` как часть fleet-level monitoring;
- `Lifecycle Board` как canonical lifecycle node с freeze/retire history.

## 6. Домены ответственности

Агент отвечает за:

- агрономию;
- поля, сезоны, техкарты;
- агро-операции и отклонения;
- агрономическую интерпретацию детерминированных расчётов.

## 7. Что агент обязан делать

- Запрашивать недостающий агроконтекст, если без него нельзя безопасно выполнить задачу.
- Использовать детерминированные agro tools как truth-source.
- Возвращать объяснимый результат, а не свободную генерацию без grounding.
- Оставаться в пределах agro-domain owner scope.

## 8. Что агенту запрещено делать

- Выполнять CRM-сценарии.
- Брать финансовые intent-ы `plan/fact`, `scenario`, `risk assessment`.
- Подменять legal и knowledge ownership.
- Выполнять неконтролируемые write-действия вне агрономического контура.

## 9. Текущий фактический функционал

- Генерация черновика техкарты.
- Расчёт и объяснение агрономических отклонений.
- Возврат `NEEDS_MORE_DATA`, если нет `fieldRef` и `seasonRef` для техкарты.
- Синтез краткого объяснения через LLM только поверх deterministic output.

## 10. Максимально допустимый функционал

В целевой модели агент может покрывать:

- расширенные техкарты;
- агрономические рекомендации по операциям, культурам и сезонным сценариям;
- guided remediation по отклонениям;
- агрономический handoff в экономический контур только через оркестратор;
- rich agro work windows и clarification flows.

Агент не должен расширяться до:

- финансового анализа;
- CRM и контрагентов;
- договоров;
- универсального knowledge-search вне agro-domain.

## 11. Связи с оркестратором

- Вход идёт через `SupervisorAgent -> IntentRouterService -> AgentRuntimeService -> AgentExecutionAdapterService`.
- Прямой peer-to-peer вызов других агентов не подтверждён.
- Допустимый handoff возможен только через центральный orchestration spine.

## 12. Связи с другими агентами

- С `economist`: допустим handoff по economics follow-up после agro расчёта.
- С `knowledge`: допустим handoff для поиска регламентов и документов.
- С `monitoring`: допустима сигнализация, но не подмена agro ownership.
- С `crm_agent`: прямой рабочий overlap запрещён.

## 13. Связи с доменными модулями

- `AgroToolsRegistry`
- `AgroDeterministicEngineFacade`
- агро-контур `consulting` и `tech-map`

## 14. Required Context Contract

- Для `tech_map_draft` обязательны `fieldRef` и `seasonRef`.
- Для `compute_deviations` обязательный контекст жёстко не требуется, но полезен `scope`.

## 15. Intent Catalog

- `tech_map_draft`
- `compute_deviations`

## 16. Tool surface

- `GenerateTechMapDraft`
- `ComputeDeviations`

## 17. UI surface

Подтверждённые паттерны:

- clarification для добора контекста;
- рабочие окна с результатами расчётов;
- navigation в агрономические маршруты.

## 18. Guardrails

- Запрещённые intent-ы: финансовые, knowledge-owner, monitoring-owner, CRM.
- Запрещённые домены: `crm`, `finance`, `legal`.
- Запрещённые маршруты: знания и финансы вне handoff.

## 19. Основные риски и failure modes

- Подмена агрономии общим текстовым советом без deterministic basis.
- Недобор контекста по полю или сезону.
- Захват соседних доменов при слишком широком роутинге.
- Фальшивое ощущение полноты, если UI fallback маскирует отсутствие нужного agro-intent.

## 20. Требования к тестам

- Проверка классификации `tech_map_draft`.
- Проверка `NEEDS_MORE_DATA` при отсутствии `fieldRef` и `seasonRef`.
- Проверка deterministic execution path через `AgroToolsRegistry`.
- Проверка guardrails против finance/CRM intent-ов.

## 21. Критерии production-ready

- Intent-ы стабильно маршрутизируются в `agronomist`.
- Clarification flow добирает обязательный контекст.
- Ответы grounded в deterministic agro tools.
- Нет cross-domain drift в финансы, CRM и legal.
- Есть smoke-сценарии на техкарты и отклонения.
- Роль видна в `Runtime Governance`, `Swarm Control Tower` и `Lifecycle Board`.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agronom-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts)
