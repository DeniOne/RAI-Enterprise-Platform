# RAI Agent Platform & AI — Addendum: Agent Focus, Intent и Context Contracts

> Версия: 1.0  
> Дата: 2026-03-07  
> Статус: Active Addendum to Master Plan  
> Родительский документ: [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)

---

## 1. Зачем нужен addendum

Infrastructure и governed runtime-контур Stage 2 в основном доведены.

Но на уровне продуктовой логики остаётся важный разрыв:

- агент уже можно вызвать;
- агент уже можно исполнить через runtime;
- агент уже можно govern'ить;
- но у агента ещё нет достаточно жёстко описанной фокусной зоны ответственности.

Сейчас специализация агентов в значительной степени определяется:

- rule-based роутингом по словам запроса;
- подсказкой от текущего route;
- allowlist-ом инструментов и capabilities;
- ограниченным набором intent-ов внутри конкретного agent service.

Этого достаточно для первых governed execution paths, но недостаточно для зрелой Agent Platform.

Этот addendum фиксирует следующий обязательный продуктово-архитектурный слой:

- `Agent Focus Contract`
- `Intent Catalog`
- `Required Context Contract`
- `UI Action Surface Contract`

---

## 2. Честная фиксация текущего состояния

### 2.1 Что уже есть

- у канонических агентов есть role;
- у них есть runtime profile;
- у них есть capability/tool bindings;
- runtime и governance уже понимают, как их исполнять и ограничивать;
- future roles уже можно безопасно привязывать через `executionAdapterRole`.

### 2.2 Чего ещё нет как first-class contract

Пока ещё не существует полноценно формализованного ответа на вопросы:

- за какой именно класс задач отвечает агент;
- какие intent-ы являются каноническими для этого агента;
- какие входные данные обязательны для каждого intent-а;
- какие данные агент может брать сам;
- какие данные нужно спрашивать у пользователя;
- какие рабочие окна агент имеет право открывать в UI.

Именно это сейчас мешает сделать действительно зрелый guided interaction layer.

### 2.3 Что уже начато в коде

После последних изменений этот addendum уже не является чисто теоретическим:

- появился единый backend contract source для interaction semantics;
- `IntentRouter` больше не держит ключевые agent intent rules только в локальных regex-ветках;
- `Supervisor` resume-path использует общий intent/context contract;
- clarification payload и window-actions для:
  - `Агроном-А / tech_map_draft`
  - `Экономист-А / compute_plan_fact`
  уже строятся от общего contract-layer, а не от трёх разрозненных реализаций.
- rich-output semantics того же contract-aware слоя уже подтверждены и для:
  - `Знание-А / query_knowledge`
  - `Мониторинг-А / emit_alerts`

То есть:

- слой больше не “начат”, а уже действует как runtime-backed contract layer;
- platform-wide reference coverage по 4 canonical agent families Stage 2 уже есть.

---

## 3. Главный принцип addendum

Новый агент или уже существующий reference agent должен определяться не только через:

- `role`
- `model`
- `systemPrompt`
- `tool bindings`

Но и через 4 дополнительные first-class сущности:

1. `Focus Contract`
2. `Intent Catalog`
3. `Required Context Contract`
4. `UI Action Surface Contract`

Без этого агент остаётся “исполняемым runtime-юнитом”, но ещё не становится полнофункциональным продуктовым модулем.

---

## 4. Agent Focus Contract

### 4.1 Что это такое

`Agent Focus Contract` отвечает на вопрос:

**какой класс задач является канонической зоной ответственности агента**

Это не маркетинговое описание и не красивый prompt.

Это жёсткий продуктовый контракт:

- чем агент должен заниматься;
- чем агент не должен заниматься;
- какие доменные поверхности являются для него целевыми;
- где он может быть первичным исполнителем;
- где он может быть только вторичным помощником.

### 4.2 Минимальная форма

```ts
interface AgentFocusContract {
  role: string;
  primaryDomains: string[];
  secondaryDomains?: string[];
  canonicalTaskFamilies: string[];
  forbiddenTaskFamilies?: string[];
  primaryWorkspaceSurfaces?: string[];
  notes?: string[];
}
```

### 4.3 Пример для `Агроном-А`

Не в коде, а как канонический продуктовый смысл:

- primary domains:
  - agronomy
  - field operations
  - tech map draft/review
  - deviations review
- canonical task families:
  - `tech_map_draft`
  - `deviations_review`
  - `agro_recommendation`
- forbidden task families:
  - `finance_plan_fact`
  - `legal_validation`
  - `crm_follow_up`

Это и будет настоящей фокусной зоной, а не просто “если встретилось слово техкарта”.

---

## 5. Intent Catalog

### 5.1 Зачем он нужен

Сейчас у части агентов intent-ы уже есть фактически, но не оформлены как отдельный уровень платформы.

`Intent Catalog` должен зафиксировать:

- какие intent-ы вообще допустимы для конкретного агента;
- какой intent является primary;
- какие tool/connector/memory paths используются для этого intent-а;
- какой output contract ожидается;
- какой режим UI-вывода нужен по умолчанию.

### 5.2 Минимальная форма

```ts
interface AgentIntentDefinition {
  intentId: string;
  agentRole: string;
  title: string;
  taskFamily: string;
  requiredCapabilities: string[];
  allowedTools: string[];
  outputContractId: string;
  defaultUiMode: "inline" | "panel" | "takeover";
}
```

### 5.3 Пример для `Агроном-А`

Для первого релиза должны быть хотя бы:

- `tech_map_draft`
- `deviations_review`

Это важно, потому что тогда формулировка

`Агроном-А -> техкарта -> не хватает контекста`

будет опираться не на случайную эвристику, а на канонический intent catalog.

---

## 6. Required Context Contract

### 6.1 Зачем он нужен

Сейчас агент уже может понять, что ему чего-то не хватает.

Но этого недостаточно.

Нужно first-class описать:

- какой контекст обязателен для каждого intent-а;
- какой контекст желателен;
- что можно взять из workspace;
- что можно взять из памяти;
- что нужно запросить у пользователя;
- что делать, если источник контекста отсутствует.

### 6.2 Минимальная форма

```ts
interface RequiredContextItem {
  key: string;
  label: string;
  required: boolean;
  sourcePriority: Array<"workspace" | "memory" | "record" | "user">;
  reason: string;
}

interface AgentIntentContextContract {
  intentId: string;
  requiredContext: RequiredContextItem[];
  optionalContext?: RequiredContextItem[];
}
```

### 6.3 Пример для `tech_map_draft`

Обязательные:

- `fieldRef`
- `seasonRef`

Желательные:

- `crop`
- `selected technology profile`
- `farmRef`

Тогда фраза `не хватает контекста` перестаёт быть туманной и становится управляемым контрактом.

---

## 7. UI Action Surface Contract

### 7.1 Зачем он нужен

Если агент должен работать через overlay windows и guided interaction, он должен знать не только что спросить, но и:

- какие UI-окна он может открыть;
- в какие разделы он может вести пользователя;
- какие действия допустимы;
- какой режим вывода нужен по умолчанию.

### 7.2 Минимальная форма

```ts
interface AgentUiActionSurfaceContract {
  intentId: string;
  defaultWindowType: string;
  defaultWindowMode: "inline" | "panel" | "takeover";
  allowedUiActions: string[];
  allowedNavigationTargets?: string[];
}
```

### 7.3 Пример для `tech_map_draft`

Разрешённые действия:

- открыть `context_acquisition`
- открыть карточку поля
- открыть выбор сезона
- показать найденные связанные данные
- продолжить выполнение после добора контекста

Это нужно, чтобы оркестратор открывал не абстрактную панель, а канонически допустимое рабочее окно.

---

## 8. Что это означает для MVP-4

### 8.1 Жёсткая формулировка

MVP-4 нельзя считать завершёнными reference implementations платформы, пока у них нет:

- явного focus contract;
- явного intent catalog;
- required context contract;
- UI action surface contract.

### 8.2 Первый обязательный эталон

Первый эталонный трек:

- `Агроном-А`
- intent: `tech_map_draft`
- required context: `fieldRef`, `seasonRef`
- ui action surface: `context_acquisition` overlay

Это должен быть первый fully-specified product interaction contract.

---

## 9. Что это означает для runtime и orchestration

После принятия этого addendum оркестратор должен принимать решения не только по:

- тексту сообщения;
- route;
- эвристике по regex;

Но и по:

- focus contract агента;
- intent catalog;
- context contract;
- ui action surface contract.

То есть следующий зрелый уровень роутинга должен быть:

`message + workspace + focus contract + intent catalog + context contract -> selected agent intent -> execution / clarification / window action`

---

## 10. Статус внедрения

### 10.1 Что уже можно считать частично реализованным

- runtime specialization path;
- capability/tool allowlists;
- execution through canonical adapters;
- первичные agent-specific intents у MVP-4;
- governed execution через `/api/rai/chat`.

### 10.2 Что пока ещё не реализовано fully

- first-class `Agent Focus Contract`
- first-class `Intent Catalog`
- first-class `Required Context Contract`
- first-class `UI Action Surface Contract`

Именно это является следующим продуктово-архитектурным слоем после закрытия execution/governance stage.

---

## 11. Сухой вывод

Stage 2 runtime/governance/kernel слой в основном доведён.

Следующий обязательный шаг уже не про “как исполнить агента”, а про:

- за что агент отвечает;
- какие intent-ы ему принадлежат;
- какой контекст ему обязателен;
- как он должен взаимодействовать с UI и пользователем.

Без этого платформа будет иметь исполнимых агентов, но не будет иметь по-настоящему зрелых продуктовых агентных модулей.

---

## 12. Implementation Plan

### 12.1 Цель пакета

Сделать `Agent Responsibility Contracts` не только архитектурным тезисом, а runtime/governance truth-source.

После выполнения этого пакета система должна явно знать:

- за что отвечает агент;
- какие задачи он имеет право брать;
- какой контекст обязан собрать до исполнения;
- какие UI-действия и окна он может инициировать;
- что ему запрещено;
- как future roles наследуют responsibility profile.

### 12.2 Что считаем done

Пакет считается завершённым, когда одновременно выполнено всё:

1. Есть единый машинно-читаемый source of truth для:
   - `Focus Contract`
   - `Intent Catalog`
   - `Required Context Contract`
   - `UI Action Surface Contract`
   - `Guardrails Contract`
2. Для canonical families описаны и реально используются responsibility contracts:
   - `agronomist`
   - `economist`
   - `knowledge`
   - `monitoring`
3. `IntentRouter` опирается на responsibility contracts, а не на semi-hardcoded responsibility heuristics.
4. Clarification flow берёт required context из общего contract source.
5. Window actions и guided overlays собираются из `UI Action Surface Contract`.
6. Future role может наследовать canonical responsibility profile через binding.
7. Governance surface валидирует manifest/change request на предмет responsibility binding и intent compatibility.
8. Есть tests + live smoke минимум для canonical families и хотя бы одного future role.

### 12.3 Основная модель данных

#### Agent Focus Contract

```ts
interface AgentFocusContract {
  role: string;
  title: string;
  businessDomain: string;
  responsibilities: string[];
  allowedEntityTypes: string[];
  disallowedEntityTypes?: string[];
  allowedRoutes?: string[];
  forbiddenRoutes?: string[];
}
```

#### Intent Catalog

```ts
interface AgentIntentDefinition {
  id: string;
  role: string;
  description: string;
  triggerHints: string[];
  toolName?: string;
  outputMode: "answer" | "clarification" | "window" | "comparison";
  requiredContextKeys: string[];
  optionalContextKeys?: string[];
  allowedWithoutContext?: boolean;
}
```

#### Required Context Contract

```ts
interface RequiredContextDefinition {
  key: string;
  label: string;
  entityType?: string;
  required: boolean;
  sourcePriority: Array<"workspace" | "record" | "thread" | "user">;
  reason: string;
}
```

#### UI Action Surface Contract

```ts
interface AgentUiActionDefinition {
  id: string;
  role: string;
  intentId?: string;
  kind: "focus_window" | "open_route" | "open_entity" | "refresh_context" | "pick_context";
  label: string;
  targetRoutePattern?: string;
  allowedWindowTypes?: string[];
  allowedEntityTypes?: string[];
}
```

#### Guardrails Contract

```ts
interface AgentGuardrailDefinition {
  role: string;
  forbiddenIntentIds?: string[];
  forbiddenEntityTypes?: string[];
  forbiddenActions?: string[];
  forbiddenDomains?: string[];
}
```

#### Future-role Responsibility Binding

```ts
interface ResponsibilityBinding {
  role: string;
  inheritsFromRole: string;
  overrides?: {
    title?: string;
    allowedIntents?: string[];
    forbiddenIntents?: string[];
    extraUiActions?: string[];
  };
}
```

### 12.4 Минимальный канонический intent catalog

#### `agronomist`

- `tech_map_draft`
- `execution_deviation_review`
- `field_operation_guidance`

#### `economist`

- `compute_plan_fact`
- `scenario_comparison`
- `risk_assessment`

#### `knowledge`

- `query_knowledge`
- `policy_lookup`
- `document_grounding`

#### `monitoring`

- `signal_review`
- `emit_alerts`
- `escalation_summary`

### 12.5 Required context examples

#### `agronomist / tech_map_draft`

- `fieldRef`
- `seasonRef`

#### `economist / compute_plan_fact`

- `harvestPlanId`
- `seasonRef`

#### `knowledge / query_knowledge`

- может быть `allowedWithoutContext = true`

#### `monitoring / signal_review`

- `route`
- `tenantContext`
- опционально `alertId`

### 12.6 UI action surface examples

#### `agronomist`

- `open_field_card`
- `go_to_techmap`
- `pick_season`
- `focus_window`

#### `economist`

- `open_plan_fact`
- `go_to_budget_dashboard`
- `open_scenario_compare`

#### `knowledge`

- `open_document`
- `open_policy_page`

#### `monitoring`

- `open_signal_center`
- `open_alert_route`
- `open_trace_detail`

### 12.7 Архитектурный план реализации

#### Step 1. Responsibility contract registry

Создать единый source of truth, например:

- `/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-responsibility.contracts.ts`

В нём для каждого canonical role должны жить:

- focus
- intents
- required context
- ui actions
- guardrails

#### Step 2. Перевести router на contracts

`IntentRouter` должен использовать:

- `Intent Catalog`
- `Focus Contract`
- route/entity hints как scoring input

И отдавать:

- `targetRole`
- `intentId`
- `confidence`
- `matchedBy`
- `requiredContextKeys`

#### Step 3. Перевести clarification flow на contracts

После выбора `intentId` система должна:

- брать required keys из `Required Context Contract`
- пробовать собрать их из `workspaceContext`
- если не хватает:
  - строить `pendingClarification`
  - строить `context_acquisition` window
  - собирать actions из `UI Action Surface Contract`

#### Step 4. Перевести window actions на contracts

`ResponseComposer` должен брать разрешённые actions из `UI Action Surface Contract`, а не собирать их ad-hoc в процедурной логике.

#### Step 5. Future-role inheritance

Нужно ввести для promoted/future roles не только `executionAdapterRole`, но и:

- `responsibilityProfileRole`

Либо equivalent binding, который говорит, чей semantic responsibility profile наследуется.

Пример:

- `marketer -> knowledge`

#### Step 6. Governance validation

`validateFutureAgentManifest()` и related governance guards должны проверять:

- есть ли responsibility binding/profile
- совместим ли declared domain с inherited profile
- не заявляет ли future role forbidden intents
- есть ли допустимый UI action surface

### 12.8 Рекомендуемые file-level changes

#### Backend

- `/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-responsibility.contracts.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/intent-router/intent-router.service.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `/root/RAI_EP/apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`
- `/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts`
- `/root/RAI_EP/apps/api/src/modules/explainability/agent-config-guard.service.ts`
- `/root/RAI_EP/apps/api/src/modules/explainability/agent-prompt-governance.service.ts`

#### Frontend

Минимально:

- `/root/RAI_EP/apps/web/lib/api.ts`
- `/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts`

Если выводить responsibility truth в UI:

- `/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx`

### 12.9 Тестовый план

#### Backend unit

1. Для каждого canonical role существует валидный responsibility profile.
2. Каждый intent привязан к существующему role.
3. Каждый required context key существует и связан с intent.
4. Каждый UI action surface не выходит за allowed domain.
5. Router корректно выбирает:
   - `agronomist / tech_map_draft`
   - `economist / compute_plan_fact`
   - `knowledge / query_knowledge`
   - `monitoring / signal_review` или `emit_alerts`
6. Clarification берёт missing context из contract source, а не из ad-hoc логики.
7. Future role с responsibility binding валиден.
8. Future role без responsibility binding невалиден.

#### Backend live smoke

1. `/api/rai/chat` agronomist path
2. `/api/rai/chat` economist path
3. `/api/rai/chat` knowledge path
4. `/api/rai/chat` monitoring path
5. `/api/rai/agents/config` future role показывает responsibility binding
6. onboarding/validate для future manifest проверяет responsibility profile

#### Frontend/manual smoke

1. control-tower показывает responsibility truth для role
2. clarification окна используют только разрешённые действия
3. future role не выглядит generic-агентом без фокусной зоны

### 12.10 Truth-sync после реализации

После завершения пакета обновить:

- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md`
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`
- `/root/RAI_EP/docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`
- новый handoff / closeout report

### 12.11 Порядок выполнения

#### Phase 1

1. Responsibility contracts для 4 canonical families
2. Router from contract source
3. Clarification from contract source

#### Phase 2

1. UI actions from contract source
2. Future-role responsibility binding
3. Governance validation

#### Phase 3

1. Tests
2. Live smoke
3. Truth-sync docs
4. memory-bank + push

### 12.12 Pragmatic cut для следующего чата

Для следующего execution-пакета брать именно такой объём:

1. canonical responsibility contracts для 4 reference families
2. router + clarification + ui actions from contract source
3. future-role `responsibilityProfileRole`
4. governance validation for future roles
5. tests + live smoke + truth-sync

Это даёт архитектурно честное завершение следующего слоя Stage 2 без расползания в бесконечную метамодель.
