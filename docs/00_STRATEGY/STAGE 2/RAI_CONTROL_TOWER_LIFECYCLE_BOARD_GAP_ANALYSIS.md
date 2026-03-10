---
id: DOC-S2-CT-LIFECYCLE-GAP
type: Analysis
layer: Stage 2
status: Active Analysis
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-10
---

# RAI CONTROL TOWER LIFECYCLE BOARD GAP ANALYSIS

## 1. Назначение документа

Этот документ фиксирует разрыв между:

- текущим фактическим кодом `Control Tower` и explainability/governance surfaces;
- целевым `lifecycle board`, вытекающим из:
  - [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
  - [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)

Цель документа:

- честно зафиксировать, что уже реализовано;
- показать, чего не хватает до полноценного lifecycle board;
- дать roadmap следующей реализации без архитектурной путаницы.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- планируется развитие `Control Tower`;
- обсуждается lifecycle board;
- нужно понять, достаточно ли текущего operator plane;
- нужно решить, что делать после `runtime governance` и `swarm control tower`;
- требуется приоритизировать следующий UX/backend слой по жизненному циклу агентов.

---

## 3. Канонические источники

Этот gap analysis нужно читать вместе с:

- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)

Фактическое состояние подтверждается кодом:

- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [runtime-governance-read-model.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-read-model.service.ts)
- [runtime-governance-drilldown.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-drilldown.service.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [agent-prompt-governance.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-prompt-governance.service.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)

---

## 4. Целевой lifecycle board

Целевой `lifecycle board` в `Control Tower` должен как минимум показывать и управлять:

- `agent onboarding`
- `template -> future role -> canonical promotion`
- `promotion candidate`
- `canary rollout`
- `freeze`
- `rollback`
- `retirement`
- `versioning`

Нормативно это должен быть не просто список change requests, а единая operator поверхность по жизненному циклу флота агентов.

---

## 5. Что уже есть в текущем коде

### 5.1 Runtime governance plane уже есть

Подтверждено:

- runtime governance summary;
- agent reliability table;
- drilldowns;
- top fallback reasons;
- recent incidents;
- active recommendations;
- queue pressure;
- manual `TOOL_FIRST`;
- manual `QUARANTINE`;
- `clear override`.

Это уже даёт рабочий operator plane по надежности и автономности.

### 5.2 Agent onboarding и configuration plane уже есть

Подтверждено:

- отдельная страница реестра и конфигурирования агентов;
- onboarding templates;
- создание future roles;
- validation;
- governed change request path;
- responsibility binding;
- runtime governance overrides.

### 5.3 Promotion/canary/rollback backend уже есть частично

Подтверждено:

- change request review path;
- canary statuses;
- rollback statuses;
- promotion path;
- quarantine model path при degraded review.

Но это пока существует в основном как backend/governance path, а не как единый lifecycle board внутри `Control Tower`.

---

## 6. Что уже покрыто, частично покрыто и отсутствует

| Lifecycle capability | Текущее состояние | Факт по коду | Разрыв |
|---|---|---|---|
| Runtime reliability board | `DONE` | Есть summary, reliability table, drilldowns, overrides | Разрыв не критичен |
| Agent onboarding | `PARTIAL` | Есть templates, config UI, validation, change requests | Нет unified lifecycle board view |
| Future role tracking | `PARTIAL` | Есть manifests и governance path | Нет fleet-wide lifecycle stage board |
| Promotion candidate visibility | `PARTIAL` | Backend статусы есть | Нет dedicated operator surface |
| Canary rollout board | `PARTIAL` | Canary backend path есть | Нет visual board and unhealthy-first rollout view |
| Freeze | `PARTIAL` | Есть quarantine/tool-first overrides, но это autonomy governance, а не lifecycle freeze | Нет отдельного freeze state board |
| Rollback | `PARTIAL` | Backend rollback path и runbooks есть | Нет явного rollback board и version comparison |
| Retirement | `MISSING` | Нет first-class retirement surface | Нет lifecycle retirement workflow |
| Versioning board | `PARTIAL` | Config snapshots/change requests есть | Нет unified version lineage in Control Tower |
| Fleet lifecycle heatmap | `MISSING` | Нет lifecycle heatmap | Нет operator summary по стадиям эволюции |

---

## 7. Главный вывод по текущему состоянию

Сейчас `Control Tower` уже является сильной панелью:

- по reliability;
- по runtime governance;
- по incidents and overrides;
- по unhealthy execution behaviour.

Но он ещё не является полноценным `lifecycle board`.

Точный диагноз:

- `runtime control plane` уже есть;
- `lifecycle control plane` ещё не собран в единую операторскую поверхность.

---

## 8. Детализация разрывов

### 8.1 Нет first-class lifecycle stage board

Оператор сейчас не видит в одном месте:

- какие агенты в `TEMPLATE`;
- какие в `FUTURE_ROLE`;
- какие в `PROMOTION_CANDIDATE`;
- какие в `CANARY`;
- какие `FROZEN`;
- какие `ROLLBACK_PENDING`;
- какие `RETIRED`.

Это главный недостающий слой.

### 8.2 Нет canary board как отдельной operator зоны

Хотя backend знает `canaryStatus`, в `Control Tower` нет поверхностей:

- какие canary active;
- какие degraded;
- где нужен rollback;
- какие rollout windows unsafe.

### 8.3 Freeze смешан с autonomy override

Сейчас `QUARANTINE` и `TOOL_FIRST` уже работают, но это не то же самое, что lifecycle `freeze`.

Разница:

- `autonomy override` управляет способом исполнения;
- `freeze` должен управлять эволюцией и продвижением версии/агента.

### 8.4 Rollback существует без удобного operator board

Rollback path и runbooks уже есть, но оператор не имеет:

- fleet-wide rollback board;
- сравнения `previous stable -> current candidate`;
- наглядной цепочки `incident -> degraded canary -> rollback`.

### 8.5 Retirement как lifecycle state фактически не surfaced

Сейчас можно логически считать роль выведенной, но нет:

- отдельного retirement workflow;
- retirement board;
- retirement status summary.

### 8.6 Versioning ещё не собран как lineage view

Есть snapshots, change requests и promoted configs, но нет:

- единой линии версий;
- отображения current effective version vs candidate version;
- operator view по lineage агента.

---

## 9. Что уже можно считать сильной базой для lifecycle board

Следующие куски уже достаточно сильные, чтобы не переписывать их, а использовать как основу:

- `agents` registry/config page;
- change request flow;
- canary and rollback backend semantics;
- runtime governance summary;
- runtime governance drilldowns;
- manual operator actions;
- autonomy policy surfaces.

То есть lifecycle board должен строиться не с нуля, а как сборка уже существующих governance surfaces.

---

## 10. Что нужно реализовать следующим слоем

### 10.1 Lifecycle summary board

Добавить в `Control Tower` read-model, который показывает:

- count by lifecycle state;
- active canaries;
- degraded canaries;
- frozen agents;
- rollback pending agents;
- retired agents;
- promotion candidates.

### 10.2 Lifecycle table по агентам

Нужна таблица по агентам с колонками:

- role;
- owner domain;
- lifecycle state;
- effective version;
- candidate version;
- canary status;
- rollback status;
- freeze flag;
- current autonomy level;
- last critical recommendation.

### 10.3 Canary zone

Нужна отдельная зона:

- active canaries;
- degraded canaries;
- pass/fail verdict;
- operator actions:
  - approve promote
  - hold
  - rollback

### 10.4 Version lineage view

Нужен view:

- previous stable;
- current active;
- current candidate;
- pending promotion;
- rolled-back version.

### 10.5 Retirement workflow

Нужен отдельный controlled path:

- mark as retirement candidate;
- confirm retirement;
- successor agent or domain reason;
- remove from active default surfaces.

---

## 11. Приоритеты

### Priority 1

- lifecycle summary board
- lifecycle table
- canary board

### Priority 2

- freeze as distinct lifecycle state
- rollback board
- version lineage

### Priority 3

- retirement workflow
- lifecycle heatmap
- ownership-to-lifecycle overlay

---

## 12. Проверка по двум новым агентам

Дополнительная проверка показала:

- профиль [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md) существует;
- профиль [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md) существует;
- оба уже включены в [AGENT_PROFILES/INDEX.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INDEX.md).

То есть отдельного пробела по profile-docs для двух новых canonical agents сейчас нет.

---

## 13. Рекомендованный следующий implementation track

Следующий правильный шаг после этого gap analysis:

1. сделать `lifecycle read model` в backend;
2. вывести `lifecycle summary` и `lifecycle table` в `Control Tower`;
3. добавить `canary board`;
4. отделить `freeze` от `autonomy override`;
5. потом сделать `rollback board` и `version lineage`.

---

## 14. Связанные файлы и точки кода

- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [runtime-governance-read-model.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-read-model.service.ts)
- [runtime-governance-drilldown.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-drilldown.service.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [agent-prompt-governance.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-prompt-governance.service.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
