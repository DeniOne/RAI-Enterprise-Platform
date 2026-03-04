# ПЛАН — TM-POST-B: Season → CropZone + Rapeseed → CropVariety
Дата: 2026-03-04
Статус: **DRAFT**
Decision-ID: AG-TM-POST-B-006

## Результат
- Подготовленный к исполнению план безопасного рефакторинга схемы и сервисов для перевода `Season` в глобальный период и `CropZone` в primary relation для `TechMap`.
- Подготовленный план введения мультикультурной модели `CropVariety` без удаления legacy `Rapeseed`/`RapeseedHistory`.
- Подготовленный план миграции данных с обязательным backup-gate и проверкой tenant isolation (`companyId` только из trusted context).

## Границы
- Входит: `packages/prisma-client/schema.prisma` (Season, CropZone, TechMap, новые CropType/CropVariety/CropVarietyHistory, legacy deprecation без удаления).
- Входит: новый модуль `apps/api/src/modules/crop-variety/*` (service + DTO + tests).
- Входит: обновления `apps/api/src/modules/season/*` и `apps/api/src/modules/tech-map/*` только в пределах перехода на `cropZoneId`.
- Входит: data-migration скрипт `packages/prisma-client/scripts/migrate-rapeseed-to-cropvariety.ts`.
- Входит: тесты `crop-variety`, `season`, регрессия `tech-map`, `tsc`, Prisma validate/push.
- Не входит: изменения UI, FSM-логики, `EvidenceService`, `ChangeOrderService`, `AdaptiveRule`.
- Не входит: удаление `TechMap.seasonId` и удаление моделей `Rapeseed*` (только deprecation в этом спринте).

## Предварительные проверки
- FOUNDATION и security-проверки пройдены для стадии планирования: `CANON.md`, `SECURITY_CANON.md`, language policy.
- Decision-ID указан в prompt: `AG-TM-POST-B-006`; реализация допустима только после канонического токена `ACCEPTED`.
- Зафиксирован обязательный blocking-gate: до любых Prisma-миграций требуется подтверждённый `pg_dump`.
- Tenant-инвариант: `companyId` не берётся из payload ни в `CropVarietyService`, ни в миграционных бизнес-операциях.

## Риски
- Data-loss риск при DDL без backup или при ошибочной миграции `Season`/`TechMap` связей.
- Migration consistency риск: `TechMap` записи без `cropZoneId` требуют корректного бэктрилла из `seasonId + fieldId`.
- Domain coupling риск: одновременный переход Season/CropZone/CropVariety может вызвать каскадные ошибки в сервисах и тестовых моках.
- Tenant/security риск: перенос сервисов может непреднамеренно ослабить фильтрацию по `companyId`.
- Legacy-compat риск: прежние вызовы rapeseed-модуля и связанные тесты должны остаться рабочими до полного вывода legacy.

## План работ
- [ ] Подтвердить backup-gate: зафиксировать и выполнить `pg_dump` перед DDL; без подтверждения backup миграции не запускать.
- [ ] Обновить Prisma-схему для `Season`: `fieldId` → nullable, добавить `farmId String?`, подготовить переход `rapeseedId` → `cropVarietyId String?` с сохранением совместимости.
- [ ] Обновить Prisma-схему для `CropZone`: добавить `cropType CropType` и `cropVarietyId String?`; проверить связи с `TechMap`.
- [ ] Обновить Prisma-схему для `TechMap`: `cropZoneId` сделать обязательным, `seasonId` оставить nullable (deprecation), `fieldId` оставить nullable/денормализацию по текущему контракту.
- [ ] Ввести `enum CropType` и новые модели `CropVariety`, `CropVarietyHistory`; legacy `Rapeseed`, `RapeseedHistory` оставить, пометив как deprecated в документации/комментариях.
- [ ] Реализовать скрипт миграции данных `migrate-rapeseed-to-cropvariety.ts`:
- Для `Rapeseed(isLatest=true)` создать `CropVariety(cropType=RAPESEED)`.
- Обновить `Season.cropVarietyId` на основе `Season.rapeseedId`.
- Логировать количество переносов и пропусков.
- [ ] Реализовать/обновить скрипт backfill для `CropZone`:
- Для каждой legacy `Season` с `fieldId` создать/найти `CropZone(fieldId, seasonId, cropType, cropVarietyId)`.
- Для `TechMap` без `cropZoneId` проставить `cropZoneId` из `seasonId + fieldId (+ companyId)` с валидацией tenant scope.
- [ ] Обновить `SeasonService.create`: убрать обязательность `fieldId`, сохранить tenant isolation.
- [ ] Обновить `TechMapService.create`/draft pathways: `cropZoneId` обязателен как primary relation; legacy поля поддерживать как deprecated.
- [ ] Создать модуль `crop-variety` с сервисом `create/update/findAll/getHistory/getVarietiesByCropType` и Zod DTO.
- [ ] Добавить unit-тесты `crop-variety` (минимум 6): create, update versioning, findAll, tenant isolation, history, filter by cropType.
- [ ] Обновить/адаптировать `season` тесты под nullable `fieldId`.
- [ ] Выполнить проверки: `prisma validate`, `prisma db push`, `tsc`, targeted jest (`crop-variety`, `season`, `tech-map`).
- [ ] Обновить docs/memory-bank по факту выполненной миграции и deprecation-стратегии legacy моделей.

## DoD
- [ ] Backup подтверждён и зафиксирован до миграции (`pg_dump`).
- [ ] `npx prisma validate` PASS.
- [ ] `npx prisma db push` PASS без потери данных.
- [ ] `TechMap.cropZoneId` обязательный в схеме.
- [ ] `TechMap.seasonId` сохранён nullable как deprecated.
- [ ] `CropVariety`/`CropVarietyHistory` введены; `Rapeseed*` не удалены.
- [ ] Data-migration скрипт создан и проверен на тестовых данных.
- [ ] `pnpm --filter api exec tsc --noEmit` PASS.
- [ ] `pnpm --filter api test --testPathPattern="crop-variety|season"` PASS (включая ≥6 тестов crop-variety).
- [ ] `pnpm --filter api test --testPathPattern="tech-map"` PASS (не ниже 28 suites / 95 tests).
- [ ] Tenant isolation подтверждён в `CropVarietyService` тестами.

