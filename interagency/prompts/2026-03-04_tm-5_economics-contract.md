# PROMPT — TechMap Sprint TM-5: Economics + Contract Core
Дата: 2026-03-04
Статус: active
Приоритет: P1

## Цель
Реализовать финансовый слой техкарты и механизм юридической фиксации (Contract Core):
1. **`TechMapBudgetService`** — расчёт бюджета по 8 категориям (SEEDS/FERTILIZERS/PESTICIDES/FUEL/LABOR/RENT/LOGISTICS/ANALYSES), детектирование перерасходов + автогенерация ChangeOrder.
2. **`TechMapKPIService`** — расчёт экономических KPI из GRAND_SYNTHESIS §5.3.2: себестоимость/га, себестоимость/т, маржа/га, маржинальность, Risk-Adjusted Margin.
3. **`ContractCoreService`** — сериализация подписываемой части техкарты в детерминированный JSON + SHA-256 хэш → `TechMap.basePlanHash`, проверка целостности.
4. **`RecalculationEngine`** — пересчёт KPI в реальном времени при срабатывании триггера (интеграция с `TriggerEvaluationService` из TM-4).

**Предусловие:** TM-4 CLOSED — существуют `TriggerEvaluationService`, `ChangeOrderService`, `AdaptiveRule`, `RegionProfile`, `HybridPhenologyModel`.

## Контекст
- Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §5.3 (Финансовая структура техкарты)
- Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` (Sprint TM-5)
- Decision-ID будет зарегистрирован Orchestrator при акцепте плана

**Ключевые цитаты из GRAND_SYNTHESIS §5.3:**

### Категории бюджета (§5.3.1)
| BudgetCategory | Доля бюджета | Источник |
|----------------|-------------|----------|
| SEEDS | 15–20% | Склад ERP |
| FERTILIZERS | 25–30% | Склад ERP |
| PESTICIDES | 15% | Склад ERP |
| FUEL | 10% | Норматив л/га × цена ГСМ |
| LABOR | ~20% | Тарифная сетка × сложность |
| RENT | ~20% | Договоры аренды паёв |
| LOGISTICS | 5–10% | Транспортные плечи |
| ANALYSES | 5–10% | Услуги лабораторий |

### KPI-формулы (§5.3.2)
```
C_ha         = Σ BudgetLine.plannedCost / area_ha
C_t          = C_ha / targetYieldTHa
grossRevenue = targetYieldTHa * marketPriceRubT
margin_ha    = grossRevenue - C_ha
marginPct    = (margin_ha / grossRevenue) * 100
riskAdjustedMargin = (targetYieldTHa * marketPriceRubT) - (C_ha * (1 + lossRisk))
variancePct  = ((actualCost - plannedCost) / plannedCost) * 100
```

### Правила контроля перерасходов (§5.3.3)
- `actual > planned × (1 + tolerance_pct)` → автогенерация ChangeOrder
- tolerance_pct по умолчанию: 0.10 (10%), для SEEDS: 0.05 (5%)
- Delta ≤ contingency_fund → Агроном; Delta > contingency_fund → FINANCE

## Ограничения (жёстко)
- **Tenant isolation:** все новые сервисы принимают `companyId` и фильтруют данные только через него
- **Scope:** только `apps/api/src/modules/tech-map/` (без изменений Prisma-схемы — данные уже есть в TM-1..TM-4)
- **Не трогать:** UI, API-контроллеры, FSM, Prisma-схема, домены вне TechMap
- **Hash детерминизм:** `ContractCoreService.hashContractCore` должен давать одинаковый результат при одинаковых данных (canonical JSON, sorted keys, lexicographic order)
- **Нет side-effects в KPI:** `TechMapKPIService` — pure-вычисления; все исходные данные передаются как параметры или загружаются методами до расчёта

## Задачи

### 1. Новая Prisma-модель: `BudgetLine`

```prisma
enum BudgetCategory {
  SEEDS
  FERTILIZERS
  PESTICIDES
  FUEL
  LABOR
  RENT
  LOGISTICS
  ANALYSES
  OTHER
}

model BudgetLine {
  id              String          @id @default(cuid())
  techMapId       String
  techMap         TechMap         @relation(fields: [techMapId], references: [id])
  category        BudgetCategory
  description     String?
  plannedCost     Float           // руб
  actualCost      Float?          // руб — заполняется по факту
  tolerancePct    Float           @default(0.10)
  unit            String?         // 'кг', 'л', 'га', 'ч'
  plannedQty      Float?
  actualQty       Float?
  unitPrice       Float?          // руб/единицу
  operationId     String?         // привязка к конкретной Operation (опционально)
  companyId       String
  company         Company         @relation(fields: [companyId], references: [id])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([techMapId])
  @@index([companyId])
  @@index([category])
  @@map("budget_lines")
}
```

- Добавить `budgetLines BudgetLine[]` в `TechMap` и `Company`

### 2. Zod DTO
Файлы в `apps/api/src/modules/tech-map/dto/`:
- `budget-line.dto.ts` — `BudgetLineCreateDto`, `BudgetLineResponseDto`
  - `plannedCost`: `z.number().positive()`
  - `tolerancePct`: `z.number().min(0).max(1).default(0.10)`
  - `actualCost`: `z.number().nonnegative().optional()`
- `tech-map-kpi.dto.ts` — `TechMapKPIResponseDto` (read-only, computed)
  - Поля: `costPerHa`, `costPerTon`, `grossRevenuePerHa`, `marginPerHa`, `marginPct`, `riskAdjustedMarginPerHa`, `variancePct`

Unit-тесты: `*.dto.spec.ts` — по 2 теста каждый.

### 3. `TechMapBudgetService`
Файл: `apps/api/src/modules/tech-map/economics/tech-map-budget.service.ts`

```typescript
@Injectable()
export class TechMapBudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changeOrderService: ChangeOrderService,
  ) {}

  // Создать или обновить BudgetLine для TechMap
  async upsertBudgetLine(
    dto: BudgetLineCreateDto,
    techMapId: string,
    companyId: string,
  ): Promise<BudgetLine>

  // Рассчитать суммарный бюджет по всем категориям
  async calculateBudget(
    techMapId: string,
    companyId: string,
  ): Promise<{
    totalPlanned: number
    totalActual: number
    byCategory: Record<BudgetCategory, { planned: number; actual: number }>
    withinCap: boolean
    overCap: number  // превышение над budgetCapRubHa * area (0 если не превышено)
  }>

  // Проверить перерасход по каждой BudgetLine
  // При actual > planned * (1 + tolerancePct) → создать ChangeOrder SHIFT_DATE/CHANGE_RATE
  async checkOverspend(
    techMapId: string,
    companyId: string,
  ): Promise<{
    overspentLines: BudgetLine[]
    createdChangeOrders: ChangeOrder[]
  }>
}
```

**Логика `checkOverspend`:**
1. Загрузить `BudgetLine[]` для techMapId + companyId где `actualCost != null`
2. Для каждой: `overspent = actualCost > plannedCost * (1 + tolerancePct)`
3. Если overspent → `ChangeOrderService.createChangeOrder(techMapId, { changeType: 'CHANGE_RATE', reason: 'Перерасход по категории '+category, diffPayload: {...}, deltaCostRub: actualCost - plannedCost }, companyId)`
4. → `ChangeOrderService.routeForApproval(...)`
5. Вернуть `{ overspentLines, createdChangeOrders }`

**Unit-тесты** (`tech-map-budget.service.spec.ts`):
- [ ] `calculateBudget`: 3 BudgetLine → правильная сумма по категориям
- [ ] `calculateBudget`: `totalActual > budgetCap * area` → `withinCap: false`
- [ ] `checkOverspend`: `actualCost <= planned*(1+tol)` → нет ChangeOrder
- [ ] `checkOverspend`: `actualCost > planned*(1+tol)` → ChangeOrder создан, PENDING_APPROVAL
- [ ] `checkOverspend`: SEEDS tolerance 5%, actual = planned*1.06 → overspent

### 4. `TechMapKPIService`
Файл: `apps/api/src/modules/tech-map/economics/tech-map-kpi.service.ts`

```typescript
// Входные параметры для расчёта KPI
export interface KPICalculationInput {
  totalPlannedCost: number   // руб
  totalActualCost?: number   // руб (если есть)
  areaHa: number
  targetYieldTHa: number
  actualYieldTHa?: number
  marketPriceRubT: number
  lossRiskFactor: number     // 0.0–1.0 (вероятность потерь * их размер)
}

@Injectable()
export class TechMapKPIService {
  constructor(private readonly prisma: PrismaService) {}

  // Загрузить данные и рассчитать KPI для TechMap
  async calculateKPIs(
    techMapId: string,
    companyId: string,
    marketPriceRubT: number,
    lossRiskFactor?: number,
  ): Promise<TechMapKPIResponseDto>

  // Pure function — можно тестировать без Prisma
  computeKPIs(input: KPICalculationInput): TechMapKPIResponseDto

  // Пересчёт при появлении новых фактических данных
  async recalculate(
    techMapId: string,
    companyId: string,
    marketPriceRubT: number,
  ): Promise<TechMapKPIResponseDto>
}
```

**`computeKPIs` — pure function, без IO:**
```typescript
const costPerHa = input.totalPlannedCost / input.areaHa
const costPerTon = costPerHa / input.targetYieldTHa
const grossRevenuePerHa = input.targetYieldTHa * input.marketPriceRubT
const marginPerHa = grossRevenuePerHa - costPerHa
const marginPct = grossRevenuePerHa > 0 ? (marginPerHa / grossRevenuePerHa) * 100 : 0
const riskAdjustedMarginPerHa = grossRevenuePerHa - costPerHa * (1 + (input.lossRiskFactor ?? 0))
const variancePct = input.totalActualCost != null
  ? ((input.totalActualCost - input.totalPlannedCost) / input.totalPlannedCost) * 100
  : null
return { costPerHa, costPerTon, grossRevenuePerHa, marginPerHa, marginPct, riskAdjustedMarginPerHa, variancePct }
```

**Unit-тесты** (`tech-map-kpi.service.spec.ts`):
- [ ] `computeKPIs`: числовые значения совпадают с ручным расчётом
- [ ] `computeKPIs`: `lossRiskFactor=0` → `riskAdjustedMarginPerHa = marginPerHa`
- [ ] `computeKPIs`: `totalActualCost = null` → `variancePct = null`
- [ ] `computeKPIs`: `targetYieldTHa=0` → не бросает ошибку (costPerTon = Infinity или guard)

### 5. `ContractCoreService`
Файл: `apps/api/src/modules/tech-map/economics/contract-core.service.ts`

```typescript
@Injectable()
export class ContractCoreService {
  constructor(private readonly prisma: PrismaService) {}

  // Собрать подписываемую часть техкарты — Contract Core
  async generateContractCore(
    techMapId: string,
    companyId: string,
  ): Promise<ContractCorePayload>

  // Детерминированный SHA-256 хэш Contract Core
  // canonical JSON: ключи отсортированы лексикографически, без пробелов
  hashContractCore(core: ContractCorePayload): string

  // Сохранить хэш в TechMap.basePlanHash и вернуть его
  async sealContractCore(
    techMapId: string,
    companyId: string,
  ): Promise<{ hash: string; sealedAt: Date }>

  // Проверить что текущие данные TechMap совпадают с сохранённым hash
  async verifyIntegrity(
    techMapId: string,
    companyId: string,
  ): Promise<{ valid: boolean; storedHash: string; currentHash: string }>
}
```

**`ContractCorePayload` — структура подписываемой части:**
```typescript
export interface ContractCorePayload {
  techMapId: string
  companyId: string
  fieldId: string
  cropType: string
  targetYieldTHa: number
  budgetCapRubHa: number
  criticalOperations: Array<{ id: string; operationType: string; bbchWindowFrom: number | null }>
  sealedAt: string  // ISO-дата
  version: number
}
```

**Логика `hashContractCore`:**
```typescript
import { createHash } from 'crypto'
// Рекурсивная сортировка ключей для канонического JSON
const canonical = JSON.stringify(core, Object.keys(core).sort())
return createHash('sha256').update(canonical).digest('hex')
```

**Unit-тесты** (`contract-core.service.spec.ts`):
- [ ] `hashContractCore`: одинаковый payload → одинаковый hash
- [ ] `hashContractCore`: разный порядок ключей → одинаковый hash (canonical)
- [ ] `hashContractCore`: изменение одного поля → другой hash
- [ ] `verifyIntegrity`: stored == current → `valid: true`
- [ ] `verifyIntegrity`: hash изменён в БД → `valid: false`

### 6. `RecalculationEngine`
Файл: `apps/api/src/modules/tech-map/economics/recalculation.engine.ts`

```typescript
export interface RecalculationEvent {
  type: 'CHANGE_ORDER_APPLIED' | 'ACTUAL_YIELD_UPDATED' | 'PRICE_CHANGED' | 'TRIGGER_FIRED'
  techMapId: string
  payload?: Record<string, unknown>
}

@Injectable()
export class RecalculationEngine {
  constructor(
    private readonly budgetService: TechMapBudgetService,
    private readonly kpiService: TechMapKPIService,
    private readonly triggerService: TriggerEvaluationService,
  ) {}

  // Пересчитать всё при наступлении события
  async onEvent(
    event: RecalculationEvent,
    companyId: string,
    marketPriceRubT: number,
    lossRiskFactor?: number,
  ): Promise<{
    updatedBudget: Awaited<ReturnType<TechMapBudgetService['calculateBudget']>>
    updatedKPIs: TechMapKPIResponseDto
    newChangeOrders: ChangeOrder[]
  }>
}
```

**Логика `onEvent`:**
```
1. budgetService.calculateBudget(techMapId, companyId)
2. budgetService.checkOverspend(techMapId, companyId) → newChangeOrders
3. kpiService.recalculate(techMapId, companyId, marketPriceRubT)
4. if event.type === 'TRIGGER_FIRED' → triggerService.evaluateTriggers(techMapId, companyId, context)
5. Вернуть агрегированный результат
```

**Unit-тест** (`recalculation.engine.spec.ts`):
- [ ] `onEvent` CHANGE_ORDER_APPLIED → вызывает calculateBudget + checkOverspend + recalculate
- [ ] `onEvent` PRICE_CHANGED → обновляет KPI с новой ценой

### 7. Поддиректория
```
apps/api/src/modules/tech-map/economics/
```

### 8. Регистрация в `TechMapModule`
```typescript
providers: [
  TechMapService,
  TechMapStateMachine,
  DAGValidationService,
  TechMapValidationEngine,
  TankMixCompatibilityService,
  EvidenceService,
  ChangeOrderService,
  TriggerEvaluationService,
  RegionProfileService,
  HybridPhenologyService,
  TechMapBudgetService,     // NEW TM-5
  TechMapKPIService,        // NEW TM-5
  ContractCoreService,      // NEW TM-5
  RecalculationEngine,      // NEW TM-5
],
exports: [
  TechMapService,
  EvidenceService,
  ChangeOrderService,
  TriggerEvaluationService,
  TechMapBudgetService,     // NEW
  TechMapKPIService,        // NEW
  ContractCoreService,      // NEW
],
```

## Definition of Done (DoD)
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS
- [ ] `npx prisma validate` + `npx prisma db push` — PASS (только BudgetLine model)
- [ ] Новые unit-тесты: ≥ 18 суммарно:
  - TechMapBudgetService: ≥ 5 тестов
  - TechMapKPIService: ≥ 4 теста (включая `computeKPIs` как pure fn без моков)
  - ContractCoreService: ≥ 5 тестов (hash детерминизм обязателен)
  - RecalculationEngine: ≥ 2 теста
  - DTO: ≥ 4 теста (2 файла × 2)
- [ ] `hashContractCore` — детерминированный (canonical JSON, sorted keys)
- [ ] `computeKPIs` — pure function без Prisma
- [ ] `checkOverspend` — мутирует только через `ChangeOrderService`
- [ ] Все новые методы принимают `companyId` и фильтруют данные через него

## Тест-план (минимум)
```bash
# 1. Схема (только BudgetLine)
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'

# 2. TypeScript
pnpm --filter api exec tsc --noEmit

# 3. Новые тесты (адресно)
cd apps/api && npx jest --runInBand src/modules/tech-map/economics/
cd apps/api && npx jest --runInBand src/modules/tech-map/dto/budget-line.dto.spec.ts src/modules/tech-map/dto/tech-map-kpi.dto.spec.ts

# 4. Регрессия tech-map домена
cd apps/api && npx jest --runInBand src/modules/tech-map/

# 5. Итог
pnpm --filter api test -- --passWithNoTests
```

## Что вернуть на ревью
**Новые файлы:**
- `packages/prisma-client/schema.prisma` (diff: BudgetLine + enum BudgetCategory)
- `apps/api/src/modules/tech-map/economics/tech-map-budget.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/economics/tech-map-kpi.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/economics/contract-core.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/economics/recalculation.engine.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/budget-line.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/tech-map-kpi.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/tech-map.module.ts` (diff)

**Логи:** validate, db push, tsc, jest адресный (economics/ + DTO) + регрессия tech-map/

**Особо важно:**
- Доказать детерминизм hash: два вызова `hashContractCore` с одинаковыми данными → одинаковый hex.
- Доказать pure fn `computeKPIs`: тест без `jest.mock('...')` Prisma.
