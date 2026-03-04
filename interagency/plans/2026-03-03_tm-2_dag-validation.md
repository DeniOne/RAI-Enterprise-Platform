# PLAN — TechMap Sprint TM-2: Operations DAG + Validation Engine
Дата: 2026-03-03
Статус: **ACCEPTED**
Decision-ID: AG-TM-DAG-002

---

## Pre-flight check

| Проверка | Результат |
|----------|-----------|
| CANON.md | ✅ Соответствует |
| SECURITY_CANON.md | ✅ Соответствует: все сервисы принимают `companyId`; pure-функции — без IO; DTO-вход валидируется до бизнес-логики |
| LANGUAGE POLICY | ✅ Русский текст, английский — только код/идентификаторы |
| UI Design Canon | ✅ Не применимо — scope только `apps/api/` |
| Multi-tenancy | ✅ Все методы сервисов принимают `companyId` первым параметром |
| CRM-блоат | ✅ Не выявлен — чистый агрономический домен |
| Infrastructure Isolation | ✅ Domain-сервисы получают данные через параметры или `PrismaService` via DI |
| Service = IO / Orchestrator = Brain | ✅ Калькуляторы — pure functions; `TechMapService` — orchestrator |
| Decision-ID | ⏳ Будет зарегистрирован Orchestrator при акцепте плана |
| TM-1 предусловие | ✅ Модели `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, расширенные `MapOperation`/`MapResource` — в schema; DTO и spec-файлы в `dto/` — подтверждены |

---

## Результат (какой артефакт получим)

Три новых поддиректории в `apps/api/src/modules/tech-map/`:

- `validation/` — 3 injectable-класса + 3 spec-файла
- `calculators/` — 3 pure-function модуля + 3 spec-файла
- Расширение `TechMapService` тремя методами
- Регистрация новых провайдеров в `TechMapModule`

Итого: **≥ 20 unit-тестов, tsc PASS, все существующие тесты PASS**.

---

## Границы (что входит / что НЕ входит)

**Входит:**
- Создание `apps/api/src/modules/tech-map/validation/`
- `dag-validation.service.ts` + `dag-validation.service.spec.ts`
- `techmap-validation.engine.ts` + `techmap-validation.engine.spec.ts`
- `tank-mix-compatibility.service.ts` + `tank-mix-compatibility.service.spec.ts`
- Создание `apps/api/src/modules/tech-map/calculators/`
- `seeding-rate.calculator.ts` + `seeding-rate.calculator.spec.ts`
- `fertilizer-dose.calculator.ts` + `fertilizer-dose.calculator.spec.ts`
- `gdd-window.calculator.ts` + `gdd-window.calculator.spec.ts`
- Добавление методов `validateTechMap`, `validateDAG`, `getCalculationContext` в `TechMapService`
- Регистрация `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` в `tech-map.module.ts`

**НЕ входит:**
- Любые изменения `apps/web`
- Изменения Prisma-схемы (TM-1 закрыт)
- Новые API-контроллеры или endpoints
- Изменения за пределами `apps/api/src/modules/tech-map/`
- Изменения `interagency/INDEX.md`, memory-bank, чеклистов до внешнего ревью

---

## Риски

| Риск | Митигация |
|------|-----------|
| Типы `MapOperation.dependencies` в Prisma — `Json?`, а не строгий TS-тип | Использовать Zod-парсинг внутри `DAGValidationService.validateAcyclicity()` до работы с данными |
| `MapOperation.bbchWindowFrom/To` и `MapResource.maxRate` могут быть `null` в existingданных | В `TechMapValidationEngine` проверять null перед применением правила; skip-правило если данных нет |
| Существующие тесты (spec в `fsm/`, `tech-map.concurrency.spec.ts`) могут косвенно зависеть от `TechMapService` | Новые методы добавляются без изменения сигнатур существующих; новые зависимости инжектируются опционально через отдельные параметры конструктора |
| `TechMapService` конструктор: нужно добавить 3 новых инжектируемых класса | Добавить аргументы в конструктор; существующие `.spec.ts`-тесты сервиса потребуют обновления mock-контекста — проверить перед написанием |
| `InputCatalog.incompatibleWith` — тип `String[]` в Prisma (JSON-массив) | Парсить на уровне читающего сервиса, не трогая схему |

---

## Детальный план работ

### 1. Создать поддиректории

```
apps/api/src/modules/tech-map/validation/
apps/api/src/modules/tech-map/calculators/
```

### 2. `DAGValidationService`
**Файл:** `apps/api/src/modules/tech-map/validation/dag-validation.service.ts`

- Injectable NestJS-класс (без PrismaService — только входные данные)
- `validateAcyclicity(operations)` — DFS с колоризацией (WHITE/GRAY/BLACK), возвращает `{ valid, cycles }`
- `calculateCriticalPath(operations)` — CPM-алгоритм: ES/EF/LS/LF для каждого узла с учётом FS/SS/FF и `lagMinDays`; возвращает `{ criticalPath, totalDurationDays, floats }`
- `detectResourceConflicts(operations, capacity)` — пересечение временных окон при FS-зависимостях; возвращает `ResourceConflict[]`

**TS-интерфейсы** (определяются в том же файле):
```typescript
type OperationNode = {
  id: string
  plannedDurationHours: number
  isCritical: boolean
  dependencies: Array<{ opId: string; type: 'FS'|'SS'|'FF'; lagMinDays: number; lagMaxDays: number }>
}
type ValidationResult    = { valid: boolean; cycles: string[][] }
type CriticalPathResult  = { criticalPath: string[]; totalDurationDays: number; floats: Record<string, number> }
type ResourceConflict    = { operationIds: [string, string]; conflictType: 'MACHINERY'|'LABOR'; description: string }
type ResourceCapacity    = Record<string, number>
```

**Spec:** `dag-validation.service.spec.ts` — 4 теста:
1. Линейный A→B→C: нет циклов, criticalPath=['A','B','C']
2. Цикл A→B→A: `valid: false`, cycles=[['A','B']]
3. Параллельные ветки разной длины: длиннейший путь = criticalPath
4. FS с lagMinDays=2: totalDurationDays учитывает lag

### 3. `TechMapValidationEngine`
**Файл:** `apps/api/src/modules/tech-map/validation/techmap-validation.engine.ts`

- Pure injectable (без PrismaService — данные передаются как `ValidationInput`)
- Метод `validate(input: ValidationInput): ValidationReport`
- Реализует 7 правил из промта строго по порядку:
  1. Несовместимые смеси → вызывает `TankMixCompatibilityService`
  2. `plannedRate > maxRate`
  3. Операция вне BBCH-окна (если `bbchWindowFrom/To` не null)
  4. `isCritical=true` + нет факта + окно истекло → CRITICAL_WARNING
  5. `protectedZoneFlags` содержит 'WATER_PROTECTION' + `operationType==='PESTICIDE_APP'`
  6. Ресурсный конфликт → вызывает `DAGValidationService.detectResourceConflicts`
  7. Суммарная доза д.в. по active_substances > зарегистрированный max

**Инъекция зависимостей:**
```typescript
constructor(
  private readonly tankMix: TankMixCompatibilityService,
  private readonly dag: DAGValidationService,
) {}
```

**Spec:** `techmap-validation.engine.spec.ts` — 8 тестов (по 1 на каждое правило + 1 чистый)

### 4. `TankMixCompatibilityService`
**Файл:** `apps/api/src/modules/tech-map/validation/tank-mix-compatibility.service.ts`

- Injectable (без PrismaService — данные передаются)
- `checkCompatibility(inputs: InputCatalogItem[]): CompatibilityResult`
- Алгоритм: O(n²) попарная проверка через `incompatibleWith[]`

**Spec:** `tank-mix-compatibility.service.spec.ts` — 3 теста

### 5. Калькуляторы (pure functions)

#### 5.1 `seeding-rate.calculator.ts`
- Экспортирует `calculateSeedingRate(params): { weightedRateKgHa, seedsPerM2 }`
- Формула из промта §3.2.1
- Guard: бросать `Error('Invalid params')` при `density <= 0`, `germinationPct <= 0` или `germinationPct > 100`

**Spec:** 3 теста (стандарт рапс, яровой Сибирь, невалидный ввод)

#### 5.2 `fertilizer-dose.calculator.ts`
- Экспортирует `calculateNitrogenDose(params): { doseKgHa, mineralNReserveKgHa }`
- Формула из промта §3.2.3
- Guard: бросать `Error` при `fertUtilizationCoeff === 0`

**Spec:** 3 теста (бедная почва, богатая почва, деление на ноль)

#### 5.3 `gdd-window.calculator.ts`
- Экспортирует `calculateGDDToDate(params): { gddAccumulated, gddByDate }`
- Экспортирует `estimateOperationDate(params): { estimatedDate, confidenceRangeDays }`
- GDD по дню = max(0, (tMin + tMax)/2 - baseTemp)

**Spec:** 3 теста (накопление за 10 дней, base > tMax → 0, estimateOperationDate)

### 6. Расширение `TechMapService`

Добавить 3 новых метода:

```typescript
async validateTechMap(techMapId: string, companyId: string): Promise<ValidationReport>
async validateDAG(techMapId: string, companyId: string): Promise<ValidationResult>
async getCalculationContext(cropZoneId: string, companyId: string): Promise<CalculationContext>
```

**`validateTechMap`** — загружает TechMap с operations+resources+field, формирует `ValidationInput`, вызывает `TechMapValidationEngine.validate()`.

**`validateDAG`** — загружает `MapOperation[]` для TechMap, парсит `dependencies` из JSON, передаёт в `DAGValidationService.validateAcyclicity()`.

**`getCalculationContext`** — загружает `CropZone` с `SoilProfile` и `RegionProfile` по `cropZoneId` и `companyId`; возвращает нужные поля для передачи в калькуляторы.

**Конструктор `TechMapService`** расширяется:
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly integrityGate: IntegrityGateService,
  private readonly fsm: TechMapStateMachine,
  private readonly validationEngine: TechMapValidationEngine,
  private readonly dagValidation: DAGValidationService,
) {}
```

_Примечание: `tech-map.concurrency.spec.ts` и `fsm/tech-map.fsm.spec.ts` не тестируют новые методы напрямую и не должны сломаться; но если они инстанцируют `TechMapService` вручную — потребуется добавить mock-параметры._

### 7. Обновление `TechMapModule`

```typescript
providers: [
  TechMapService,
  TechMapStateMachine,
  DAGValidationService,
  TechMapValidationEngine,
  TankMixCompatibilityService,
],
exports: [TechMapService],
```

---

## Security Assessment

| Пункт SECURITY_CANON §7 | Статус |
|--------------------------|--------|
| Decision-ID + ACCEPTED | ⏳ Назначается при акцепте |
| Tenant isolation (companyId) | ✅ Все 3 метода TechMapService принимают companyId |
| Нет обхода gate-процессов | ✅ Новые методы не меняют FSM/IntegrityGate |
| Audit trail | ✅ Существующий Logger в TechMapService; validation-результаты не мутируют данные |
| Нет новых контроллеров/endpoints | ✅ Промт запрещает, план соответствует |

---

## DoD (Definition of Done)

- [ ] `pnpm --filter api exec tsc --noEmit` — PASS
- [ ] `npx jest --runInBand src/modules/tech-map/validation/` — все тесты PASS
- [ ] `npx jest --runInBand src/modules/tech-map/calculators/` — все тесты PASS
- [ ] `pnpm --filter api test -- --passWithNoTests` — существующие тесты не ухудшены
- [ ] Новых unit-тестов ≥ 20 суммарно
- [ ] Все методы TechMapService с `companyId` фильтруют данные через него
- [ ] Калькуляторы — pure functions без side-effects

---

## Тест-план (команды верификации)

```bash
# 1. TypeScript
pnpm --filter api exec tsc --noEmit

# 2. Новые validation-тесты
cd apps/api && npx jest --runInBand src/modules/tech-map/validation/

# 3. Новые calculator-тесты
cd apps/api && npx jest --runInBand src/modules/tech-map/calculators/

# 4. Регрессия всего api
pnpm --filter api test -- --passWithNoTests
```

---

## Список файлов для ревью

| Файл | Действие |
|------|----------|
| `apps/api/src/modules/tech-map/validation/dag-validation.service.ts` | NEW |
| `apps/api/src/modules/tech-map/validation/dag-validation.service.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/validation/techmap-validation.engine.ts` | NEW |
| `apps/api/src/modules/tech-map/validation/techmap-validation.engine.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/validation/tank-mix-compatibility.service.ts` | NEW |
| `apps/api/src/modules/tech-map/validation/tank-mix-compatibility.service.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/seeding-rate.calculator.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/seeding-rate.calculator.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/fertilizer-dose.calculator.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/fertilizer-dose.calculator.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/gdd-window.calculator.ts` | NEW |
| `apps/api/src/modules/tech-map/calculators/gdd-window.calculator.spec.ts` | NEW |
| `apps/api/src/modules/tech-map/tech-map.service.ts` | MODIFY (+3 метода, расширен конструктор) |
| `apps/api/src/modules/tech-map/tech-map.module.ts` | MODIFY (+3 провайдера) |
