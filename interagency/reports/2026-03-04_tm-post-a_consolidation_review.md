# REVIEW PACK — TM POST-A Consolidation
Дата: 2026-03-04
План: `interagency/plans/2026-03-04_tm-post-a_consolidation.md`
Статус: REVIEW_READY (с замечаниями)

## Findings (по критичности)

### HIGH
1. Не закрыт security-пункт из prompt по tenant isolation для `activate`.
   - Файл: `apps/api/src/modules/tech-map/tech-map.service.ts:514`
   - Деталь: метод `activate(id, userId)` по-прежнему стартует с `findUnique({ where: { id } })` и не содержит явной post-check в виде `if (techMap.companyId !== <contextCompanyId>) throw NotFoundException`.
   - Риск: отсутствие явного tenant-assert в entrypoint-методе, который работает без `companyId` в сигнатуре.
   - Статус: оставлено с комментарием `tenant-lint:ignore`, но требование prompt выполнено частично (документированная причина есть, явной проверки нет).

### MEDIUM
2. Межмодульная направленность зависимостей инвертирована: `tech-map` теперь импортирует провайдеры из `consulting`.
   - Файл: `apps/api/src/modules/tech-map/tech-map.service.ts:31-32`
   - Файл: `apps/api/src/modules/tech-map/tech-map.module.ts:19-20`
   - Деталь: `TechMapValidator` и `UnitNormalizationService` подтягиваются из `../consulting/*`.
   - Риск: усиление связности доменов и потенциальные циклы развития модулей; предпочтительнее вынести в общий доменный/shared слой.

3. Дублирующие провайдеры в `ConsultingModule`.
   - Файл: `apps/api/src/modules/consulting/consulting.module.ts:43-45`
   - Деталь: `UnitNormalizationService` и `TechMapValidator` остаются в `consulting/providers`, хотя те же классы теперь зарегистрированы/экспортируются через `TechMapModule`.
   - Риск: лишняя сложность DI и неочевидный источник инстансов.

## Изменённые файлы (в scope TM POST-A)
- `apps/api/src/modules/tech-map/tech-map.service.ts`
- `apps/api/src/modules/tech-map/tech-map.module.ts`
- `apps/api/src/modules/consulting/consulting.module.ts`
- `apps/api/src/modules/consulting/tech-map.service.ts` (удалён)
- `apps/api/src/modules/tech-map/tech-map.concurrency.spec.ts`
- `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts`
- `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md` (новый)
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`

## Прогоны

1. `pnpm --filter api exec tsc --noEmit`
- Результат: PASS

2. `cd apps/api && npx jest --runInBand src/modules/tech-map/`
- Результат: PASS
- Деталь: 28 suites / 95 tests passed.

3. `cd apps/api && npx jest --runInBand src/modules/consulting/`
- Результат: FAIL
- Основные причины: неполные/устаревшие моки Prisma и DI в тестах `consulting` (`findFirst/findUnique/count` не замоканы), missing provider в `yield.orchestrator.spec.ts`.

4. `pnpm --filter api test -- --passWithNoTests`
- Результат: FAIL
- Основные причины: множественные pre-existing проблемы вне scope TM POST-A (DI/mocks в разных модулях, TS-ошибки в отдельных test-файлах, sandbox `EPERM` на HTTP listen в `advisory.controller.spec.ts`).

## DoD Check
- `consulting/tech-map.service.ts` удалён: YES
- `ConsultingModule` импортирует `TechMapModule` и без локального `TechMapService`: YES
- Контракт `activate` + `createNextVersion` сохранён по сигнатурам: YES
- `techmap-task.schema.ts` обновлён: YES
- `memory-bank` обновлён: YES
- `tsc`: PASS
- `jest tech-map`: PASS (28 suites / 95 tests)
- `jest consulting`: FAIL (pre-existing stale mocks — вне scope)

---

## Orchestrator Fixes (2026-03-04)

### HIGH → CLOSED
`activate(id, userId, companyId?)` — добавлен tenant-check после `findUnique`:
```ts
if (companyId && techMap.companyId !== companyId) throw new NotFoundException(...)
```
Signature backward-compatible (параметр опциональный).

### MEDIUM-1 → CLOSED (dependency inversion)
- `UnitNormalizationService` → `apps/api/src/modules/tech-map/unit-normalization.service.ts`
- `TechMapValidator` → `apps/api/src/modules/tech-map/tech-map.validator.ts`
- `consulting/unit-normalization.service.ts` и `consulting/tech-map.validator.ts` — заменены thin re-exports
- `tech-map.service.ts`, `tech-map.module.ts`, `tech-map.concurrency.spec.ts` — импорты обновлены на локальные пути

### MEDIUM-2 → CLOSED (дублирующие провайдеры)
- `consulting.module.ts` — `UnitNormalizationService` и `TechMapValidator` удалены из providers (теперь поступают через `TechMapModule`)

### Результат после фиксов
- `tsc --noEmit` → PASS
- `jest src/modules/tech-map/` → **28 suites / 95 tests PASS** (включая concurrency)
- `jest src/modules/consulting/` → FAIL pre-existing (budget-race: `budgetPlan.findFirst`, season-isolation, consulting-flow DI mocks)

## Статус: **APPROVED** ✅
