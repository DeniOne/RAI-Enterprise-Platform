---
id: DOC-S2-AGENT-LIFECYCLE
type: Canon
layer: Stage 2
status: Active Canon
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-09
---

# RAI AGENT EVOLUTION AND LIFECYCLE

## 1. Назначение документа

Этот документ фиксирует полный жизненный цикл агента в `RAI_EP`:

- `agent onboarding`;
- `agent promotion`;
- `template -> canonical`;
- `canary rollout`;
- `freeze`;
- `rollback`;
- `retirement`;
- `versioning`.

Документ нужен как верхний канон эволюции агентной платформы. Он замыкает архитектуру между:

- ownership;
- runtime governance;
- `Swarm Control Tower`;
- governance path для agent configs;
- production rollout.

Нормативный смысл документа:

- агент считается не просто кодовым модулем, а управляемой производственной единицей;
- у каждого агента есть не только responsibility profile, но и lifecycle state;
- agent fleet должен эволюционировать по governed path, а не через хаотические правки prompt-ов и tool bindings.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- создаётся новый агент;
- future role переводится в canonical runtime role;
- меняется prompt, model, tools, focus contract или runtime governance profile;
- выполняется canary rollout;
- нужно заморозить агента;
- нужно откатить агента;
- агент выводится из эксплуатации;
- проектируется версия нового agent family.

---

## 3. Канонические источники

Этот документ нужно читать вместе с:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
- [RAI_CONTROL_TOWER_LIFECYCLE_BOARD_GAP_ANALYSIS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_CONTROL_TOWER_LIFECYCLE_BOARD_GAP_ANALYSIS.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md)

Фактическое состояние подтверждается кодом:

- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-config-guard.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-config-guard.service.ts)
- [agent-config.dto.ts](/root/RAI_EP/apps/api/src/modules/explainability/dto/agent-config.dto.ts)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [autonomy-policy.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/autonomy-policy.service.ts)
- [quality-alerting.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/quality-alerting.service.ts)

---

## 4. Базовый принцип

Жизненный цикл агента в `RAI_EP` должен идти по цепочке:

```text
Idea
  -> Onboarding
  -> Future Role / Template
  -> Validation
  -> Governance Review
  -> Promotion Candidate
  -> Canary
  -> Canonical Production
  -> Freeze / Override / Rollback
  -> Retirement
```

Это означает:

- агент нельзя считать production-ready в момент первого появления в UI;
- promotion не равен “поменяли конфиг и нажали сохранить”;
- каждое существенное изменение должно иметь versioned lifecycle state;
- fleet evolution должна быть наблюдаемой и управляемой через `Control Tower`.

---

## 5. Нормативные lifecycle states

Минимальный жизненный цикл агента должен включать состояния:

- `DRAFT`
- `TEMPLATE`
- `FUTURE_ROLE`
- `PROMOTION_CANDIDATE`
- `CANARY`
- `CANONICAL_ACTIVE`
- `FROZEN`
- `ROLLBACK_PENDING`
- `RETIRED`

### 5.1 Что означает каждое состояние

#### `DRAFT`

Идея или неполный агентный профиль.

Разрешено:

- проектирование;
- документирование;
- contract definition;
- template preparation.

Запрещено:

- production execution;
- direct rollout.

#### `TEMPLATE`

Агент описан в onboarding templates, но ещё не имеет canonical runtime ownership.

Разрешено:

- UX onboarding;
- config authoring;
- bounded experimentation через существующий adapter.

Запрещено:

- считать агента зрелым production-owner.

#### `FUTURE_ROLE`

Agent config уже существует как governed role, но исполняется поверх canonical adapter role.

Разрешено:

- governed eval;
- limited use;
- quality observation.

Запрещено:

- считать его самостоятельным runtime family.

#### `PROMOTION_CANDIDATE`

Роль подготовлена к переходу в canonical family.

Обязательно:

- ownership закреплён;
- contracts определены;
- tools определены;
- governance guard зелёный;
- smoke/eval подготовлены.

#### `CANARY`

Новый canonical agent или новая версия canonical agent включены ограниченно.

Обязательно:

- наблюдать reliability;
- наблюдать BS drift;
- наблюдать fallback and incidents;
- держать rollback path заранее.

#### `CANONICAL_ACTIVE`

Agent считается production canonical owner-role.

Обязательно:

- ownership map;
- runtime governance;
- reliability visibility;
- control tower visibility;
- smoke evidence.

#### `FROZEN`

Agent остаётся в системе, но его evolution path заморожен.

Типовые причины:

- incident cluster;
- BS drift;
- unresolved governance issues;
- platform migration.

#### `ROLLBACK_PENDING`

Agent или его новая версия признаны unsafe для продолжения rollout.

Обязательно:

- остановить дальнейшее продвижение;
- вернуть предыдущую стабильную версию;
- оставить audit trail.

#### `RETIRED`

Agent окончательно выведен из активной эксплуатации.

Обязательно:

- убрать из active ownership;
- убрать из rollout surfaces;
- оставить traceable history.

---

## 6. Agent Onboarding

### 6.1 Что такое onboarding

`Agent onboarding` — это controlled entry нового агента в систему.

В `RAI_EP` onboarding не должен ограничиваться:

- выбором модели;
- написанием prompt;
- добавлением названия в dropdown.

Onboarding обязан включать:

- роль;
- owner domain;
- responsibility binding;
- runtime profile;
- tools;
- guardrails;
- validation;
- governance request.

### 6.2 Что подтверждено кодом

Подтверждено кодом:

- onboarding templates существуют;
- future roles существуют;
- config guard и validation существуют;
- change request path существует;
- responsibility binding уже поддерживается.

### 6.3 Нормативные правила

1. Любой новый агент сначала проходит через onboarding.
2. Onboarding не равен canonical activation.
3. Новый агент обязан иметь owner-domain или explicit delegated binding.
4. Новый write-capable agent обязан иметь governance gates до production use.

---

## 7. Agent Promotion

### 7.1 Что такое promotion

`Promotion` — это перевод агента:

- из template/future role;
- в canonical runtime family;
- или из версии-кандидата;
- в следующую production ступень.

### 7.2 Promotion template -> canonical

Promotion допустим только если одновременно выполнено:

- domain ownership закреплён;
- contracts оформлены;
- runtime role реализована;
- tools registry реализован;
- governance policy оформлена;
- runtime governance thresholds заданы;
- smoke и eval проходят.

### 7.3 Promotion version -> version

Promotion новой версии canonical agent допускается только если:

- canary metrics допустимы;
- нет active rollback recommendation;
- нет unresolved critical incident pressure;
- `Control Tower` не показывает unsafe drift.

---

## 8. Canary Rollout

### 8.1 Назначение canary

Canary нужен, чтобы:

- проверить новую версию в ограниченном контуре;
- не выкатывать risky agent change на весь fleet;
- наблюдать реальные runtime/governance последствия.

### 8.2 Что должно наблюдаться в canary

Минимум:

- success rate;
- fallback rate;
- policy blocks;
- budget denied;
- p95 latency;
- BS%;
- evidence coverage;
- incidents;
- operator overrides.

### 8.3 Нормативные правила

1. Canary не может быть “невидимым”.
2. Для canary обязателен rollback path.
3. Canary должен быть виден в `Control Tower`.
4. Canary нельзя считать завершённым без smoke and runtime evidence.

---

## 9. Freeze

### 9.1 Что такое freeze

`Freeze` — это controlled stop дальнейших изменений и расширений по агенту.

Freeze не равен retirement.

Agent может быть:

- active but frozen;
- serving but not evolving;
- quarantined from risky rollout changes.

### 9.2 Основания для freeze

- repeated quality drift;
- repeated incidents;
- ownership conflict;
- unstable runtime metrics;
- unresolved architecture debt;
- blocked migration.

### 9.3 Нормативные правила

1. Freeze обязан быть видим в operator plane.
2. Freeze обязан блокировать promotion дальше.
3. Freeze не должен стирать историю агента.

---

## 10. Rollback

### 10.1 Что такое rollback

`Rollback` — это controlled возврат к предыдущей стабильной версии агента или его effective config.

### 10.2 Основания для rollback

- critical incident;
- BS drift above unsafe threshold;
- массовый fallback;
- failed canary;
- policy breach;
- operator decision after governance review.

### 10.3 Нормативные правила

1. Rollback должен быть traceable.
2. Rollback не должен зависеть от ручной переписки и памяти команды.
3. Rollback path должен существовать до promotion.
4. Новый agent version без rollback path запрещён.

---

## 11. Retirement

### 11.1 Что такое retirement

`Retirement` — controlled вывод агента из активного fleet.

### 11.2 Когда retirement допустим

- owner-domain поглощён другим canonical agent;
- агент признан временным migration contour;
- роль потеряла bounded context;
- agent family заменён новой версией или новой архитектурой.

### 11.3 Что обязательно при retirement

- зафиксировать successor или reason for retirement;
- убрать active ownership;
- убрать agent from onboarding defaults, если он больше не должен создаваться;
- сохранить audit / traces / historical references.

---

## 12. Versioning

### 12.1 Что подлежит versioning

Versioning обязателен не только для prompt.

Версионироваться должны:

- prompt;
- model;
- tools set;
- focus contract;
- intent catalog;
- guardrails;
- runtime governance envelope;
- autonomy defaults;
- rollout state.

### 12.2 Что запрещено

Запрещено иметь “плавающего” агента без понятной версии эффективной конфигурации.

Нельзя считать версией только:

- markdown описание;
- human memory;
- случайный git diff без rollout attribution.

### 12.3 Нормативный принцип

У агента всегда должны быть различимы:

- `design version`
- `effective runtime version`
- `current lifecycle state`

---

## 13. Что уже подтверждено кодом

На текущий момент кодом уже подтверждено:

- onboarding templates;
- future roles;
- governance validation;
- responsibility binding;
- runtime governance;
- manual overrides;
- `Control Tower` governance surfaces;
- `canary/promote/rollback` контуры в explainability/governance path как минимум частично;
- fleet visibility через runtime governance summary и drilldowns.

Это означает:

- lifecycle canon не стартует с нуля;
- он оформляет и объединяет уже существующие куски в единый нормативный слой.

---

## 14. Что ещё остаётся разрывом

На текущий момент типовые разрывы:

- не все lifecycle states ещё вынесены как first-class persisted status;
- часть promotion semantics ещё распределена между config/governance/runtime, а не собрана в один fleet lifecycle board;
- retirement path ещё не выглядит как отдельный зрелый operator workflow;
- versioning effective agent state ещё может требовать более явной operator surface.

---

## 15. Практические требования к новым агентам

Каждый новый canonical agent обязан сразу иметь:

- onboarding path;
- promotion criteria;
- canary rules;
- rollback path;
- lifecycle visibility in `Control Tower`;
- clear retirement strategy, даже если retirement не ожидается скоро.

Если этого нет, агент не считается полноценно production-governed.

---

## 16. Критерии зрелости

Архитектура агентной платформы считается замкнутой только если одновременно есть:

- ownership map;
- runtime governance;
- `Swarm Control Tower`;
- lifecycle canon;
- governed onboarding;
- promotion path;
- canary path;
- freeze and rollback path;
- retirement and versioning rules.

Только после этого система действительно становится:

- `Agent OS + Control Tower + Lifecycle Governance`.

---

## 17. Связанные файлы и точки кода

- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-config-guard.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-config-guard.service.ts)
- [agent-config.dto.ts](/root/RAI_EP/apps/api/src/modules/explainability/dto/agent-config.dto.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [autonomy-policy.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/autonomy-policy.service.ts)
- [quality-alerting.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/quality-alerting.service.ts)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_SWARM_CONTROL_TOWER_ARCHITECTURE.md)
