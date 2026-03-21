---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-M-FN0K
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА MONITORING

## 1. Назначение

Документ фиксирует роль, ограничения и предельный scope агента `monitoring`.

## 2. Когда применять

Использовать документ, когда:

- проектируется monitoring или alerting сценарий;
- добавляются новые сигналы и risk tools;
- нужно избежать подмены доменных operational owners мониторинговым контуром.

## 3. Статус агента

- Статус: канонический runtime-агент.
- Runtime family: реализована.
- Owner domain: `risk`.
- Adapter role: `monitoring`.

## 4. Стратегический образ агента в Stage 2

По Stage 2 `monitoring` должен быть:

- owner-agent для сигналов, алертов и risk contour;
- read-mostly / control-oriented агентом;
- контуром раннего предупреждения, а не агентом бизнес-исполнения.

## 5. Фактическое состояние агента по коду

Подтверждён через:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [monitoring-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/monitoring-agent.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Фактически покрывает intent:

- `emit_alerts`

Имеет встроенные:

- rate limit;
- deduplication;
- deterministic alert execution через `RiskToolsRegistry`.

Также агент уже включён в:

- `Runtime Governance` как canonical signal/risk role;
- `Control Tower` как источник queue/risk/fallback telemetry;
- `Lifecycle Board` как canonical runtime node.

## 6. Домены ответственности

- сигналы;
- алерты;
- incidents;
- risk monitoring;
- сводка причин и источников предупреждений.

## 7. Что агент обязан делать

- Принимать сигналы и превращать их в alerts.
- Не дублировать одинаковые alerts.
- Соблюдать rate limiting.
- Давать explainable summary по monitoring snapshot.

## 8. Что агенту запрещено делать

- Брать ownership CRM, finance и agronomy operations.
- Выполнять бизнес-действия вместо owner-agent домена.
- Подменять escalation решением о реальном write-action.

## 9. Текущий фактический функционал

- Обработка сигналов.
- Вызов `EmitAlerts`.
- Дедупликация и лимит алертов.
- Monitoring summary поверх deterministic result.

## 10. Максимально допустимый функционал

В целевой модели агент может покрывать:

- multi-signal correlation;
- risk prioritization;
- governed escalation в owner-domains через оркестратор;
- связку с `controller` как будущей ролью контроля.

Не должен покрывать:

- прямое выполнение remediation действий;
- перехват ownership у finance, agro, CRM;
- скрытый operational mesh.

## 11. Связи с оркестратором

- Все вызовы идут через orchestration spine.
- Handoff в другой домен допустим только как governed escalation.
- Агент не должен напрямую активировать peer agent.

## 12. Связи с другими агентами

- С `agronomist`: возможна передача сигналов agro-risk через оркестратор.
- С `economist`: возможна передача finance-risk через оркестратор.
- С `crm_agent`: возможна эскалация клиентского сигнала, но не ownership.
- С `knowledge`: возможна проверка policy по incident rules через оркестратор.

## 13. Связи с доменными модулями

- `RiskToolsRegistry`
- monitoring / control tower contour

## 14. Required Context Contract

- Базовый контекст: набор `signals`.
- При отсутствии явных сигналов используется mock/default snapshot, что допустимо для fallback-режима, но не заменяет production feed.

## 15. Intent Catalog

- `emit_alerts`

## 16. Tool surface

- `EmitAlerts`
- по registry default дополнительно доступен `GetWeatherForecast`, но owner-intent остаётся monitoring.

## 17. UI surface

- контрольные и monitoring windows;
- alerts summary;
- risk status output.

## 18. Guardrails

- Запрет на ownership чужих operational domains.
- Read/control-first характер.
- Handoff только через центральный узел.

## 19. Основные риски и failure modes

- Сигнальный контур маскирует отсутствие owner-agent в другом домене.
- Alert fatigue из-за слабой настройки dedup и rate limit.
- Неявное расширение в business execution.

## 20. Требования к тестам

- Тест на `emit_alerts` routing.
- Тесты на rate limit.
- Тесты на dedup.
- Тесты на запрет cross-domain execution.

## 21. Критерии production-ready

- Сигналы обрабатываются детерминированно.
- Dedup и rate limit работают.
- Нет подмены operational ownership.
- Есть smoke-набор по сигналам и алертам.
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
- [monitoring-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agents/monitoring-agent.service.ts)
