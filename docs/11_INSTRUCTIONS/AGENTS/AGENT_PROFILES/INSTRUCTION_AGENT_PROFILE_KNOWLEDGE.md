---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-K-XLY8
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА KNOWLEDGE

## 1. Назначение

Документ фиксирует зону ответственности и ограничения агента `knowledge`.

## 2. Когда применять

Использовать документ, когда:

- проектируется knowledge / RAG сценарий;
- нужно понять, может ли доменный агент передать вопрос в knowledge контур;
- оценивается риск подмены operational owners knowledge-агентом.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `knowledge`.
- Adapter role: `knowledge`.

## 4. Стратегический образ агента в Stage 2

По Stage 2 `knowledge` должен быть:

- источником grounding;
- RAG-owner для документов, политик и регламентов;
- агентом доказательной памяти и retrieval-поиска;
- read-oriented контуром, который не подменяет operational owners.

## 5. Фактическое состояние агента по коду

Подтверждён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [knowledge-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически сейчас покрывает intent:

- `query_knowledge`

Исполнение идёт через `KnowledgeToolsRegistry`.

Также агент уже включён в:

- `Runtime Governance` как evidence-owner с отдельным BS/evidence contour;
- `Control Tower` как canonical role в fleet ranking и telemetry;
- `Lifecycle Board` как canonical lifecycle node.

## 6. Домены ответственности

- документы;
- политики;
- регламенты;
- фрагменты knowledge-base;
- grounding для других контуров через оркестратор.

## 7. Что агент обязан делать

- Выполнять evidence-based retrieval.
- Показывать uncertainty при слабом совпадении.
- Не выходить за пределы read / retrieval ownership.
- Возвращать grounded summary вместо вольной генерации.

## 8. Что агенту запрещено делать

- Выполнять операционные write-действия.
- Брать ownership чужих доменов.
- Притворяться CRM, finance, agro или legal owner-agent.

## 9. Текущий фактический функционал

- Поиск в базе знаний.
- Формирование grounded ответа по top hits.
- Возврат evidences по документным фрагментам.
- LLM summary только при наличии evidence.

## 10. Максимально допустимый функционал

Агент может покрывать:

- policy lookup;
- grounded summary по корпусу документов;
- cross-domain grounding support через governed handoff;
- retrieval-based explanation и цитирование доказательств.

Не должен покрывать:

- создание или изменение бизнес-сущностей;
- самостоятельное принятие доменных решений;
- выполнение договорных, CRM, финансовых или агрономических операций.

## 11. Связи с оркестратором

- Вход только через orchestration spine.
- Выступает как owner-agent для `query_knowledge`.
- Может использоваться как вспомогательный контур grounding для других агентов только через оркестратор.

## 12. Связи с другими агентами

- `agronomist`, `economist`, `crm_agent`, `monitoring` могут получать evidence через governed handoff.
- Прямой peer-to-peer режим не является нормативной моделью.

## 13. Связи с доменными модулями

- `KnowledgeToolsRegistry`
- knowledge corpus / documents / policies

## 14. Required Context Contract

- Базовый обязательный контекст: текстовый `query`.
- Дополнительный контекст может приходить через route и workspace, но не является жёстким блокером.

## 15. Intent Catalog

- `query_knowledge`

## 16. Tool surface

- `QueryKnowledge`

## 17. UI surface

- knowledge route;
- result windows с evidence;
- секции grounded summary и источников.

## 18. Guardrails

- Запрещены operational write paths.
- Запрещено присваивать ownership чужих доменов.
- Ответы должны быть evidence-first.

## 19. Основные риски и failure modes

- Подмена retrieval свободной генерацией.
- Псевдо-правовые или псевдо-финансовые советы без owner handoff.
- Слабое evidence качество при плохом corpus coverage.

## 20. Требования к тестам

- Тесты на `query_knowledge` classification.
- Тесты на grounded output и evidence generation.
- Тесты на отсутствие write behaviour.
- Тесты на low-hit / zero-hit scenario.
- Тесты на корректное поведение в degraded/evidence-first runtime governance mode.

## 21. Критерии production-ready

- Retrieval стабилен и воспроизводим.
- Ответы не выходят за пределы evidence.
- Нет скрытого operational ownership.
- Есть smoke-набор на knowledge lookup и grounding.
- Роль видна в `Runtime Governance`, `Swarm Control Tower` и `Lifecycle Board`.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../../../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](../../../00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [knowledge-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts)
