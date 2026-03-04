# PLAN — TechMap Sprint TM-3: Evidence + ChangeOrder Protocol
Дата: 2026-03-03
Статус: **ACCEPTED**
Decision-ID: AG-TM-EV-003

## Результат (какой артефакт получим)
- Подготовленный к исполнению план реализации контура цифровых доказательств `Evidence` и протокола изменений `ChangeOrder + Approval` в TechMap-домене.
- Декомпозиция по Prisma schema, DTO, сервисам `EvidenceService` и `ChangeOrderService`, модульной регистрации и адресным тестам.
- Явно зафиксированные gate-условия перед реализацией: регистрация `Decision-ID` в `DECISIONS.log`, подтверждение предпосылки TM-2 и точный токен `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: изменения только в `packages/prisma-client/schema.prisma` и `apps/api/src/modules/tech-map/`.
- Входит: добавление Prisma-моделей `Evidence`, `ChangeOrder`, `Approval` и enum-ов `EvidenceType`, `ChangeOrderType`, `ChangeOrderStatus`, `ApproverRole`, `ApprovalDecision`.
- Входит: расширение существующих Prisma-моделей `MapOperation`, `TechMap`, `Company` relation-полями в рамках промта.
- Входит: создание Zod DTO `evidence.dto.ts`, `change-order.dto.ts`, `approval.dto.ts` и unit-тестов для них.
- Входит: создание `EvidenceService` и `ChangeOrderService` с unit-тестами, а также регистрация сервисов в `TechMapModule`.
- Входит: создание поддиректорий `apps/api/src/modules/tech-map/evidence/` и `apps/api/src/modules/tech-map/change-order/`.
- Входит: адресные проверки `prisma validate`, `db push`, `tsc`, `jest` по новым сервисам и DTO.
- Не входит: изменения `apps/web`.
- Не входит: изменения API-контроллеров и transport-контрактов.
- Не входит: переписывание `TechMapStateMachine`; допускаются только hook-методы и использование FSM как зависимости сервиса.
- Не входит: изменения доменов вне `apps/api/src/modules/tech-map/`.
- Не входит: правки TM-1 Prisma-полей, кроме точечных relation-добавлений, необходимых для TM-3.

## Риски (что может пойти не так)
- В промте нет готового `Decision-ID`; без его регистрации в `DECISIONS.log` реализация должна быть остановлена по FOUNDATION.
- Промт ссылается на завершённый TM-2 как предусловие; если фактическая реализация TM-2 не завершена или не совпадает по контрактам сервисов, TM-3 может упереться в несоответствие зависимостей.
- Формула маршрутизации `deltaCostRub > contingency_fund` опирается на `TechMap.contingencyFundPct`, `TechMap.budgetCapRubHa` и `CropZone.field.area`; если часть этих данных nullable или отсутствует, потребуется явно определить безопасное поведение без домысливания.
- `ChangeOrder` объявлен append-only, но при этом промт требует менять `status`, `versionTo` и `appliedAt`; нужно аккуратно реализовать это через выделенные методы и транзакции без произвольных редактирований сущности.
- В `Evidence` есть `observationId` как будущая связь, но Observation-модель в scope отсутствует; потребуется оставить поле без relation, строго как указано в промте.
- Текущий общий `pnpm --filter api test` уже нестабилен вне TM-3; это нужно честно зафиксировать как внешний фон, чтобы не подменить адресную верификацию нового функционала полной зеленью пакета.

## План работ (коротко, исполнимо)
- [ ] Выполнить pre-flight перед реализацией: подтвердить регистрацию `Decision-ID` для TM-3 в `DECISIONS.log`, подтвердить статус предусловия TM-2 и сверить scope с foundation-ограничениями.
- [ ] Обновить `packages/prisma-client/schema.prisma`: добавить модели `Evidence`, `ChangeOrder`, `Approval`, новые enum-ы, tenant-поля `companyId`, индексы и relation-поля в `MapOperation`, `TechMap`, `Company`.
- [ ] Создать Zod DTO в `apps/api/src/modules/tech-map/dto/`: `evidence.dto.ts`, `change-order.dto.ts`, `approval.dto.ts` с валидацией URL, checksum SHA-256, дат и JSON payload.
- [ ] Добавить unit-тесты DTO: по 2 сценария на каждый новый DTO-файл, чтобы покрыть happy path и validation error.
- [ ] Создать `apps/api/src/modules/tech-map/evidence/evidence.service.ts` и `evidence.service.spec.ts` с методами `attachEvidence`, `validateOperationCompletion`, `getByOperation`.
- [ ] Создать `apps/api/src/modules/tech-map/change-order/change-order.service.ts` и `change-order.service.spec.ts` с методами `createChangeOrder`, `routeForApproval`, `decideApproval`, `applyChangeOrder`, `rejectChangeOrder`.
- [ ] Обновить `apps/api/src/modules/tech-map/tech-map.module.ts`, зарегистрировав новые сервисы и exports без изменения контроллеров.
- [ ] Прогнать адресный контур проверок: `prisma validate`, `db push`, `tsc`, `jest` по `evidence/`, `change-order/` и новым DTO.
- [ ] Подготовить review packet с логами прогонов, ключевым diff и честной фиксацией внешних красных тестов, если они сохранятся вне scope.

## DoD
- [ ] Для TM-3 зарегистрирован `Decision-ID` в `DECISIONS.log` со статусом `ACCEPTED`.
- [ ] В `packages/prisma-client/schema.prisma` добавлены `Evidence`, `ChangeOrder`, `Approval` и все enum-ы из промта.
- [ ] Все новые модели содержат `companyId` и `@@index([companyId])`; tenant-фильтрация в сервисах идёт только через `companyId`.
- [ ] В `MapOperation`, `TechMap`, `Company` добавлены только необходимые relation-поля без разрушения существующих связей.
- [ ] Созданы `evidence.dto.ts`, `change-order.dto.ts`, `approval.dto.ts` и минимум 6 DTO-тестов суммарно.
- [ ] Реализованы `EvidenceService` и `ChangeOrderService` с минимум 10 unit-тестами суммарно по сценариям из промта.
- [ ] `TechMapModule` экспортирует `EvidenceService` и `ChangeOrderService`.
- [ ] `npx prisma validate` проходит успешно.
- [ ] `npx prisma db push` применяется без ошибок.
- [ ] `pnpm --filter api exec tsc --noEmit` проходит без TS-ошибок.
- [ ] Адресные новые тесты проходят успешно; результат общего `pnpm --filter api test -- --passWithNoTests` зафиксирован в отчёте как факт.
