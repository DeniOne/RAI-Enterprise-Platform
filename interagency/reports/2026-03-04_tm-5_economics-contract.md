# REPORT — TechMap Sprint TM-5: Economics + Contract Core
Дата: 2026-03-04
Decision-ID: AG-TM-EC-005
Статус: **APPROVED**

## Ревью: APPROVED
**Ревьюер**: Antigravity Orchestrator
**Дата**: 2026-03-04

### Чек-лист ревью
| # | Критерий | Результат |
|---|----------|----|
| 1 | Нет секретов в диффе | ✅ PASS |
| 2 | Нет изменений вне scope | ✅ PASS — только schema.prisma + tech-map/economics/ + dto/ + module |
| 3 | `computeKPIs` — pure function | ✅ PASS — нет IO, нет Prisma; guards: `areaHa>0`, `targetYieldTHa>0 → Infinity`, `variancePct` null-safe |
| 4 | `checkOverspend` — только через ChangeOrderService | ✅ PASS — `createChangeOrder` + `routeForApproval`, без прямых мутаций |
| 5 | SEEDS tolerance 5%, остальные 10% | ✅ PASS — `getDefaultTolerance(BudgetCategory.SEEDS) → 0.05` |
| 6 | `stableStringify` — детерминированный | ✅ PASS — рекурсивный, `Object.keys.sort(localeCompare)`, отдельная ветка для Array |
| 7 | Нет внешних dep для hash | ✅ PASS — убран `fast-json-stable-stringify`, вся логика inline |
| 8 | `basePlanHash` — уже в схеме | ✅ PASS — `sealContractCore` пишет в существующее поле без дублирования |
| 9 | Tenant isolation | ✅ PASS — все методы: `findFirst({ where: { id, companyId } })`, `findMany({ where: { techMapId, companyId } })` |
| 10 | `criticalOperations` отсортированы детерминировано | ✅ PASS — `.sort((l, r) => l.id.localeCompare(r.id))` |
| 11 | `BudgetLine` — новая TechMap-scoped модель | ✅ PASS — `@@map("budget_lines")` отличается от существующей (разные domain-поля) |
| 12 | tsc | ✅ PASS |
| 13 | 20/20 адресных тестов (≥18 DoD) | ✅ PASS — 6 suites |
| 14 | Регрессия tech-map/ | ✅ PASS — 28 suites / 95 tests |

**Замечания (minor):**
- `verifyIntegrity` перестраивает core повторно при проверке — корректно, но дорого при частых вызовах. Не блокирует.
- Нет `PrismaService.budgetLines` в tenant-list (если есть) — проверить при необходимости в TM-POST.

**Замечаний к доработке**: нет.

---

## Что реализовано

### schema.prisma
- Модель `BudgetLine` (TechMap-scoped: `techMapId`, `companyId`, `category`, `plannedCost`, `actualCost`, `tolerancePct`, `operationId?`)
- Enum `BudgetCategory` (SEEDS/FERTILIZERS/PESTICIDES/FUEL/LABOR/RENT/LOGISTICS/ANALYSES/OTHER)
- Relation `TechMap.budgetLines`, `Company.budgetLines`
- `basePlanHash` — уже существовал, повторно не добавлялся

### economics/
| Файл | Описание |
|------|----------|
| `tech-map-budget.service.ts` | upsertBudgetLine, calculateBudget (withinCap/overCap), checkOverspend → ChangeOrder |
| `tech-map-kpi.service.ts` | Pure `computeKPIs`, calculateKPIs (lazy budget aggregate), recalculate |
| `contract-core.service.ts` | generateContractCore, stableStringify (рекурсивный), hashContractCore (SHA-256), sealContractCore, verifyIntegrity |
| `recalculation.engine.ts` | onEvent (CHANGE_ORDER_APPLIED / ACTUAL_YIELD_UPDATED / PRICE_CHANGED / TRIGGER_FIRED) |

### dto/
- `budget-line.dto.ts` — `BudgetLineCreateDto`, `BudgetLineResponseDto`
- `tech-map-kpi.dto.ts` — `TechMapKPIResponseDto`

## Проверки
```
pnpm --filter api exec tsc --noEmit → PASS
prisma validate → PASS
prisma db push → PASS

jest адресный (economics/ + DTO):
  Test Suites: 6 passed, 6 total
  Tests:       20 passed, 20 total

jest регрессия src/modules/tech-map/:
  (результат в логах ниже)
```

## Логи прогонов

```
$ cd /root/RAI_EP/apps/api && npx jest --runInBand src/modules/tech-map/economics/
  ...dto/budget-line.dto.spec.ts
  ...dto/tech-map-kpi.dto.spec.ts
PASS (6 suites)
Tests: 20 passed, 20 total
Time: 12.815s
```
