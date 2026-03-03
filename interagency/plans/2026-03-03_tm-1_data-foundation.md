# PLAN — TechMap Sprint TM-1: Data Foundation
Дата: 2026-03-03
Статус: **ACCEPTED**
Decision-ID: AG-TM-DATA-001

## Результат (какой артефакт получим)
- Подготовленный к исполнению план изменения `packages/prisma-client/schema.prisma` под TM-1 Data Foundation без выхода за границы TechMap-домена.
- Декомпозиция на изменение Prisma-моделей, enum-слоя, relation-связей, Zod DTO и минимального набора проверок.
- Явно зафиксированные блокеры перед реализацией: обязательный `Decision-ID` со статусом `ACCEPTED` и формальный токен принятия плана.

## Границы (что входит / что НЕ входит)
- Входит: добавление моделей `SoilProfile`, `RegionProfile`, `InputCatalog`, `CropZone` в Prisma schema.
- Входит: расширение существующих моделей `Field`, `TechMap`, `MapOperation`, `MapResource`, `Company` только nullable-полями и relation-ами, указанными в промте.
- Входит: добавление Prisma enum-ов `SoilGranulometricType`, `ClimateType`, `InputType`, `OperationType`, `ApplicationMethod`.
- Входит: создание `apps/api/src/modules/tech-map/dto/` и файлов `soil-profile.dto.ts`, `region-profile.dto.ts`, `input-catalog.dto.ts`, `crop-zone.dto.ts`.
- Входит: добавление минимальных DTO-тестов на happy path и validation error для новых DTO.
- Входит: верификация `prisma validate`, `prisma db push`, `pnpm --filter api exec tsc --noEmit`, `pnpm --filter api test`.
- Не входит: изменения `apps/web`.
- Не входит: изменения `TechMapService`, контроллеров, API endpoints и бизнес-логики.
- Не входит: изменения доменов вне TechMap и связанных с ним tenant-scoped сущностей.
- Не входит: обновление `interagency/INDEX.md`, memory-bank, чеклистов выполнения и review packet до внешнего ревью и отдельного разрешённого этапа процесса.

## Риски (что может пойти не так)
- В промте не указан `Decision-ID`; без него реализация должна быть остановлена по FOUNDATION и SECURITY CANON.
- В репозитории не обнаружен `DECISIONS.log`; перед реализацией потребуется указание источника решения или подтверждение его отсутствия как отдельный управленческий блокер.
- Добавление optional relation в `TechMap` и `MapResource` может потребовать точного выравнивания имён relation, чтобы не конфликтовать с существующими Prisma relation.
- `Company` relation arrays для глобальных сущностей с nullable `companyId` (`RegionProfile`, `InputCatalog`) требуют аккуратной настройки optional relation без нарушения tenant isolation.
- DTO-путь в `apps/api/src/modules/tech-map/dto/` сейчас отсутствует; потребуется создать структуру файлов и убедиться, что она не ломает текущую сборку.
- `prisma db push` может выявить конфликт текущей БД с новой схемой, особенно если есть существующие данные и ограничения relation/unique/index.
- Текущие unit-тесты могут падать не из-за DTO, а из-за косвенных эффектов изменения Prisma client types после обновления schema.

## План работ (коротко, исполнимо)
- [ ] Выполнить pre-flight check перед реализацией: подтвердить `Decision-ID`, сверить scope с foundation-документами и найти/уточнить источник решений вместо отсутствующего `DECISIONS.log`.
- [ ] Обновить `packages/prisma-client/schema.prisma`: добавить новые модели, enum-ы, relation-поля, индексы `@@index([companyId])`, `companyId` и `Company @relation` согласно промту и tenant isolation.
- [ ] Расширить существующие модели `Field`, `TechMap`, `MapOperation`, `MapResource`, `Company` только перечисленными в промте nullable-полями и relation-ами, не удаляя текущие поля и связи.
- [ ] Создать каталог `apps/api/src/modules/tech-map/dto/` и реализовать 4 Zod DTO файла с `CreateDto` и `ResponseDto`, включая диапазоны валидации для числовых полей.
- [ ] Добавить минимальные тесты DTO: по 2 сценария на каждый новый DTO, чтобы покрыть happy path и validation error.
- [ ] Запустить проверочный контур: `npx prisma validate`, `npx prisma db push`, `pnpm --filter api exec tsc --noEmit`, `pnpm --filter api test`.
- [ ] Подготовить набор артефактов для review packet: список изменённых файлов и логи всех обязательных проверок.

## DoD
- [ ] До начала реализации подтверждён `Decision-ID` со статусом `ACCEPTED`.
- [ ] Все новые модели содержат `companyId`, `Company @relation` и `@@index([companyId])` в соответствии с промтом и tenant isolation.
- [ ] Все новые поля в существующих моделях добавлены только как nullable (`?`), без удаления существующих полей и связей.
- [ ] В `packages/prisma-client/schema.prisma` добавлены все новые модели, enum-ы и relation-связи из промта без выхода за рамки scope.
- [ ] В `apps/api/src/modules/tech-map/dto/` созданы 4 DTO-файла с корректной Zod-валидацией и диапазонами.
- [ ] Добавлены минимальные тесты DTO: не менее 8 сценариев суммарно.
- [ ] `npx prisma validate` проходит успешно.
- [ ] `npx prisma db push` применяется без ошибок.
- [ ] `pnpm --filter api exec tsc --noEmit` проходит без TS-ошибок.
- [ ] `pnpm --filter api test` не ухудшает текущий уровень прохождения тестов.
