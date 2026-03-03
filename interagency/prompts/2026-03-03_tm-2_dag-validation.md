# PROMPT — TechMap Sprint TM-2: Operations DAG + Validation Engine
Дата: 2026-03-03
Статус: active
Приоритет: P1

## Цель
Реализовать операции техкарты как направленный ациклический граф (DAG) с типизированными зависимостями и математической валидацией. Добавить сервисы: `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` и три калькулятора (норма высева, дозы удобрений, GDD-окна).

**Предусловие**: Sprint TM-1 закрыт — существуют модели `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone`, расширенные `MapOperation` (с `bbchWindowFrom/To`, `dependencies`, `isCritical`, `weatherConstraints`) и `MapResource` (с `inputCatalogId`, `minRate`, `maxRate`).

## Контекст
- Техническая база: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §3 (Методология расчётов)
- Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` (Sprint TM-2)
- Decision-ID будет зарегистрирован Orchestrator при акцепте плана

**Ключевые ссылки из GRAND_SYNTHESIS §3:**

### DAG-зависимости (§2.2.8)
`dependencies` в Operation — массив типизированных связей:
```json
[{ "op_id": "uuid", "type": "FS|SS|FF", "lag_min_days": 0, "lag_max_days": 5 }]
```
- **FS** (Finish-Start): B начинается после завершения A + lag
- **SS** (Start-Start): B начинается одновременно с A + lag
- **FF** (Finish-Finish): B заканчивается одновременно с A + lag

### Алгоритм нормы высева (§3.2.1)
```
НормаВесовая (кг/га) = (ЦелеваяГустота_млн/га × МассаТысячиСемян_г) / (ЛабВсхожесть% × ПолеваяВсхожесть% / 10000)
```
Диапазоны: 1.2–5.0 млн всхожих/га. Озимый рапс: ниже норма (длинная осень). Яровой (Сибирь): выше норма.

### Алгоритм доз удобрений (§3.2.3)
```
ДозаN (кг/га) = (ВыносN × ЦелеваяУрожайность - ЗапасNпочвы × Кусвоения) / КусвоенияУдобрения
```
Входящие данные: `SoilProfile` (N, P, K, S, B, pH), `CropZone.targetYieldTHa`, региональные коэффициенты выноса.

### GDD-окна (§3.2.2)
```
ДатаОперации = f(RegionProfile.GDD, ФактическаяПогода, BBCH_модель_гибрида)
```
НЕ календарные даты — динамические окна по сумме активных температур и BBCH-фазам.

### 7 классов ошибок валидации (§3.4)
| # | Класс | Тип | Поле источника |
|---|-------|-----|----------------|
| 1 | Несовместимые смеси в tank_mix_group | HARD_STOP | `InputCatalog.incompatibleWith` |
| 2 | planned_rate > max_rate | HARD_STOP | `MapResource.maxRate` |
| 3 | Операция вне BBCH-окна | HARD_STOP | `MapOperation.bbchWindowFrom/To` |
| 4 | Критическая операция пропущена (is_critical=true + окно истекло) | CRITICAL_WARNING | `MapOperation.isCritical` |
| 5 | СЗР в водоохранной/буферной зоне | HARD_STOP | `Field.protectedZoneFlags` |
| 6 | Ресурсный конфликт (техника/люди) | WARNING | `MapOperation.dependencies` |
| 7 | Превышение дозы д.в./га (sum по active_substances) | HARD_STOP | `InputCatalog.activeSubstances` + `MapResource.plannedRate` |

## Ограничения (жёстко)
- **Tenant isolation**: все сервисы принимают `companyId` как первый параметр и фильтруют данные через него
- **Не трогать**: UI (`apps/web`), Prisma-схему (TM-1 уже закрыт — только runtime-код), API-контроллеры
- **Scope**: только `apps/api/src/modules/tech-map/` — новые поддиректории `validation/` и `calculators/`
- **Чистая архитектура**: сервисы не обращаются к БД напрямую — используют `PrismaService` через DI
- **Pure functions — calculators**: калькуляторы должны быть pure functions без side-effects (удобно для тестов)
- **Тесты**: все новые сервисы без моков Prisma на уровне unit — входные данные передаются напрямую

## Задачи (что сделать)

### 1. Директории
Создать:
- `apps/api/src/modules/tech-map/validation/`
- `apps/api/src/modules/tech-map/calculators/`

### 2. `DAGValidationService`
Файл: `apps/api/src/modules/tech-map/validation/dag-validation.service.ts`

```typescript
export class DAGValidationService {
  // Обнаружение ациклов (DFS + color marking)
  validateAcyclicity(operations: OperationNode[]): ValidationResult
  // Критический путь (CPM — метод критического пути)
  calculateCriticalPath(operations: OperationNode[]): CriticalPathResult
  // Ресурсные конфликты
  detectResourceConflicts(operations: OperationNode[], availableCapacity: ResourceCapacity): ResourceConflict[]
}

// Типы:
type OperationNode = {
  id: string
  plannedDurationHours: number
  isCritical: boolean
  dependencies: Array<{ opId: string; type: 'FS' | 'SS' | 'FF'; lagMinDays: number; lagMaxDays: number }>
}
type ValidationResult = { valid: boolean; cycles: string[][] }
type CriticalPathResult = { criticalPath: string[]; totalDurationDays: number; floats: Record<string, number> }
type ResourceConflict = { operationIds: [string, string]; conflictType: 'MACHINERY' | 'LABOR'; description: string }
```

**Unit-тесты** (`dag-validation.service.spec.ts`):
- [ ] Линейный граф (A→B→C) → нет циклов, критический путь = A,B,C
- [ ] Граф с циклом (A→B→A) → `valid: false`, `cycles: [['A','B']]`
- [ ] Параллельные ветки с разными длительностями → правильный крит. путь
- [ ] FS-зависимость с лагом 2 дня → учтено в длительности

### 3. `TechMapValidationEngine`
Файл: `apps/api/src/modules/tech-map/validation/techmap-validation.engine.ts`

```typescript
export class TechMapValidationEngine {
  validate(input: ValidationInput): ValidationReport
}

type ValidationInput = {
  operations: OperationWithResources[]
  field: { protectedZoneFlags: string[] | null }
  cropZone: { targetYieldTHa: number }
}

type ValidationReport = {
  hardStops: ValidationError[]
  criticalWarnings: ValidationError[]
  warnings: ValidationError[]
  isBlockedForProduction: boolean // true если есть хотя бы 1 HARD_STOP
}

type ValidationError = {
  code: string           // e.g. 'INCOMPATIBLE_TANK_MIX'
  operationId?: string
  resourceId?: string
  message: string
  severity: 'HARD_STOP' | 'CRITICAL_WARNING' | 'WARNING'
}
```

**Unit-тесты** (`techmap-validation.engine.spec.ts`):
- [ ] Правило 1: несовместимые СЗР в одной группе → HARD_STOP с code='INCOMPATIBLE_TANK_MIX'
- [ ] Правило 2: planned_rate > max_rate → HARD_STOP с code='RATE_EXCEEDS_MAX'
- [ ] Правило 3: операция с bbchWindowFrom/To, BBCH не совпадает → HARD_STOP 'BBCH_WINDOW_VIOLATION'
- [ ] Правило 4: isCritical=true, операция без факта и окно истекло → CRITICAL_WARNING 'CRITICAL_OP_MISSED'
- [ ] Правило 5: field.protectedZoneFlags содержит 'WATER_PROTECTION' + операция PESTICIDE_APP → HARD_STOP 'REGULATORY_ZONE_VIOLATION'
- [ ] Правило 6: ресурсный конфликт → WARNING 'RESOURCE_CONFLICT'
- [ ] Правило 7: суммарная доза д.в. превышает зарегистрированный максимум → HARD_STOP 'ACTIVE_SUBSTANCE_OVERDOSE'
- [ ] Чистая техкарта (нет нарушений) → `isBlockedForProduction: false`, пустые ошибки

### 4. `TankMixCompatibilityService`
Файл: `apps/api/src/modules/tech-map/validation/tank-mix-compatibility.service.ts`

```typescript
export class TankMixCompatibilityService {
  // Принимает список InputCatalog-записей из одного tank_mix_group_id
  checkCompatibility(inputs: InputCatalogItem[]): CompatibilityResult
}

type InputCatalogItem = { id: string; name: string; incompatibleWith: string[] | null }
type CompatibilityResult = {
  status: 'COMPATIBLE' | 'CAUTION' | 'INCOMPATIBLE'
  conflictingPairs: Array<[string, string]>  // пары несовместимых id
  message: string
}
```

**Unit-тесты** (`tank-mix-compatibility.service.spec.ts`):
- [ ] 3 совместимых препарата → COMPATIBLE
- [ ] A.incompatibleWith=['B'] → INCOMPATIBLE, conflictingPairs=[['A','B']]
- [ ] Пустой список → COMPATIBLE

### 5. Калькуляторы

#### 5.1 `SeedingRateCalculator`
Файл: `apps/api/src/modules/tech-map/calculators/seeding-rate.calculator.ts`

```typescript
// Pure function — принимает числа, возвращает числа
export function calculateSeedingRate(params: {
  targetDensityMlnHa: number    // целевая густота, млн всхожих/га (1.2–5.0)
  thousandSeedWeightG: number   // масса 1000 семян, г
  labGerminationPct: number     // лабораторная всхожесть, % (0–100)
  fieldGerminationPct: number   // полевая всхожесть, % (0–100)
}): {
  weightedRateKgHa: number      // весовая норма, кг/га
  seedsPerM2: number            // штук на м²
}
```

**Unit-тесты**:
- [ ] Стандартный рапс: density=1.2, tgw=4.5g, labGerm=95%, fieldGerm=85% → корректный кг/га
- [ ] Яровой Сибирь: density=3.5, tgw=3.8g, labGerm=90%, fieldGerm=70% → выше норма
- [ ] Невалидный ввод (density=0) → бросает ошибку

#### 5.2 `FertilizerDoseCalculator`
Файл: `apps/api/src/modules/tech-map/calculators/fertilizer-dose.calculator.ts`

```typescript
export function calculateNitrogenDose(params: {
  targetYieldTHa: number
  nUptakeKgPerT: number       // вынос N на 1 т урожая, кг (для рапса ~60)
  soilNMineralMgKg: number    // минеральный N в почве, мг/кг
  soilUtilizationCoeff: number // коэф. использования почвенного N (0–1, обычно 0.3)
  fertUtilizationCoeff: number // коэф. использования удобрения (0–1, обычно 0.7)
  bulkDensityGCm3: number     // объёмная масса почвы для расчёта запаса
  samplingDepthCm: number     // глубина взятия образца, см
}): {
  doseKgHa: number            // доза N, кг/га д.в.
  mineralNReserveKgHa: number // запас минерального N в почве, кг/га
}
```

**Unit-тесты**:
- [ ] Рапс 4 т/га, вынос 60 кг/т, бедная почва → высокая доза
- [ ] Рапс 3 т/га, богатая почва (высокий мин.N) → сниженная доза
- [ ] Деление на ноль при fertCoeff=0 → ошибка

#### 5.3 `GDDWindowCalculator`
Файл: `apps/api/src/modules/tech-map/calculators/gdd-window.calculator.ts`

```typescript
export function calculateGDDToDate(params: {
  dailyTemps: Array<{ date: string; tMin: number; tMax: number }>
  baseTemp: number            // базовая температура (для рапса 0 или 5°C)
  startDate: string           // ISO дата начала накопления
}): {
  gddAccumulated: number
  gddByDate: Record<string, number>  // накопленный GDD по датам
}

export function estimateOperationDate(params: {
  gddTarget: number           // целевой GDD для операции
  regionProfile: { gddBaseTempC: number; avgGddSeason: number }
  seasonStartDate: string
  historicalGDDRate: number   // средний GDD/день в регионе
}): {
  estimatedDate: string       // ISO
  confidenceRangeDays: number // ±N дней
}
```

**Unit-тесты**:
- [ ] Массив температур за 10 дней → корректный накопленный GDD
- [ ] baseTemp=5°C, tMax=4°C → GDD=0 (не накапливается ниже базы)
- [ ] estimateOperationDate с известным rate → правильная дата

### 6. Регистрация в tech-map.module.ts
- [ ] Добавить `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` в providers/exports `TechMapModule`
- [ ] Калькуляторы — standalone functions, импортировать по месту использования (не NestJS injectable)

### 7. Интеграция в `TechMapService`
- [ ] Метод `validateTechMap(techMapId, companyId)` — загружает данные и вызывает `TechMapValidationEngine.validate()`
- [ ] Метод `validateDAG(techMapId, companyId)` — загружает операции и вызывает `DAGValidationService.validateAcyclicity()`
- [ ] Метод `getCalculationContext(cropZoneId, companyId)` — загружает `SoilProfile`, `RegionProfile`, `CropZone` для передачи в калькуляторы

## Definition of Done (DoD)
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS (нет TS-ошибок)
- [ ] `pnpm --filter api test` — существующие тесты PASS + все новые PASS
- [ ] Новые тесты: ≥ 20 unit-тестов суммарно:
  - DAGValidationService: ≥ 4 теста
  - TechMapValidationEngine: ≥ 8 тестов (по 1 на каждый класс ошибки + 1 clean)
  - TankMixCompatibilityService: ≥ 3 теста
  - Calculators: ≥ 7 тестов
- [ ] Smoke-тест через `TechMapService.validateTechMap()` — с mock-данными, правильный ответ
- [ ] Все сервисы принимают companyId и не имеют жёстко закодированных данных

## Тест-план (минимум)
```bash
# Запуск новых тестов:
cd apps/api && npx jest --runInBand src/modules/tech-map/validation/
cd apps/api && npx jest --runInBand src/modules/tech-map/calculators/

# Регрессия:
pnpm --filter api test -- --passWithNoTests

# TypeScript:
pnpm --filter api exec tsc --noEmit
```

## Что вернуть на ревью
- Новые файлы (список):
  - `apps/api/src/modules/tech-map/validation/*.ts` (4 файла: service + engine + compatibility + specs)
  - `apps/api/src/modules/tech-map/calculators/*.ts` (6 файлов: 3 калькулятора + 3 spec)
  - `apps/api/src/modules/tech-map/tech-map.service.ts` (diff — 3 новых метода)
  - `apps/api/src/modules/tech-map/tech-map.module.ts` (diff — новые providers)
- Логи тестов (все ≥ 20 проходят)
- Логи `tsc --noEmit`
