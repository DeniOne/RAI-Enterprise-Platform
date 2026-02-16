---
id: DOC-OPS-RUN-130
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# INVARIANT ALERT RUNBOOK (RU)

Дата: 2026-02-15  
Область: tenant/FSM/finance инварианты  
Цель: единая процедура triage, containment, recovery и postmortem.

## 1. Общие правила реакции
- `P0`: cross-tenant, financial panic mode, массовые tenant violations.
- `P1`: illegal FSM transitions, рост invariant ошибок без утечки.
- Время реакции:
- `P0`: до 5 минут.
- `P1`: до 30 минут.
- Любой `P0` инцидент: немедленно остановить rollout и включить rollback/kill switch.

## 2. Источники сигналов
- Prometheus alert rules: `infra/monitoring/prometheus/invariant-alert-rules.yml`
- Runtime endpoint: `/api/invariants/metrics`
- Логи API/relay/finance с correlation id и `companyId`.

## 3. Процедуры по алертам

### tenant-violation
Сигнал: `RAIInvariantTenantViolationSpike`

Шаги:
1. Проверить `/api/invariants/metrics` и breakdown `byTenant`, `byModule`.
2. Определить модуль-источник и путь запроса (controller/service/query).
3. Перевести `TENANT_MIDDLEWARE_MODE` в `enforce` для canary/ограниченного контура.
4. При повторении: блокировать релиз, открыть P0 incident, включить kill switch для проблемного маршрута.
5. Подготовить fix + negative test на bypass path.

### cross-tenant-attempt
Сигнал: `RAIInvariantCrossTenantAttempt`

Шаги:
1. Считать как `P0` до доказательства обратного.
2. Временно запретить проблемный endpoint (feature flag / route deny).
3. Проверить guard + tenant middleware + query filter в цепочке.
4. Проверить raw SQL path и background job path.
5. После фикса: regression test + replay проверка.

### illegal-fsm-transition
Сигнал: `RAIInvariantIllegalTransition`

Шаги:
1. Найти entity/status pair и caller path.
2. Проверить, что переход идёт через централизованный FSM слой.
3. Проверить DB enforcement (trigger/constraint) на сущности.
4. Добавить блокирующий тест на illegal transition.
5. Если есть side-effects вне транзакции: изолировать и вынести в outbox.

### financial-invariant-failure
Сигнал: `RAIInvariantFinancialFailure`

Шаги:
1. Немедленно проверить целостность `economic_events` и `ledger_entries`.
2. Проверить идемпотентность входящего события (`metadata.idempotencyKey`).
3. Проверить симметрию DEBIT/CREDIT по `economicEventId`.
4. При системном повторе: временно остановить ingestion в finance-контуре.
5. Выполнить reconciliation job и зафиксировать scope повреждения.

### financial-panic-mode
Сигнал: `RAIFinancialPanicModeActive`

Шаги:
1. Считать как `P0` и блокировать новые финансовые команды.
2. Выполнить быстрый integrity-check:
- количество событий без парной проводки;
- события с расхождением дебет/кредит;
- дубли idempotency ключей.
3. Перевести контур в режим recovery:
- freeze ingest;
- анализ последней стабильной точки;
- forward-fix или controlled rollback по runbook релиза.
4. Разморозка только после зелёного reconciliation и апрува владельца Data/SRE.

### event-duplicates-prevented
Сигнал: `RAIEventDuplicatesPrevented`

Шаги:
1. Проверить какие `type + aggregateId` чаще всего дедуплицируются.
2. Проверить producer path на повторные ретраи без стабильного idempotency key.
3. Проверить, не появились ли duplicate outbox insert в одном бизнес-потоке.
4. Если частота растёт: перевести инцидент в `P1`, зафиксировать corrective action в контракте событий.

### finance-reconciliation-anomaly
Сигнал: `RAIFinanceReconciliationAnomaly`

Шаги:
1. Проверить последние аномалии reconciliation (`MISSING_LEDGER_ENTRIES`, `DOUBLE_ENTRY_MISMATCH`) по логам `ReconciliationJob`.
2. Выгрузить затронутые `economicEventId` и сверить проводки в `ledger_entries` по каждому событию.
3. При `MISSING_LEDGER_ENTRIES`:
- проверить транзакционный путь ingest и ошибки `generateLedgerEntries`,
- временно ограничить ingest по проблемному producer/source.
4. При `DOUBLE_ENTRY_MISMATCH`:
- зафиксировать deltas debit/credit,
- выполнить ручной reconciliation/compensating posting по утверждённой финансовой процедуре.
5. После фикса:
- убедиться, что `invariant_reconciliation_alerts_total` не растёт минимум 30 минут,
- зафиксировать root cause в postmortem и добавить regression test.

### outbox-backlog-high
Сигнал: `RAIOutboxBacklogHigh`

Шаги:
1. Проверить `pendingCount`, `processingCount`, `oldestPendingAgeSeconds`.
2. Убедиться, что relay-инстанс жив и cron-процесс не блокирован.
3. Проверить частоту ошибок в relay и количество retry.
4. При необходимости масштабировать relay и временно снизить нагрузку на producers.

### outbox-dlq-non-zero
Сигнал: `RAIOutboxDlqNonZero`

Шаги:
1. Получить список `FAILED` сообщений и ошибки.
2. Разделить на `transient` vs `schema/contract` причины.
3. Для transient: replay после устранения причины.
4. Для contract ошибок: фикс producer/consumer и только потом replay.

### outbox-oldest-pending-age-high
Сигнал: `RAIOutboxOldestPendingAgeHigh`

Шаги:
1. Проверить stream-ordering defer loops и retry backoff.
2. Проверить наличие stuck `PROCESSING` сообщений.
3. Если есть stuck: перевести в `PENDING` через controlled remediation.
4. Зафиксировать причину в postmortem и добавить тест.

## 4. Recovery и верификация
- Обязательные проверки после фикса:
- invariant counters стабилизированы;
- новые нарушения не растут 30+ минут;
- regression tests зелёные;
- rollout только progressive (canary -> cohort -> full).

## 5. Postmortem (обязательно)
- Root cause.
- Почему не сработало раннее обнаружение.
- Какие инварианты/гейты добавить.
- Сроки и ответственный за preventive action.
