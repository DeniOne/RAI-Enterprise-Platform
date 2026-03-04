# PROMPT — TM-POST-B: Season → CropZone + Rapeseed → CropVariety
Дата: 2026-03-04  
Статус: active  
Приоритет: P0  
Decision-ID: AG-TM-POST-B-006

## Цель

Выполнить два связанных рефакторинга схемы данных:
1. **Season → CropZone**: сделать `Season` глобальным (без привязки к конкретному `Field`), а `CropZone` — primary-связкой для `TechMap`. Все операционные данные, ранее привязанные к `Season.fieldId`, переходят на `CropZone`.
2. **Rapeseed → CropVariety**: переименовать модель `Rapeseed` → `CropVariety`, добавить поле `cropType: CropType` (enum), обеспечить мультикультурность. Вся бизнес-логика и аудит остаются, меняется только name-space и расширяется модель.

> ⚠️ **ОБЯЗАТЕЛЬНО**: перед запуском убедиться, что сделан `pg_dump` (резервная копия БД). Обе миграции работают с реальными данными.

## Контекст

- `Season` сейчас жёстко привязан к `Field` (`fieldId NOT NULL`) и к `Rapeseed` (`rapeseedId NOT NULL`) — это нарушает GRAND_SYNTHESIS §2, где сезон — это глобальный производственный период хозяйства, а `CropZone` (Field × Season × Crop) является правильной атомарной единицей плана.
- `CropZone` модель уже существует в схеме (TM-1.7) и имеет `fieldId`, `seasonId`, `techMaps`. Сейчас `TechMap` имеет и `seasonId` (legacy), и `cropZoneId` (новый) — пришло время перевести на `cropZoneId` как единственный «источник истины».
- `Rapeseed` охватывает только рапс. Для мультикультурности (пшеница, кукуруза и др.) нужна обобщённая модель `CropVariety` с `cropType` enum.
- Эти два изменения взаимосвязаны: `CropZone.cropType` будет ссылаться на `CropVariety.cropType`.

Опорные документы:
- `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §2 (ER-модель)
- `packages/prisma-client/schema.prisma` — текущая схема
- `apps/api/src/modules/season/` — текущий season-модуль
- `apps/api/src/modules/rapeseed/` — текущий rapeseed-модуль
- `apps/api/src/modules/tech-map/` — потребитель CropZone

## Ограничения (жёстко)

- **Security / tenant isolation**: `companyId` только из trusted context (JWT/session), никогда из payload. Все новые `CropVariety` методы — `companyId` из параметра сервиса.
- **Миграция данных**: все существующие `Season` записи должны остаться рабочими. Если `Season.fieldId` становится nullable — нужен скрипт заполнения `CropZone` из существующих `Season`.
- **Не трогать**: логику FSM (`TechMapStateMachine`), `EvidenceService`, `ChangeOrderService`, `AdaptiveRule` — они работают через `techMapId`, не через `seasonId`.
- **Обратная совместимость**: `TechMap.seasonId` оставить nullable (не удалять) — удаление только в отдельном future промте после верификации. В этом спринте — только deprecation + перенос primary relation на `cropZoneId`.
- **Тесты не ломать**: регрессия `tech-map/` 28 suites / 95 tests должна оставаться PASS.
- **Нет UI-изменений** в scope этого промта.

## Задачи (что сделать)

### Шаг 0: Backup
- [ ] Зафиксировать в плане команду `pg_dump` — кодер **не запускает** миграцию без подтверждения бэкапа от оркестратора

### Шаг 1: Season → глобальный
- [ ] В Prisma-схеме: `Season.fieldId` сделать `String?` (nullable), убрать обязательную связь `Field → Season`
- [ ] `Season.rapeseedId` → `cropVarietyId String?` (после создания `CropVariety` в Steps 3–4)
- [ ] Добавить поле `Season.farmId String?` — привязка сезона к хозяйству (необязательная), без удаления `fieldId`
- [ ] Написать data-migration скрипт: для каждой существующей `Season` с `fieldId` создать (или найти) соответствующий `CropZone` (fieldId + seasonId + crop из rapeseed)
- [ ] Обновить `SeasonService.create` — убрать валидацию `fieldId as required`

### Шаг 2: CropZone становится primary для TechMap
- [ ] `TechMap.cropZoneId` сделать NOT NULL (требует миграции: все `TechMap` без `cropZoneId` должны получить его из `seasonId + fieldId`)
- [ ] `TechMap.seasonId` оставить nullable (deprecation, не удалять)
- [ ] `TechMap.fieldId` — аналогично, nullable (денормализация остаётся для uniqueness index — оставить как есть)
- [ ] Обновить `TechMapService` — при `create` обязательно принимать `cropZoneId`

### Шаг 3: Rapeseed → CropVariety (схема)
- [ ] Создать `enum CropType { RAPESEED, WINTER_WHEAT, SPRING_WHEAT, CORN, SUNFLOWER, BARLEY, OTHER }`
- [ ] Создать `model CropVariety` — все поля из `Rapeseed` + `cropType CropType`, `tenantId` (= companyId)
- [ ] Создать `model CropVarietyHistory` — аналог `RapeseedHistory`
- [ ] **НЕ удалять** `model Rapeseed` и `model RapeseedHistory` — оставить как deprecated (`@@map("rapeseed")`) до отдельного промта
- [ ] `CropZone` добавить поле `cropType CropType` и `cropVarietyId String?`

### Шаг 4: CropVarietyService
- [ ] Создать `apps/api/src/modules/crop-variety/` — новый модуль
- [ ] `CropVarietyService` — методы: `create`, `update` (versioning), `findAll`, `getHistory`, `getVarietiesByCropType`
- [ ] Tenant isolation: все запросы через `companyId` параметр
- [ ] Zod DTOs: `CropVarietyCreateDto`, `CropVarietyResponseDto`
- [ ] Unit-тесты: ≥ 6 тестов (create / update / findAll / tenant isolation / versioning / cropType filter)

### Шаг 5: Миграция данных (скрипт)
- [ ] Скрипт `packages/prisma-client/scripts/migrate-rapeseed-to-cropvariety.ts`:
  - Для каждой `Rapeseed` записи (isLatest = true) создать `CropVariety` с `cropType: RAPESEED`
  - Обновить `Season.cropVarietyId` из `Season.rapeseedId`
  - Логировать количество перенесённых записей

### Шаг 6: Обновить тесты
- [ ] `season.service.spec.ts` — убрать hard requirement на `fieldId`
- [ ] Регрессия `tech-map/`: 28 suites / 95 tests — PASS
- [ ] `tsc --noEmit` — PASS

## Definition of Done (DoD)

- [ ] `npx prisma validate` PASS
- [ ] `npx prisma db push` PASS (без потери данных — нет destructive changes без миграционного скрипта)
- [ ] `pnpm --filter api exec tsc --noEmit` PASS
- [ ] `pnpm --filter api test --testPathPattern="crop-variety|season"` — ≥ 6 unit-тестов PASS
- [ ] Регрессия `tech-map/` — 28 suites ≥ 95 tests PASS
- [ ] `CropVarietyService` покрыт тестами на tenant isolation
- [ ] `TechMap.cropZoneId` is NOT NULL в schema (primary relation)
- [ ] Скрипт data-migration задокументирован и проверен на test-данных
- [ ] `Rapeseed` / `RapeseedHistory` моделей — **не удалены** (deprecated, остаются)

## Тест-план (минимум)

- [ ] `pnpm --filter api test --testPathPattern="crop-variety"` — новые unit-тесты
- [ ] `pnpm --filter api test --testPathPattern="season"` — регрессия season
- [ ] `pnpm --filter api test --testPathPattern="tech-map"` — полная регрессия (28 suites)
- [ ] `pnpm --filter api exec tsc --noEmit` — нет ошибок TypeScript
- [ ] `npx prisma validate && npx prisma db push --preview-feature` — схема валидна
- [ ] Ручная проверка: создать `CropVariety` через сервис → получить список → проверить tenant isolation

## Что вернуть на ревью

- `packages/prisma-client/schema.prisma` — diff изменений Season / CropZone / CropVariety
- `apps/api/src/modules/crop-variety/` — полный новый модуль
- `packages/prisma-client/scripts/migrate-rapeseed-to-cropvariety.ts` — скрипт миграции
- Обновлённые: `season.service.ts`, `tech-map.service.ts`
- Логи тестов: `crop-variety`, `season`, `tech-map` suites
- `tsc --noEmit` output
