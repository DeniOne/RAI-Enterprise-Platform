# ПЛАН — TM POST-A: Консолидация `TechMapService` + Документация
Дата: 2026-03-04
Статус: **ACCEPTED**
Decision-ID: AG-TM-POST-A-001

## Результат
- Подготовленный к исполнению план переноса методов `activate` и `createNextVersion` из `consulting/tech-map.service.ts` в единый доменный сервис `tech-map/tech-map.service.ts` без изменения контрактов.
- Подготовленный план перевода `ConsultingModule` на импорт `TechMapModule` с устранением локального провайдера `TechMapService` в `consulting`.
- Подготовленный план документирования TM-POST.5: обновление `techmap-task.schema.ts`, фиксация API-слоя TM-4..TM-5 и запись в `memory-bank`.

## Границы
- Входит: аудит `apps/api/src/modules/consulting/tech-map.service.ts`, `apps/api/src/modules/tech-map/tech-map.service.ts`, `consulting.module.ts`, `tech-map.module.ts`, всех импортов `TechMapService` в `consulting`.
- Входит: дословный перенос `activate` и `createNextVersion` в `apps/api/src/modules/tech-map/tech-map.service.ts` с сохранением сигнатур и текущей бизнес-логики.
- Входит: tenant-проверка для `activate` на `companyId` по `SECURITY_CANON.md` и `ADR-013`, если текущий путь использует выборку по `id` без tenant-фильтра.
- Входит: обновление `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts`, добавление краткого API-списка TM-4..TM-5 в `docs/`, обновление `memory-bank/*`.
- Входит: верификация `pnpm --filter api exec tsc --noEmit`, `jest` для `tech-map/` и `consulting/`, плюс полный прогон `pnpm --filter api test -- --passWithNoTests`.
- Не входит: изменения Prisma-схемы, FSM, API-контрактов, UI, а также произвольный рефакторинг вне прямого scope TM-POST.1/TM-POST.5.

## Предварительные проверки
- Проверены `CANON.md`, `ARCHITECTURAL_AXIOMS.md`, `FORBIDDEN.md`, `SECURITY_CANON.md`, `memory-bank/LANGUAGE_POLICY.md`; режим `PLAN-ONLY` соблюдён.
- В репозитории нет файла `DECISIONS.log`; в качестве журнала решений используется `docs/01_ARCHITECTURE/DECISIONS/RAI_DECISION_LOG.md`.
- В журнале решений присутствует релевантный `ADR-013: Zero Trust Tenant Isolation` со статусом `ACCEPTED`, поэтому перенос с tenant-защитой обязателен.
- Основной риск зафиксирован в prompt: в consulting-версии есть `findUnique({ where: { id } })` без `companyId`; это требует явной защиты на уровне пост-проверки или документированного исключения.

## Риски
- DI-риск: удаление `consulting/tech-map.service.ts` до подключения `TechMapModule` в `ConsultingModule` сломает резолв зависимостей.
- Security-риск: перенос без tenant-контроля нарушит `SECURITY_CANON.md` и `ADR-013`.
- Регрессионный риск: изменение wiring модулей может затронуть unit/e2e тесты `consulting`, даже без изменения бизнес-правил.
- Документационный риск: расхождение `techmap-task.schema.ts` с фактическими моделями TM-4..TM-5 создаст ложный source of truth.

## План работ
- [ ] Прочитать и сопоставить текущие реализации `consulting/tech-map.service.ts` и `tech-map/tech-map.service.ts`, выделить точные блоки `activate` и `createNextVersion`.
- [ ] Проверить все инъекции `TechMapValidator` и `UnitNormalizationService`; убедиться, что они доступны через `TechMapModule` (providers/exports).
- [ ] Перенести `activate` и `createNextVersion` в `apps/api/src/modules/tech-map/tech-map.service.ts` дословно, сохранив сигнатуры.
- [ ] В `activate` добавить tenant-защиту после загрузки сущности (`companyId` mismatch => `NotFoundException`) либо зафиксировать документированное обоснование, если это недопустимо по текущему контракту.
- [ ] Обновить `apps/api/src/modules/tech-map/tech-map.module.ts`: зарегистрировать и экспортировать требуемые зависимости для нового единого сервиса.
- [ ] Обновить `apps/api/src/modules/consulting/consulting.module.ts`: добавить `TechMapModule` в imports и убрать локальный `TechMapService` из providers.
- [ ] Перевести импорты в `consulting/*` на доменный путь `tech-map/tech-map.service.ts` там, где используется прямой импорт класса.
- [ ] Удалить `apps/api/src/modules/consulting/tech-map.service.ts` или заменить на тонкий re-export-адаптер, если это нужно для стабильности тестов и DI на переходном этапе.
- [ ] Обновить `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts`: добавить модели `AdaptiveRule`, `HybridPhenologyModel`, `BudgetLine`, `ContractCorePayload`.
- [ ] Добавить краткий API-список публичных методов новых сервисов TM-4 и TM-5 в отдельный файл `docs/` или комментарий в релевантной doc-точке.
- [ ] Обновить `memory-bank` фиксацией факта консолидации `TechMapService` и изменённой модульной связности.
- [ ] Выполнить `tsc` и целевые `jest` прогоны; при регрессии исправить и повторить прогоны до зелёного статуса.

## DoD
- [ ] `apps/api/src/modules/consulting/tech-map.service.ts` удалён или оставлен как тонкий re-export без бизнес-логики.
- [ ] `ConsultingModule` импортирует `TechMapModule` и не содержит локального `TechMapService` в providers.
- [ ] `activate` и `createNextVersion` работают из единого `tech-map/tech-map.service.ts` без изменения сигнатур.
- [ ] Tenant-изоляция в переносимых сценариях соответствует `companyId`-политике.
- [ ] `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-task.schema.ts` обновлён для TM-4..TM-5.
- [ ] Добавлен и зафиксирован краткий API-слой TM-4..TM-5 в `docs/`.
- [ ] `memory-bank` обновлён по факту консолидации.
- [ ] `pnpm --filter api exec tsc --noEmit` — PASS.
- [ ] `cd apps/api && npx jest --runInBand src/modules/tech-map/` — PASS.
- [ ] `cd apps/api && npx jest --runInBand src/modules/consulting/` — PASS.
- [ ] `pnpm --filter api test -- --passWithNoTests` — PASS или документированная причина пропуска.
