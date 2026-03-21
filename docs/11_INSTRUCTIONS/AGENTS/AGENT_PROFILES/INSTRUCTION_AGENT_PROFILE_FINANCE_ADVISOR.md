---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-F-1NIX
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА FINANCE_ADVISOR

## 1. Назначение

Документ описывает template-role `finance_advisor`.

## 2. Когда применять

Использовать документ при проектировании специализированного финансового advisory поверх `economist`.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `finance`.
- Execution adapter: `economist`.

## 4. Стратегический образ агента в Stage 2

Роль нужна как управляемый финансовый advisory-контур поверх детерминированных метрик и сценариев.

## 5. Фактическое состояние агента по коду

Подтверждён template с:

- `ownerDomain: finance`
- strong-model routing
- `FinanceToolsRegistry`
- advisory-only governance
- explicit no-payment / no-booking writes

Как canonical runtime role не реализован.

## 6. Домены ответственности

- финансовые рекомендации;
- метрики;
- budgets;
- сценарные финансовые выводы;
- executive finance commentary как advisory-only слой, а не finance execution или finance analysis owner-path.

## 7. Что агент обязан делать

- Опираться на deterministic finance evidence.
- Возвращать рекомендации, а не транзакции.
- Работать в advisory-only режиме.

## 8. Что агенту запрещено делать

- Платёжные и учётные writes.
- Брать ownership по plan/fact, scenario или risk assessment только потому, что запрос оформлен как advisory.
- Подменять `economist` owner-agent без formalized runtime split.
- Притворяться production-ready runtime owner, пока canonical finance-advisor family не поднята.
- Выходить в CRM или legal.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `finance_advisor`;
- governance policy и advisory-only constraints;
- adapter binding к `economist`;
- `FinanceToolsRegistry` на template-уровне;
- template semantics для management-ready finance advisory поверх deterministic evidence.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый самостоятельный finance-advisor intent catalog в `rai-chat`;
- production tool surface отдельный от `economist`;
- direct production routing в `finance_advisor` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- управляемый финансовый advisory;
- portfolio and budget commentary;
- management-ready summaries поверх `economist` outputs;
- executive commentary по commerce facts и deterministic metrics;
- governed advisory handoff для finance / contracts / control контуров.

Роль не должна автоматически расширяться до:

- ownership над `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment`;
- payment, booking или contract execution;
- CRM, agronomy или legal ownership;
- скрытого runtime-дубля `economist`.

## 11. Связи с оркестратором

- Сейчас только через future-role onboarding.
- В каноническом runtime как отдельная family отсутствует.
- До canonical enablement direct production routing в `finance_advisor` запрещён.

## 12. Связи с другими агентами

- С `economist`: текущее adapter inheritance.
- С `controller`: будущая связка по control exceptions.

### 12.1 Нормативные handoff-trigger зоны

`finance_advisor` может быть owner только standalone finance-advisory-запроса, когда доминирующее действие пользователя относится к executive finance commentary:

- подготовить management-ready financial summary;
- дать advisory commentary по budget / portfolio / metrics;
- оформить executive interpretation поверх уже рассчитанных deterministic finance outputs;
- дать advisory summary по commerce facts без запроса на execution.

Даже в этих случаях до canonical enablement direct production routing в `finance_advisor` остаётся запрещённым. Оркестратор должен трактовать это как future advisory-path, а не как уже доступный runtime owner.

Ownership не должен переходить в `finance_advisor`, когда главное действие остаётся у runtime owner:

- посчитать plan/fact;
- выполнить scenario simulation;
- выполнить finance risk assessment;
- создать или провести invoice / payment;
- исполнить contract lifecycle action;
- изменить CRM, agronomy или monitoring state.

Жёсткие различия:

- `finance_advisor` даёт executive advisory и management commentary;
- `economist` владеет deterministic finance analysis и finance interpretation;
- `contracts_agent` владеет contract / invoice / payment execution;
- `finance_advisor` не должен подменять `economist` только из-за более "управленческой" формулировки запроса.

Допустимые governed handoff:

- из `economist`, когда нужен executive advisory поверх уже рассчитанных metrics;
- из `contracts_agent`, когда нужен management-level finance commentary по commerce facts;
- из `controller`, когда control exception требует executive finance interpretation;
- из `knowledge`, когда corpus retrieval уже найден и нужен finance-advisory слой.

Анти-триггеры:

- наличие слов `budget`, `portfolio`, `advisory`, `summary` внутри запроса, который на самом деле требует `compute_plan_fact` или `simulate_scenario`;
- наличие invoice / payment / contract context без самостоятельного advisory-вопроса;
- наличие finance route без смены доминирующего действия;
- наличие deterministic result, если пользователь просит именно operational execution, а не commentary.

Эти признаки не должны переводить ownership в `finance_advisor`, если главное действие остаётся у `economist` или `contracts_agent`.

## 13. Связи с доменными модулями

- `FinanceToolsRegistry`
- будущий finance domain adapter

## 14. Required Context Contract

Как canonical runtime contract не оформлен.

На future/template-уровне финансово полезны:

- metrics / budget / portfolio context;
- deterministic finance outputs или commerce facts;
- период, сценарий или management question;
- явный advisory-вопрос пользователя.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- executive finance advisory;
- budget / portfolio commentary;
- management-ready finance summary.

### 15.2 Максимально допустимый intent-scope

В пределах finance-advisory domain допустимы только такие будущие intent-ы:

- executive finance commentary;
- management summary по metrics;
- portfolio / budget advisory;
- governed advisory handoff support для finance / contracts / control контуров.

Эти intent-ы не должны превращать `finance_advisor` в owner для `economist` analysis, contracts execution, CRM, agronomy или monitoring.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `FinanceToolsRegistry`

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только finance-advisory-специфичные расширения:

- executive summary tooling;
- commentary assembly поверх deterministic metrics;
- budget / portfolio advisory tooling;
- advisory context preparation.

Tool surface не должен расширяться в:

- payment or booking execution tools;
- contracts execution tools;
- CRM tools;
- agronomy tools;
- monitoring-owner tools.

## 17. UI surface

- Пока только onboarding.
- Full finance advisor windows не подтверждены.

## 18. Guardrails

- Только advisory.
- `financial_actions_disallowed`
- `no_payment_or_booking_writes`

## 19. Основные риски и failure modes

- Путаница между `finance_advisor` и `economist`.
- Скрытая попытка сделать runtime-дубль экономиста без ownership split.
- Использование советника как transaction actor.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- В будущем: routing, evidence, no-write regression.

## 21. Критерии production-ready

- Отдельный role contract.
- Ясное разграничение с `economist`.
- No-write governance.
- Deterministic evidence path.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)

