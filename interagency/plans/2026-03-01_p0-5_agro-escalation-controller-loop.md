# PLAN — Проверить и подключить AgroEscalation к commit-loop
Дата: 2026-03-01  
Статус: accepted  
Decision-ID: AG-AGRO-ESCALATION-LOOP-001  

## Результат (какой артефакт получим)
- Исполнимый план для P0.5: верификация отсутствия/наличия реального escalation-loop в `apps/api` и, при допуске, минимальное подключение `AgroEscalation` к факту commit в `agro-events`.
- Зафиксированный scope backend-only: `commit -> severity check -> create AgroEscalation -> unit proof`, без UI и без Prisma-миграций.

## Границы (что входит / что НЕ входит)
- Входит: проверка `DECISIONS.log`; поиск существующей реализации в `apps/api/src`; минимальный loop рядом с agro-доменом; unit-тесты на порог и отсутствие эскалации ниже порога.
- Входит: идемпотентность на уровне `eventId + metricKey`, чтобы не плодить дубликаты для одного commit.
- Не входит: любые Prisma-миграции или изменения `schema.prisma`, если не будет отдельно доказана несовместимость.
- Не входит: UI, тексты, Telegram, web, отчёты вне review-packet после реализации.
- Не входит: получение `companyId` из payload/callback; tenant только из доверенного контекста `apps/api`.

## Риски (что может пойти не так)
- Блокирующий риск: `AG-AGRO-ESCALATION-LOOP-001` ещё не внесён в `DECISIONS.log` и не имеет статуса `ACCEPTED`; без этого реализация запрещена.
- Риск архитектурной развязки: hook на commit может потребовать аккуратного размещения, чтобы не смешать доменный loop с транспортом или случайным модулем.
- Риск данных: в committed-event может не хватить детерминированного источника для `operationDelayDays`; тогда потребуется остановка и уточнение, а не домысливание.
- Риск дубликатов: без явной проверки `eventId + metricKey` можно создать повторные `AgroEscalation` при повторном вызове `confirm/commit`.

## План работ (коротко, исполнимо)
- [ ] Внести `AG-AGRO-ESCALATION-LOOP-001` в `DECISIONS.log` и получить статус `ACCEPTED`; при отсутствии допуска остановить реализацию.
- [ ] Верифицировать в коде факты по `apps/api/src`: существует ли уже запись `AgroEscalation`, существует ли controller/escalation loop, и можно ли подключить его к реальному `commit` в `AgroEventsOrchestratorService`.
- [ ] Если реализации нет, спроектировать минимальный backend-only loop рядом с agro-доменом:
- [ ] Точка входа: после успешного `commitDraft(...)` в `AgroEventsOrchestratorService` или через уже принятый доменный emitter, если он реально существует в коде.
- [ ] Вычисление `operationDelayDays` из уже доступных данных committed-event; если данных недостаточно, остановить процесс и запросить уточнение.
- [ ] Зафиксировать пороги P0.5 константами: `S3` при `delayDays >= 4`, `S4` при `delayDays >= 7`.
- [ ] Создавать `AgroEscalation` со значениями `metricKey="operationDelayDays"`, `severity`, детерминированным `reason`, `references` минимум `{ eventId, fieldRef?, taskRef? }`, `status="OPEN"`.
- [ ] Добавить идемпотентную проверку: не создавать повторную эскалацию для одного `eventId + metricKey`.
- [ ] Добавить unit-тесты, доказывающие loop:
- [ ] `delayDays=4` -> escalation created с `severity=S3`
- [ ] `delayDays=0` -> escalation not created
- [ ] negative/security: попытка протащить `companyId` через payload не влияет на tenant scope

## DoD
- [ ] После commit Agro события в `apps/api` создаётся `AgroEscalation` при пороге `S3/S4`.
- [ ] Есть unit-доказательство, что без loop сценарий бы не сработал, а с loop создаёт escalation.
- [ ] Tenant isolation соблюдён: `companyId` не читается из недоверенного ввода.
- [ ] Prisma schema не менялась в рамках P0.5.
