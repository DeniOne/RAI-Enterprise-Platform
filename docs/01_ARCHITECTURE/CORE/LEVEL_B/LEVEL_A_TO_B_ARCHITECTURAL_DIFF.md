# LEVEL_A_TO_B_ARCHITECTURAL_DIFF.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Переход:** LEVEL A → LEVEL B
- **Статус:** DRAFT / ARCHITECTURAL SPECIFICATION
- **Зависимости:** LEVEL_A_BASELINE_VERIFIED_SPEC.md, Evolution Architecture Roadmap (A → F).md

---

## 1. Назначение документа

Данный документ фиксирует **архитектурные различия** между Level A (Controlled Intelligence) и Level B (Generative Agronomy Engine). Документ служит техническим руководством для миграции и интеграции новых компонентов.

---

## 2. Сравнительная таблица возможностей

| Возможность | Level A | Level B | Изменение |
| :--- | :--- | :--- | :--- |
| **Генерация TechMap** | ❌ Только вручную | ✅ ИИ генерирует черновики | **NEW** |
| **Прогноз урожайности** | ❌ Отсутствует | ✅ Вероятностная модель | **NEW** |
| **Симуляция сценариев** | ❌ Отсутствует | ✅ "Что, если" анализ | **NEW** |
| **Библиотека стратегий** | ❌ Отсутствует | ✅ Версионированная база знаний | **NEW** |
| **Роль ИИ** | Advisor/Coach/Auditor | Architect/Advisor/Coach/Auditor | **EXTENDED** |
| **FSM состояния** | 4 (DRAFT, REVIEW, APPROVED, FROZEN) | 5 (+GENERATED_DRAFT) | **EXTENDED** |
| **IntegrityGate** | Валидация ограничений | Валидация + Pre-Generation Check | **EXTENDED** |
| **Immutable Decisions** | Без изменений | Без изменений | **UNCHANGED** |
| **Governance** | Human-only approval | Human-only approval | **UNCHANGED** |

---

## 3. Архитектурные изменения по слоям

### 3.1 Structural Layer (FSM)

**Level A:**
```
DRAFT -> REVIEW -> APPROVED -> FROZEN
```

**Level B:**
```
GENERATED_DRAFT -> DRAFT -> REVIEW -> APPROVED -> FROZEN
                    ^
                    |
              (Human Approve)
```

**Ключевые изменения:**
- Добавлено состояние `GENERATED_DRAFT`.
- Новое событие `HUMAN_APPROVE_DRAFT` для перехода `GENERATED_DRAFT -> DRAFT`.
- Автоматический переход `GENERATED_DRAFT -> DRAFT` запрещен (I15).

---

### 3.2 Immutable Decisions Subsystem

**Изменения:** Нет.

**Обоснование:** Механизм логирования решений остается неизменным. `DecisionRecord` создается **только при переходе в `APPROVED`** (Level A), а не при переходе `GENERATED_DRAFT -> DRAFT`. Генеративные черновики не создают `DecisionRecord` до момента утверждения.

---

### 3.3 IntegrityGate

**Level A:**
- Валидация ограничений при записи.

**Level B:**
- Валидация ограничений при записи.
- **NEW:** Pre-Generation Validation — проверка входных параметров перед запуском генерации.
- **NEW:** Post-Generation Validation — проверка сгенерированного черновика на соответствие Constraints.

**Новые методы:**
```typescript
interface IntegrityGateService {
  // Level A
  validate(entity: Entity): ValidationResult;
  
  // Level B Extensions
  validateGenerationInput(params: GenerationParams): ValidationResult;
  validateGeneratedDraft(draft: TechMap): ValidationResult;
}
```

---

### 3.4 Decision Layer

**Level A:**
- Advisor (Советник)
- Coach (Наставник)
- Auditor (Аудитор)

**Level B:**
- **NEW:** Architect (Архитектор) — генерирует TechMap на основе стратегий.
- Advisor (Советник) — расширен прогнозированием урожайности.
- Coach (Наставник) — без изменений.
- Auditor (Аудитор) — расширен проверкой генеративных метаданных.

**Новый контракт Generative Engine:**
```typescript
interface GenerativeEngineService {
  generateTechMap(params: {
    cropId: string;
    regionId: string;
    strategyId: string;
    seasonParams: object;
  }): Promise<TechMapDraft>;
}
```

**Новый контракт Yield Forecasting:**
```typescript
interface YieldForecastingService {
  forecastYield(techMapId: string): Promise<YieldForecast>;
}
```

**Новый контракт Simulation:**
```typescript
interface SimulationService {
  simulateScenario(scenarioParams: object): Promise<SimulationResult>;
}
```

---

## 4. Новые компоненты Level B

### 4.1 Generative Engine

**Назначение:** Генерация технологических карт на основе агрономических стратегий.

**Входные данные:**
- Культура (Crop)
- Регион (Region)
- Стратегия из библиотеки (Strategy)
- Параметры сезона (Season Params)

**Выходные данные:**
- TechMap в статусе `GENERATED_DRAFT`
- Метаданные генерации (I16)

**Зависимости:**
- Strategy Library
- IntegrityGate (Pre/Post Validation)
- Knowledge Graph

---

### 4.2 Agronomic Strategy Library

**Назначение:** Версионированная база знаний агрономических стратегий.

**Схема стратегии:**
```typescript
interface AgronomicStrategy {
  id: string;
  name: string;
  version: number;
  cropId: string;
  regionId: string;
  operations: OperationTemplate[];
  constraints: Constraint[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
  hash: string; // SHA-256
}
```

**Инвариант:** I18 (Strategy Library Immutability)

---

### 4.3 Yield Forecasting Module

**Назначение:** Вероятностное прогнозирование урожайности.

**Входные данные:**
- TechMap
- Исторические данные
- Метеопрогноз
- Данные почвы

**Выходные данные:**
```typescript
interface YieldForecast {
  techMapId: string;
  forecastedYield: number; // т/га
  confidenceInterval: [number, number];
  modelVersion: string;
  forecastedAt: Date;
  inputData: object;
}
```

**Инвариант:** I20 (Yield Model Traceability)

---

### 4.4 Simulation Engine

**Назначение:** Симуляция сценариев "что, если".

**Примеры сценариев:**
- Изменение сроков посева.
- Изменение норм внесения удобрений.
- Экстремальные погодные условия.

**Изоляция:** Результаты симуляций хранятся отдельно (I22).

---

## 5. Изменения в схеме данных (Prisma)

### 5.1 TechMap (Расширение)

```diff
model TechMap {
  id              String   @id @default(uuid())
  cropId          String
  regionId        String
  operations      Json
  plannedDates    Json
  resourceRates   Json
  status          TechMapStatus // EXTENDED: enum extended with GENERATED_DRAFT
  version         Int
  approvalMetadata String?
  freezeMetadata  Json?
+ generationMetadata Json? // NEW: I16
+ yieldForecast   YieldForecast? // NEW: I20
}

+// Extend existing enum (not replace)
+enum TechMapStatus {
+  GENERATED_DRAFT // NEW
+  DRAFT
+  REVIEW
+  APPROVED
+  FROZEN
+}
```

### 5.2 AgronomicStrategy (Новая таблица)

```prisma
model AgronomicStrategy {
  id            String   @id @default(uuid())
  name          String
  version       Int
  cropId        String
  regionId      String
  operations    Json
  constraints   Json
  status        StrategyStatus
  publishedAt   DateTime?
  hash          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum StrategyStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

### 5.3 YieldForecast (Новая таблица)

```prisma
model YieldForecast {
  id                  String   @id @default(uuid())
  techMapId           String   @unique
  forecastedYield     Float
  confidenceInterval  Json
  modelVersion        String
  inputData           Json
  forecastedAt        DateTime
  techMap             TechMap  @relation(fields: [techMapId], references: [id])
}
```

### 5.4 GenerationRecord (Новая таблица)

```prisma
model GenerationRecord {
  id              String   @id @default(uuid())
  generatedDraftId String  @unique
  inputParams     Json
  modelVersion    String
  seed            Int?
  hash            String   // SHA-256(inputParams + modelVersion + seed)
  result          String   // 'SUCCESS' | 'FAILED'
  errorDetails    Json?
  createdAt       DateTime @default(now())
  
  @@index([createdAt])
}
```

**Инвариант:** I28 (Generation Logging)

---

### 5.5 SimulationRun (Новая таблица)

```prisma
model SimulationRun {
  id              String   @id @default(uuid())
  scenarioParams  Json
  results         Json
  isProduction    Boolean  @default(false)
  createdAt       DateTime @default(now())
  createdBy       String
}
```

---

## 6. Миграционный путь (A → B)

### Фаза 1: Подготовка инфраструктуры
1. Создать таблицы: `AgronomicStrategy`, `YieldForecast`, `GenerationRecord`, `SimulationRun`.
2. Расширить enum `TechMapStatus` (добавить `GENERATED_DRAFT`).
3. Добавить поля `generationMetadata` и `yieldForecast` в `TechMap`.

### Фаза 2: Интеграция Generative Engine
1. Реализовать `GenerativeEngineService`.
2. Интегрировать с IntegrityGate (Pre/Post Validation).
3. Реализовать переход `GENERATED_DRAFT -> DRAFT`.

### Фаза 3: Библиотека стратегий
1. Создать UI для управления стратегиями.
2. Реализовать версионирование и публикацию.
3. Интегрировать с Generative Engine.

### Фаза 4: Прогнозирование и симуляция
1. Реализовать `YieldForecastingService`.
2. Реализовать `SimulationEngine`.
3. Интегрировать с UI (дашборды, визуализация).

---

## 7. Обратная совместимость

**Гарантии:**
- Все существующие TechMap в статусах `DRAFT`, `REVIEW`, `APPROVED`, `FROZEN` остаются валидными.
- Workflow Level A продолжает работать без изменений.
- IntegrityGate Level A применяется ко всем объектам.

**Миграция данных:**
- Существующие TechMap не требуют миграции.
- Новые поля (`generationMetadata`, `yieldForecast`) являются опциональными.

---

## 8. Формальная граница изменений

**Что добавлено:**
- 1 новое состояние FSM (`GENERATED_DRAFT`).
- 4 новых компонента (Generative Engine, Strategy Library, Yield Forecasting, Simulation).
- 14 новых инвариантов (I15–I28).
- 4 новые таблицы БД (`AgronomicStrategy`, `YieldForecast`, `GenerationRecord`, `SimulationRun`).

**Что НЕ изменилось:**
- Immutable Decisions (I5–I8).
- Governance Model (I13–I14).
- Human Override Supremacy (расширен I17).
- Freeze Irreversibility (I3).

**Вывод:** Level B является **аддитивным расширением** Level A с сохранением всех гарантий безопасности и прослеживаемости.
