# PROMPT — TechMap POST-A: Консолидация TechMapService + Документация
Дата: 2026-03-04
Статус: active
Приоритет: P1
Охватывает: TM-POST.1 + TM-POST.5

## Цель
1. **TM-POST.1** — устранить дублирование `TechMapService`: объединить consulting-вариант (193 строки, методы `activate` + `createNextVersion`) в доменный сервис `apps/api/src/modules/tech-map/tech-map.service.ts`, после чего `ConsultingModule` импортирует `TechMapModule` и использует единый сервис.
2. **TM-POST.5** — обновить документацию: `techmap-task.schema.ts`, обновить `memory-bank`.

**Предусловие:** TM-5 CLOSED (AG-TM-EC-005), все 95 тестов зелёные.

## Контекст: два сервиса

### `apps/api/src/modules/consulting/tech-map.service.ts` (193 строки)
Методы, которые нужно **перенести** в `tech-map/tech-map.service.ts`:
- `activate(id, userId)` — фазовый snapshot + иммутабельность, использует `TechMapValidator` и `UnitNormalizationService`
- `createNextVersion(sourceId, userId)` — клонирование TechMap для нового сезона

Зависимости: `PrismaService`, `TechMapValidator`, `TechMapValidator` (уже в consulting), `UnitNormalizationService`.

### `apps/api/src/modules/tech-map/tech-map.service.ts` (504 строки)
Уже содержит: `generateMap`, `createDraftStub`, `transitionStatus`, `updateDraft`, `findAll`, `findOne`, `findBySeason`, `validateTechMap`, `validateDAG`, `getCalculationContext`.

## Ограничения (жёстко)
- **Нельзя удалять** `consulting/tech-map.service.ts` до тех пор, пока `ConsultingModule` не импортирует `TechMapModule` и не использует единый сервис — иначе сломается DI
- **Не трогать** FSM, схему Prisma, бизнес-логику методов — только перемещение
- **Нельзя** переименовывать класс `TechMapService` в consulting — это сломает DI. Нужен `re-export` или удаление с заменой провайдера
- **Tenant isolation** — при переносе `activate` и `createNextVersion` убедиться, что `companyId` добавлен в запросы (сейчас в consulting-версии `findUnique({ where: { id } })` без `companyId` — это lint-ignore; при переносе исправить или явно задокументировать причину)

## Задачи

### 1. Аудит перед слиянием
- Прочитать полный `consulting/tech-map.service.ts` и проверить все зависимости (`TechMapValidator`, `UnitNormalizationService`)
- Убедиться что `TechMapValidator` и `UnitNormalizationService` уже доступны или будут зарегистрированы в `TechMapModule`
- Проверить все места в `consulting/` где импортируется `TechMapService` (кроме `consulting.module.ts`)

### 2. Перенос методов в `tech-map/tech-map.service.ts`
- Добавить зависимости `TechMapValidator` и `UnitNormalizationService` в конструктор `TechMapService` (если ещё нет)
- Перенести методы `activate(id, userId)` и `createNextVersion(sourceId, userId)` дословно, сохранив логику
- Исправить `tenant-lint:ignore`: в `activate` после `findUnique({ id })` добавить проверку `if (techMap.companyId !== companyId)` — NotFoundException — или принять как есть с документированным обоснованием
- Добавить `TechMapValidator` и `UnitNormalizationService` в providers и exports `TechMapModule`

### 3. Обновление `ConsultingModule`
- Добавить `TechMapModule` в `imports` в `consulting.module.ts`
- Удалить `TechMapService` из `providers` в `consulting.module.ts` (теперь он приходит через `TechMapModule`)
- Обновить импорт в consulting-контроллерах/сервисах с `../consulting/tech-map.service` → `../tech-map/tech-map.service` (или убедиться что DI работает без изменения импортных путей через токен)
- Удалить файл `apps/api/src/modules/consulting/tech-map.service.ts` (или оставить как re-export обёртку если есть зависимые тесты)

### 4. Тесты
- Прогнать `pnpm --filter api exec tsc --noEmit` — PASS
- Прогнать `cd apps/api && npx jest --runInBand src/modules/tech-map/` — PASS (≥95 тестов)
- Прогнать `cd apps/api && npx jest --runInBand src/modules/consulting/` — PASS
- Если регрессия сломалась — исправить, зафиксировать в отчёте

### 5. TM-POST.5: Документация
- Обновить `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` — добавить новые модели из TM-4..TM-5 (`AdaptiveRule`, `HybridPhenologyModel`, `BudgetLine`, `ContractCorePayload`)
- Добавить краткий API-список в `docs/` — публичные методы новых сервисов (TM-4 + TM-5) в виде комментариев или отдельного `.md`
- Обновить `memory-bank/` — зафиксировать факт слияния TechMapService

## Definition of Done (DoD)
- [ ] `consulting/tech-map.service.ts` либо удалён, либо является тонкой re-export обёрткой
- [ ] `ConsultingModule` импортирует `TechMapModule` и не содержит локального `TechMapService` в providers
- [ ] Методы `activate` + `createNextVersion` работают без изменения контракта (сигнатура не меняется)
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS
- [ ] `jest src/modules/tech-map/` — ≥95 тестов PASS
- [ ] `jest src/modules/consulting/` — PASS (без регрессий)
- [ ] `techmap-task.schema.ts` обновлён с моделями TM-4..TM-5
- [ ] `memory-bank/` обновлён

## Тест-план
```bash
# 1. TypeScript
pnpm --filter api exec tsc --noEmit

# 2. tech-map домен
cd apps/api && npx jest --runInBand src/modules/tech-map/

# 3. consulting домен
cd apps/api && npx jest --runInBand src/modules/consulting/

# 4. Полный прогон
pnpm --filter api test -- --passWithNoTests
```

## Что вернуть на ревью
**Изменённые файлы:**
- `apps/api/src/modules/tech-map/tech-map.service.ts` (+ activate, createNextVersion)
- `apps/api/src/modules/tech-map/tech-map.module.ts` (+ TechMapValidator, UnitNormalizationService в providers/exports)
- `apps/api/src/modules/consulting/consulting.module.ts` (imports TechMapModule)
- `apps/api/src/modules/consulting/tech-map.service.ts` (удалён или re-export)
- `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` (diff: TM-4..TM-5 модели)

**Логи:** tsc, jest tech-map/, jest consulting/, полный прогон
