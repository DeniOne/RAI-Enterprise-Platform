---
id: DOC-ARCH-RAPESEED-ENGINE-INTEGRATION-MAP-001
layer: Architecture
type: ADR
status: approved
version: 1.0.0
owners: [principal-architect, domain-integrator]
last_updated: 2026-04-01
claim_id: CLAIM-ARCH-RAPESEED-INT-001
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs:
  - docs/01_ARCHITECTURE/RAPESEED_ENGINE_INTEGRATION_MAP.md
  - docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md
  - docs/00_STRATEGY/TECHMAP/RAPESEED_CANONICAL_RULE_REGISTRY.md
  - docs/00_STRATEGY/TECHMAP/RAPESEED_DOMAIN_ONTOLOGY.md
  - apps/api/src/modules/tech-map/
---

# RAPESEED ENGINE INTEGRATION MAP
## TechMap Engine ↔ Canonical Rapeseed Agronomy Core

## CLAIM
id: CLAIM-ARCH-RAPESEED-INT-001
status: asserted
verified_by: manual
last_verified: 2026-04-01

---

## 1. Назначение документа

Этот документ является **каноническим архитектурным планом интеграции** между:

- **TechMap Engine** — существующей governance / runtime-платформой (FSM, DAG, ChangeOrder, Evidence, ValidationEngine, WorkflowOrchestrator)
- **Canonical Rapeseed Core** — новым каноническим агрономическим ядром по рапсу (Rule Registry, Domain Ontology, Techcard Schema v1.0.0)

Документ отвечает на три вопроса:
1. **ЧТО** в Engine уже существует и корректно работает — не трогать.
2. **ЧТО** в Canonical Core является новым семантическим слоем, которого в Engine нет.
3. **КАК** встраивать новый core, не заменяя engine, не ломая существующие инварианты.

---

## 2. Контекст: текущее состояние Engine (Sprint TM-1 → TM-5 + POST)

По результатам спринтов TM-1…TM-5 + POST-A/B/C Engine реализует следующее:

### 2.1 Реализованный Runtime Layer (locked — не трогать)

| Компонент | Местоположение | Статус |
|-----------|---------------|--------|
| `TechMapStateMachine` (FSM) | `tech-map/fsm/` | ✅ DONE |
| `DAGValidationService` (CPM, acyclicity, resource conflicts) | `tech-map/validation/` | ✅ DONE |
| `TechMapValidationEngine` (7 классов ошибок HARD_STOP/WARNING) | `tech-map/validation/` | ✅ DONE |
| `TankMixCompatibilityService` | `tech-map/validation/` | ✅ DONE |
| `ChangeOrderService` + `Approval` | `tech-map/change-order/` | ✅ DONE |
| `EvidenceService` | `tech-map/evidence/` | ✅ DONE |
| `TechMapBudgetService` + `TechMapKPIService` | `tech-map/economics/` | ✅ DONE |
| `ContractCoreService` (SHA-256 hash) | `tech-map/economics/` | ✅ DONE |
| `RecalculationEngine` | `tech-map/economics/` | ✅ DONE |
| `TriggerEvaluationService` | `tech-map/adaptive-rules/` | ✅ DONE |
| `RegionProfileService` | `tech-map/adaptive-rules/` | ✅ DONE |
| `HybridPhenologyService` | `tech-map/adaptive-rules/` | ✅ DONE |
| `TechMapWorkflowOrchestratorService` | `tech-map/` | ✅ DONE |
| `buildTechMapBlueprint()` | `tech-map/tech-map-blueprint.ts` | ✅ DONE (см. Gap §5) |

### 2.2 Данные в Prisma-схеме (locked — не трогать, только расширять)

| Модель | Статус |
|--------|--------|
| `TechMap`, `MapStage`, `MapOperation`, `MapResource` | ✅ DONE |
| `CropZone`, `CropPlan`, `SoilProfile`, `RegionProfile` | ✅ DONE |
| `Evidence`, `ChangeOrder`, `Approval` | ✅ DONE |
| `AdaptiveRule`, `HybridPhenologyModel` | ✅ DONE |
| `InputCatalog`, `BudgetLine`, `KPI` | ✅ DONE |

---

## 3. Canonical Rapeseed Core: новые семантические слои

Canonical Core (документы v1.0.0 от 2026-04-01) вводит следующие семантические сущности и концепции, которых в Engine **нет или нет в явном виде**:

### 3.1 Таблица новых сущностей Canonical Core

| Сущность Canonical Core | Canonical ID | Есть в Engine? | Разрыв |
|--------------------------|--------------|----------------|--------|
| `RapeseedTechCard` (обёртка поверх `TechMap`) | Ontology §2.3 | ❌ Нет (TechMap — generic) | Нет явной специализации под рапс |
| `TechCardStage` (логический блок со Stage Goal) | Ontology §2.4 | ⚠️ `MapStage` есть, но без `goal`, `bbch_scope` | Отсутствуют: `stage_goal`, `bbch_scope` |
| `ControlPoint` (шлюз решений при BBCH-фазе) | Ontology §2.5 | ❌ Нет | Полностью отсутствует |
| `RuleRegistry` (Rule со структурой rule_id, layer, confidence) | Rule Registry §3 | ⚠️ 7 классов ошибок в `ValidationEngine` | Нет rule_id, layer, confidence. Правила хардкод |
| `RuleType` enum | Rule Registry §2.1 | ⚠️ Частично (HARD_STOP, WARNING) | Отсутствуют: `STRONG_RECOMMENDATION`, `CONDITIONAL_ADAPTATION`, `SEASONAL_OVERRIDE_TRIGGER`, `MONITORING_SIGNAL`, `HUMAN_REVIEW_REQUIRED` |
| `CropForm` enum (winter/spring) | Schema §enums | ⚠️ `CropType.RAPESEED` есть | Нет разделения RAPESEED_WINTER / RAPESEED_SPRING |
| `MonitoringSignal` (асинхронный сигнал из внешних систем) | Schema §monitoring_signals | ❌ Нет | Полностью отсутствует |
| `CanonicalBranch` (winter_rapeseed / spring_rapeseed) | Schema §canonical_branches | ❌ Нет | Blueprint знает про рапс, но не разделяет ветки |
| `FieldAdmissionCheck` (pre-generation blocker) | Rule Registry §3.1 (R-ADM-*) | ❌ Нет | Нет pre-generation validation gate |
| `AgroclimaticProfile` (независимо от RegionProfile) | Schema required_inputs | ⚠️ `RegionProfile` есть | Нет `SAT_avg`, `agroclimatic_zone`, `B_available`, `S_available` как обязательных полей |
| `DeviationSeverity` enum | Ontology §4, Schema §enums | ❌ Нет | Нет `informational / warning / critical / blocker` hierarchy |
| Правила `R-ADM-001…005` (pH, севооборот, кила, крестоцветные) | Rule Registry §3.1 | ❌ Нет | Gap таблица §5 |
| Правила `R-NUT-001` (Сера обязательна) | Rule Registry §3.4 | ❌ Нет | Gap таблица §5 |
| Правила `R-WIN-001` (розетка перед зимой) | Rule Registry §3.5 | ❌ Нет | Gap таблица §5 |
| Конфигурируемые пороги (T-SOIL-01, T-PLT-01, T-PLT-04) | Schema §thresholds | ❌ Нет | Без externalized threshold registry |

---

## 4. Карта интеграции: Entity Mapping

### 4.1 Прямое совмещение (entity aliasing — без переписывания)

```
TechMap             ↔  RapeseedTechCard        (специализация, не новая модель)
MapStage            ↔  TechCardStage            (расширить: добавить stage_goal, bbch_scope)
MapOperation        ↔  Operation                (расширить: operation_type уже есть)
MapResource         ↔  InputMaterial            (уже есть через InputCatalog+Application)
RegionProfile       ↔  AgroclimaticProfile      (расширить: добавить SAT_avg, agroclimatic_zone, S_available, B_available)
AdaptiveRule        ↔  SeasonalOverrideTrigger  (расширить rule_type)
SoilProfile         ↔  SoilProfile              (добавить B_available, S_available как mandatory for rapeseed)
CropZone.cropType   ↔  CropForm                 (расширить enum: RAPESEED_WINTER / RAPESEED_SPRING)
```

### 4.2 Новые сущности — требуют добавления

```
ControlPoint        → новая Prisma-модель (привязана к MapStage)
RuleRegistryEntry   → новая Prisma-модель (rule_id, layer, type, confidence, condition, action, override_allowed)
MonitoringSignal    → новая Prisma-модель / event (signal_type, threshold_logic, severity, action)
DeviationSeverity   → новый Enum (informational | warning | critical | blocker)
ThresholdRegistry   → новый stateless сервис / seed-данные
FieldAdmissionGate  → новый validation service (pre-generation, до buildTechMapBlueprint)
```

### 4.3 Сервисный маппинг (services)

```
TechMapValidationEngine     → расширить правилами из CANONICAL Rule Registry
                              (R-ADM-001, R-NUT-001, R-SOW-003, R-IPM-003 и др.)

RegionProfileService        → расширить: 
                              calculateSowingWindow() принимает CropForm (winter/spring)
                              MeteoAPI monitoring_signals binding

buildTechMapBlueprint()     → расширить: 
                              CropForm WINTER/SPRING → canonical_branch ветвление
                              mandatory_blocks из Schema (seed_treatment, post_sowing_rolling и т.д.)

TriggerEvaluationService    → расширить RuleType:
                              добавить CONDITIONAL_ADAPTATION, SEASONAL_OVERRIDE_TRIGGER
                              MonitoringSignal handlers (frost_alert, heat_alert)

HybridPhenologyService      → расширить: 
                              добавить BBCH-based ControlPoint evaluation
```

---

## 5. Gap Analysis: Что отсутствует в Engine

> Легенда: 🔴 Critical (блокирует корректное агрономическое поведение) | 🟡 Important (влияет на качество) | 🟢 Enhancement (улучшение)

| Gap ID | Описание | Severity | Canonical Source | Target Component |
|--------|----------|----------|-----------------|-----------------|
| GAP-01 | `buildTechMapBlueprint()` не разделяет WINTER / SPRING ветки рапса | 🔴 | Schema §canonical_branches | `tech-map-blueprint.ts` |
| GAP-02 | Нет `FieldAdmissionGate` до генерации (pH, севооборот, кила) | 🔴 | Rule Registry §3.1 R-ADM-001…005 | Новый `field-admission.service.ts` |
| GAP-03 | `S_available`, `B_available` не являются обязательными полями для рапса | 🔴 | Schema required_inputs, R-NUT-001 | `SoilProfile` Prisma + Zod |
| GAP-04 | Нет `ControlPoint` сущности (шлюз решений по BBCH) | 🔴 | Ontology §2.5 | Новая Prisma-модель + сервис |
| GAP-05 | `RuleType` в `ValidationEngine` — только HARD_STOP / WARNING | 🟡 | Rule Registry §2.1 | `techmap-validation.engine.ts` |
| GAP-06 | Нет rule_id, layer, confidence в валидационных правилах | 🟡 | Rule Registry §2.2, §2.3 | `RuleRegistryEntry` Prisma модель |
| GAP-07 | `CropType.RAPESEED` — нет разделения WINTER/SPRING | 🟡 | Schema §enums CropForm | Prisma enum расширение |
| GAP-08 | Нет `MonitoringSignal` — frost_alert, heat_alert | 🟡 | Schema §monitoring_signals | Новый `monitoring-signal.service.ts` |
| GAP-09 | `RegionProfile` не содержит `SAT_avg`, `agroclimatic_zone` | 🟡 | Schema required_inputs | `RegionProfile` Prisma расширение |
| GAP-10 | Нет `DeviationSeverity` enum (informational/warning/critical/blocker) | 🟡 | Ontology §4 | Prisma enum + `EvidenceService` |
| GAP-11 | `MapStage` не имеет `stage_goal`, `bbch_scope` | 🟢 | Ontology §2.4 TechCardStage | `MapStage` Prisma расширение |
| GAP-12 | `ThresholdRegistry` не externalized — пороги хардкод | 🟢 | Schema §thresholds | Новый `threshold-registry.service.ts` |
| GAP-13 | `mandatory_blocks` из canonical_branches не применяются при генерации | 🔴 | Schema §canonical_branches.mandatory_blocks | `tech-map-blueprint.ts` |
| GAP-14 | Нет проверки `rotation_years_since_rapeseed` и `predecessor` | 🔴 | R-ADM-003, R-ADM-004 | `FieldAdmissionGate` |
| GAP-15 | `seed_treatment` не является обязательным блоком при посеве | 🔴 | R-SOW-003, Schema mandatory_blocks | `ValidationEngine` + Blueprint |

---

## 6. Правила интеграции (Architectural Invariants)

### 6.1 Non-Negotiable Engine Invariants (не изменять)

1. **FSM TechMapStatus** — `DRAFT → UNDER_REVIEW → APPROVED → IN_EXECUTION → CLOSED` сохраняется без изменений.
2. **ContractCore SHA-256** — хэш-механизм не изменяется. Новые canonical правила НЕ входят в ContractCore.
3. **DAG Validation** — алгоритм acyclicity + CPM не изменяется. Новые ControlPoint — отдельный слой.
4. **ChangeOrder Protocol** — workflow согласования не изменяется. ControlPoint может генерировать ChangeOrder, но не bypass его.
5. **Tenant Isolation** — `companyId` scoping обязателен для всех новых моделей.
6. **Evidence Definition-of-Done** — правило «нет DONE без Evidence» не изменяется.
7. **RBAC** — роли AgRONOMIST / DIRECTOR / FINANCE не изменяются.

### 6.2 Integration Rules (новые правила для нового core)

1. **Canonical rules не хардкод**: все правила из `RAPESEED_CANONICAL_RULE_REGISTRY.md` должны быть в `RuleRegistryEntry` Prisma модели с `rule_id`, `layer`, `override_allowed`.
2. **FieldAdmissionGate — до blueprint**: `field-admission.service.ts` вызывается ДО `buildTechMapBlueprint()`. Failure = исключение до создания TechMap.
3. **CropForm WINTER/SPRING — canonical ветки**: `buildTechMapBlueprint()` должен выбирать canonical_branch на основе `CropForm`, не только `crop === 'rapeseed'`.
4. **ControlPoint — non-blocking по умолчанию**: ControlPoint генерирует `Deviation` / `Recommendation`, НЕ FSM transition. Только `blocker`-severity может заблокировать операцию.
5. **MonitoringSignal — асинхронный**: MS — event-driven поверх `AdaptiveRule` + `TriggerEvaluationService`. Не синхронный вызов.
6. **DeviationSeverity иерархия**: `blocker` ↔ HARD_STOP, `critical` ↔ CRITICAL_WARNING, `warning` ↔ WARNING, `informational` ↔ INFO.
7. **Новые enums additive**: `RAPESEED_WINTER`, `RAPESEED_SPRING` добавляются к `CropType` enum. `RAPESEED` остаётся для backward compat.
8. **ThresholdRegistry — seed-данные**: пороги из Canonical Core (`T-SOIL-01`, `T-PLT-01`, `T-PLT-04`) должны быть seed-данными, не константами в коде.

---

## 7. Стратегия миграции (3 фазы, Non-Breaking)

### Phase I — Semantic Enrichment (non-breaking, extends only)

**Цель**: добавить новые сущности и расширить существующие без изменения runtime-поведения.

| Задача | Действие | Тип |
|--------|----------|-----|
| I-1 | Расширить `CropType` enum: добавить `RAPESEED_WINTER`, `RAPESEED_SPRING` | Additive migration |
| I-2 | Расширить `MapStage`: добавить `stageGoal`, `bbchScopeFrom`, `bbchScopeTo` | Additive Prisma |
| I-3 | Расширить `RegionProfile`: добавить `satAvg`, `agroclimaticZone`, `sAvailable`, `bAvailable` | Additive Prisma |
| I-4 | Расширить `SoilProfile` Zod: `sAvailable`, `bAvailable` — `REQUIRED` если `cropType == RAPESEED_*` | Conditional validation |
| I-5 | Создать `RuleRegistryEntry` Prisma модель (rule_id, layer, rule_type, condition, action, confidence, override_allowed) | New model |
| I-6 | Создать `DeviationSeverity` enum в Prisma | New enum |
| I-7 | Создать `ThresholdRegistry` seed данных (T-SOIL-01, T-PLT-01, T-PLT-04) | Seed |
| I-8 | Seed: загрузить все правила из Rule Registry §3 в `RuleRegistryEntry` | Seed |

### Phase II — Gate Integration (canonicalization)

**Цель**: подключить новые правила к Engine. Validation gates активны.

| Задача | Действие | Тип |
|--------|----------|-----|
| II-1 | Создать `FieldAdmissionService` с методами: `validateAdmission(fieldId, cropForm, companyId)` | New service |
| II-2 | Подключить `FieldAdmissionService` в `TechMapService.createDraftStub()` — до `generateMap()` | Hook |
| II-3 | Расширить `TechMapValidationEngine`: загружать правила из `RuleRegistryEntry`, применять по `rule_type` | Engine extension |
| II-4 | Расширить `buildTechMapBlueprint()`: добавить `CropForm.WINTER/SPRING` ветвление, применять `mandatory_blocks` из Canonical Schema | Blueprint extension |
| II-5 | Создать `ControlPoint` Prisma модель (controlPointId, mapStageId, bbchScope, requiredObservations, acceptanceRanges) | New model |
| II-6 | Создать `ControlPointService`: `evaluate(controlPointId, observations)` → `Deviation` | New service |
| II-7 | Расширить `TriggerEvaluationService`: добавить `CONDITIONAL_ADAPTATION`, `SEASONAL_OVERRIDE_TRIGGER` rule types | Enum extension |

### Phase III — Runtime Unification (advanced)

**Цель**: подключить MonitoringSignal, сигналы из внешних систем, полная унификация runtime.

| Задача | Действие | Тип |
|--------|----------|-----|
| III-1 | Создать `MonitoringSignal` Prisma модель (signalType, source, thresholdLogic, severity, resultingAction) | New model |
| III-2 | Создать `MonitoringSignalService`: `process(signal)` → `TriggerEvaluationService.applyTriggeredRule()` | New service |
| III-3 | Интегрировать `ControlPoint.evaluate()` с `ChangeOrderService` для `blocker` severity | Integration |
| III-4 | `RegionProfileService.calculateSowingWindow()` принимает `CropForm` (WINTER/SPRING) — разные окна | Extension |
| III-5 | `HybridPhenologyService.predictBBCH()` — интеграция с ControlPoint evaluation loop | Integration |

---

## 8. Service Dependency Graph (after integration)

```
FieldAdmissionService          ← [R-ADM-001..005] RuleRegistryEntry
        │
        ▼
TechMapService.createDraftStub()
        │
        ▼
buildTechMapBlueprint(CropForm: WINTER|SPRING)
   ├── canonical_branch = winter_rapeseed → mandatory_blocks[]
   └── canonical_branch = spring_rapeseed → mandatory_blocks[]
        │
        ▼
TechMapValidationEngine
   ├── [legacy] 7 HARD_STOP / WARNING rules
   └── [new] RuleRegistryEntry.HARD_BLOCKER | HARD_REQUIREMENT | STRONG_RECOMMENDATION
        │
        ▼
DAGValidationService (unchanged)
        │
        ▼
ControlPointService ── evaluates at MapStage.bbch_scope
   ├── → Deviation (informational | warning | critical)
   └── → blocker → ChangeOrderService.createChangeOrder()
        │
        ▼
TriggerEvaluationService
   ├── [WEATHER|NDVI|OBSERVATION|PRICE|PHENOLOGY] (existing)
   ├── [CONDITIONAL_ADAPTATION] (new)
   └── [SEASONAL_OVERRIDE_TRIGGER] (new)
        │
        ▼
MonitoringSignalService (Phase III)
   ├── frost_alert → TriggerEvaluationService
   └── heat_alert → TriggerEvaluationService
        │
        ▼
ChangeOrderService → Approval → TechMapStateMachine (FSM)
```

---

## 9. Scheme Extension Summary (Prisma delta)

```prisma
// ===== Phase I additions =====

enum CropType {
  RAPESEED
  RAPESEED_WINTER   // NEW
  RAPESEED_SPRING   // NEW
  SUNFLOWER
  // ... existing
}

enum DeviationSeverity {
  informational
  warning
  critical
  blocker
}

model MapStage {
  // ... existing fields ...
  stageGoal      String?      // NEW: агрономическая цель этапа
  bbchScopeFrom  Int?         // NEW: начало BBCH-диапазона этапа
  bbchScopeTo    Int?         // NEW: конец BBCH-диапазона этапа
  controlPoints  ControlPoint[]
}

model RuleRegistryEntry {
  id               String   @id @default(uuid())
  ruleId           String   @unique  // e.g. "R-ADM-001"
  ruleName         String
  layer            String   // CANONICAL | STATIC_ADAPTATION | DYNAMIC_SEASONAL
  ruleType         String   // HARD_BLOCKER | HARD_REQUIREMENT | ...
  cropScope        String   // winter | spring | both
  description      String
  condition        Json     // machine-readable condition object
  action           String   // block_sowing | alert | ...
  overrideAllowed  Boolean
  confidenceLevel  String   // HIGH | MEDIUM | LOW
  priority         Int      @default(0)
  isActive         Boolean  @default(true)
  companyId        String?  // null = global
  createdAt        DateTime @default(now())
}

// ===== Phase II additions =====

model ControlPoint {
  id                   String            @id @default(uuid())
  mapStageId           String
  mapStage             MapStage          @relation(fields: [mapStageId], references: [id])
  bbchScopeFrom        Int
  bbchScopeTo          Int
  requiredObservations Json              // list of observation keys
  acceptanceRanges     Json              // key → {min, max}
  deviations           Deviation[]
  createdAt            DateTime          @default(now())
}

model Deviation {
  id              String            @id @default(uuid())
  controlPointId  String
  controlPoint    ControlPoint      @relation(fields: [controlPointId], references: [id])
  severity        DeviationSeverity
  description     String
  recommAction    String?
  resolvedAt      DateTime?
  createdAt       DateTime          @default(now())
}

// ===== Phase III additions =====

model MonitoringSignal {
  id              String   @id @default(uuid())
  signalType      String   // frost_alert | heat_alert | ...
  source          String   // meteo_api | satellite | ...
  thresholdLogic  String   // human-readable condition
  severity        DeviationSeverity
  resultingAction String
  techMapId       String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
}
```

---

## 10. Execution Sequence — Rapeseed TechCard Generation (Target State)

```
1. User: "Создать техкарту для поля #8, озимый рапс, сезон 2026/27"
   │
2. FieldAdmissionService.validateAdmission({
     fieldId, cropForm: RAPESEED_WINTER,
     pH, rotation_years, clubroot_history, predecessor
   })
   ├── R-ADM-001: pH < 5.5? → HARD_BLOCKER → Exception (stop here)
   ├── R-ADM-003: rotation < 4 years? → HARD_BLOCKER → Exception
   ├── R-ADM-004: crucifer predecessor? → HARD_BLOCKER → Exception
   └── PASS → продолжение
   │
3. TechMapService.createDraftStub()
   ├── ensureCropZone(cropType: RAPESEED_WINTER)
   └── generateMap()
   │
4. buildTechMapBlueprint({crop: rapeseed, cropForm: RAPESEED_WINTER})
   ├── canonical_branch = winter_rapeseed
   ├── stage_sequence: [field_preparation, sowing, autumn_care, winter_dormancy, ...]
   ├── mandatory_blocks: [seed_treatment, post_sowing_rolling, autumn_growth_regulator, ...]
   └── critical_risks: [overwintering_mortality, autumn_overgrowth, ...]
   │
5. TechMapValidationEngine.validate(techMapId)
   ├── [Legacy] IncompatibleTankMix, RateExceedsMax, BBCHWindowViolation...
   ├── [NEW R-NUT-001] S_planned < 15 kg/ha? → HARD_REQUIREMENT → блок + требование серы
   ├── [NEW R-SOW-003] seed_treatment == NONE? → HARD_REQUIREMENT → блок
   └── [NEW R-WIN-004] BBCH [14-16] без ретарданта? → STRONG_RECOMMENDATION → warning
   │
6. ControlPoint.evaluate() при достижении каждой BBCH-фазы:
   ├── BBCH 14-16 (autumn_care): розетка 6-8 листьев, шейка ≥8мм?
   │   ├── OK → continue
   │   ├── critical deviation → urgent_alert + recommendation
   │   └── blocker → ChangeOrderService (resow decision)
   └── BBCH 00 (spring_renewal): выживаемость > 40%?
       ├── ≥ 40% → continue
       └── < 40% → R-WIN-006 HUMAN_REVIEW_REQUIRED → эскалация к агроному
   │
7. TriggerEvaluationService (ongoing, event-driven):
   ├── WEATHER: осадки > X мм → перенос N-подкормки
   ├── PHENOLOGY: BBCH 60 → открытие окна фунгицидной обработки
   └── SEASONAL_OVERRIDE_TRIGGER: T_soil > +5°C (spring) → открытие окна сева
   │
8. MonitoringSignalService (Phase III):
   ├── frost_alert: T < -3°C AND BBCH [09-12] → alert_frost_risk
   └── heat_alert: T > 30°C AND BBCH [60-69] → alert_yield_loss_expected
```

---

## 11. Open Questions (требуют решения перед Phase II)

| # | Вопрос | Кому | Приоритет |
|---|--------|------|-----------|
| OQ-1 | `FieldAdmissionService` — блокировать создание TechMap или только предупреждать для HARD_REQUIREMENT (не HARD_BLOCKER)? | Product / Principal Architect | P0 |
| OQ-2 | `RuleRegistryEntry.condition` — JSON-объект или строка DSL? Нужна ли DSL для машинного исполнения условий? | Backend Lead | P0 |
| OQ-3 | `ControlPoint` — привязан к `MapStage` или к конкретной `MapOperation`? | Domain Expert | P1 |
| OQ-4 | `MonitoringSignal.source` — метео API уже подключен через `RegionProfile`? Какой текущий API? | Infra / Backend | P1 |
| OQ-5 | Миграция данных: существующие `TechMap` с `CropType.RAPESEED` — автоматически → `RAPESEED_WINTER` или требует ручного ввода? | Product | P0 |
| OQ-6 | `ThresholdRegistry` — хранить в Prisma или как YAML/JSON config file? | Backend Lead | P2 |

---

## 12. Verification Plan

### После Phase I
```bash
npx prisma validate
pnpm --filter api exec tsc --noEmit
pnpm --filter api test --testPathPattern="tech-map"
```

### После Phase II
```bash
pnpm --filter api test --testPathPattern="field-admission|control-point|validation"
# Интеграционный тест: создать TechMap для поля с pH < 5.5 → ожидать Exception
# Интеграционный тест: создать TechMap без S_planned → ожидать HARD_REQUIREMENT
```

### После Phase III
```bash
pnpm --filter api test --testPathPattern="monitoring-signal|trigger-evaluation"
# E2E: полный цикл RAPESEED_WINTER от FieldAdmission до ControlPoint при BBCH 14
```

---

## 13. Ссылки

| Документ | Роль |
|---------|------|
| [GRAND_SYNTHESIS.md](../00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md) | Engine/Runtime foundation |
| [TECHMAP_IMPLEMENTATION_CHECKLIST.md](../00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md) | Sprint history & DoD |
| [RAPESEED_CANONICAL_RULE_REGISTRY.md](../00_STRATEGY/TECHMAP/RAPESEED_CANONICAL_RULE_REGISTRY.md) | Canonical Rule Registry v1.0.0 |
| [RAPESEED_DOMAIN_ONTOLOGY.md](../00_STRATEGY/TECHMAP/RAPESEED_DOMAIN_ONTOLOGY.md) | Domain Ontology v1.0.0 |
| [rapeseed_techcard.schema.yaml](../00_STRATEGY/TECHMAP/rapeseed_techcard.schema.yaml) | Machine-readable schema v1.0.0 |
| [tech-map-blueprint.ts](../../apps/api/src/modules/tech-map/tech-map-blueprint.ts) | Current blueprint generator |
| [techmap-validation.engine.ts](../../apps/api/src/modules/tech-map/validation/techmap-validation.engine.ts) | Current validation engine |

---

*Документ устанавливает архитектурный контракт интеграции. Любые изменения в стратегии фаз требуют обновления этого документа и регистрации нового claim в DOCS_MATRIX.md.*
