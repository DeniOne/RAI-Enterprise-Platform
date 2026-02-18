# INVARIANT_EXTENSION_FOR_LEVEL_B.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Уровень зрелости:** LEVEL B — Generative Agronomy Engine
- **Статус:** DRAFT / ARCHITECTURAL SPECIFICATION
- **Зависимости:** LEVEL_A_BASELINE_VERIFIED_SPEC.md, ARCHITECTURAL_TEST_PROTOCOL.md

---

## 1. Назначение документа

Данный документ определяет **расширения формальных инвариантов** для поддержки генеративных возможностей Level B. Все инварианты Level A (I1–I14) остаются обязательными. Level B добавляет новые инварианты I15–I28 для управления генеративным слоем.

**Фазность Level B:**
- **B1 (Baseline Generation):** Строгий детерминизм, генерация черновиков без вероятностных моделей.
- **B2+ (Advanced Analytics):** Вероятностное прогнозирование, симуляции, confidence intervals.

---

## 2. Новые инварианты Level B

### I15: Generated Draft Isolation (Изоляция генеративных черновиков)

**Определение:** Любой черновик, созданный ИИ-движком, должен находиться в отдельном состоянии `GENERATED_DRAFT` и не может быть автоматически переведен в `DRAFT` без явного одобрения человека.

**Механизм исполнения:**
- FSM добавляет новое состояние `GENERATED_DRAFT`.
- Переход `GENERATED_DRAFT -> DRAFT` требует явного действия пользователя (`HUMAN_APPROVE_DRAFT`).
- Автоматический переход запрещен на уровне IntegrityGate.

**Trace ID:** `GEN_ISO_01`  
**Test Level:** L4  
**Компонент:** FSM Extension

---

### I16: Generation Provenance (Происхождение генерации)

**Определение:** Каждый сгенерированный объект должен содержать метаданные о модели, версии, входных параметрах и timestamp генерации.

**Механизм исполнения:**
- Обязательное поле `generationMetadata` в схеме TechMap.
- Структура метаданных:
  ```json
  {
    "modelId": "string",
    "modelVersion": "string",
    "inputParams": "object",
    "generatedAt": "iso8601",
    "generationStrategy": "string"
  }
  ```

**Trace ID:** `GEN_PROV_01`  
**Test Level:** L5  
**Компонент:** Generative Engine

---

### I17: Human Override Supremacy (Верховенство человеческого решения)

**Определение:** Любое решение ИИ может быть отменено человеком. Система обязана сохранить оригинальное предложение ИИ и обоснование оверрайда.

**Механизм исполнения:**
- Расширение таблицы `AuditLog` полем `aiProposal`.
- При оверрайде сохраняется:
  - Оригинальное предложение ИИ (immutable).
  - Финальное решение человека.
  - Обоснование (`justification`).

**Trace ID:** `HUMAN_OVERRIDE_SUP_01`  
**Test Level:** L5  
**Компонент:** Governance Layer

---

### I18: Strategy Library Immutability (Неизменяемость библиотеки стратегий)

**Определение:** Агрономические стратегии в библиотеке являются версионированными и неизменяемыми после публикации. Любые изменения создают новую версию.

**Механизм исполнения:**
- Таблица `AgronomicStrategy` с полями `version`, `publishedAt`, `hash`.
- После перехода в статус `PUBLISHED` запись становится Read-Only.
- Изменения создают новую запись с инкрементом версии.

**Trace ID:** `STRAT_IMMUT_01`  
**Test Level:** L6  
**Компонент:** Strategy Library

---

### I19: Deterministic Generation (Детерминированная генерация)

**Определение (B1):** При одинаковых входных параметрах и версии модели генеративный движок **обязан** производить строго идентичный результат. Вероятностная погрешность **запрещена** в фазе B1.

**Определение (B2+):** В фазе B2+ допускается вероятностная погрешность при условии фиксации `seed` и логирования доверительных интервалов.

**Механизм исполнения (B1):**
- Обязательная фиксация `seed` для генерации.
- Логирование всех входных параметров.
- Replay-тесты для проверки **строгого** детерминизма (byte-to-byte identity).
- Использование детерминированных алгоритмов (без random sampling).

**Механизм исполнения (B2+):**
- Фиксация `seed` для воспроизводимости.
- Логирование доверительных интервалов.
- Replay-тесты для проверки статистической эквивалентности.

**Trace ID:** `GEN_DET_01` (B1), `GEN_DET_02` (B2+)  
**Test Level:** L4  
**Компонент:** Generative Engine

---

### I20: Yield Model Traceability (Прослеживаемость модели урожайности)

**Определение:** Любой прогноз урожайности должен содержать ссылку на версию модели, входные данные и доверительный интервал.

**Механизм исполнения:**
- Обязательное поле `yieldForecastMetadata` в результатах генерации.
- Структура:
  ```json
  {
    "modelVersion": "string",
    "confidenceInterval": [min, max],
    "inputData": "object",
    "forecastedAt": "iso8601"
  }
  ```

**Trace ID:** `YIELD_TRACE_01`  
**Test Level:** L5  
**Компонент:** Yield Forecasting Module

---

### I21: Constraint Propagation (Распространение ограничений)

**Определение:** Генеративный движок обязан соблюдать все ограничения (Constraints) из IntegrityGate Level A при создании черновиков.

**Механизм исполнения:**
- Генеративный движок вызывает `IntegrityGate.validate()` перед сохранением черновика.
- Нарушение любого ограничения приводит к отклонению генерации и логированию ошибки.

**Trace ID:** `CONST_PROP_01`  
**Test Level:** L3  
**Компонент:** Generative Engine + IntegrityGate

---

### I22: Simulation Isolation (Изоляция симуляций)

**Определение:** Результаты симуляций "что, если" должны храниться отдельно от основных данных и не могут влиять на production-состояние без явного одобрения.

**Механизм исполнения:**
- Отдельная таблица `SimulationRuns` с полем `isProduction = false`.
- Переход симуляции в production требует создания нового объекта через стандартный workflow (DRAFT -> REVIEW -> APPROVED).

**Trace ID:** `SIM_ISO_01`  
**Test Level:** L4  
**Компонент:** Simulation Engine

---

### I23: Limited Generation Scope (Ограниченная область генерации)

**Определение:** ИИ имеет строго ограниченные полномочия на создание объектов. Генерация разрешена только для определенных типов сущностей.

**Разрешено создавать:**
- `TechMap` (в статусе `GENERATED_DRAFT`)
- `GenerationRecord` (лог генерации)
- `YieldForecast` (прогноз урожайности)
- `SimulationRun` (результаты симуляции)

**Запрещено создавать:**
- `DecisionRecord` (только человек через Governance)
- `OverrideRecord` (только человек)
- `AgronomicStrategy` (только человек через Strategy Library UI)
- `Constraint` (только администратор)
- Любые сущности в статусах `APPROVED` или `FROZEN`

**Механизм исполнения:**
- ACL на уровне репозиториев: методы `create()` для запрещенных типов выбрасывают `UnauthorizedGenerationException` при вызове от имени ИИ.
- Проверка `actorType` перед созданием объекта.
- Логирование всех попыток нарушения.

**Trace ID:** `GEN_SCOPE_01`  
**Test Level:** L5  
**Компонент:** ACL + Generative Engine

---

### I24: Explainability Mandatory (Обязательное объяснение)

**Определение:** Любой сгенерированный черновик **обязан** содержать объяснение (explanation payload) логики генерации. Отсутствие объяснения делает черновик невалидным.

**Механизм исполнения:**
- Обязательное поле `explanation` в `generationMetadata`.
- Структура объяснения:
  ```json
  {
    "reasoning": "string (почему выбрана эта стратегия)",
    "keyFactors": ["factor1", "factor2"],
    "alternativesConsidered": ["alt1", "alt2"],
    "confidence": "HIGH | MEDIUM | LOW"
  }
  ```
- Валидация на уровне IntegrityGate: `GENERATED_DRAFT` без `explanation` → FAIL.

**Trace ID:** `EXPLAIN_MAND_01`  
**Test Level:** L5  
**Компонент:** Generative Engine + IntegrityGate

---

### I25: Probability Normalization (Нормализация вероятностей)

**Определение (B2+):** Любые вероятностные распределения в прогнозах **обязаны** быть нормализованными (сумма вероятностей = 1.0).

**Механизм исполнения:**
- Проверка нормализации перед сохранением прогноза.
- Формула: `Σ P(x_i) = 1.0 ± ε`, где `ε = 1e-6` (допустимая погрешность округления).
- Нарушение нормализации → `ProbabilityNormalizationException`.

**Trace ID:** `PROB_NORM_01`  
**Test Level:** L4  
**Компонент:** Yield Forecasting Module

---

### I26: Probability Bounds (Границы вероятностей)

**Определение (B2+):** Любая вероятность **обязана** находиться в интервале [0, 1].

**Механизм исполнения:**
- Проверка границ: `0 ≤ P(x) ≤ 1` для всех вероятностей.
- Нарушение границ → `ProbabilityBoundsException`.

**Trace ID:** `PROB_BOUNDS_01`  
**Test Level:** L4  
**Компонент:** Yield Forecasting Module

---

### I27: Confidence Interval Validity (Валидность доверительных интервалов)

**Определение (B2+):** Любой доверительный интервал **обязан** удовлетворять условиям: `min ≤ mean ≤ max` и `min < max`.

**Механизм исполнения:**
- Проверка интервала перед сохранением прогноза.
- Формула: `CI.min < CI.mean < CI.max`.
- Нарушение → `ConfidenceIntervalException`.

**Trace ID:** `CONF_INT_01`  
**Test Level:** L4  
**Компонент:** Yield Forecasting Module

---

### I28: Generation Logging (Логирование генерации)

**Определение:** Каждая генерация **обязана** создавать неизменяемую запись в `GenerationRecord` с полным контекстом для replay.

**Механизм исполнения:**
- Таблица `GenerationRecord`:
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
- После создания запись становится Read-Only (DB trigger).
- Хеш позволяет проверить целостность и воспроизводимость.

**Trace ID:** `GEN_LOG_01`  
**Test Level:** L5  
**Компонент:** Generative Engine

---

## 3. Таблица соответствия новых инвариантов

| ID | Инвариант | Компонент | Механизм | Test Level | Trace ID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **I15** | Generated Draft Isolation | FSM Extension | State Transition Rules | L4 | GEN_ISO_01 |
| **I16** | Generation Provenance | Generative Engine | Metadata Schema | L5 | GEN_PROV_01 |
| **I17** | Human Override Supremacy | Governance | AuditLog Extension | L5 | HUMAN_OVERRIDE_SUP_01 |
| **I18** | Strategy Library Immutability | Strategy Library | Versioning + Hash | L6 | STRAT_IMMUT_01 |
| **I19** | Deterministic Generation (B1) | Generative Engine | Strict Seed Fixation | L4 | GEN_DET_01 |
| **I19** | Deterministic Generation (B2+) | Generative Engine | Statistical Equivalence | L4 | GEN_DET_02 |
| **I20** | Yield Model Traceability | Yield Forecasting | Metadata Schema | L5 | YIELD_TRACE_01 |
| **I21** | Constraint Propagation | IntegrityGate | Pre-Generation Validation | L3 | CONST_PROP_01 |
| **I22** | Simulation Isolation | Simulation Engine | Separate Storage | L4 | SIM_ISO_01 |
| **I23** | Limited Generation Scope | ACL + Generative Engine | Repository ACL | L5 | GEN_SCOPE_01 |
| **I24** | Explainability Mandatory | Generative Engine + IntegrityGate | Explanation Validation | L5 | EXPLAIN_MAND_01 |
| **I25** | Probability Normalization (B2+) | Yield Forecasting | Sum Check | L4 | PROB_NORM_01 |
| **I26** | Probability Bounds (B2+) | Yield Forecasting | Range Check | L4 | PROB_BOUNDS_01 |
| **I27** | Confidence Interval Validity (B2+) | Yield Forecasting | Interval Check | L4 | CONF_INT_01 |
| **I28** | Generation Logging | Generative Engine | Immutable Record | L5 | GEN_LOG_01 |

---

## 4. Обратная совместимость с Level A

Все инварианты Level A (I1–I14) остаются обязательными в Level B. Расширения не нарушают существующие гарантии:

- FSM Level A остается подмножеством FSM Level B.
- IntegrityGate Level A применяется ко всем объектам, включая сгенерированные.
- Immutable Decisions сохраняют свою семантику.

---

## 5. Негативные сценарии (Adversarial Tests)

1. **Попытка автоматического перехода GENERATED_DRAFT -> APPROVED (I15):** Ожидаемый результат: FAIL (L6).
2. **Генерация без метаданных (I16):** Ожидаемый результат: FAIL (L5).
3. **Генерация без объяснения (I24):** Ожидаемый результат: FAIL (L5).
4. **Попытка ИИ создать DecisionRecord (I23):** Ожидаемый результат: `UnauthorizedGenerationException` (L5).
5. **Попытка ИИ создать Strategy (I23):** Ожидаемый результат: `UnauthorizedGenerationException` (L5).
6. **Удаление оригинального предложения ИИ после оверрайда (I17):** Ожидаемый результат: FAIL (L6).
7. **Мутация опубликованной стратегии (I18):** Ожидаемый результат: FAIL (L6).
8. **Генерация с нарушением Constraint (I21):** Ожидаемый результат: FAIL (L3).
9. **Прямое применение результатов симуляции в production (I22):** Ожидаемый результат: FAIL (L4).
10. **Прогноз с ненормализованными вероятностями (I25, B2+):** Ожидаемый результат: `ProbabilityNormalizationException` (L4).
11. **Прогноз с вероятностью > 1 (I26, B2+):** Ожидаемый результат: `ProbabilityBoundsException` (L4).
12. **Прогноз с невалидным доверительным интервалом (I27, B2+):** Ожидаемый результат: `ConfidenceIntervalException` (L4).
13. **Генерация без создания GenerationRecord (I28):** Ожидаемый результат: FAIL (L5).

---

## 6. Формальная граница Level B

### B1 (Baseline Generation)

**ИИ может:**
- Генерировать черновики TechMap (строго детерминированно).
- Создавать GenerationRecord.
- Объяснять логику генерации (I24).

**ИИ НЕ может:**
- Автономно утверждать решения.
- Обходить IntegrityGate.
- Модифицировать утвержденные данные.
- Создавать DecisionRecord, Strategy, Constraint (I23).
- Использовать вероятностные модели (только детерминизм).

### B2+ (Advanced Analytics)

**ИИ может (дополнительно к B1):**
- Прогнозировать урожайность с доверительными интервалами (I20, I25-I27).
- Симулировать сценарии (I22).
- Использовать вероятностные модели (с нормализацией и bounds check).

**ИИ НЕ может:**
- Все ограничения B1 остаются в силе.
- Создавать прогнозы с ненормализованными вероятностями (I25).
- Создавать прогнозы с невалидными доверительными интервалами (I27).

### Общие гарантии Level B

Граница Level B является расширением Level A с сохранением всех гарантий безопасности и прослеживаемости:
- Все инварианты Level A (I1–I14) обязательны.
- Генерация логируется и воспроизводима (I28).
- Человек сохраняет верховенство решений (I17).
- Объяснимость обязательна (I24).
