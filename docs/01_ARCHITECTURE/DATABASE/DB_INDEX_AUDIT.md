# DB_INDEX_AUDIT

## Scope and evidence

Источники, на которых основан аудит:
- `packages/prisma-client/schema.prisma`
- `packages/prisma-client/migrations/*`
- `mg-core/backend/prisma/schema.prisma`
- `mg-core/backend/prisma/migrations/*`
- workload-файлы active contour:
  - `apps/api/src/modules/season/season.service.ts`
  - `apps/api/src/modules/task/task.service.ts`
  - `apps/api/src/modules/tech-map/tech-map.service.ts`
  - `apps/api/src/modules/cmr/deviation.service.ts`
  - `apps/api/src/modules/commerce/services/party.service.ts`
  - `apps/api/src/modules/finance-economy/economy/application/economy.service.ts`
  - `apps/api/src/modules/finance-economy/economy/application/reconciliation.job.ts`
  - `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-event.service.ts`
  - `apps/api/src/shared/outbox/outbox.relay.ts`

Подтвержденные числа:
- current contour: `368` индексов, `59` compound unique, `1` compound primary key;
- MG-Core contour: `66` индексов, `14` compound unique.

Жесткий вывод:
- active schema не страдает от полного отсутствия индексов;
- active schema страдает от плохого соответствия между индексами и реальными query paths;
- старые planning/finance модели индексированы шаблонно;
- новые front-office/runtime-governance модели индексированы заметно взрослее;
- основная проблема не в количестве индексов, а в том, что слишком много `@@index([companyId])` и слишком мало составных индексов под `where + orderBy`.

## Current index inventory

Доминирующие формы в current contour:
- `companyId` alone: `82` моделей;
- `companyId, id`: `18`;
- `status`: `10`;
- `seasonId`: `10`;
- `createdAt`: `10`;
- `companyId, status`: `8`;
- `traceId`: `6`;
- `companyId, role`: `4`;
- `companyId, seasonId`: `3`;
- `companyId, createdAt`: `3`;
- `companyId, threadKey`: `3`.

Вывод:
- index policy исторически строилась как tenant-placeholder policy;
- workload-driven policy есть только в части новых модулей;
- из-за этого критичные operational tables читаются не так быстро, как должны.

## Hot query paths from code

Подтвержденная delegate hotness в `apps/api`:
- `techMap`: `43`
- `season`: `33`
- `harvestPlan`: `31`
- `deviationReview`: `21`
- `agentConfiguration`: `20`
- `task`: `18`
- `party`: `17`
- `outboxMessage`: `17`
- `field`: `17`
- `cmrRisk`: `10`
- `runtimeGovernanceEvent`: `6`
- `economicEvent`: `5`

Приоритет индексации должен идти по этим моделям, а не по формальной важности домена.

## Model-by-model audit

### `Season`

Реальные паттерны из `apps/api/src/modules/season/season.service.ts`:
- `findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })`
- `findFirst({ where: { id, companyId } })`
- update/access checks в tenant context.

Текущие индексы:
- `@@index([id, companyId])`
- `@@index([fieldId, year])`
- `@@index([companyId, year])`
- `@@index([companyId, status])`
- `@@index([status, companyId])`
- `@@index([rapeseedId, companyId])`
- `@@index([cropVarietyId, companyId])`
- `@@index([farmId, year])`

Проблема:
- нет индекса под базовый list path `companyId + createdAt desc`;
- пара `companyId,status` и `status,companyId` выглядит как зеркальный дубль без подтвержденной ценности.

Рекомендация:
- добавить `@@index([companyId, createdAt])`;
- проверить production-statistics и удалить один из двух индексов `([companyId,status])` / `([status,companyId])`, если нет запроса с левым префиксом `status`.

### `Task`

Реальные паттерны из `apps/api/src/modules/task/task.service.ts`:
- idempotency lookup `where: { seasonId, operationId, fieldId }`;
- access checks `where: { id, companyId }`;
- рабочие выборки по `seasonId`, `companyId`, `assigneeId`, `fieldId`.

Текущие индексы:
- `@@index([seasonId])`
- `@@index([companyId])`
- `@@index([assigneeId])`
- `@@index([fieldId])`

Проблема:
- индексный слой не совпадает с основным idempotency path;
- tenant-aware assignee/status view не покрыт.

Рекомендация:
- минимум `@@index([seasonId, operationId, fieldId])`;
- целевой вариант после чистки данных: `@@unique([companyId, seasonId, operationId, fieldId])`, если бизнес-правило действительно запрещает дубликаты;
- добавить `@@index([companyId, assigneeId, status])`;
- дополнительно проверить нужность `@@index([companyId, fieldId, status])` для operational boards.

### `HarvestPlan`

Реальные паттерны из `apps/api/src/modules/tech-map/tech-map.service.ts` и `apps/api/src/modules/cmr/deviation.service.ts`:
- `findFirst({ where: { companyId, id } })`
- `findFirst({ where: { companyId, seasonId } })`
- list/read paths по `companyId` с сортировкой по `createdAt`;
- status transitions и проверки активного плана.

Текущие индексы:
- `@@index([companyId])`
- `@@index([accountId])`

Проблема:
- критичная модель недоиндексирована;
- сервисы читают её как рабочий aggregate, а не как редкий справочник.

Рекомендация:
- добавить `@@index([companyId, seasonId])`;
- добавить `@@index([companyId, status])`;
- добавить `@@index([companyId, createdAt])`.

### `TechMap`

Реальные паттерны из `apps/api/src/modules/tech-map/tech-map.service.ts`:
- `findFirst({ where: { fieldId, crop, seasonId, companyId }, orderBy: { version: 'desc' } })`
- `findMany({ where: { companyId, seasonId, fieldId } })`
- `findFirst({ where: { id, companyId } })`
- workflow переходов вокруг `harvestPlanId`, `cropZoneId`, `status`.

Текущие индексы:
- `@@unique([fieldId, crop, seasonId, companyId, version])`
- `@@index([companyId])`
- `@@index([cropZoneId])`
- `@@index([harvestPlanId])`

Проблема:
- version-path закрыт хорошо;
- plan-scoped и review/dashboard reads частично опираются на одиночные индексы.

Рекомендация:
- добавить `@@index([companyId, harvestPlanId])`;
- рассмотреть `@@index([companyId, status])`, если admission/review dashboards действительно hot path;
- не трогать уникальный version-index: он один из немногих реально правильных в старом agronomy блоке.

### `DeviationReview`

Реальные паттерны из `apps/api/src/modules/cmr/deviation.service.ts`:
- `findFirst({ where: { id, companyId } })`
- `findFirst({ where: { seasonId, companyId, status: ... } })`
- `findMany({ where: { companyId, seasonId? } })`
- есть path по `telegramThreadId + companyId`.

Текущие индексы:
- `@@index([seasonId])`
- `@@index([harvestPlanId])`
- `@@index([budgetPlanId])`
- `@@index([companyId])`
- `@@index([status])`

Проблема:
- индексный стиль старый и не tenant-first;
- комбинации tenant + season/status/thread не покрыты.

Рекомендация:
- добавить `@@index([companyId, seasonId])`;
- добавить `@@index([companyId, status, createdAt])`;
- добавить `@@index([companyId, telegramThreadId])`.

### `CmrRisk`

Реальные паттерны видны через сервисы CMR и relation graph:
- фильтры по `seasonId`, `taskId`, `responsibleId`, `observationId`;
- почти всегда в tenant context.

Текущие индексы:
- `@@index([seasonId])`
- `@@index([type])`
- `@@index([taskId])`
- `@@index([observationId])`
- `@@index([responsibleId])`
- `@@index([insuranceId])`

Проблема:
- tenant-composite indexes отсутствуют;
- risk lists и responsibility queues будут читать лишние строки.

Рекомендация:
- добавить `@@index([companyId, seasonId])`;
- добавить `@@index([companyId, status])`;
- добавить `@@index([companyId, responsibleId, status])`.

### `EconomicEvent`

Реальные паттерны из `apps/api/src/modules/finance-economy/economy/application/economy.service.ts` и `reconciliation.job.ts`:
- replay/idempotency по `companyId + replayKey`;
- reporting/reconciliation по `companyId`, `type`, `createdAt`;
- срезы по `seasonId`, `fieldId`, `employeeId`.

Текущие индексы:
- `@@unique([companyId, id])`
- `@@unique([companyId, replayKey])`
- `@@index([companyId])`
- `@@index([type])`
- `@@index([seasonId])`
- `@@index([fieldId])`
- `@@index([employeeId])`

Проблема:
- replay path закрыт хорошо;
- tenant time-slice reporting path закрыт слабо.

Рекомендация:
- добавить `@@index([companyId, createdAt])`;
- добавить `@@index([companyId, type, createdAt])`;
- опционально добавить `@@index([companyId, seasonId, createdAt])`, если подтверждён регулярный finance-by-season reporting.

### `LedgerEntry`

Реальные паттерны в finance блоке:
- поиск и сортировка по `economicEventId`, `sequenceNumber`;
- tenant reports по `accountCode`, `cashAccountId`, `dueDate`, `createdAt`;
- будущие replays и audit slices почти наверняка tenant-scoped.

Текущие индексы:
- `@@unique([economicEventId, sequenceNumber])`
- `@@index([companyId])`
- `@@index([accountCode])`
- `@@index([cashAccountId])`
- `@@index([executionId])`

Проблема:
- write-path допустим;
- аналитический tenant path слабый и разрозненный.

Рекомендация:
- добавить `@@index([companyId, createdAt])`;
- добавить `@@index([companyId, accountCode, createdAt])`;
- добавить `@@index([companyId, cashAccountId, dueDate])`.

### `Party` и `RegulatoryProfile`

Реальные паттерны из `apps/api/src/modules/commerce/services/party.service.ts`:
- `Party.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })`
- `Party.findFirst({ where: { companyId, id } })`
- `RegulatoryProfile.findMany({ where: { companyId, jurisdictionId?, isSystemPreset? }, orderBy: [{ isSystemPreset: 'desc' }, { code: 'asc' }] })`

Текущие индексы:
- `Party`: `@@index([companyId, legalName])`
- `RegulatoryProfile`: unique `([companyId, id])`, unique `([companyId, code])`
- `Jurisdiction`: unique `([companyId, id])`, unique `([companyId, code])`

Проблема:
- `Party` list path не покрыт оптимально;
- `RegulatoryProfile` filter path по `jurisdictionId + isSystemPreset + code` не покрыт совсем.

Рекомендация:
- добавить `Party(companyId, createdAt)`;
- добавить `Party(companyId, status, createdAt)`;
- добавить `RegulatoryProfile(companyId, jurisdictionId, isSystemPreset, code)`.

### `FrontOfficeThread` family

Реальные паттерны из front-office сервисов и auth flows:
- `where: { companyId, threadKey }`
- list по `companyId` с `updatedAt desc`
- фильтры по `farmAccountId`, `currentHandoffStatus`
- child messages по `companyId, threadId, createdAt`
- handoffs по `companyId, status, createdAt`

Текущие индексы:
- `FrontOfficeThread`: `@@index([companyId, updatedAt])`, `@@index([companyId, currentHandoffStatus])`, `@@index([companyId, farmAccountId, updatedAt])`, unique `([companyId, threadKey])`
- `FrontOfficeThreadMessage`: `@@index([companyId, threadId, createdAt])`
- `FrontOfficeHandoffRecord`: `@@index([companyId, status, createdAt])`, `@@index([companyId, targetOwnerRole, status])`, `@@index([companyId, draftId])`
- `FrontOfficeThreadParticipantState`: unique `([companyId, threadId, userId])`, `@@index([companyId, userId, updatedAt])`, `@@index([companyId, threadId])`

Вывод:
- это один из лучших блоков текущей схемы;
- индексы уже соответствуют реальным tenant-scoped operational paths.

Рекомендация:
- не добавлять новые индексы без новых доказанных hot paths;
- использовать этот блок как образец для старых доменов.

### `RuntimeGovernanceEvent`

Реальные паттерны из `apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-event.service.ts`:
- `where: { companyId, createdAt >= from, eventType?, agentRole? }`
- `orderBy: { createdAt: 'desc' }`

Текущие индексы:
- `@@index([companyId])`
- `@@index([companyId, eventType, createdAt])`
- `@@index([companyId, agentRole, createdAt])`
- `@@index([traceId])`

Вывод:
- индексный дизайн хороший;
- это зрелый пример tenant-aware event table.

Рекомендация:
- не расширять индексный набор до тех пор, пока не появятся новые формы фильтрации;
- после введения `tenantId` перевести эти индексы на tenant boundary, а не дублировать company- и tenant-версии надолго.

### `AgentConfiguration`

Реальные паттерны из `apps/api/src/modules/rai-chat/agent-registry.service.ts`:
- `findMany({ where: { companyId: null } })` для global preset path;
- `findMany({ where: { companyId } })` для tenant-local path;
- `findUnique({ where: { role_companyId: ... } })`.

Текущие индексы:
- unique `([role, companyId])`
- `@@index([companyId])`

Вывод:
- индексный дизайн достаточен;
- архитектурная проблема здесь не индексная, а scope-semantics: global preset через `companyId = null` и отсутствие отдельного `tenantId`.

Рекомендация:
- не раздувать индексы;
- решить сначала tenancy semantics.

### `OutboxMessage`

Реальные паттерны из `apps/api/src/shared/outbox/outbox.relay.ts`:
- claim queue по `status`, `nextRetryAt`, `createdAt` с `FOR UPDATE SKIP LOCKED`;
- stream ordering checks по `status`, `type`, `aggregateType`, `aggregateId`, `createdAt`;
- tenant scope определяется через JSON payload `companyId`, а не через нормализованную колонку.

Текущий индекс:
- `@@index([status, nextRetryAt, createdAt])`

Проблема:
- queue-claim path закрыт правильно;
- ordering/isolation path недоиндексирован и частично неиндексируем, потому что tenant сидит в payload.

Рекомендация:
- добавить явную колонку `companyId` на переходный период;
- затем добавить `tenantId` как target-state;
- после нормализации добавить `@@index([status, type, aggregateType, aggregateId, createdAt])`;
- если нужен tenant-isolated ordering, добавить `@@index([companyId, status, type, aggregateType, aggregateId, createdAt])` и потом мигрировать на tenant-версию.

## Redundant and low-value indexes

Проблемные классы индексов:
- зеркальные пары по тем же equality-полям, как в `Season`;
- standalone `status` на tenant tables, где реальные запросы идут как `companyId + status + createdAt`;
- standalone `companyId`, когда реальные запросы почти всегда включают `status`, `seasonId`, `role`, `updatedAt` или `createdAt`;
- частичное дублирование `companyId` и `companyId,id`, если PK lookup и так дешёвый, а tenant-filter нужен в других составных индексах.

Жесткий вывод:
- `@@index([companyId])` в `83` моделях не означает хорошую tenant-индексацию;
- в значительной части моделей это просто placeholder, который замедляет writes, но не ускоряет реальные operational reads настолько, насколько нужен active contour.

## Missing composite indexes: priority order

Первый приоритет:
1. `Season(companyId, createdAt)`
2. `Task(seasonId, operationId, fieldId)`
3. `Task(companyId, assigneeId, status)`
4. `HarvestPlan(companyId, seasonId)`
5. `HarvestPlan(companyId, status)`
6. `HarvestPlan(companyId, createdAt)`
7. `DeviationReview(companyId, seasonId)`
8. `DeviationReview(companyId, status, createdAt)`
9. `DeviationReview(companyId, telegramThreadId)`
10. `CmrRisk(companyId, seasonId)`
11. `CmrRisk(companyId, status)`
12. `EconomicEvent(companyId, createdAt)`
13. `EconomicEvent(companyId, type, createdAt)`
14. `LedgerEntry(companyId, createdAt)`
15. `LedgerEntry(companyId, accountCode, createdAt)`
16. `Party(companyId, createdAt)`
17. `Party(companyId, status, createdAt)`
18. `RegulatoryProfile(companyId, jurisdictionId, isSystemPreset, code)`
19. `OutboxMessage(status, type, aggregateType, aggregateId, createdAt)` после нормализации scope-колонок.

Второй приоритет, только после проверки реального workload:
- `Task(companyId, fieldId, status)`
- `EconomicEvent(companyId, seasonId, createdAt)`
- `TechMap(companyId, status)`
- `CmrRisk(companyId, responsibleId, status)`
- tenant-aware композиты для части AI control-plane таблиц после ввода `tenantId`.

## Write amplification risks

Таблицы, где лишний индекс особенно дорог:
- `OutboxMessage`
- `RuntimeGovernanceEvent`
- `AiAuditEntry`
- `ExpertReview`
- `PerformanceMetric`
- `EconomicEvent`
- `LedgerEntry`
- `FrontOfficeThreadMessage`
- `FrontOfficeHandoffRecord`
- `MemoryInteraction`

Правило:
- на append-heavy tables нельзя компенсировать плохую query architecture россыпью одиночных индексов;
- нужен один правильный composite index под реальный path, а не пять placeholder-индексов.

## MG-Core contour

MG-Core индексирован проще и однороднее.

Что там выглядит нормально:
- event/audit indexes по времени и status;
- registry projections по identifier/path;
- MES/production linkage indexes.

Чего там нет для прямого reuse:
- tenant-aware partitioning discipline;
- стратегии под `companyId`/`tenantId` boundary;
- зрелого event/control-plane index design уровня current front-office/runtime tables.

Вывод:
- MG-Core не даёт готовую индексную стратегию для active contour;
- максимум, что он даёт, это reference point для более простого монолита;
- использовать его как source for index policy для active contour нельзя.

## Do not add yet

Не добавлять без подтвержденного hot path:
- дополнительные индексы на `AgentConfiguration` beyond current unique + company pattern;
- новые индексы на `FrontOfficeThread` family, пока нет новых фильтров;
- speculative индексы на все AI/runtime tables подряд;
- JSON-path индексы по outbox payload вместо нормализации колонок scope;
- дубли tenant- и company-индексов одновременно на старых таблицах до тех пор, пока не начнётся реальный migration wave.

## Final recommendation

Current contour не нуждается в тотальном rewrite index layer.
Ему нужен управляемый сдвиг от generic tenant indexes к workload-driven composite indexes.

Самые недоиндексированные критичные поверхности:
- `HarvestPlan`
- `Task`
- `DeviationReview`
- `CmrRisk`
- `EconomicEvent`
- `LedgerEntry`
- `Party`

Лучшие образцы текущей схемы:
- `FrontOfficeThread` family
- `RuntimeGovernanceEvent`
- queue-claim индекс `OutboxMessage`
- часть `TechMap` version semantics

Правильный следующий шаг:
- не массово добавлять индексы по всей схеме;
- сначала зафиксировать ownership и tenancy policy;
- затем точечно добавить high-value composite indexes по списку выше;
- затем удалить зеркальные и малоценные индексы только после проверки production query statistics.
