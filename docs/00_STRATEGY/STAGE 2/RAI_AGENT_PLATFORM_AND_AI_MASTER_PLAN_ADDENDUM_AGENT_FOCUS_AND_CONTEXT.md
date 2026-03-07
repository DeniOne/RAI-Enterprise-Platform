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
