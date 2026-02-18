# INTEGRITY_GATE_SERVICE_SPEC.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Компонент:** IntegrityGate Service (Level B)
- **Статус:** FORMAL SPECIFICATION
- **Зависимости:** INVARIANT_EXTENSION_FOR_LEVEL_B.md, FSM_EXTENSION_LEVEL_B.md
- **Document Maturity Level:** D3 (Verification-Ready)

---

## 1. Назначение (Purpose)

Данный документ ДОЛЖЕН определить формальную спецификацию сервиса IntegrityGate в рамках Level B платформы RAI Enterprise Platform. Сервис ДОЛЖЕН обеспечивать валидацию инвариантов и ограничений перед выполнением критических операций.

Спецификация ДОЛЖНА обеспечить:
- Валидацию всех инвариантов I15-I28
- Блокировку нарушений инвариантов
- Прослеживаемость проверок
- Детерминированность валидации

---

## 2. Область применения (Scope)

### 2.1 Входит в область

- Формальное определение сервиса `IntegrityGateService`
- Валидационные правила для инвариантов I15-I28
- Контракты интеграции с FSM и Generative Engine
- Логирование нарушений инвариантов
- Детерминизм валидации
- Обработка ошибок валидации

### 2.2 Не входит в область (см. Раздел 10)

- Реализация алгоритмов валидации
- Производительность валидации
- Кэширование результатов валидации
- UI для отображения ошибок валидации
- Реализация схемы базы данных
- Развёртывание сервиса
- Мониторинг и алертинг

---

## 3. Формальные определения (Formal Definitions)

### 3.1 Интерфейс IntegrityGateService

```
IntegrityGateService := {
  validateTransition: (techMap, event, actor) → ValidationResult,
  validateGeneration: (generationParams) → ValidationResult,
  validateConstraints: (techMap) → ValidationResult,
  logViolation: (violation) → void
}
```

### 3.2 ValidationResult

```
ValidationResult := {
  isValid: Boolean,
  violations: Violation[],
  timestamp: ISO8601,
  validatorVersion: String
}

Violation := {
  invariantId: String,        // I15-I28
  severity: Severity,
  message: String,
  context: Json
}

Severity := BLOCKING | WARNING | INFO
```

### 3.3 Валидационные правила

```
ValidationRule := {
  invariantId: String,
  predicate: (context) → Boolean,
  errorMessage: String,
  severity: Severity
}

Примеры:
  I15_RULE: {
    invariantId: "I15",
    predicate: (ctx) => ctx.actor.type === 'HUMAN',
    errorMessage: "Auto-approval denied",
    severity: BLOCKING
  }
  
  I18_RULE: {
    invariantId: "I18",
    predicate: (ctx) => ctx.strategy.status !== 'PUBLISHED' || !isModified(ctx.strategy),
    errorMessage: "Published strategy immutable",
    severity: BLOCKING
  }
```

---

## 4. Маппинг инвариантов (Invariant Mapping) — только I15–I28

### 4.1 Покрываемые инварианты

**I15: Изоляция генеративных черновиков**
- **Правило:** `actor.type === 'HUMAN'` для перехода `GENERATED_DRAFT -> DRAFT`
- **Trace:** [TRACE-LB-ENG-001]

**I16: Провенанс генерации**
- **Правило:** `generationMetadata` NOT NULL для `GENERATED_DRAFT`
- **Trace:** [TRACE-LB-ENG-002]

**I17: Верховенство человеческого переопределения**
- **Правило:** Человек МОЖЕТ отклонить/изменить любой `GENERATED_DRAFT`
- **Trace:** [TRACE-LB-ENG-003]

**I18: Неизменяемость библиотеки стратегий**
- **Правило:** `strategy.status === 'PUBLISHED' ⇒ isImmutable(strategy)`
- **Trace:** [TRACE-LB-ENG-004]

**I19: Детерминированная генерация**
- **Правило:** `seed` NOT NULL для B1, детерминированный генератор
- **Trace:** [TRACE-LB-ENG-005]

**I20: Прослеживаемость модели урожайности**
- **Правило:** `forecast.modelVersion` AND `forecast.inputData` NOT NULL
- **Trace:** [TRACE-LB-ENG-006]

**I21: Распространение ограничений**
- **Правило:** Ограничения стратегии ДОЛЖНЫ быть в TechMap
- **Trace:** [TRACE-LB-ENG-007]

**I22: Изоляция симуляций**
- **Правило:** `simulation.isProduction === false`
- **Trace:** [TRACE-LB-ENG-008]

**I23: Запрет обратной совместимости**
- **Правило:** `generatedDraft.version === 1` (новая версия)
- **Trace:** [TRACE-LB-ENG-009]

**I24: Обязательная объяснимость**
- **Правило:** `explainability` NOT NULL AND `limitationsDisclosed === true`
- **Trace:** [TRACE-LB-ENG-010]

**I25: Нормализация вероятности** (B2+)
- **Правило:** `∫ p(y) dy = 1 ± 0.001`
- **Trace:** [TRACE-LB-ENG-011]

**I26: Границы вероятности** (B2+)
- **Правило:** `∀y: 0 ≤ p(y) ≤ 1`
- **Trace:** [TRACE-LB-ENG-012]

**I27: Доверительный интервал** (B2+)
- **Правило:** `0.8 ≤ confidence ≤ 0.99`
- **Trace:** [TRACE-LB-ENG-013]

**I28: Неизменяемость записи генерации**
- **Правило:** `generationRecord` создаётся один раз, затем immutable
- **Trace:** [TRACE-LB-ENG-014]

### 4.2 Непокрываемые инварианты

Все инварианты I15-I28 покрыты данным сервисом.

---

## 5. Выравнивание FSM (FSM Alignment)

### 5.1 Валидация переходов FSM

IntegrityGate ДОЛЖЕН валидировать ВСЕ переходы FSM:

```
validateTransition(techMap, event, actor):
  1. Проверить допустимость перехода (FSM матрица)
  2. Проверить инварианты для данного перехода
  3. Проверить полномочия актора
  4. Вернуть ValidationResult

Примеры:
  GENERATED_DRAFT → DRAFT:
    - Проверить I15 (actor.type === 'HUMAN')
    - Проверить I16 (generationMetadata NOT NULL)
    - Проверить I24 (explainability NOT NULL)
  
  DRAFT → REVIEW:
    - Проверить I21 (constraints propagated)
    - Проверить полноту TechMap
```

**Trace:** [TRACE-LB-ENG-015]

### 5.2 Интеграция с FSM

```
FSM ДОЛЖЕН вызывать IntegrityGate ПЕРЕД каждым переходом:

transition(techMap, event, actor):
  result = IntegrityGate.validateTransition(techMap, event, actor)
  
  if !result.isValid:
    throw InvariantViolationException(result.violations)
  
  // Выполнить переход
  ...
```

**Trace:** [TRACE-LB-ENG-016]

---

## 6. Ограничения детерминизма (Determinism Constraints)

### 6.1 DC-1: Детерминированная валидация

**Ограничение:**
```
∀ контекста C:
  validate(C)₁ = validate(C)₂

где равенство — это идентичность ValidationResult:
  - isValid
  - violations (порядок и содержимое)
```

**Механизм:** Валидация НЕ ДОЛЖНА использовать недетерминированные источники (время, случайность).

**Trace:** [TRACE-LB-ENG-017]

### 6.2 DC-2: Неизменяемость правил валидации

**Ограничение:**
```
∀ версии валидатора V:
  rules(V) неизменяемы
  
Изменение правил ⇒ новая версия валидатора
```

**Механизм:** Правила валидации версионируются вместе с `validatorVersion`.

**Trace:** [TRACE-LB-ENG-018]

### 6.3 DC-3: Полнота логирования

**Ограничение:**
```
∀ нарушения v:
  logViolation(v) ДОЛЖЕН записать:
    - invariantId
    - timestamp
    - context
    - validatorVersion
```

**Механизм:** Все нарушения ДОЛЖНЫ быть залогированы для аудита.

**Trace:** [TRACE-LB-ENG-019]

---

## 7. Стратегия верификации (Verification Strategy)

### 7.1 Структурные тесты (L3)

**Тест:** Проверка наличия правил для всех инвариантов
```
Дано: IntegrityGateService
Когда: getValidationRules()
Тогда: ∀ invariantId ∈ [I15..I28]:
        ∃ rule с rule.invariantId === invariantId
```
**Trace:** [TRACE-LB-TEST-501]

### 7.2 Тесты формальных инвариантов (L4)

**Тест I15-01:** Блокировка автоматического утверждения
```
Дано: GENERATED_DRAFT d, actor с type = 'AI'
Когда: validateTransition(d, HUMAN_APPROVE_DRAFT, actor)
Тогда: result.isValid = false
      AND result.violations содержит I15
```
**Trace:** [TRACE-LB-TEST-502]

**Тест I18-01:** Блокировка изменения опубликованной стратегии
```
Дано: strategy s со status = 'PUBLISHED'
Когда: validateUpdate(s, {operations: new_ops})
Тогда: result.isValid = false
      AND result.violations содержит I18
```
**Trace:** [TRACE-LB-TEST-503]

**Тест I24-01:** Обязательная объяснимость
```
Дано: GENERATED_DRAFT d без explainability
Когда: validateTransition(d, HUMAN_APPROVE_DRAFT, actor)
Тогда: result.isValid = false
      AND result.violations содержит I24
```
**Trace:** [TRACE-LB-TEST-504]

### 7.3 Тесты на основе свойств (L5)

**Свойство PBT-01:** Детерминизм валидации
```
Свойство: ∀ контекста C:
  ∀ n ∈ ℕ: validate(C)₀ = validate(C)ₙ
Trace: [TRACE-LB-TEST-505]
```

**Свойство PBT-02:** Полнота покрытия инвариантов
```
Свойство: ∀ invariantId ∈ [I15..I28]:
  ∃ ValidationRule с rule.invariantId === invariantId
Trace: [TRACE-LB-TEST-506]
```

---

## 8. Критерии приёмки (Acceptance Criteria) — бинарные

### 8.1 Обязательные критерии

| ID | Критерий | Статус |
|----|----------|--------|
| AC-01 | Все инварианты I15-I28 имеют правила валидации | ✓ ОПРЕДЕЛЁН |
| AC-02 | Валидация детерминирована | ✓ ОПРЕДЕЛЁН |
| AC-03 | Нарушения логируются | ✓ ОПРЕДЕЛЁН |
| AC-04 | Интеграция с FSM реализована | ✓ ОПРЕДЕЛЁН |
| AC-05 | Правила валидации версионированы | ✓ ОПРЕДЕЛЁН |

### 8.2 Верификационные ворота

**Ворота G1:** Все тесты L4 (TRACE-LB-TEST-501 — TRACE-LB-TEST-504) ДОЛЖНЫ пройти.

**Ворота G2:** Тесты на основе свойств (PBT-01, PBT-02) ДОЛЖНЫ пройти для 10,000 сгенерированных контекстов.

**Ворота G3:** Покрытие всех инвариантов I15-I28 ДОЛЖНО быть 100%.

---

## 9. Матрица прослеживаемости (Traceability Matrix)

| Trace ID | Тип | Требование | Метод верификации | Статус |
|----------|-----|------------|-------------------|--------|
| TRACE-LB-ENG-001 | Инвариант | I15: Изоляция генеративных черновиков | L4 Тест I15-01 | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-002 | Инвариант | I16: Провенанс генерации | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-003 | Инвариант | I17: Верховенство человека | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-004 | Инвариант | I18: Неизменяемость стратегий | L4 Тест I18-01 | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-005 | Инвариант | I19: Детерминизм | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-006 | Инвариант | I20: Прослеживаемость модели | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-007 | Инвариант | I21: Распространение ограничений | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-008 | Инвариант | I22: Изоляция симуляций | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-009 | Инвариант | I23: Запрет обратной совместимости | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-010 | Инвариант | I24: Объяснимость | L4 Тест I24-01 | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-011 | Инвариант | I25: Нормализация вероятности | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-012 | Инвариант | I26: Границы вероятности | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-013 | Инвариант | I27: Доверительный интервал | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-014 | Инвариант | I28: Неизменяемость записи | L4 Тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-015 | FSM | Валидация переходов | Интеграционный тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-016 | FSM | Интеграция с FSM | Интеграционный тест | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-017 | Ограничение | DC-1: Детерминизм валидации | PBT-01 | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-018 | Ограничение | DC-2: Неизменяемость правил | Версионирование | ОПРЕДЕЛЁН |
| TRACE-LB-ENG-019 | Ограничение | DC-3: Полнота логирования | Аудит логов | ОПРЕДЕЛЁН |
| TRACE-LB-TEST-501 | Тест | Наличие правил | Автоматизированный | В ОЖИДАНИИ |
| TRACE-LB-TEST-502 | Тест | I15-01: Блокировка авто | Автоматизированный | В ОЖИДАНИИ |
| TRACE-LB-TEST-503 | Тест | I18-01: Неизменяемость | Автоматизированный | В ОЖИДАНИИ |
| TRACE-LB-TEST-504 | Тест | I24-01: Объяснимость | Автоматизированный | В ОЖИДАНИИ |
| TRACE-LB-TEST-505 | Тест | PBT-01: Детерминизм | Property-Based | В ОЖИДАНИИ |
| TRACE-LB-TEST-506 | Тест | PBT-02: Полнота покрытия | Property-Based | В ОЖИДАНИИ |

---

## 10. Вне области применения (Out of Scope)

Следующее ЯВНО ИСКЛЮЧЕНО из области данной спецификации:

1. **Реализация алгоритмов:** Конкретные алгоритмы валидации, оптимизация
2. **Производительность:** Кэширование, параллелизация валидации
3. **UI:** Интерфейс отображения ошибок валидации
4. **Хранение:** Персистентность логов нарушений, архивация
5. **Мониторинг:** Алертинг на нарушения, дашборды
6. **Развёртывание:** Стратегия развёртывания сервиса
7. **Масштабирование:** Горизонтальное масштабирование, load balancing
8. **Интеграция:** Интеграция с внешними системами валидации

Эти вопросы ДОЛЖНЫ быть рассмотрены в отдельных инженерных и операционных спецификациях.

---

## Document Maturity Level: D3 (Verification-Ready)

**Обоснование:**
- ✓ Структурно завершён (D1)
- ✓ Выровнен с инвариантами (D2): Все I15-I28 явно замаплены
- ✓ Готов к верификации (D3): Все стратегии тестирования определены с trace ID
- ✗ Утверждён для реализации (D4): Требуется план реализации и интеграции

**Следующие шаги:**
1. Реализовать правила валидации для всех инвариантов
2. Интегрировать с FSM
3. Реализовать тесты L4 и L5
4. Настроить логирование нарушений
5. Получить утверждение стейкхолдеров для повышения до D4
