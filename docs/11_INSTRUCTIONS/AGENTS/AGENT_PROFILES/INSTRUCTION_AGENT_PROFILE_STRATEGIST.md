---
id: DOC-INS-AGT-PROFILE-007
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
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
- portfolio tradeoffs;
- strategic interpretation и long-range advisory как advisory-only слой, а не execution-layer.

## 7. Что агент обязан делать

- Давать стратегические варианты и assumptions.
- Отделять thesis от evidence.
- Оставаться advisory-only.

## 8. Что агенту запрещено делать

- Автономно менять стратегию компании.
- Брать ownership по plan/fact, scenario simulation или finance risk assessment только потому, что вопрос сформулирован стратегически.
- Подменять economist, legal или controller ownership.
- Притворяться production-ready runtime owner, пока canonical strategy family не поднята.
- Выполнять реальные бизнес-действия.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `strategist`;
- governance path и advisory-only policy;
- runtime defaults для будущего агента;
- `StrategyToolsRegistry` на template-уровне;
- template semantics для strategic scenarios, tradeoffs и initiative prioritization.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый strategy intent catalog в `rai-chat`;
- production strategy tool surface;
- direct production routing в `strategist` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- Strategic scenario analysis;
- initiative prioritization;
- tradeoff maps;
- long-horizon recommendations с evidence;
- portfolio framing и strategic thesis building;
- governed advisory handoff для strategy / finance / control контуров.

Роль не должна автоматически расширяться до:

- ownership над `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment`;
- execution ownership в contracts, CRM, agronomy или monitoring;
- autonomous strategy execution;
- скрытого runtime-дубля `economist`.

## 11. Связи с оркестратором

- Пока только template binding через onboarding.
- В runtime agent topology не присутствует.
- До canonical enablement direct production routing в `strategist` запрещён.

## 12. Связи с другими агентами

- С `economist`: будущий handoff по финансовым сценариям.
- С `knowledge`: текущее template execution inheritance.
- С `controller`: будущий контроль исполнения стратегических решений.

### 12.1 Нормативные handoff-trigger зоны

`strategist` может быть owner только standalone strategy/advisory-запроса, когда доминирующее действие пользователя относится к strategic framing:

- сформировать strategic options;
- приоритизировать инициативы;
- собрать portfolio tradeoffs;
- оформить long-range recommendation;
- дать strategic thesis и assumptions по нескольким сценариям.

Даже в этих случаях до canonical enablement direct production routing в `strategist` остаётся запрещённым. Оркестратор должен трактовать это как future advisory-path, а не как уже доступный runtime owner.

Ownership не должен переходить в `strategist`, когда главное действие остаётся у runtime owner:

- посчитать plan/fact;
- выполнить scenario simulation как deterministic finance-analysis;
- выполнить finance risk assessment;
- создать или исполнить договорный объект;
- выполнить CRM, agronomy или monitoring action.

Жёсткие различия:

- `strategist` даёт strategic framing, tradeoffs и long-horizon advisory;
- `economist` владеет deterministic finance analysis и economic interpretation;
- `knowledge` владеет corpus retrieval и evidence lookup;
- `controller` в будущем нужен для control implications, а не для strategy authorship.

Допустимые governed handoff:

- из `economist`, когда deterministic finance outputs нужно поднять на strategic advisory-уровень;
- из `knowledge`, когда corpus retrieval уже найден и нужен strategic interpretation слой;
- из `controller`, когда control exception требует strategic implication review;
- в `economist`, когда strategic scenario требует финансовой оценки.

Анти-триггеры:

- наличие слов `strategy`, `initiative`, `portfolio`, если пользователь по сути просит `compute_plan_fact` или `simulate_scenario`;
- наличие strategic route без смены доминирующего действия;
- наличие финансовых метрик без самостоятельного strategic question;
- наличие сценарного слова в execution-запросе другого домена.

Эти признаки не должны переводить ownership в `strategist`, если главное действие остаётся у `economist` или другого доменного owner-а.

## 13. Связи с доменными модулями

- Будущий `StrategyToolsRegistry`
- стратегические источники и corpora

## 14. Required Context Contract

Как canonical runtime contract не формализован.

На future/template-уровне стратегически полезны:

- scenario set или initiative context;
- portfolio / strategic horizon;
- supporting finance evidence или corpus evidence;
- явный strategic question пользователя.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- strategic scenario framing;
- initiative prioritization;
- portfolio tradeoff commentary;
- long-horizon strategic summary.

### 15.2 Максимально допустимый intent-scope

В пределах strategy-domain допустимы только такие будущие intent-ы:

- strategic framing;
- initiative prioritization;
- portfolio tradeoff analysis;
- strategic summary и thesis building;
- governed advisory handoff support для strategy / finance / control контуров.

Эти intent-ы не должны превращать `strategist` в owner для `economist` analysis, contracts execution, CRM, agronomy или monitoring.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `StrategyToolsRegistry`

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только strategy-специфичные расширения:

- scenario framing tooling;
- tradeoff mapping tooling;
- strategic summary assembly;
- advisory context preparation.

Tool surface не должен расширяться в:

- finance-owner tools;
- contracts execution tools;
- CRM tools;
- agronomy tools;
- monitoring-owner tools.

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

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](../INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)


