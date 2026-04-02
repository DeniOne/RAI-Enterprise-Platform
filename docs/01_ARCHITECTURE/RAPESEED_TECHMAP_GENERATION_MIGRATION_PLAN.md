---
id: DOC-ARCH-RAPESEED-TECHMAP-GENERATION-MIGRATION-PLAN-20260401
layer: Architecture
type: HLD
status: approved
version: 1.1.12
owners: [principal-architect, domain-integrator]
last_updated: 2026-04-02
claim_id: CLAIM-ARCH-RAPESEED-GEN-MIGRATION-001
claim_status: asserted
verified_by: manual
last_verified: 2026-04-02
evidence_refs:
  - docs/01_ARCHITECTURE/RAPESEED_ENGINE_INTEGRATION_MAP.md
  - docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md
  - docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md
  - docs/00_STRATEGY/TECHMAP/RAPESEED_CANONICAL_RULE_REGISTRY.md
  - docs/00_STRATEGY/TECHMAP/RAPESEED_DOMAIN_ONTOLOGY.md
  - docs/00_STRATEGY/TECHMAP/rapeseed_techcard.schema.yaml
  - apps/api/src/modules/tech-map/tech-map.service.ts
  - apps/api/src/modules/tech-map/tech-map-blueprint.ts
  - apps/api/src/modules/tech-map/fsm/tech-map.fsm.ts
  - scripts/techmap-rapeseed-cutover.cjs
  - scripts/techmap-rapeseed-cutover-matrix.cjs
  - scripts/techmap-rapeseed-cutover-wave.cjs
  - var/ops/techmap-rapeseed-cutover-default-rai-company-verify.json
  - var/ops/techmap-rapeseed-cutover-pilot-rapeseed-kuban-company-verify.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-e.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-f.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-g.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-h.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-i.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-j.json
  - var/ops/techmap-rapeseed-cutover-wave-operational-wave-2026-04-02-k.json
  - var/ops/techmap-rapeseed-cutover-matrix-operational.json
---

# RAPESEED TECHMAP GENERATION MIGRATION PLAN
## Non-breaking миграция генерации TechMap к Canonical Rapeseed Core

## CLAIM
id: CLAIM-ARCH-RAPESEED-GEN-MIGRATION-001
status: asserted
verified_by: manual
last_verified: 2026-04-02

---

## Статус реализации на 2026-04-02

План больше не является только проектным intent-документом. Его основные migration wave доведены до рабочего состояния в коде, в explainability/runtime-контуре и в operational rollout.

### Текущий статус завершения

- `technical implementation complete`
- `live validation continues`

Это означает:

- инженерная часть миграции считается завершённой;
- canonical generation path, fallback, parity, explainability, governance loop и cutover tooling уже реализованы;
- дальнейшие tenant-level cutover и field validation больше не считаются незавершённой разработкой и идут как live operational подтверждение.

Фактически реализовано:

- `TechMap Engine` сохранён как runtime/governance backbone без смены кодового FSM.
- `CropForm` закреплён как единственный канонический механизм различения `RAPESEED_WINTER` и `RAPESEED_SPRING`.
- генерация переведена на orchestrated path с `canonical_schema`, version pinning, `GenerationExplanationTrace`, `FieldAdmissionResult`, semantic shadow parity и fallback governance.
- runtime-семантика `ControlPoint`, `Recommendation`, `DecisionGate`, evidence guard, explainability read-path и rollout observability введены как first-class контур.
- выполнен живой tenant cutover для двадцати трёх operational scope:
  - `default-rai-company`
  - `pilot-rapeseed-bryansk-company`
  - `pilot-rapeseed-kaluga-company`
  - `pilot-rapeseed-kostroma-company`
  - `pilot-rapeseed-kuban-company`
  - `pilot-rapeseed-don-company`
  - `pilot-rapeseed-volga-company`
  - `pilot-rapeseed-stavropol-company`
  - `pilot-rapeseed-rostov-company`
  - `pilot-rapeseed-belgorod-company`
  - `pilot-rapeseed-kursk-company`
  - `pilot-rapeseed-orenburg-company`
  - `pilot-rapeseed-samara-company`
  - `pilot-rapeseed-saratov-company`
  - `pilot-rapeseed-tambov-company`
  - `pilot-rapeseed-ulyanovsk-company`
  - `pilot-rapeseed-voronezh-company`
  - `pilot-rapeseed-lipetsk-company`
  - `pilot-rapeseed-penza-company`
  - `pilot-rapeseed-tula-company`
  - `pilot-rapeseed-ryazan-company`
  - `pilot-rapeseed-vladimir-company`
  - `pilot-rapeseed-yaroslavl-company`
- актуальная serial rollout matrix подтверждает `PASS = 23`, `BLOCKED = 0` в `scope=operational`; `STRESS_*` tenant-ы исключены из боевого scope.

Граница этого документа остаётся архитектурной:

- он фиксирует целевую модель миграции и её реализованный operational status;
- утверждения о текущем runtime по-прежнему должны перепроверяться по `code/tests/gates` и generated rollout artifacts.
- engineering sprint по migration implementation на этом уровне считается закрытым; дальше остаётся только live validation track.

## 1. Назначение

Этот документ нужен, чтобы перевести генерацию техкарты рапса с текущего скрытого детерминированного `blueprint`-источника на явное каноническое агрономическое ядро без переписывания рабочего движка исполнения.

Мигрируется только слой генерации:

- выбор ветки озимый/яровой;
- допуск поля до генерации;
- статическая адаптация по полю, почве, региону, предшественнику и гибриду;
- раскрытие этапов, обязательных блоков, порогов, правил, точек контроля и сигналов мониторинга из канонических артефактов.

Не трогаются и сохраняются как рабочий backbone:

- `TechMapStateMachine` с текущим кодовым FSM `DRAFT -> REVIEW -> APPROVED -> ACTIVE -> ARCHIVED`;
- `TechMapWorkflowOrchestratorService`;
- `DAGValidationService` и `TechMapValidationEngine`;
- `ChangeOrderService`, `Approval`, `EvidenceService`;
- `ContractCoreService`, `TechMapBudgetService`, `TechMapKPIService`, `RecalculationEngine`;
- tenant isolation, идемпотентные write-path, `CropZone`-центрированная модель.

Практический смысл для `Phase B`: замкнуть путь `context -> techmap -> execution -> deviation -> result`, где каноника управляет генерацией, а существующий движок сохраняет жизненный цикл, governance, explainability и контроль отклонений.

---

## 2. Исполнительный вердикт миграции

### 2.1. Жёсткие решения

| Метка | Вердикт | Решение |
|---|---|---|
| `APPROVED_AS_BASE` | Принято | Текущий `TechMap Engine` достаточен как базовый исполняющий и governance-контур. |
| `KEEP_RUNTIME` | Принято | FSM, DAG, `ChangeOrder`, `Evidence`, `ContractCore`, Budget/KPI и adaptive runtime сохраняются без переписывания. |
| `REPLACE_GENERATION_SOURCE` | Принято | Скрытый первичный источник генерации должен быть вынесен из `tech-map-blueprint.ts`. |
| `ADD_CANONICAL_LAYER` | Принято | Нужен явный канонический генерационный слой поверх schema/rule/ontology. |
| `REQUIRE_PHASED_ROLLOUT` | Обязательно | Переключение только по фазам с параллельным режимом и резервным путём. |
| `REQUIRE_NEW_COMPONENT` | Обязательно | Нужны `FieldAdmissionService`, `SchemaDrivenTechMapGenerator`, explainability-trace и runtime semantics для `ControlPoint`. |
| `KEEP_CODE_FSM` | Обязательно | Миграция генерации не меняет текущий кодовый FSM. |
| `KEEP_ENGINE_INVARIANTS` | Обязательно | Нельзя ломать tenant scoping, идемпотентность, валидацию DAG и доказательный контур исполнения. |

### 2.2. Итоговый архитектурный вывод

Небьющая миграция выполнима. Проблема системы находится не в исполняющем движке, а в том, что активная production-генерация всё ещё живёт в `buildTechMapBlueprint()`. Поэтому целевой путь должен заменить источник генерационной истины, а не переписывать жизненный цикл техкарты.

### 2.3. Топ выводов миграции

| № | Вывод |
|---|---|
| 1 | `tech-map-blueprint.ts` сегодня является production-path, но не может оставаться канонической истиной после миграции. |
| 2 | Целевой первичный путь генерации: `SchemaDrivenTechMapGenerator` с rapeseed-специализацией через `CanonicalRapeseedGeneratorService`. |
| 3 | Допуск поля должен выполняться до создания черновика техкарты и до любой materialization стадий/операций. |
| 4 | Ветвление `winter/spring` должно стать first-class решением генерации, а не побочным следствием общих шаблонов рапса. |
| 5 | `rapeseed_techcard.schema.yaml` должен определять стадии, ветки, `mandatory_blocks`, `control points` и `monitoring signals`. |
| 6 | `RAPESEED_CANONICAL_RULE_REGISTRY.md` должен стать источником порогов, правил допуска, проверок и severity-модели. |
| 7 | `RAPESEED_DOMAIN_ONTOLOGY.md` должен фиксировать семантический контракт для сущностей и разделение `RegionProfile` vs `SoilProfile`. |
| 8 | Все новые решения генерации должны оставлять explainability traces, иначе `Phase B` не закрывает explainability-loop. |
| 9 | `ControlPoint`, `Recommendation`, `DecisionGate`, `MonitoringSignal` и trace-объекты нужно вводить аддитивно, не вмешиваясь в FSM-переходы. |
| 10 | На переходный период должен существовать резервный путь: blueprint как fallback и совместимый adapter, но не как primary truth. |

---

## 3. Текущий путь генерации

### 3.1. Реально реализованный путь в коде

| Шаг | Текущий узел | Что происходит | Выход |
|---|---|---|---|
| 1 | `TechMapService.generateMap(harvestPlanId, seasonId)` | Принимает запрос генерации, грузит `HarvestPlan` и `Season`, проверяет tenant и наличие `fieldId`. | Подготовленный generation context |
| 2 | `ensureCropZone()` | Находит или создаёт `CropZone` по `seasonId + fieldId + companyId`. | `CropZone` как центр агрегации генерации |
| 3 | `buildTechMapBlueprint()` | Строит детерминированный шаблон по `crop`, `seasonYear`, `seasonStartDate`, `targetYieldTHa`. | `TechMapBlueprint` |
| 4 | `prisma.$transaction(...)` | Создаёт `TechMap`, затем `MapStage`, затем `MapOperation`, затем `MapResource`; помечает прошлые карты `isLatest=false`. | Персистентная техкарта с графом стадий/операций |
| 5 | `status = DRAFT` | Новая карта создаётся как `DRAFT`, `generationMetadata` хранит `source=deterministic-blueprint`. | Черновик техкарты |
| 6 | Поздний жизненный цикл | Дальше включаются FSM, review/approval, валидации, бюджет, доказательства и runtime-оркестрация. | Рабочий lifecycle после генерации |

### 3.2. Что этот путь уже решает хорошо

| Сильная сторона | Почему это важно |
|---|---|
| Идемпотентный центр через `CropZone` | Генерация уже привязана к tenant, сезону и полю, а не к абстрактному crop-template. |
| Транзакционная materialization | `TechMap`, `MapStage`, `MapOperation`, `MapResource` пишутся атомарно. |
| Совместимость с текущим FSM | Карта сразу входит в рабочий контур `DRAFT -> REVIEW -> APPROVED -> ACTIVE -> ARCHIVED`. |
| Повторное использование валидаторов | После генерации уже доступны DAG-проверки, validation engine, budget/KPI и recalculation. |
| Минимальная explainability метаданных | Есть `generationMetadata` с `source` и `blueprintVersion`, что можно расширить до trace. |

### 3.3. Где путь недостаточен для канонического ядра рапса

| Пробел | Текущее состояние | Почему это критично |
|---|---|---|
| Допуск поля | Отсутствует обязательный pre-generation gate | Генерация может начаться на поле, которое каноника должна заблокировать по pH, севообороту или киле. |
| Выбор формы культуры | Есть только общий `CropType.RAPESEED` | Нет first-class ветвления `RAPESEED_WINTER` vs `RAPESEED_SPRING`. |
| Ветвление канонических стадий | Blueprint содержит 5 hardcoded стадий | Нет разделения на `winter_rapeseed` и `spring_rapeseed` sequences из schema. |
| Статическая адаптация | Практически отсутствует | Почва, уплотнение, дренаж, предшественник, `SAT_avg`, гибрид и целевая урожайность не управляют каркасом карты. |
| Mandatory blocks | Не извлекаются из schema | Обязательные блоки живут вне генерационного контракта. |
| Правила и пороги | Хардкод/локальные проверки | `RuleRegistry` и `ThresholdRegistry` не являются первичным генерационным источником. |
| Точки контроля | Нет first-class `ControlPoint` | Runtime не получает канонические decision gates и целевые наблюдения по фазам. |
| Сигналы мониторинга | Нет materialized `MonitoringSignal` | Нельзя заранее связать карту с каноническими сезонными сигналами. |
| Explainability | Нет подробного трассирования ветвления и правил | Невозможно аудировать, почему выбрана ветка, стадия, блок или порог. |

### 3.4. Что сейчас зашито в коде вместо каноники

| Категория | Где зашито | Что должно переехать |
|---|---|---|
| Последовательность стадий | `tech-map-blueprint.ts` | В `schema.canonical_branches[*].stage_sequence` |
| Обязательные операции | `tech-map-blueprint.ts` | В `mandatory_blocks` + rule-driven injection |
| Yield scaling | `scaleAmount(...)` | В канонический expander и адаптационные policy-слои |
| Выбор формы рапса | Не моделируется явно | В `crop_form` + `BranchSelectionService` |
| Пороговые решения | Частично в validation/калькуляторах | В `RuleRegistryEntry` и `ThresholdRegistry` |

---

## 4. Целевой путь генерации

| Шаг | Действие | Текущий компонент engine | Канонический артефакт | Новая интеграционная логика | Выход |
|---|---|---|---|---|---|
| 1 | Intake контекста | `TechMapService.generateMap()` / `createDraftStub()` | Ontology inputs | Сбор полного generation context по `CropZone`, `CropPlan`, `SoilProfile`, `RegionProfile`, `InputCatalog` | `GenerationContext` |
| 2 | Допуск поля | Новый `FieldAdmissionService` | Rule Registry `R-ADM-*`, schema `required_inputs` | Проверка обязательных полей и блокирующих условий до генерации | `FieldAdmissionResult` |
| 3 | Выбор формы культуры | Новый `BranchSelectionService` | Schema `CropForm`, ontology `CropPlan.crop_form` | Вывод `winter/spring` по плану и zone-fit сигналам | `CropFormResolution` |
| 4 | Выбор канонической ветки | `CanonicalRapeseedGeneratorService` | `canonical_branches` | Маппинг `crop_form -> winter_rapeseed / spring_rapeseed` | `CanonicalBranchContext` |
| 5 | Статическая адаптация | `CanonicalRapeseedGeneratorService` + existing calculators | Rule Registry layer `STATIC_ADAPTATION`, ontology, schema thresholds | Наложение условий почвы, региона, предшественника, гибрида, yield-target | `AdaptedGenerationPlan` |
| 6 | Раскрытие стадий из schema | Новый `SchemaDrivenTechMapGenerator` | `stage_sequence` | Преобразование stage ids в `MapStageDraft[]` с `goal`, `bbch_scope`, template-операциями | `StageDraft[]` |
| 7 | Materialization операций | Existing `MapOperation` persistence path | Schema stage templates + existing calculators | Генерация операций, временных окон, норм ресурсов и зависимостей | `OperationDraft[]` |
| 8 | Внедрение обязательных блоков | `SchemaDrivenTechMapGenerator` | `mandatory_blocks` | Injector добавляет обязательные операции/этапы и помечает их как mandatory-origin | `ExpandedStageDraft[]` |
| 9 | Создание `ControlPoint` | Новый `ControlPointFactory` | Ontology `ControlPoint`, schema thresholds | Генерация planned control points на основе стадий и BBCH scope | `ControlPointDraft[]` |
| 10 | Привязка порогов | Новый `ThresholdAttachmentService` | Schema `thresholds`, Rule Registry | Привязка threshold refs к stage/operation/control point | `ThresholdAttachment[]` |
| 11 | Привязка правил | Новый `RuleAttachmentService` | Rule Registry | Привязка `rule_id`, `layer`, `type`, `confidence`, severity | `RuleBinding[]` |
| 12 | Привязка сигналов мониторинга | Новый `MonitoringSignalService` | Schema `monitoring_signals` | Подготовка signal subscriptions и реакций по стадиям | `MonitoringSignalBinding[]` |
| 13 | Persist в текущие engine-структуры | Существующий Prisma write-path | Ontology mapping | Запись в `TechMap`, `MapStage`, `MapOperation`, `MapResource` и новые trace/runtime-модели в одной транзакции | Персистентная техкарта |
| 14 | Runtime activation | Существующие FSM, workflow, validation, budget/KPI | Engine invariants | Карта входит в обычный lifecycle без смены статусной машины | `DRAFT` техкарта в рабочем lifecycle |
| 15 | Persist explainability trace | Новый `GenerationExplanationBuilder` | Ontology + Rule Registry + schema | Сохранение human-readable и machine-auditable причин выбора | `GenerationExplanationTrace` |

### 4.1. Канонический порядок истины после миграции

| Слой | Роль после миграции |
|---|---|
| `rapeseed_techcard.schema.yaml` | Источник генерации веток, стадий, mandatory blocks, control points, monitoring signals |
| `RAPESEED_CANONICAL_RULE_REGISTRY.md` | Источник правил допуска, порогов, severity и адаптационных решений |
| `RAPESEED_DOMAIN_ONTOLOGY.md` | Семантический контракт сущностей и границ данных |
| `TechMap Engine` | Жизненный цикл, governance, персистентность, runtime-оркестрация, доказательства и изменения |

---

## 5. Стратегия миграции `blueprint`

`tech-map-blueprint.ts` сегодня является production generation path. Это нужно признать явно. Одновременно он не является и не должен оставаться канонической истиной после миграции.

### 5.1. Сравнение опций

| Опция | Суть | Плюсы | Минусы | Вердикт |
|---|---|---|---|---|
| `Option A — keep as legacy fallback` | Оставить как резервный генератор | Минимальный риск rollback | Не решает проблему скрытого первичного источника истины | Недостаточно как основная стратегия |
| `Option B — wrap as compatibility adapter` | Обернуть `blueprint` в совместимый adapter и вынести единый generation interface | Уменьшает точку входа миграции, даёт feature-flag и fallback | Если остановиться здесь, truth duplication сохранится | Обязательный переходный слой |
| `Option C — gradually replace by schema-driven generator` | Пошагово перевести раскрытие стадий и правил на schema/rule/ontology | Устраняет скрытую истину, даёт канонический генератор | Требует phased rollout, trace и новых компонентов | Рекомендуемая целевая стратегия |

### 5.2. Рекомендация

Рекомендуется `Option C`, реализуемая через переходный контур `Option B`.

Это означает:

- в фазе перехода `tech-map-blueprint.ts` оборачивается в единый интерфейс генерации;
- по умолчанию сперва остаётся совместимым резервным путём;
- первичная генерационная истина переносится в `SchemaDrivenTechMapGenerator`;
- после переключения по умолчанию blueprint остаётся только как fallback и compatibility adapter.

### 5.3. Что может остаться от blueprint

| Часть текущего blueprint | Судьба | Причина |
|---|---|---|
| `resolveOperationWindow()` | Оставить как utility | Это нейтральная техническая функция materialization. |
| Нормализация crop/base date | Оставить или перенести в shared helper | Это не агрономическая truth-логика. |
| Yield scaling heuristics | Вынести в canonical adapter policy | Это уже влияет на доменную генерацию и не должно жить скрыто в blueprint. |
| Hardcoded stages/operations | Перенести в schema-driven generation | Это и есть скрытая генерационная истина, которую нужно демонтировать. |
| Rapeseed-specific narrative и ресурсы | Перевести в stage templates/rule-driven injector | Они должны исходить из каноники, а не из ручного шаблона. |

### 5.4. Как избежать дублирования истины в переходе

| Мера | Что делает |
|---|---|
| Единый интерфейс `ITechMapGenerationStrategy` | Любой путь генерации вызывается через один orchestrator. |
| Явный `generationStrategy` в `generationMetadata` | Позволяет видеть, какой путь породил карту: `blueprint_fallback` или `canonical_schema`. |
| Shadow compare в фазе 2 | Сравнивает состав стадий/операций между legacy и canonical без переключения пользователей. |
| Запрет на новые rapeseed-enhancements в blueprint | Любое новое агрономическое правило добавляется только в canonical layer. |
| Feature flag per tenant/company | Позволяет включать новый путь дозированно и откатываться без правки кода. |

---

## 6. Новые компоненты, требуемые для миграции

| Компонент | Назначение | Входы | Выходы | Зависимости | Обязателен | Эквивалент уже есть | Интеграция с текущим engine |
|---|---|---|---|---|---|---|---|
| `FieldAdmissionService` | Выполняет допуск поля до генерации | `CropPlan`, `CropZone`, `SoilProfile`, `RegionProfile`, history | `FieldAdmissionResult`, blocker list, trace | Rule Registry, schema `required_inputs` | Да | Нет | Вызывается до materialization в `TechMapService` |
| `SchemaDrivenTechMapGenerator` | Генерирует стадии/операции из schema | `GenerationContext`, branch, adaptation plan | `TechMapDraftGraph` | schema, calculators, input catalog | Да | Нет | Заменяет внутреннее раскрытие `buildTechMapBlueprint()` |
| `CanonicalRapeseedGeneratorService` | Rapeseed-специализация поверх schema expander | `GenerationContext` | `CanonicalGenerationBundle` | ontology, rule registry, schema | Да | Частично blueprint | Оркестрирует admission, branch, adaptation, schema expansion |
| `BranchSelectionService` | Выбирает `winter/spring` и ветку | `CropPlan`, `RegionProfile`, `SAT_avg`, zone-fit signals | `CropFormResolution` | schema enums, rule registry | Да | Нет | Работает перед `SchemaDrivenTechMapGenerator` |
| `RuleAttachmentService` | Привязывает `rule_id` к стадиям, операциям и control points | branch, stage drafts, registry entries | `RuleBinding[]` | Rule Registry | Да | Частично `TechMapValidationEngine` | Расширяет validation metadata без ломки существующих проверок |
| `ThresholdAttachmentService` | Привязывает пороги и breach-actions | stage drafts, branch, thresholds | `ThresholdAttachment[]` | schema thresholds | Да | Нет | Подготавливает evaluation metadata для validation/runtime |
| `ControlPointFactory` | Строит planned `ControlPoint` при генерации | stage drafts, BBCH scopes, rules | `ControlPointDraft[]` | ontology, thresholds, rules | Да | Нет | Создаёт runtime semantics как часть карты |
| `ControlPointService` | Выполняет оценку точек контроля в сезоне | observations, tech map context, control point definition | `ControlPointOutcome`, `Deviation`, `Recommendation` | Evidence, ChangeOrder, validation | Да | Нет | Сидит над текущим lifecycle, не меняя FSM |
| `MonitoringSignalService` | Регистрирует и обрабатывает monitoring signals | tech map, signals, external events | `MonitoringSignalBinding`, `SignalEvaluationResult` | schema signals, TriggerEvaluationService | Да | Частично `TriggerEvaluationService` | Расширяет adaptive runtime через канонические сигналы |
| `RecommendationService` | Формирует human-readable рекомендации | rule hits, deviations, outcomes | `Recommendation` | RuleEvaluationTrace, ontology | Да | Нет | Сопровождает deviation/evidence без блокировки FSM |
| `DecisionGateService` | Формализует ручное решение там, где автологика не должна продолжать сама | blocker outcomes, review-required rules | `DecisionGate`, resolution status | ControlPointService, ChangeOrderService, Approval | Да | Частично Approval flow | Направляет в `ChangeOrder`, не обходя approval |
| `GenerationExplanationBuilder` | Собирает explainability trace генерации | admission result, branch, adaptation decisions, bindings | `GenerationExplanationTrace` | Все новые generation services | Да | Частично `generationMetadata` | Пишет trace рядом с техкартой при генерации |
| `RuleEvaluationTraceStore` | Хранит трассы исполнения правил | rule context, inputs, outputs | `RuleEvaluationTrace` | RuleAttachmentService, validation/runtime | Да | Нет | Используется validation/runtime без изменения FSM |
| `ControlPointOutcomeTraceStore` | Хранит объяснение outcome по control point | observations, thresholds, severity, actions | `ControlPointOutcomeExplanation` | ControlPointService, EvidenceService | Да | Нет | Поддерживает explainability для deviation/result loop |

---

## 7. План миграции на уровне сущностей

| current_entity | future_role | canonical_core_relation | migration_action | breaking_risk | phase | notes |
|---|---|---|---|---|---|---|
| `TechMap` | Основной persist-контейнер канонически сгенерированной карты | Обёртка над `RapeseedTechCard` | `EXTEND` | low | 1-3 | Добавить ссылки на strategy, branch, traces, не менять lifecycle-status |
| `MapStage` | Персистентное представление `TechCardStage` | Schema stages + ontology stage semantics | `EXTEND` | low | 1-2 | Добавить `stage_goal`, `bbch_scope`, canonical ids |
| `MapOperation` | Materialized operation node | Schema stage templates + rule attachments | `EXTEND` | medium | 1-2 | Добавить provenance и attachments без ломки DAG |
| `MapResource` | Materialized resource/input norm | Stage templates + adaptation rules | `EXTEND` | low | 2 | Сохранить идемпотентный write-path и pricing hooks |
| `CropZone` | Центр generation context | Маппинг на поле/сезон/форму культуры | `KEEP` | low | 1-3 | Остаётся точкой входа в runtime data spine |
| `CropPlan` | Источник `crop_form`, yield target, variety, rotation | Ontology `CropPlan` | `EXTEND` | medium | 1 | Нужны явные поля crop-form и admission inputs |
| `RegionProfile` | Агроклиматический слой выбора ветки и зональной адаптации | Ontology `AgroclimaticProfile` | `MAP` | low | 1 | Только региональные данные: `SAT_avg`, zone, frost/drought patterns |
| `SoilProfile` | Полевая и почвенная основа допуска и статической адаптации | Ontology `FieldConditionProfile` | `MAP` | medium | 1 | Хранит `pH`, `P_available`, `K_available`, `S_available`, `B_available`, compaction |
| `AdaptiveRule` | Динамическая сезонная адаптация после генерации | Rule Registry layer `DYNAMIC_SEASONAL` | `KEEP` | low | 2-3 | Не подменяет generation rules, а работает поверх них |
| `Evidence` | Подтверждение выполнения и наблюдений | Explainability/evidence contract | `KEEP` | low | 1-3 | Нужны ссылки на control point и outcome traces |
| `ChangeOrder` | Управляемое изменение карты после runtime events | Decision gate resolution path | `KEEP` | low | 2-3 | Используется как канал внесения изменений, не меняется по сути |
| `Approval` | Подтверждение критичных изменений | Governance core | `KEEP` | low | 2-3 | Сохраняет routing для человеко-решений |
| `RuleRegistryEntry` | Персистентный реестр правил с метаданными | Rule Registry runtime projection | `ADD` | low | 1 | `rule_id`, `layer`, `type`, `confidence`, override policy |
| `ThresholdRegistry` | Источник порогов и breach-actions | Schema thresholds projection | `ADD` | low | 1 | Может быть seed/read-model, не обязательно mutable entity |
| `ControlPoint` | Planned runtime decision gate по BBCH/stage | Ontology `ControlPoint` | `ADD` | medium | 2 | Привязан к `MapStage`, не меняет FSM statuses |
| `Deviation` | Формализованный результат отклонения | Outcome от control point / monitoring | `EXTEND` | medium | 2-3 | Должен получить severity и trace binding |
| `Recommendation` | Advisory outcome без прямой смены статуса | Rule and outcome explainability | `ADD` | low | 1-2 | Human-readable контур для агронома и UI |
| `DecisionGate` | Явный ручной шлюз перед продолжением/override | `HUMAN_REVIEW_REQUIRED` semantics | `ADD` | medium | 2 | Запускает `ChangeOrder`/`Approval`, а не обходит их |
| `MonitoringSignal` | Асинхронный сигнал сезона | Schema `monitoring_signals` | `ADD` | medium | 2-3 | Связка с `TriggerEvaluationService` и внешними сигналами |
| `GenerationExplanationTrace` | Причины формирования техкарты | Explainability core | `ADD` | low | 1-2 | Пишется в generation-time |
| `RuleEvaluationTrace` | Аудит исполнения правила | Rule Registry execution audit | `ADD` | low | 1-3 | Используется и при валидации, и в runtime |
| `ControlPointOutcomeExplanation` | Объяснение результата контрольной точки | Runtime explainability | `ADD` | low | 2-3 | Human-readable + machine-auditable outcome trail |

---

## 8. План миграции на уровне сервисов

| service | current_role | future_role | migration_action | canonical_dependency | rule_registry_dependency | ontology_alignment_needed | schema_dependency | phase | risk | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `tech-map.service.ts` | Entrypoint генерации, materialization, lifecycle ops | Вызывает unified generation orchestrator и сохраняет current engine write-path | `WRAP` | high | medium | high | high | 1-3 | medium | `generateMap()` должен перестать напрямую зависеть от blueprint |
| `tech-map-blueprint.ts` | Текущий детерминированный генератор | Fallback/compatibility adapter | `DEPRECATE_LATER` | low | low | medium | low | 2-3 | high | Запрещено добавлять в него новую rapeseed truth-логику |
| `TechMapWorkflowOrchestratorService` | Explainability/runtime orchestration | Сохраняет lifecycle и читает новые traces | `KEEP` | low | low | medium | low | 2-3 | low | Новые traces становятся источником richer workflow summary |
| `DAGValidationService` | Acyclicity/CPM/resource conflicts | Остаётся неизменным нижним слоем graph validation | `KEEP` | none | none | low | none | 1-3 | low | Новые control points идут отдельным слоем |
| `TechMapValidationEngine` | 7 классов ошибок post-generation | Дополняется canonical rule refs и trace output | `EXTEND` | medium | high | high | medium | 1-3 | medium | Сохраняет legacy checks, но учится ссылаться на `rule_id` |
| `TankMixCompatibilityService` | Совместимость смесей | Сохраняется как специализированная validation utility | `KEEP` | low | medium | low | low | 1-3 | low | Может выдавать `RuleEvaluationTrace` вместо голого warning |
| `SeedingRateCalculator` | Расчёт нормы высева | Используется в canonical adaptation/materialization | `KEEP` | medium | low | medium | low | 2 | low | Не источник ветки, а расчётная функция |
| `FertilizerDoseCalculator` | Расчёт доз питания | Используется в mandatory block injection и adaptation | `KEEP` | medium | medium | medium | low | 2 | low | Работает под rule-driven orchestration |
| `GDDWindowCalculator` | Расчёт GDD-окон | Поддерживает branch-specific windows и signals | `KEEP` | medium | medium | medium | medium | 2-3 | low | Станет частью canonical timing layer |
| `TriggerEvaluationService` | Динамические adaptive rules через `ChangeOrder` | Потребляет канонические `MonitoringSignal` и seasonal overrides | `EXTEND` | medium | high | medium | high | 2-3 | medium | Не заменяет генерацию, а расширяет сезонный контур |
| `RegionProfileService` | Зональные окна и suggestions | Источник agroclimatic signals для branch selection | `EXTEND` | high | medium | high | medium | 1-2 | medium | Не должен хранить полевые агрохимические поля |
| `HybridPhenologyService` | Прогноз BBCH | Даёт вход для control points и monitoring | `EXTEND` | medium | medium | medium | low | 2-3 | low | Используется после generation-time для runtime оценок |
| `EvidenceService` | Evidence attach/validate completion | Получает ссылки на control points/outcome traces | `EXTEND` | low | low | medium | low | 2-3 | low | Не менять DoD: нет завершения без evidence |
| `ChangeOrderService` | Управление изменениями и approval | Основной канал применения decision gates и triggered overrides | `KEEP` | low | medium | medium | low | 2-3 | low | Сохраняется без смены базового протокола |
| `ContractCoreService` | Контрактная целостность и hash | Сохраняет integrity boundary без включения canonical registry в hash | `KEEP` | none | none | low | none | 1-3 | low | Инвариант из integration map |
| `TechMapBudgetService` | Budget plan/fact и delta routing | Получает richer причины изменений, но не меняет принцип расчёта | `KEEP` | low | low | low | none | 1-3 | low | Работает на materialized operations/resources |
| `TechMapKPIService` | KPI оценка карты | Может читать canonical branch/control point metadata | `EXTEND` | low | low | medium | low | 2-3 | low | KPI остаётся поверх текущей карты |
| `RecalculationEngine` | Пересчёт budget/KPI/trigger effects | Оркестрирует реакцию на runtime deviations и signals | `EXTEND` | medium | medium | medium | low | 2-3 | medium | Должен уметь перезапускать canonical attachment evaluation без big-bang rewrite |

---

## 9. План допуска, ветвления и статической адаптации

### 9.1. Допуск поля

| Аспект | Уже покрыто частично | Что нужно реализовать | Gate качества данных |
|---|---|---|---|
| `pH floor` | В текущей генерации отсутствует pre-check | `FieldAdmissionService` должен применять `R-ADM-001` и `R-ADM-002` до генерации | `SoilProfile.pH` обязателен, с датой анализа и freshness policy |
| Рапсовый возврат в севообороте | Нет blocking gate | Применить `R-ADM-003` по `rotation_years_since_rapeseed` | Источник rotation history обязателен и аудируем |
| Исключение крестоцветного предшественника | Нет blocking gate | Применить `R-ADM-004` по predecessor history | `predecessor` и `crucifer_years` обязательны |
| История килы | Нет blocking gate | Применить `R-ADM-005` с hard block логикой | `clubroot_history` и years-since-last-case обязательны |
| Полнота почвенных данных | Частично есть `SoilProfile` модель | Добавить completeness gate по `P_available`, `K_available`, `S_available`, `B_available`, compaction | Нельзя генерировать при missing critical inputs |

### 9.2. Выбор формы культуры

| Аспект | Уже покрыто частично | Что нужно реализовать | Gate качества данных |
|---|---|---|---|
| Явное `RAPESEED_WINTER` / `RAPESEED_SPRING` | Нет, есть общий `CropType.RAPESEED` | Ввести first-class `crop_form` в generation context и branch selection | `CropPlan.crop_form` обязателен либо выводим только по формализованному resolver trace |
| Agroclimatic fit | Частично есть `RegionProfileService` | Использовать `SAT_avg`, `agroclimatic_zone`, `winter_type`, frost/drought profile | `RegionProfile` должен быть полным и tenant-resolved |
| Zone-fit signals | Частично есть zonal suggestions | Формализовать `BranchSelectionService` c trace на каждый сигнал выбора | Нужен explainable score/decision trace |

### 9.3. Статическая адаптация

| Фактор | Уже покрыто частично | Что нужно реализовать | Gate качества данных |
|---|---|---|---|
| `soil_texture` | Почвенная модель есть, generation не использует | Влиять на обработку, глубину, риски и ресурсы | Обязательный enum из schema |
| `compaction` | Модель есть, rule-driven generation нет | Добавлять `deep loosening` блок по `R-SOIL-001` | Нужна подтверждённая оценка уплотнения |
| `drainage` | Полевая модель частично есть | Влиять на риски, timing и monitoring signals | Нужен структурированный дренажный класс |
| Профиль питания поля | Есть `SoilProfile`, нет pre-generation attachments | Привязывать nutrition blocks и thresholds по `P/K/S/B` | Анализ должен быть свежим и полным |
| Предшественник | Хранится вне generation contract | Влиять на branch adaptation, residue handling, risk flags | История предшественников обязательна |
| Сорт / гибрид | Есть `cropVarietyId`, `varietyHybrid` | Влиять на timing, phenology, risk profile | Нужен связный reference на variety/hybrid |
| `target_yield` | Уже есть в `CropZone` и blueprint scaling | Перевести в canonical adaptation policy | Число должно быть валидировано и explainable |
| Региональный профиль | Есть `RegionProfileService` | Развести региональные сигналы от полевых показателей | Запрещено смешивать `SAT_avg` с `S_available/B_available` |

---

## 10. `ControlPoint`, monitoring и семантика runtime

### 10.1. Когда и что создаётся

| Объект | Когда создаётся | Что пишется при генерации | Что появляется только в runtime |
|---|---|---|---|
| `ControlPoint` | Во время генерации | Planned gate: stage binding, `bbch_scope`, required observations, thresholds | Outcome после фактических наблюдений |
| `Deviation` | Частично на generation-time как risk placeholder, полноценно в runtime | Severity policy и expected action mapping | Реальное отклонение при breach/control point failure |
| `Recommendation` | Может создаваться при generation-time для mandatory review | Advisory scaffolding и canned rationale | Контекстная рекомендация по факту rule hit/outcome |
| `DecisionGate` | Только если правило требует human resolution или blocker review | Planned gate policy и routing metadata | Реальный pending/resolved gate |
| `MonitoringSignal` | При генерации как binding/subscription | Signal definitions, source, threshold logic | Срабатывание сигнала и resulting action |
| `RuleEvaluationTrace` | При generation-time для admission/branch/adaptation | Trace precomputed decisions | Runtime breach traces и validation traces |
| `ControlPointOutcomeExplanation` | Нет | Planned trace schema | Реальное explainability outcome после оценки контрольной точки |

### 10.2. Взаимодействие с FSM, `ChangeOrder`, `Evidence`

| Интеграция | Правило |
|---|---|
| FSM | `ControlPoint` не добавляет новые статусы FSM. Он управляет отклонениями и ручными решениями внутри текущих состояний. |
| `ChangeOrder` | Любое изменение техкарты после blocker/critical outcome идёт через `ChangeOrderService`, а не прямым апдейтом карты. |
| `Evidence` | Проверка `ControlPoint` и закрытие критичных отклонений должны уметь требовать `Evidence` как часть definition-of-done. |
| `Approval` | `DecisionGate` для критичных сценариев маршрутизируется в существующий approval-flow. |

### 10.3. Карта severity

| Canonical severity | Поведение в runtime | Влияние на карту |
|---|---|---|
| `informational` | Логирование и наблюдение | Без блокировки; enrich explainability |
| `warning` | Требуется внимание агронома | Может создать `Recommendation`, но не блокирует lifecycle |
| `critical` | Требуется вмешательство и возможный `ChangeOrder` | Может приостановить выполнение конкретного блока до решения |
| `blocker` | Продолжение запрещено до разрешения | Создаёт `DecisionGate`, затем `ChangeOrder`/`Approval` |

---

## 11. План explainability и traceability

### 11.1. Типы трасс

| Категория trace | Что объясняет | Где хранится | Human-readable | Machine-auditable |
|---|---|---|---|---|
| Generation-time trace | Почему поле прошло допуск, выбрана ветка, сгенерированы стадии и mandatory blocks | `GenerationExplanationTrace` | Да, для UI/review | Да, со структурированными refs |
| Validation-time trace | Почему правило/threshold сработали при проверке карты | `RuleEvaluationTrace` | Да | Да |
| Runtime control-point trace | Почему контрольная точка завершилась `ok/warning/critical/blocker` | `ControlPointOutcomeExplanation` | Да | Да |
| Monitoring-trigger trace | Почему внешний сигнал привёл к alert/recommendation/change | `RuleEvaluationTrace` или связанный signal-trace | Да | Да |

### 11.2. Минимальный состав `GenerationExplanationTrace`

| Поле | Смысл |
|---|---|
| `admission_summary` | Почему поле прошло или не прошло допуск |
| `crop_form_decision` | Почему выбрана ветка `winter` или `spring` |
| `branch_id` | Какая каноническая ветка раскрыта |
| `adaptation_factors[]` | Какие статические факторы повлияли на карту |
| `mandatory_block_injections[]` | Какие обязательные блоки были добавлены и почему |
| `rule_bindings[]` | Какие `rule_id` и thresholds прикреплены к объектам карты |
| `fallback_used` | Был ли применён blueprint fallback |

### 11.3. Как trace поддерживает `Phase B`

| Вопрос `Phase B` | Как отвечает новая trace-модель |
|---|---|
| Почему поле прошло/не прошло допуск | `FieldAdmissionResult` + generation trace |
| Почему выбрана ветка озимый/яровой | `crop_form_decision` + branch selection trace |
| Почему карта имеет именно такую последовательность стадий | `branch_id` + `stage_sequence` + adaptation deltas |
| Почему добавлены обязательные блоки | `mandatory_block_injections[]` |
| Почему сработал порог или правило | `RuleEvaluationTrace` |
| Почему `ControlPoint` создал deviation | `ControlPointOutcomeExplanation` |
| Почему создана рекомендация или ручной шлюз | `Recommendation` / `DecisionGate` rationale |

---

## 12. Фазный rollout-план

| Фаза | Изменения | Что остаётся нетронутым | Критерии успеха | Стратегия отката | Наблюдаемость | Требуемые тесты |
|---|---|---|---|---|---|---|
| `Фаза 1 — Parallel canonical enrichment` | Добавляются `RuleRegistryEntry`, `ThresholdRegistry`, trace-модели, `FieldAdmissionService`, `BranchSelectionService`, canonical projections из docs/schema | Blueprint остаётся default; FSM, DAG, `ChangeOrder`, `Evidence`, Budget/KPI без изменений | Admission может выполняться в shadow/report режиме; канонические реестры materialized; traces сохраняются хотя бы для admission/branch dry-run | Выключение новых сервисов feature-flag; генерация полностью остаётся на blueprint | Shadow verdicts, coverage по missing inputs, branch decision logs | Unit для admission/branching; contract tests на registry/schema loading |
| `Фаза 2 — Canonical generation path introduced` | Появляется `SchemaDrivenTechMapGenerator`, unified generation interface, shadow compare legacy vs canonical, planned `ControlPoint`/rule/threshold attachments | Default для пользователей всё ещё может оставаться legacy до readiness; FSM и write-path не меняются | Canonical generator выдаёт персистентную карту в параллельном режиме; сравнение с legacy стабильно; fallback работает | Переключение feature-flag назад на blueprint adapter | Diff dashboard по stages/ops/rules; trace completeness metrics | Integration tests generation parity, transaction tests, non-breaking persistence tests |
| `Фаза 3 — Default switch` | Для rapeseed default-path становится canonical; blueprint переводится в fallback; включаются `ControlPoint`, `Recommendation`, `DecisionGate`, `MonitoringSignal` | Runtime backbone и governance-протоколы сохраняются без rewrite | Новые rapeseed карты не зависят от blueprint как primary truth; fallback доказан; explainability loop полный | Пер-tenant rollback на blueprint fallback с сохранением current maps | Error budget по branch selection, fallback rate, trace persistence rate, `ChangeOrder` integrity | E2E `context -> techmap -> execution -> deviation -> result`, regression tests по FSM/DAG/governance |

---

## 13. Риски и режимы отказа

| risk | where_it_appears | probability | impact | mitigation | rollback_signal |
|---|---|---|---|---|---|
| duplicated truth between blueprint and schema | Фаза 1-2 | high | high | Единый strategy-interface, запрет новых правил в blueprint, shadow compare | Рост расхождений между legacy и canonical outputs |
| semantic drift | Между docs, ontology, code projections | medium | high | Rule registry seeds, schema loaders, doc ownership, trace assertions | Частые mismatch между generated bindings и registry ids |
| wrong crop-form selection | Branch selection | medium | high | `BranchSelectionService` с explainability trace и manual override gate | Неожиданный рост fallback/manual overrides |
| loss of governance integrity | При встраивании новых control layers | low | high | Не менять FSM/approval/change-order contracts | Появление прямых апдейтов карты вне `ChangeOrder` |
| broken `ChangeOrder` flow | Runtime deviations и decision gates | medium | high | Все critical/blocker paths маршрутизировать только через existing service | Ошибки apply/approve после control point outcomes |
| broken `Evidence` flow | Control point completion и operation closure | medium | high | `EvidenceService` остаётся mandatory validator для completion | Возможность закрыть critical outcome без evidence |
| broken DAG assumptions | Injection новых операций и control points | medium | high | Control points отделять от DAG nodes или явно моделировать без циклов | Рост cycle/resource-conflict ошибок после canonical generation |
| weak UI support | Новые traces и recommendation semantics | medium | medium | Сначала human-readable payloads и backward-safe API contracts | UI не показывает branch/admission rationale |
| incomplete control-point integration | Planned gates есть, runtime outcome нет | medium | medium | Вводить `ControlPoint` только вместе с outcome/service contracts | Planned points не порождают observable runtime objects |
| traces not persisted | Explainability включена только в памяти | medium | high | Отдельные trace-stores + transaction hooks + coverage metrics | Пустые trace refs на canonical-generated maps |
| hardcoded legacy logic surviving unnoticed | Старые rapeseed rules остаются в blueprint/service helpers | high | medium | Audit hardcoded branches, code owners, grep-gates на новые rapeseed literals | Новые изменения rapeseed path идут в legacy files |

---

## 14. Definition of Done

- Генерация рапса больше не зависит от `tech-map-blueprint.ts` как от скрытого первичного источника истины.
- `FieldAdmissionService` выполняется до генерации техкарты и блокирует недопустимые поля.
- `winter` и `spring` существуют как first-class ветки генерации.
- Состав стадий выводится из канонической schema, а не из hardcoded blueprint-структуры.
- `mandatory_blocks` внедряются из ветки и адаптационных правил.
- `ControlPoint` существует как first-class runtime semantics.
- `Recommendation` и `DecisionGate` существуют и встроены в deviation/change workflow.
- Существуют `GenerationExplanationTrace`, `RuleEvaluationTrace`, `ControlPointOutcomeExplanation`.
- Инварианты engine сохранены: FSM, DAG, `ChangeOrder`, `Evidence`, `ContractCore`, Budget/KPI, adaptive runtime, tenant isolation, идемпотентный write-path.
- Текущий кодовый FSM продолжает работать без изменений.
- Во время перехода существует резервный путь на blueprint fallback.

---

## 15. Финальная матрица рекомендаций

| area | current_state | target_state | migration_recommendation | priority | phase |
|---|---|---|---|---|---|
| generation entrypoint | `TechMapService.generateMap()` напрямую вызывает blueprint | Entrypoint вызывает unified canonical generation orchestrator | `WRAP` вход и вынести strategy selection | P0 | 1-2 |
| blueprint | Production path и скрытая truth-логика | Fallback/adapter | `DEPRECATE_LATER` и запретить новые rapeseed rules внутри него | P0 | 2-3 |
| field admission | Отсутствует | Blocking pre-generation gate | Добавить `FieldAdmissionService` | P0 | 1 |
| crop-form branching | Не first-class | `winter/spring` branch selection с trace | Добавить `BranchSelectionService` | P0 | 1 |
| static adaptation | Почти отсутствует | Rule-driven adaptation by soil/region/predecessor/variety/yield | Добавить canonical adaptation layer | P0 | 1-2 |
| canonical rules | Docs-only | Runtime projections + attachments + traces | Добавить `RuleRegistryEntry` и `RuleAttachmentService` | P0 | 1-2 |
| schema-driven stages | Hardcoded stages | Schema-driven expansion | Добавить `SchemaDrivenTechMapGenerator` | P0 | 2 |
| control points | Отсутствуют | Planned and evaluated `ControlPoint` | Добавить `ControlPointFactory` + `ControlPointService` | P1 | 2-3 |
| monitoring signals | Отсутствуют как first-class semantics | Bound signals with runtime reactions | Добавить `MonitoringSignalService` | P1 | 2-3 |
| explainability traces | Ограничены `generationMetadata` | Полный trace-контур generation/validation/runtime | Добавить trace stores и builders | P0 | 1-3 |
| adaptive runtime | Уже есть trigger/phenology spine | Читает канонические signals и outcomes | `EXTEND`, не переписывать | P1 | 2-3 |
| governance preservation | Сильный рабочий контур | Тот же контур с richer semantics | `KEEP_RUNTIME` как жёсткий инвариант | P0 | 1-3 |
| UX implications | Причины генерации и отклонений малообъяснимы | UI может показать admission, branch, control-point rationale | Сначала стабилизировать API traces, затем UI contract | P1 | 2-3 |
| `Phase B` readiness | Контур `techmap -> execution` сильный, но generation truth слабая | Полный путь `context -> techmap -> execution -> deviation -> result` | Перевести truth генерации в canonical layer, сохранив engine backbone | P0 | 1-3 |

---

Итоговая архитектурная рекомендация: сохранять существующий `TechMap Engine` как исполняющий backbone, но целенаправленно и по фазам переносить rapeseed generation source-of-truth в `schema + rule registry + ontology`. Это даёт каноническую агрономическую генерацию без разрушения рабочего production-контура.
