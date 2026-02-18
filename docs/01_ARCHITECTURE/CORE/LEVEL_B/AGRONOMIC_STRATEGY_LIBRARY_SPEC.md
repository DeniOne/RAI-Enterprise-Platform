# AGRONOMIC_STRATEGY_LIBRARY_SPEC.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Компонент:** Agronomic Strategy Library (Level B)
- **Статус:** DRAFT / ARCHITECTURAL SPECIFICATION
- **Зависимости:** LEVEL_A_BASELINE_VERIFIED_SPEC.md, INVARIANT_EXTENSION_FOR_LEVEL_B.md

---

## 1. Назначение компонента

**Agronomic Strategy Library** — это версионированная база знаний агрономических стратегий. Компонент хранит шаблоны технологических карт для различных культур и регионов, которые используются Generative Engine для создания конкретных TechMap.

---

## 2. Модель данных

### 2.1 Схема стратегии (Prisma)

```prisma
model AgronomicStrategy {
  id            String          @id @default(uuid())
  name          String
  description   String?
  version       Int
  cropId        String
  regionId      String
  operations    Json            // OperationTemplate[]
  constraints   Json            // Constraint[]
  status        StrategyStatus
  publishedAt   DateTime?
  hash          String          // SHA-256
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  createdBy     String
  
  crop          Crop            @relation(fields: [cropId], references: [id])
  region        Region          @relation(fields: [regionId], references: [id])
  
  @@unique([cropId, regionId, name, version])
  @@index([cropId, regionId, status])
}

enum StrategyStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

---

### 2.2 Структура OperationTemplate

```typescript
interface OperationTemplate {
  type: OperationType;          // 'SOWING', 'FERTILIZATION', 'SPRAYING', etc.
  relativeDay: number;          // День относительно начала сезона
  duration?: number;            // Длительность операции (дни)
  resourceRates: {
    [resourceType: string]: string | number; // Может быть шаблоном "{{region.seedRate}}"
  };
  constraints?: Constraint[];   // Специфичные для операции ограничения
  metadata?: object;            // Дополнительные данные
}

type OperationType = 
  | 'SOIL_PREPARATION'
  | 'SOWING'
  | 'FERTILIZATION'
  | 'SPRAYING'
  | 'IRRIGATION'
  | 'HARVESTING';
```

---

### 2.3 Структура Constraint

```typescript
interface Constraint {
  id: string;
  type: ConstraintType;         // 'ST', 'DM', 'TM', 'FN'
  rule: string;                 // Описание правила
  validator: string;            // Ссылка на валидатор
  params?: object;              // Параметры валидации
}

type ConstraintType = 'ST' | 'DM' | 'TM' | 'FN';
```

---

## 3. Жизненный цикл стратегии

### 3.1 FSM стратегии

```
[ DRAFT ] --(PUBLISH)--> [ PUBLISHED ] --(ARCHIVE)--> [ ARCHIVED ]
```

**Состояния:**
1. `DRAFT` — Черновик, доступен для редактирования.
2. `PUBLISHED` — Опубликовано, используется для генерации, **неизменяемо** (I18).
3. `ARCHIVED` — Архивировано, не используется для генерации.

---

### 3.2 Правила переходов

| Текущее состояние | Событие | Следующее состояние | Допущено | Обоснование |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `PUBLISH` | `PUBLISHED` | ДА | Публикация стратегии |
| `PUBLISHED` | `ARCHIVE` | `ARCHIVED` | ДА | Архивирование устаревшей версии |
| `PUBLISHED` | `EDIT` | `DRAFT` | **НЕТ** | Нарушение I18 (Strategy Library Immutability) |
| `ARCHIVED` | `EDIT` | `DRAFT` | **НЕТ** | Архивированные стратегии неизменяемы |

---

### 3.3 Версионирование (I18)

**Правила:**
1. При создании стратегии `version = 1`.
2. При публикации (`DRAFT -> PUBLISHED`) вычисляется `hash = SHA256(operations + constraints)`.
3. Любые изменения опубликованной стратегии требуют создания **новой версии**:
   - Клонирование стратегии с `version = version + 1`.
   - Новая версия начинается в статусе `DRAFT`.
4. Опубликованные стратегии **неизменяемы** (Read-Only в БД).

**Механизм:**
```typescript
class StrategyService {
  async editStrategy(strategyId: string, changes: Partial<AgronomicStrategy>): Promise<AgronomicStrategy> {
    const strategy = await this.repo.findById(strategyId);
    
    if (strategy.status === 'PUBLISHED' || strategy.status === 'ARCHIVED') {
      // Создать новую версию
      return await this.createNewVersion(strategy, changes);
    }
    
    // Редактировать черновик
    return await this.repo.update(strategyId, changes);
  }
  
  private async createNewVersion(original: AgronomicStrategy, changes: Partial<AgronomicStrategy>): Promise<AgronomicStrategy> {
    const newVersion = {
      ...original,
      ...changes,
      id: uuid(),
      version: original.version + 1,
      status: 'DRAFT',
      publishedAt: null,
      hash: '',
      createdAt: new Date()
    };
    
    return await this.repo.create(newVersion);
  }
}
```

[Invariant: I18 | Test Level: L6 | Trace: STRAT_IMMUT_01]

---

## 4. Публикация стратегии

### 4.1 Процесс публикации

```typescript
async publishStrategy(strategyId: string, userId: string): Promise<AgronomicStrategy> {
  const strategy = await this.repo.findById(strategyId);
  
  if (strategy.status !== 'DRAFT') {
    throw new IllegalStateTransitionException('Only DRAFT strategies can be published');
  }
  
  // Валидация стратегии
  const validation = await this.validateStrategy(strategy);
  if (!validation.isValid) {
    throw new StrategyValidationException(validation.errors);
  }
  
  // Вычисление хеша
  const hash = this.computeHash(strategy);
  
  // Публикация
  return await this.repo.update(strategyId, {
    status: 'PUBLISHED',
    publishedAt: new Date(),
    hash
  });
}
```

---

### 4.2 Валидация стратегии

**Проверки:**
1. Наличие хотя бы одной операции.
2. Корректность шаблонов ресурсов (валидные плейсхолдеры).
3. Последовательность `relativeDay` (операции не пересекаются некорректно).
4. Валидность Constraints.

---

## 5. Использование стратегий

### 5.1 Поиск стратегий

```typescript
interface StrategyLibraryService {
  // Получить опубликованную стратегию по ID
  getPublishedStrategy(strategyId: string): Promise<AgronomicStrategy>;
  
  // Найти стратегии для культуры и региона
  findStrategiesByCropAndRegion(cropId: string, regionId: string): Promise<AgronomicStrategy[]>;
  
  // Получить последнюю версию стратегии
  getLatestVersion(cropId: string, regionId: string, name: string): Promise<AgronomicStrategy>;
}
```

---

### 5.2 Развертывание шаблонов

Generative Engine использует стратегии для создания конкретных TechMap:

```typescript
class TemplateExpander {
  expand(template: OperationTemplate, context: ExpansionContext): Operation {
    const operation: Operation = {
      type: template.type,
      date: this.calculateDate(context.seasonStart, template.relativeDay),
      resourceRates: this.expandResourceRates(template.resourceRates, context)
    };
    
    return operation;
  }
  
  private expandResourceRates(rates: object, context: ExpansionContext): object {
    const expanded = {};
    
    for (const [key, value] of Object.entries(rates)) {
      if (typeof value === 'string' && value.includes('{{')) {
        // Шаблон, например "{{region.seedRate}}"
        expanded[key] = this.resolveTemplate(value, context);
      } else {
        expanded[key] = value;
      }
    }
    
    return expanded;
  }
  
  private resolveTemplate(template: string, context: ExpansionContext): any {
    // Пример: "{{region.seedRate}}" -> context.region.seedRate
    const path = template.replace(/{{|}}/g, '').trim();
    return this.getNestedValue(context, path);
  }
}
```

---

## 6. Интеграция с другими компонентами

### 6.1 Generative Engine

**Зависимость:** Generative Engine читает стратегии для генерации TechMap.

**Контракт:** См. раздел 5.1.

---

### 6.2 Knowledge Graph

**Зависимость:** Стратегии могут обогащаться данными из Knowledge Graph.

**Примеры:**
- Рекомендации по последовательности операций.
- Связи между культурами и вредителями.

---

## 7. UI для управления стратегиями

### 7.1 Основные функции

1. **Создание стратегии:**
   - Выбор культуры и региона.
   - Добавление операций (шаблонов).
   - Определение ограничений.

2. **Редактирование черновика:**
   - Изменение операций.
   - Изменение ограничений.

3. **Публикация:**
   - Валидация стратегии.
   - Вычисление хеша.
   - Переход в статус `PUBLISHED`.

4. **Создание новой версии:**
   - Клонирование опубликованной стратегии.
   - Редактирование в статусе `DRAFT`.

5. **Архивирование:**
   - Перевод устаревших стратегий в `ARCHIVED`.

---

### 7.2 Визуализация

- **Таблица стратегий:** Список всех стратегий с фильтрацией по культуре, региону, статусу.
- **Детальный вид:** Операции, ограничения, метаданные.
- **История версий:** Список всех версий стратегии с возможностью сравнения.

---

## 8. Тестирование

### 8.1 Unit Tests (L1)

- Тестирование версионирования.
- Тестирование валидации стратегий.

### 8.2 Contract Tests (L2)

- Проверка контракта `StrategyLibraryService`.

### 8.3 Structural Tests (L3)

- Проверка интеграции с Generative Engine.

### 8.4 Formal Invariant Tests (L4)

- Проверка неизменяемости опубликованных стратегий (I18).
- Попытка редактирования `PUBLISHED` стратегии → FAIL.

---

## 9. Миграция и импорт

### 9.1 Импорт стратегий

Возможность импорта стратегий из внешних источников (JSON, CSV):

```typescript
interface StrategyImportService {
  importFromJson(json: string): Promise<AgronomicStrategy>;
  exportToJson(strategyId: string): Promise<string>;
}
```

---

### 9.2 Валидация импорта

При импорте проводится полная валидация структуры и данных.

---

## 10. Формальная граница компонента

**Входные данные:**
- Шаблоны операций.
- Ограничения.
- Метаданные культуры и региона.

**Выходные данные:**
- Версионированные стратегии.
- Хеши для проверки целостности.

**Гарантии:**
- Неизменяемость опубликованных стратегий (I18).
- Прослеживаемость версий.
- Валидность шаблонов.

**Ограничения:**
- Опубликованные стратегии не могут быть изменены напрямую.
- Изменения требуют создания новой версии.
