# GENERATIVE_ENGINE_SPEC.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Компонент:** Generative Engine (Level B)
- **Статус:** DRAFT / ARCHITECTURAL SPECIFICATION
- **Зависимости:** LEVEL_A_BASELINE_VERIFIED_SPEC.md, INVARIANT_EXTENSION_FOR_LEVEL_B.md

---

## 1. Назначение компонента

**Generative Engine** — это ядро генеративных возможностей Level B. Компонент отвечает за создание технологических карт (TechMap) на основе агрономических стратегий, региональных данных и параметров сезона.

---

## 2. Архитектурная позиция

```
┌─────────────────────────────────────────────────┐
│           User / API Request                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│      GenerativeEngineService                    │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Pre-Generation Validation (I21)        │  │
│  │ 2. Strategy Selection                     │  │
│  │ 3. TechMap Generation                     │  │
│  │ 4. Post-Generation Validation (I21)       │  │
│  │ 5. Metadata Injection (I16)               │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│         TechMap (GENERATED_DRAFT)               │
└─────────────────────────────────────────────────┘
```

---

## 3. Контракт интерфейса

### 3.1 Основной метод генерации

```typescript
interface GenerativeEngineService {
  /**
   * Генерирует TechMap на основе входных параметров.
   * @param params - Параметры генерации
   * @returns TechMap в статусе GENERATED_DRAFT
   * @throws GenerationValidationException - Если входные параметры невалидны
   * @throws GeneratedDraftInvalidException - Если результат нарушает Constraints
   */
  generateTechMap(params: GenerationParams): Promise<TechMap>;
}

interface GenerationParams {
  cropId: string;           // UUID культуры
  regionId: string;         // UUID региона
  strategyId: string;       // UUID стратегии из библиотеки
  seasonParams: {
    startDate: Date;        // Начало сезона
    endDate: Date;          // Конец сезона
    budgetLimit?: number;   // Опциональный лимит бюджета
  };
  seed?: number;            // Опциональный seed для детерминизма (I19)
}
```

---

## 4. Алгоритм генерации

### 4.1 Фаза 1: Pre-Generation Validation (I21)

**Цель:** Проверить входные параметры перед запуском генерации.

**Проверки:**
1. Существование культуры (`cropId` в БД).
2. Существование региона (`regionId` в БД).
3. Существование стратегии (`strategyId` в БД, статус `PUBLISHED`).
4. Валидность дат сезона (`startDate < endDate`).
5. Соответствие стратегии культуре и региону.

**Механизм:**
```typescript
async validateGenerationInput(params: GenerationParams): Promise<ValidationResult> {
  const errors: string[] = [];
  
  // Проверка культуры
  const crop = await this.cropRepo.findById(params.cropId);
  if (!crop) errors.push('Crop not found');
  
  // Проверка региона
  const region = await this.regionRepo.findById(params.regionId);
  if (!region) errors.push('Region not found');
  
  // Проверка стратегии
  const strategy = await this.strategyRepo.findById(params.strategyId);
  if (!strategy || strategy.status !== 'PUBLISHED') {
    errors.push('Strategy not found or not published');
  }
  
  // Проверка соответствия
  if (strategy && (strategy.cropId !== params.cropId || strategy.regionId !== params.regionId)) {
    errors.push('Strategy does not match crop/region');
  }
  
  // Проверка дат
  if (params.seasonParams.startDate >= params.seasonParams.endDate) {
    errors.push('Invalid season dates');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

[Invariant: I21 | Test Level: L3 | Trace: CONST_PROP_01]

---

### 4.2 Фаза 2: Strategy Selection & Expansion

**Цель:** Загрузить стратегию и развернуть шаблоны операций в конкретные агроприемы.

**Процесс:**
1. Загрузить стратегию из библиотеки.
2. Для каждого `OperationTemplate` в стратегии:
   - Подставить региональные нормы (семена, удобрения, СЗР).
   - Рассчитать даты операций на основе `seasonParams`.
   - Применить ограничения (Constraints) из стратегии.

**Пример шаблона операции:**
```json
{
  "type": "SOWING",
  "relativeDay": 0,
  "resourceRates": {
    "seeds": "{{region.seedRate}}",
    "fertilizer": "{{region.fertilizerRate}}"
  }
}
```

**Результат:** Массив конкретных операций с датами и нормами.

---

### 4.3 Фаза 3: TechMap Assembly

**Цель:** Собрать TechMap из развернутых операций.

**Структура:**
```typescript
const techMap: TechMap = {
  id: uuid(),
  cropId: params.cropId,
  regionId: params.regionId,
  operations: expandedOperations,
  plannedDates: {
    start: params.seasonParams.startDate,
    end: params.seasonParams.endDate
  },
  resourceRates: aggregateResourceRates(expandedOperations),
  status: 'GENERATED_DRAFT',
  version: 1, // Первая версия генерации. При approve -> DRAFT версия не изменяется.
  generationMetadata: {
    modelId: 'generative-engine-v1',
    modelVersion: '1.0.0',
    inputParams: params,
    generatedAt: new Date().toISOString(),
    generationStrategy: params.strategyId,
    seed: seed // Записываем seed для воспроизводимости
  }
};

// Создать GenerationRecord (Инвариант I28)
await this.createGenerationRecord(techMap, params, seed, 'SUCCESS');
```

**Versioning Rules:**
- `GENERATED_DRAFT` всегда имеет `version = 1`.
- При переходе `GENERATED_DRAFT -> DRAFT` (через `HUMAN_APPROVE_DRAFT`) версия **не изменяется**.
- При редактировании в `DRAFT` и повторном `SUBMIT` версия инкрементируется согласно Level A Versioning Semantics.
- Генерация не влияет на ручное версионирование.

[Invariant: I16 | Test Level: L5 | Trace: GEN_PROV_01]

---

### 4.4 Фаза 4: Post-Generation Validation (I21)

**Цель:** Проверить сгенерированный черновик на соответствие всем Constraints.

**Проверки:**
1. Structural Constraints (ST): Наличие обязательных полей.
2. Domain Constraints (DM): Соответствие норм региональным лимитам.
3. Temporal Constraints (TM): Последовательность дат операций.
4. Financial Constraints (FN): Соответствие бюджету (если указан).

**Механизм:**
```typescript
async validateGeneratedDraft(draft: TechMap): Promise<ValidationResult> {
  return await this.integrityGate.validate(draft);
}
```

**Если валидация не пройдена:**
- Генерация отклоняется.
- Ошибка логируется.
- Пользователь получает детальный отчет об ошибках.

[Invariant: I21 | Test Level: L3 | Trace: CONST_PROP_01]

---

## 5. Детерминизм генерации (I19)

**Требование (B1 Strict):** При одинаковых входных параметрах и `seed` генерация должна производить **строго идентичный** результат. Вероятностная погрешность **запрещена** в Level B1.

**Механизм:**
1. `seed` **обязателен** для генерации. Если не указан, используется детерминированный `hash(inputParams)`.
2. Все недетерминированные операции (например, выбор вариантов) должны использовать этот генератор.
3. Логировать `seed` в `generationMetadata` и `GenerationRecord`.

**Пример (B1 Strict):**
```typescript
class GenerativeEngine {
  private rng: SeededRandom;
  
  async generate(params: GenerationParams): Promise<TechMap> {
    // B1 Strict: нет nondeterministic fallback
    const seed = params.seed ?? this.computeDeterministicSeed(params);
    this.rng = new SeededRandom(seed);
    
    // Все случайные выборы используют this.rng
    const variant = this.rng.choice(strategy.variants);
    
    // ...
  }
  
  private computeDeterministicSeed(params: GenerationParams): number {
    // Детерминированный seed на основе входных параметров
    const hash = sha256(JSON.stringify({
      cropId: params.cropId,
      regionId: params.regionId,
      strategyId: params.strategyId,
      seasonParams: params.seasonParams
    }));
    return parseInt(hash.substring(0, 8), 16);
  }
}
```

**Обоснование:**
- `Date.now()` является nondeterministic и нарушает I19 (B1 Strict).
- `hash(inputParams)` гарантирует детерминизм при одинаковых входных параметрах.

[Invariant: I19 | Test Level: L4 | Trace: GEN_DET_01]

---

## 6. Интеграция с другими компонентами

### 6.1 Strategy Library

**Зависимость:** Generative Engine читает стратегии из библиотеки.

**Контракт:**
```typescript
interface StrategyLibraryService {
  getPublishedStrategy(strategyId: string): Promise<AgronomicStrategy>;
  findStrategiesByCropAndRegion(cropId: string, regionId: string): Promise<AgronomicStrategy[]>;
}
```

---

### 6.2 IntegrityGate

**Зависимость:** Generative Engine вызывает IntegrityGate для валидации.

**Контракт:**
```typescript
interface IntegrityGateService {
  validateGenerationInput(params: GenerationParams): Promise<ValidationResult>;
  validateGeneratedDraft(draft: TechMap): Promise<ValidationResult>;
}
```

---

### 6.3 Knowledge Graph

**Зависимость:** Generative Engine использует Knowledge Graph для обогащения операций.

**Режим доступа:** **Read-Only Advisory Layer**

**Примеры:**
- Рекомендации по последовательности операций.
- Связи между культурами и вредителями.
- Оптимальные сроки для региона.

**Ограничения:**
- Knowledge Graph **не может** изменять стратегию.
- Knowledge Graph **не может** изменять порядок операций.
- Knowledge Graph предоставляет **только рекомендации**, которые Generative Engine может использовать или игнорировать.

**Контракт:**
```typescript
interface KnowledgeGraphService {
  // Read-Only: получение рекомендаций
  getRecommendations(context: {
    cropId: string;
    regionId: string;
    operationType: string;
  }): Promise<Recommendation[]>;
  
  // Нет методов мутации
}
```

---

## 7. Обработка ошибок

### 7.1 Типы ошибок

| Ошибка | Причина | Действие |
| :--- | :--- | :--- |
| `GenerationValidationException` | Невалидные входные параметры | Отклонить запрос, вернуть детали |
| `GeneratedDraftInvalidException` | Результат нарушает Constraints | Отклонить генерацию, логировать |
| `StrategyNotFoundException` | Стратегия не найдена | Отклонить запрос |
| `InternalGenerationException` | Ошибка в логике генерации | Логировать, алерт разработчикам |

---

### 7.2 Логирование (I28)

Все генерации логируются в таблицу `GenerationRecord`:

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

**Механизм создания:**
```typescript
private async createGenerationRecord(
  draft: TechMap,
  params: GenerationParams,
  seed: number,
  result: 'SUCCESS' | 'FAILED',
  errorDetails?: object
): Promise<void> {
  const hash = sha256(JSON.stringify({
    inputParams: params,
    modelVersion: 'generative-engine-v1',
    seed
  }));
  
  await this.generationRecordRepo.create({
    id: uuid(),
    generatedDraftId: draft.id,
    inputParams: params,
    modelVersion: 'generative-engine-v1',
    seed,
    hash,
    result,
    errorDetails,
    createdAt: new Date()
  });
}
```

**Гарантии:**
- Запись становится Read-Only после создания (DB trigger).
- Хеш позволяет проверить целостность и воспроизводимость.
- Replay: `hash(inputParams + modelVersion + seed)` должен совпадать при повторной генерации.

[Invariant: I28 | Test Level: L5 | Trace: GEN_LOG_01]

---

## 8. Производительность и масштабирование

### 8.1 Асинхронная генерация

Для сложных стратегий генерация может занимать время. Рекомендуется асинхронный режим:

```typescript
interface GenerativeEngineService {
  // Синхронная генерация (для простых случаев)
  generateTechMap(params: GenerationParams): Promise<TechMap>;
  
  // Асинхронная генерация (для сложных стратегий)
  enqueueGeneration(params: GenerationParams): Promise<{ jobId: string }>;
  getGenerationStatus(jobId: string): Promise<GenerationStatus>;
}
```

---

### 8.2 Кэширование

Для детерминированных генераций (с фиксированным `seed`) результаты могут кэшироваться:

```typescript
const cacheKey = hash(params);
const cached = await this.cache.get(cacheKey);
if (cached) return cached;

const result = await this.generate(params);
await this.cache.set(cacheKey, result, TTL);
return result;
```

---

## 9. Тестирование

### 9.1 Unit Tests (L1)

- Тестирование отдельных фаз (validation, expansion, assembly).
- Мокирование зависимостей (Strategy Library, IntegrityGate).

### 9.2 Contract Tests (L2)

- Проверка контракта `GenerativeEngineService`.
- Проверка структуры `generationMetadata` (I16).

### 9.3 Structural Tests (L3)

- Проверка интеграции с IntegrityGate (I21).
- Проверка обработки ошибок.

### 9.4 Formal Invariant Tests (L4)

- Проверка детерминизма (I19): одинаковые входы → одинаковый результат.
- Проверка изоляции (I15): `GENERATED_DRAFT` не переходит в `DRAFT` автоматически.

---

## 10. Формальная граница компонента

**Входные данные:**
- Параметры генерации (`GenerationParams`).

**Выходные данные:**
- TechMap в статусе `GENERATED_DRAFT` с метаданными (I16).

**Гарантии:**
- Детерминизм при фиксированном `seed` (I19).
- Соблюдение всех Constraints (I21).
- Прослеживаемость генерации (I16).

**Ограничения:**
- Не может автоматически утверждать черновики (I15).
- Не может обходить IntegrityGate (I21).
