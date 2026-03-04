# PROMPT — TechMap Sprint TM-4: Adaptive Rules + Regionalization
Дата: 2026-03-04
Статус: active
Приоритет: P1

## Цель
Имплементировать второй адаптивный контур техкарты:
1. **`AdaptiveRule`** — машиночитаемые правила-триггеры (WEATHER / PHENOLOGY / OBSERVATION / NDVI / PRICE), которые автоматически генерируют ChangeOrder при срабатывании условий.
2. **`TriggerEvaluationService`** — движок проверки правил; интегрируется с `ChangeOrderService` из TM-3.
3. **`RegionProfileService`** — сервис для работы с существующей моделью `RegionProfile` (из TM-1): расчёт окон посева, базового набора операций по культуре, GDD-расчётам.
4. **`HybridPhenologyModel`** — Prisma-модель справочника кривых GDD→BBCH для конкретных гибридов; метод `predictBBCH`.

**Предусловие:** TM-3 CLOSED — существуют `ChangeOrderService`, `EvidenceService`, `Evidence`, `ChangeOrder`, `Approval`, `RegionProfile` (из TM-1).

## Контекст
- Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §5 (Регионализация и финансы)
- Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md` (Sprint TM-4)
- Decision-ID будет зарегистрирован Orchestrator при акцепте плана

**Ключевые цитаты из GRAND_SYNTHESIS §5:**

### Влияние RegionProfile на расчёт (§5.1)
- `climate_type` + `avg_gdd_season` → скорость прохождения BBCH-фаз
- `precipitation_index` + `drought_risk_index` → стратегия питания и защиты
- `frost_risk_index` → выбор типа рапса (озимый/яровой), глубина и сроки посева
- `major_diseases` / `major_pests` → базовый набор профилактических операций

### 3 эталонных профиля (§5.2)
| Параметр | MARITIME_HUMID | STEPPE_DRY | CONTINENTAL_COLD |
|----------|---------------|------------|-----------------|
| Тип рапса | Озимый | Озимый | **Яровой** |
| Норма высева | Снижена | Снижена | **Повышена** |
| Десикация | Необязательна | По ситуации | **ОБЯЗАТЕЛЬНА** |
| Главный риск | Перерастание + грибки | Влага | Короткий безморозный период |

### Протокол адаптивного управления (§4.6 + §5.3)
```
Триггер (WEATHER/NDVI/OBSERVATION/PHENOLOGY/PRICE)
    │─── condition: { operator, threshold, value }
    ▼
evaluateTriggers(techMapId, context)
    │─── правило сработало?
    ▼
applyTriggeredRule(ruleId)
    │─── ChangeOrderCreateDto { changeType, reason, diffPayload, deltaCostRub }
    │─── ChangeOrderService.createChangeOrder() → ChangeOrder.DRAFT
    │─── ChangeOrderService.routeForApproval() → Approval[]
```

## Ограничения (жёстко)
- **Tenant isolation**: все новые модели и сервисы с `companyId`; фильтрация только через него
- **Scope**: только `apps/api/src/modules/tech-map/` + `packages/prisma-client/schema.prisma`
- **Не трогать**: `apps/web`, API-контроллеры, FSM, домены вне TechMap, TM-1/TM-2/TM-3 поля
- **Pure evaluation**: `TriggerEvaluationService` — не мутирует данные напрямую; мутации — только через `ChangeOrderService`

## Задачи

### 1. Новая Prisma-модель: `AdaptiveRule`

```prisma
enum TriggerType {
  WEATHER
  NDVI
  OBSERVATION
  PHENOLOGY
  PRICE
}

enum TriggerOperator {
  GT      // >
  GTE     // >=
  LT      // <
  LTE     // <=
  EQ      // ==
  NOT_EQ  // !=
}

model AdaptiveRule {
  id                   String          @id @default(cuid())
  techMapId            String
  techMap              TechMap         @relation(fields: [techMapId], references: [id])
  name                 String
  description          String?
  triggerType          TriggerType
  // condition: { parameter: string; operator: TriggerOperator; threshold: number; unit?: string }
  condition            Json
  // affectedOperationIds: string[] — список ID операций, которые правило может изменить
  affectedOperationIds Json
  // changeTemplate: { changeType, reasonTemplate, deltaRatePercent? }
  changeTemplate       Json
  requiresApprovalRole String?         // ApproverRole enum value или null (авто)
  isActive             Boolean         @default(true)
  lastEvaluatedAt      DateTime?
  companyId            String
  company              Company         @relation(fields: [companyId], references: [id])
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  @@index([techMapId])
  @@index([companyId])
  @@index([triggerType])
  @@map("adaptive_rules")
}
```

- Добавить `adaptiveRules AdaptiveRule[]` в `TechMap` и `Company`

### 2. Новая Prisma-модель: `HybridPhenologyModel`

```prisma
model HybridPhenologyModel {
  id          String   @id @default(cuid())
  hybridName  String
  cropType    String   // 'RAPESEED' | 'WHEAT' | etc.
  // gddToStage: { [bbchCode: string]: number } — GDD, нужный для достижения фазы
  // Пример: { "BBCH_00": 0, "BBCH_09": 80, "BBCH_51": 600, "BBCH_89": 1450 }
  gddToStage  Json
  baseTemp    Float    @default(5.0)   // базовая температура для расчёта GDD (°C)
  source      String?  // производитель / источник данных
  companyId   String?  // null = глобальный справочник
  company     Company? @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([hybridName])
  @@index([cropType])
  @@map("hybrid_phenology_models")
}
```

- Добавить `hybridPhenologyModels HybridPhenologyModel[]` в `Company` (опционально)

### 3. Zod DTO новых моделей
Файлы в `apps/api/src/modules/tech-map/dto/`:
- `adaptive-rule.dto.ts` — `AdaptiveRuleCreateDto`, `AdaptiveRuleResponseDto`
  - `condition`: `z.object({ parameter: z.string(), operator: z.nativeEnum(TriggerOperator), threshold: z.number(), unit: z.string().optional() })`
  - `affectedOperationIds`: `z.array(z.string().cuid())`
  - `changeTemplate`: `z.record(z.unknown())`
- `hybrid-phenology.dto.ts` — `HybridPhenologyCreateDto`
  - `gddToStage`: `z.record(z.string(), z.number().nonnegative())`
  - `baseTemp`: `z.number().min(0).max(15)`

С unit-тестами: `*.dto.spec.ts` — по 2 теста каждый (happy path + validation error).

### 4. `TriggerEvaluationService`
Файл: `apps/api/src/modules/tech-map/adaptive-rules/trigger-evaluation.service.ts`

```typescript
export interface EvaluationContext {
  weatherTempC?: number         // текущая температура
  weatherPrecipMm?: number      // осадки за последние сутки
  ndviValue?: number            // NDVI (0–1)
  gddAccumulated?: number       // накопленный GDD
  currentBBCH?: number          // текущая фаза по BBCH
  priceRubT?: number           // цена товарного рапса, руб/т
  observationType?: string      // тип скаутингового наблюдения
  observationValue?: number     // значение (количество вредителей и т.д.)
}

@Injectable()
export class TriggerEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly changeOrderService: ChangeOrderService,
  ) {}

  // Загрузить активные правила для TechMap и оценить каждое
  // Возвращает список сработавших правил
  async evaluateTriggers(
    techMapId: string,
    companyId: string,
    context: EvaluationContext,
  ): Promise<{ triggeredRules: AdaptiveRule[]; createdChangeOrders: ChangeOrder[] }>

  // Применить одно конкретное правило вручную → создать ChangeOrder + запустить routing
  async applyTriggeredRule(
    ruleId: string,
    companyId: string,
    context: EvaluationContext,
  ): Promise<ChangeOrder>

  // Проверить одно условие правила по контексту
  // Pure function (не зависит от state)
  evaluateCondition(
    condition: { parameter: string; operator: TriggerOperator; threshold: number },
    context: EvaluationContext,
  ): boolean
}
```

**Логика `evaluateCondition` (pure function):**
```typescript
const value = context[condition.parameter as keyof EvaluationContext]
if (value == null) return false
switch (condition.operator) {
  case 'GT': return value > condition.threshold
  case 'GTE': return value >= condition.threshold
  case 'LT': return value < condition.threshold
  case 'LTE': return value <= condition.threshold
  case 'EQ': return value === condition.threshold
  case 'NOT_EQ': return value !== condition.threshold
}
```

**Логика `evaluateTriggers`:**
1. Загрузить `AdaptiveRule[]` где `techMapId`, `companyId`, `isActive = true`
2. Для каждого правила: парсить `condition` из Json, вызвать `evaluateCondition(condition, context)`
3. Если `true`: вызвать `applyTriggeredRule(ruleId, companyId, context)`
4. Обновить `lastEvaluatedAt = now()` для каждого проверенного правила
5. Вернуть `{ triggeredRules, createdChangeOrders }`

**Логика `applyTriggeredRule`:**
1. Загрузить AdaptiveRule + TechMap по `ruleId` и `companyId`
2. Парсить `changeTemplate` → `{ changeType, reasonTemplate }`, подставить данные из context
3. Вызвать `ChangeOrderService.createChangeOrder(techMapId, dto, companyId)`
4. Вызвать `ChangeOrderService.routeForApproval(changeOrder.id, companyId)`
5. Вернуть созданный ChangeOrder

**Unit-тесты** (`trigger-evaluation.service.spec.ts`):
- [ ] `evaluateCondition` GT: value > threshold → true
- [ ] `evaluateCondition` GT: value ≤ threshold → false
- [ ] `evaluateCondition`: context не содержит parameter → false
- [ ] `evaluateTriggers`: правило с `isActive = false` → не срабатывает
- [ ] `evaluateTriggers`: условие выполнено → createChangeOrder вызван с правильными params
- [ ] `applyTriggeredRule`: созданный ChangeOrder в статусе `PENDING_APPROVAL`

### 5. `RegionProfileService`
Файл: `apps/api/src/modules/tech-map/adaptive-rules/region-profile.service.ts`

```typescript
@Injectable()
export class RegionProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // Найти RegionProfile, связанный с полем (через Field → CropZone → TechMap.regionProfileId или Field.regionProfileId)
  async getProfileForField(
    fieldId: string,
    companyId: string,
  ): Promise<RegionProfile | null>

  // Рассчитать оптимальный диапазон дат посева
  // Алгоритм: дата перехода среднесуточной T через +10°C минус X дней (по climate_type)
  // Возвращает { earliestDate: Date; latestDate: Date; windowDays: number }
  calculateSowingWindow(
    profile: RegionProfile,
    targetGDD: number,
    referenceDate: Date,
  ): { earliestDate: Date; latestDate: Date; windowDays: number }

  // Сформировать рекомендованный базовый набор типов операций для региона + культуры
  suggestOperationTypes(
    profile: RegionProfile,
    cropType: string,
  ): Array<{ operationType: string; isMandatory: boolean; rationale: string }>
}
```

**Логика `calculateSowingWindow`** (по §5.2):
```typescript
// GDD_offset: сколько GDD накапливается до оптимального посева
const offsets = {
  MARITIME_HUMID: { gddOffset: 0, windowDays: 14, reverse: true },  // вычитаем от перехода T>5°C
  STEPPE_DRY:     { gddOffset: 10, windowDays: 10, reverse: false }, // триггер: осадки >10мм
  CONTINENTAL_COLD: { gddOffset: 0, windowDays: 7, reverse: false }, // прогрев почвы >5°C
}
const offset = offsets[profile.climateType] ?? { gddOffset: 0, windowDays: 10, reverse: false }
const daysToSowing = targetGDD / (profile.gddBaseTempC ?? 5)
const earliest = new Date(referenceDate.getTime() + daysToSowing * 86400000)
const latest   = new Date(earliest.getTime() + offset.windowDays * 86400000)
return { earliestDate: earliest, latestDate: latest, windowDays: offset.windowDays }
```

**Логика `suggestOperationTypes`** (по §5.1 и эталонной таблице §5.2):
- Базовые операции для любого профиля: TILLAGE, SEEDING, HERBICIDE_APP, HARVEST
- CONTINENTAL_COLD добавляет: SEED_TREATMENT (обязательно), DESICCATION (обязательно)
- MARITIME_HUMID добавляет: FUNGICIDE_APP (2–3 обработки → 2 обязательных)
- STEPPE_DRY добавляет: SOIL_MOISTURE_CHECK (необязательно)

**Unit-тесты** (`region-profile.service.spec.ts`):
- [ ] `calculateSowingWindow` MARITIME_HUMID: windowDays = 14
- [ ] `calculateSowingWindow` CONTINENTAL_COLD: windowDays = 7
- [ ] `suggestOperationTypes` CONTINENTAL_COLD: включает DESICCATION с `isMandatory: true`
- [ ] `suggestOperationTypes` MARITIME_HUMID: включает минимум 2 FUNGICIDE_APP mandatory

### 6. `HybridPhenologyService`
Файл: `apps/api/src/modules/tech-map/adaptive-rules/hybrid-phenology.service.ts`

```typescript
@Injectable()
export class HybridPhenologyService {
  constructor(private readonly prisma: PrismaService) {}

  // Предсказать текущую BBCH-фазу по накопленному GDD и гибриду
  async predictBBCH(
    hybridName: string,
    gddAccumulated: number,
    companyId: string,
  ): Promise<{ bbchCode: string; bbchValue: number; nextStage: string | null; gddToNextStage: number | null }>

  // Получить или создать HybridPhenologyModel
  async getOrCreateModel(
    hybridName: string,
    cropType: string,
    companyId: string | null,
  ): Promise<HybridPhenologyModel>
}
```

**Логика `predictBBCH`:**
1. Найти модель по `hybridName`; если нет — `null`
2. Парсить `gddToStage`: `{ 'BBCH_00': 0, 'BBCH_09': 80, ... }`
3. Найти максимальный достигнутый stage: `Object.entries(gddToStage).filter(([, gdd]) => gdd <= accumulated)`
4. Вернуть текущую фазу и следующую с дельтой GDD

**Unit-тесты** (`hybrid-phenology.service.spec.ts`):
- [ ] `predictBBCH`: gdd=0 → BBCH_00
- [ ] `predictBBCH`: gdd=500 → правильная промежуточная фаза
- [ ] `predictBBCH`: gdd > max → последняя фаза, nextStage=null

### 7. Создать поддиректорию
```
apps/api/src/modules/tech-map/adaptive-rules/
```

### 8. Регистрация в `TechMapModule`
```typescript
providers: [
  TechMapService,
  TechMapStateMachine,
  DAGValidationService,       // TM-2
  TechMapValidationEngine,    // TM-2
  TankMixCompatibilityService,// TM-2
  EvidenceService,            // TM-3
  ChangeOrderService,         // TM-3
  TriggerEvaluationService,   // NEW TM-4
  RegionProfileService,       // NEW TM-4
  HybridPhenologyService,     // NEW TM-4
],
exports: [TechMapService, EvidenceService, ChangeOrderService, TriggerEvaluationService],
```

## Definition of Done (DoD)
- [ ] `npx prisma validate` — PASS
- [ ] `npx prisma db push` — PASS
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS
- [ ] Новые unit-тесты: ≥ 17 суммарно:
  - TriggerEvaluationService: ≥ 6 тестов
  - RegionProfileService: ≥ 4 теста
  - HybridPhenologyService: ≥ 3 теста
  - Zod DTO: ≥ 4 теста (2 файла × 2)
- [ ] Все новые модели: `companyId` + `@@index([companyId])`
- [ ] `evaluateCondition` — pure function, отдельно тестируется без моков
- [ ] `TriggerEvaluationService` не мутирует данные напрямую — только через ChangeOrderService

## Тест-план (минимум)
```bash
# 1. Схема
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma validate'
bash -lc 'set -a; source /root/RAI_EP/.env; cd /root/RAI_EP/packages/prisma-client && npx prisma db push'

# 2. TypeScript
pnpm --filter api exec tsc --noEmit

# 3. Новые тесты (адресно)
cd apps/api && npx jest --runInBand src/modules/tech-map/adaptive-rules/
cd apps/api && npx jest --runInBand src/modules/tech-map/dto/adaptive-rule.dto.spec.ts src/modules/tech-map/dto/hybrid-phenology.dto.spec.ts

# 4. Регрессия существующих tech-map тестов
cd apps/api && npx jest --runInBand src/modules/tech-map/

# 5. Итог
pnpm --filter api test -- --passWithNoTests
```

## Что вернуть на ревью
**Новые файлы:**
- `packages/prisma-client/schema.prisma` (diff: AdaptiveRule, HybridPhenologyModel, enums)
- `apps/api/src/modules/tech-map/adaptive-rules/trigger-evaluation.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/region-profile.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/adaptive-rules/hybrid-phenology.service.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/adaptive-rule.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.ts` + `.spec.ts`
- `apps/api/src/modules/tech-map/tech-map.module.ts` (diff)

**Логи:** prisma validate, db push, tsc, jest адресный + регрессия tech-map/
