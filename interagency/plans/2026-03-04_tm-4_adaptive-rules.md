# ПЛАН — TechMap Sprint TM-4: Adaptive Rules + Regionalization
Дата: 2026-03-04
Статус: **ACCEPTED**
Decision-ID: AG-TM-AR-004

## Результат
- Подготовленный к исполнению план для второго адаптивного контура TechMap: `AdaptiveRule`, `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService`, новые DTO и тестовое покрытие.
- Явно ограниченный объём изменений: только `packages/prisma-client/schema.prisma` и `apps/api/src/modules/tech-map/`.
- Зафиксированные blocking-gate условия перед кодом: регистрация `Decision-ID` со статусом `ACCEPTED`, подтверждение tenant-изоляции, отсутствие прямых мутаций вне `ChangeOrderService`.

## Границы
- Входит: добавление Prisma-моделей `AdaptiveRule` и `HybridPhenologyModel`, enum-ов `TriggerType` и `TriggerOperator`, а также relation-полей в `TechMap` и `Company`.
- Входит: создание DTO `adaptive-rule.dto.ts` и `hybrid-phenology.dto.ts` с unit-тестами.
- Входит: создание директории `apps/api/src/modules/tech-map/adaptive-rules/` и сервисов `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService` с unit-тестами.
- Входит: регистрация новых сервисов в `TechMapModule` и экспорт `TriggerEvaluationService`.
- Входит: адресная верификация через `prisma validate`, `prisma db push`, `tsc`, `jest` по новым файлам и регрессия `tech-map/`.
- Не входит: изменения `apps/web`, API-контроллеров, FSM и доменов вне `tech-map`.
- Не входит: произвольное расширение TM-1/TM-2/TM-3 моделей вне relation-полей, требуемых промптом.
- Не входит: автоматический bypass approval-flow; любые state changes только через существующий `ChangeOrderService`.

## Предварительные проверки
- `CANON.md`, `ARCHITECTURAL_AXIOMS.md`, `FORBIDDEN.md`, `SECURITY_CANON.md`, `LANGUAGE_POLICY.md` прочитаны; прямых противоречий планированию нет.
- В `DECISIONS.log` отсутствует релевантный `Decision-ID` для TM-4; это допустимо только на стадии плана, но блокирует реализацию.
- Предусловие TM-3 подтверждено локальным кодом: `ChangeOrderService`, `EvidenceService`, `RegionProfile` и текущий `TechMapModule` существуют.
- Scope промпта совпадает с ограничением на `packages/prisma-client/schema.prisma` и `apps/api/src/modules/tech-map/`.

## Риски
- Без зарегистрированного `Decision-ID` со статусом `ACCEPTED` реализация должна быть остановлена по FOUNDATION и Security Canon.
- Промпт требует `companyId` на всех новых tenant-scoped моделях и фильтрацию только через него; это критично для всех Prisma-запросов и тестов.
- `TriggerEvaluationService` должен быть pure в части `evaluateCondition`, но при этом `evaluateTriggers` обновляет `lastEvaluatedAt`; нужно чётко развести pure-логику и IO.
- `applyTriggeredRule` обязан создавать изменения только через `ChangeOrderService`; прямые Prisma-модификации `TechMap` или `MapOperation` будут нарушением scope.
- `RegionProfileService.getProfileForField` в промпте опирается на связи `Field → CropZone → TechMap.regionProfileId` или `Field.regionProfileId`, но текущая схема и сервисы уже выглядят частично рассинхронизированными; перед реализацией нужно опереться только на фактические relation-и в `schema.prisma`, без домысливания.
- `HybridPhenologyModel.companyId` допускает `null` как глобальный справочник; нужно заранее зафиксировать deterministic lookup order: tenant-specific запись, затем глобальная.
- `ChangeOrderService.routeForApproval` уже переводит заказ в `PENDING_APPROVAL`; тест `applyTriggeredRule` должен проверять это состояние без повторного изменения статуса в новом сервисе.
- Общая регрессия `tech-map/` может выявить старые несоответствия TM-1/TM-2; это нужно отражать в review packet как внешний фон, а не как дефект TM-4 по умолчанию.

## План работ
- [ ] Выполнить pre-flight перед реализацией: дождаться `Decision-ID` для TM-4 в `DECISIONS.log`, подтвердить токен `ACCEPTED` и повторно сверить scope.
- [ ] Обновить `packages/prisma-client/schema.prisma`: добавить `TriggerType`, `TriggerOperator`, модели `AdaptiveRule` и `HybridPhenologyModel`, relation-поля в `TechMap` и `Company`, индексы `companyId`.
- [ ] Проверить существующие Prisma relation-и `Field`, `CropZone`, `TechMap`, `RegionProfile`; если промпт опирается на несуществующую связь, реализовать только подтверждённый путь доступа и явно зафиксировать это в коде и тестах.
- [ ] Создать `apps/api/src/modules/tech-map/dto/adaptive-rule.dto.ts` с типизированной схемой `condition`, массивом `affectedOperationIds` и `changeTemplate`.
- [ ] Создать `apps/api/src/modules/tech-map/dto/hybrid-phenology.dto.ts` со схемой `gddToStage` и ограничениями `baseTemp`.
- [ ] Добавить 4 DTO-теста: happy path и validation error для каждого нового файла.
- [ ] Создать `apps/api/src/modules/tech-map/adaptive-rules/trigger-evaluation.service.ts` и `trigger-evaluation.service.spec.ts`.
- [ ] В `TriggerEvaluationService` реализовать `evaluateCondition` как pure function без обращений к Prisma и без моков в unit-тестах.
- [ ] В `TriggerEvaluationService.evaluateTriggers` загружать только активные правила по `techMapId` и `companyId`, вызывать `applyTriggeredRule` только для сработавших правил и отдельно обновлять `lastEvaluatedAt` для проверенных правил.
- [ ] В `TriggerEvaluationService.applyTriggeredRule` загружать правило по `ruleId` и `companyId`, строить `ChangeOrderCreateDto` из `changeTemplate` и передавать мутации только в `ChangeOrderService.createChangeOrder` и `ChangeOrderService.routeForApproval`.
- [ ] Создать `apps/api/src/modules/tech-map/adaptive-rules/region-profile.service.ts` и `region-profile.service.spec.ts` с методами `getProfileForField`, `calculateSowingWindow`, `suggestOperationTypes`.
- [ ] Реализовать `calculateSowingWindow` и `suggestOperationTypes` как детерминированные вычисления по промпту, без скрытых внешних зависимостей.
- [ ] Создать `apps/api/src/modules/tech-map/adaptive-rules/hybrid-phenology.service.ts` и `hybrid-phenology.service.spec.ts` с методами `predictBBCH` и `getOrCreateModel`.
- [ ] В `HybridPhenologyService.predictBBCH` использовать упорядоченный разбор `gddToStage`, чтобы корректно выбирать текущую и следующую фазу при любом наборе стадий.
- [ ] Обновить `apps/api/src/modules/tech-map/tech-map.module.ts`: зарегистрировать `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService`, экспортировать `TriggerEvaluationService`.
- [ ] Прогнать адресные проверки: `npx prisma validate`, `npx prisma db push`, `pnpm --filter api exec tsc --noEmit`, `jest` по `adaptive-rules/`, DTO и полному `tech-map/`.
- [ ] Подготовить пакет на ревью: diff, логи прогонов, фиксация фактического поведения approval-flow и всех внешних красных тестов, если они останутся вне scope TM-4.

## DoD
- [ ] Для TM-4 зарегистрирован `Decision-ID` в `DECISIONS.log` со статусом `ACCEPTED`.
- [ ] В `packages/prisma-client/schema.prisma` добавлены `AdaptiveRule`, `HybridPhenologyModel`, `TriggerType`, `TriggerOperator` и необходимые relation-поля.
- [ ] Все новые tenant-scoped выборки и записи фильтруются по `companyId`; на новых моделях есть `@@index([companyId])`, где `companyId` предусмотрен промптом.
- [ ] Созданы `adaptive-rule.dto.ts` и `hybrid-phenology.dto.ts` и минимум 4 DTO-теста суммарно.
- [ ] Реализованы `TriggerEvaluationService`, `RegionProfileService`, `HybridPhenologyService` и минимум 13 сервисных тестов суммарно по сценариям промпта.
- [ ] `evaluateCondition` покрыт отдельно и остаётся pure function.
- [ ] `TriggerEvaluationService` не мутирует `TechMap` или `MapOperation` напрямую; все изменения состояния идут только через `ChangeOrderService`.
- [ ] `TechMapModule` регистрирует новые сервисы без изменения контроллеров и FSM.
- [ ] `npx prisma validate` проходит успешно.
- [ ] `npx prisma db push` проходит успешно.
- [ ] `pnpm --filter api exec tsc --noEmit` проходит без ошибок.
- [ ] Адресные новые тесты проходят; результат общей регрессии `tech-map/` зафиксирован как факт.
