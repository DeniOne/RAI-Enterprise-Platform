---
id: DOC-INS-AGT-PROFILE-007
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА STRATEGIST

## 1. Назначение

Документ описывает role `strategist` как плановый стратегический агент.

## 2. Когда применять

Использовать документ при проектировании отдельного стратегического owner-agent и сценарного advisory.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `strategy`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Стратегически агент должен отвечать за:

- сценарии;
- стратегические компромиссы;
- portfolio thinking;
- long-range advisory без автономного исполнения.

## 5. Фактическое состояние агента по коду

Подтверждён только как onboarding template:

- `ownerDomain: strategy`
- advisory-only режим
- `StrategyToolsRegistry`
- strong-model routing

Canonical runtime role не реализована.

## 6. Домены ответственности

- стратегия;
- инициативы;
- сценарии;
- portfolio tradeoffs.

## 7. Что агент обязан делать

- Давать стратегические варианты и assumptions.
- Отделять thesis от evidence.
- Оставаться advisory-only.

## 8. Что агенту запрещено делать

- Автономно менять стратегию компании.
- Подменять economist, legal или controller ownership.
- Выполнять реальные бизнес-действия.

## 9. Текущий фактический функционал

- Template manifest;
- governance path;
- runtime defaults для будущего агента.

## 10. Максимально допустимый функционал

- Strategic scenario analysis;
- initiative prioritization;
- tradeoff maps;
- long-horizon recommendations с evidence.

## 11. Связи с оркестратором

- Пока только template binding через onboarding.
- В runtime agent topology не присутствует.

## 12. Связи с другими агентами

- С `economist`: будущий handoff по финансовым сценариям.
- С `knowledge`: текущее template execution inheritance.
- С `controller`: будущий контроль исполнения стратегических решений.

## 13. Связи с доменными модулями

- Будущий `StrategyToolsRegistry`
- стратегические источники и corpora

## 14. Required Context Contract

Ещё не формализован как canonical runtime contract.

## 15. Intent Catalog

Ещё не формализован как canonical runtime catalog.

## 16. Tool surface

- `StrategyToolsRegistry` заявлен в template.

## 17. UI surface

- Пока только onboarding.
- Отдельные strategy work windows не подтверждены кодом.

## 18. Guardrails

- Только advisory.
- `strategy_changes_require_exec_review`
- `no_autonomous_execution`

## 19. Основные риски и failure modes

- Превращение стратегической роли в vague chatbot.
- Подмена economist-owner на сценарных задачах.
- Отсутствие явного owner-agent при существующем strategic module.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- После enablement: routing, evidence, scenario regression sets.

## 21. Критерии production-ready

- Canonical runtime family.
- Strategy-specific contracts.
- Evidence-backed scenario engine or read corpus.
- Smoke-набор стратегических кейсов.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

