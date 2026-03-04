# ПЛАН — TechMap Sprint TM-5: Economics + Contract Core
Дата: 2026-03-04
Статус: **ACCEPTED**
Decision-ID: AG-TM-EC-005

## Результат
- Подготовленный к исполнению план для финансового слоя TechMap: расчёт бюджета, KPI, Contract Core и движок пересчёта.
- Явно зафиксированные блокеры до кода: отсутствие зарегистрированного `Decision-ID` со статусом `ACCEPTED`, а также расхождения prompt с фактической Prisma-схемой.
- Ограниченный объём будущих изменений: `packages/prisma-client/schema.prisma` только если это подтвердится source of truth, и `apps/api/src/modules/tech-map/` без выхода в UI, контроллеры и внешние домены.

## Границы
- Входит: проверка соответствия TM-5 текущей схеме `TechMap`, `Budget`, `BudgetLine`, `ChangeOrderService`, `TriggerEvaluationService` и модулю `tech-map`.
- Входит: планирование DTO `budget-line.dto.ts` и `tech-map-kpi.dto.ts`, сервисов `TechMapBudgetService`, `TechMapKPIService`, `ContractCoreService`, `RecalculationEngine`, а также регистрации в `TechMapModule`.
- Входит: планирование адресных тестов, `tsc`, `jest`, `prisma validate` и только тех schema-изменений, которые реально отсутствуют в `packages/prisma-client/schema.prisma`.
- Не входит: UI, API-контроллеры, FSM, домены вне `apps/api/src/modules/tech-map/`, произвольное расширение approval-flow и любые git-операции.
- Не входит: реализация до появления канонического токена `ACCEPTED: interagency/plans/2026-03-04_tm-5_economics-contract.md`.

## Предварительные проверки
- `CANON.md`, `SECURITY_CANON.md`, `LANGUAGE_POLICY.md` проверены; planning допустим, реализация без `Decision-ID` запрещена.
- В prompt указано, что `Decision-ID` будет зарегистрирован Orchestrator при акцепте плана; на стадии плана это допустимо, но остаётся blocking-gate для любого кода.
- Предусловие TM-4 по коду выглядит выполненным частично: в `tech-map` уже существуют `TriggerEvaluationService` и `ChangeOrderService`.
- Обнаружено расхождение prompt с текущим source of truth: в `[schema.prisma](/root/RAI_EP/packages/prisma-client/schema.prisma)` уже есть `TechMap.basePlanHash`, а `BudgetLine` и `BudgetCategory` существуют в другом виде через связку `Budget -> BudgetLine`, поэтому реализация должна опираться на фактическую схему, а не повторно вводить уже существующие сущности.
- `DECISIONS.log` в репозитории не найден; это нужно отдельно подтвердить/зарегистрировать до исполнения.

## Риски
- Главный admission/security-риск: без зарегистрированного `Decision-ID` со статусом `ACCEPTED` и без токена акцепта реализация нарушит FOUNDATION и Security Canon.
- Главный архитектурный риск: prompt одновременно запрещает изменения Prisma-схемы и требует новую модель `BudgetLine`; при текущей схеме это прямое противоречие, которое нельзя домыслить.
- Текущая `BudgetLine` в схеме привязана к `Budget`, а не к `TechMap`; если TM-5 требует иной контракт данных, это должно быть либо явно подтверждено новым решением, либо адаптировано через существующую модель без самовольной миграции.
- `ContractCoreService.hashContractCore` нельзя реализовывать по упрощённой сортировке только верхнего уровня; для детерминизма нужен канонический JSON с рекурсивной сортировкой ключей и стабильной сериализацией массивов.
- `companyId` обязан идти из доверенного контекста и фильтровать все tenant-scoped выборки; нельзя превращать его в произвольный источник истины из DTO.
- `RecalculationEngine` не должен создавать скрытые side effects вне `ChangeOrderService` и подтверждённых вызовов `TriggerEvaluationService`.

## План работ
- [ ] Дождаться регистрации `Decision-ID` для TM-5 и канонического токена `ACCEPTED`.
- [ ] Перед кодом повторно сверить `packages/prisma-client/schema.prisma` с prompt и зафиксировать, какие поля/relations реально отсутствуют, а какие уже существуют в другой форме.
- [ ] Если `BudgetLine` в текущем виде не покрывает TM-5, запросить/подтвердить через Orchestrator допустимый путь: расширение существующей модели, новая модель или адаптация через `Budget`.
- [ ] Создать `apps/api/src/modules/tech-map/dto/budget-line.dto.ts` и `apps/api/src/modules/tech-map/dto/tech-map-kpi.dto.ts` только после подтверждения фактического контракта данных.
- [ ] Реализовать `apps/api/src/modules/tech-map/economics/tech-map-budget.service.ts` с tenant-фильтрацией по `companyId`, агрегацией бюджета и overspend-маршрутизацией только через `ChangeOrderService`.
- [ ] Реализовать `apps/api/src/modules/tech-map/economics/tech-map-kpi.service.ts`, оставив `computeKPIs` pure function без IO и без скрытых зависимостей от Prisma.
- [ ] Реализовать `apps/api/src/modules/tech-map/economics/contract-core.service.ts` с детерминированной генерацией payload, рекурсивным canonical JSON и SHA-256 хэшем для `basePlanHash`.
- [ ] Реализовать `apps/api/src/modules/tech-map/economics/recalculation.engine.ts` как orchestration-слой без прямых мутаций доменных сущностей мимо существующих сервисов.
- [ ] Обновить `apps/api/src/modules/tech-map/tech-map.module.ts` только регистрацией новых providers/exports в рамках подтверждённого scope.
- [ ] Добавить адресные unit-тесты для DTO и новых сервисов, включая детерминизм hash, overspend-routing и pure-расчёт KPI.
- [ ] Прогнать `npx prisma validate` только если схема реально меняется, затем `pnpm --filter api exec tsc --noEmit`, адресные `jest` по `tech-map/economics/`, DTO и регрессию `tech-map/`.

## DoD
- [ ] Для TM-5 зарегистрирован релевантный `Decision-ID` со статусом `ACCEPTED`.
- [ ] Получен токен `ACCEPTED: interagency/plans/2026-03-04_tm-5_economics-contract.md`.
- [ ] Фактический data contract TM-5 согласован с текущей `packages/prisma-client/schema.prisma`; противоречие по `BudgetLine` устранено без домысливания.
- [ ] Все новые tenant-scoped операции фильтруются по `companyId` из доверенного контекста.
- [ ] `TechMapBudgetService`, `TechMapKPIService`, `ContractCoreService`, `RecalculationEngine` реализованы и покрыты адресными unit-тестами.
- [ ] `computeKPIs` остаётся pure function.
- [ ] `hashContractCore` детерминирован для одинаковых данных независимо от порядка ключей во входном объекте.
- [ ] `checkOverspend` создаёт изменения только через `ChangeOrderService`.
- [ ] `pnpm --filter api exec tsc --noEmit` проходит успешно.
- [ ] Адресные `jest` по TM-5 проходят успешно; результат общей регрессии `tech-map/` зафиксирован как факт.
