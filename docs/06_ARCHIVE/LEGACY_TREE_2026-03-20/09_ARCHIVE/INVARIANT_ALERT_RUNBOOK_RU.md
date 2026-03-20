---
id: DOC-ARV-09-ARCHIVE-INVARIANT-ALERT-RUNBOOK-RU-4J9K
layer: Archive
type: Research
status: archived
version: 1.0.0
---
# INVARIANT ALERT RUNBOOK (RU)

Дата: 2026-02-15  
Область: tenant/FSM/finance/events/memory инварианты  
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
- Operator control-plane:
- `GET /api/memory/maintenance/control-plane` (`snapshot`, `playbooks`, `recommendations`, `automation`, `recentRuns`)
- `POST /api/memory/maintenance/run` (`ADMIN` / `CEO` / `CLIENT_ADMIN`, tenant-scoped, audit events `MEMORY_MAINTENANCE_RUN_*`)
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

### memory-oldest-unconsolidated-age-high
Сигнал: `RAIMemoryOldestUnconsolidatedAgeHigh`

Шаги:
1. Проверить `MEMORY_HYGIENE_ENABLED`, `MEMORY_CONSOLIDATION_SCHEDULE_ENABLED`, `MEMORY_CONSOLIDATION_PAUSE_UNTIL` и gauge `memory_consolidation_paused`.
2. Проверить `/api/invariants/metrics` -> блок `memory` и размер backlog по unconsolidated interactions.
3. Проверить ошибки `ConsolidationWorker` в логах и недавние изменения вокруг `memory_interactions` / `memory_episodes`.
4. Проверить `MEMORY_CONSOLIDATION_BOOTSTRAP_MAX_RUNS` и `MEMORY_PRUNING_BOOTSTRAP_MAX_RUNS`: не слишком ли маленький bootstrap envelope для текущего backlog.
5. Если pause window включён осознанно, зафиксировать maintenance hold как expected state; если нет, снять pause и продолжить triage.
6. Проверить `GET /api/memory/maintenance/control-plane`: рекомендует ли control-plane playbook `consolidation_only` или `s_tier_backlog_recovery`, и не мешает ли cooldown automation path.
7. При необходимости временно запустить controlled manual drain через `POST /api/memory/maintenance/run` с `playbookId="consolidation_only"` или `actions=["consolidation"]` и зафиксировать scope backlog.
8. После фикса убедиться, что возраст oldest unconsolidated interaction стабильно снижается.

### memory-pruning-backlog-high
Сигнал: `RAIMemoryPruningBacklogHigh`

Шаги:
1. Проверить `MEMORY_HYGIENE_ENABLED`, `MEMORY_PRUNING_SCHEDULE_ENABLED`, `MEMORY_PRUNING_PAUSE_UNTIL` и gauge `memory_pruning_paused`.
2. Проверить retention policy и фактический объём `prunableConsolidatedCount` в `/api/invariants/metrics`.
3. Проверить, не вырос ли поток записи быстрее expected throughput pruning path.
4. Если pause window включён осознанно, зафиксировать maintenance hold как expected state; если нет, снять pause и продолжить triage.
5. Проверить `GET /api/memory/maintenance/control-plane`: предлагает ли control-plane `pruning_only` / `s_tier_backlog_recovery` и не упёрлась ли automation path в cooldown.
6. При необходимости выполнить controlled pruning window через `POST /api/memory/maintenance/run` с `playbookId="pruning_only"` или `actions=["pruning"]` вне пикового трафика.
7. После фикса убедиться, что backlog не растёт повторно минимум 30 минут.

### memory-engram-formation-stale
Сигнал: `RAIMemoryEngramFormationStale`

Шаги:
1. Проверить `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_ENABLED`, `MEMORY_ENGRAM_FORMATION_SCHEDULE_ENABLED`, `MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL` и gauge `memory_engram_formation_paused`.
2. Проверить `/api/invariants/metrics` -> блок `memory` и поле `latestEngramFormationAgeSeconds`.
3. Проверить, не изменился ли входной поток `TechMap`/`HarvestResult` так, что formation path больше не получает валидные кандидаты.
4. Проверить ошибки `EngramFormationWorker` в логах и недавние изменения вокруг `TechMap`, `cropZone`, `attrs.plannedYield/actualYield`.
5. Проверить `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS`: достаточно ли bootstrap envelope для catch-up после простоя.
6. Если pause window включён осознанно, зафиксировать maintenance hold как expected state; если нет, снять pause и продолжить triage.
7. После фикса убедиться, что возраст последней formation стабильно снижается и появляются новые engram formation events.

### memory-engram-formation-candidates-stale
Сигнал: `RAIMemoryEngramFormationCandidatesStale`

Шаги:
1. Проверить `/api/invariants/metrics` -> `memory.engramFormationCandidateCount` и `memory.oldestEngramFormationCandidateAgeSeconds`.
2. Проверить `GET /api/memory/maintenance/control-plane`: какие playbooks и recommendations видит control-plane, есть ли recent auto/manual runs и не активен ли cooldown.
3. Убедиться, что candidate contour честный: `EngramFormationWorker` и snapshot используют один и тот же filter на `generationMetadata.memoryLifecycle.engramFormed`.
4. Проверить `MEMORY_ENGRAM_FORMATION_SCHEDULE_ENABLED`, `MEMORY_ENGRAM_FORMATION_BOOTSTRAP_MAX_RUNS` и ошибки worker path в логах.
5. Если automation выключена или under cooldown, при необходимости выполнить manual catch-up через `POST /api/memory/maintenance/run` с `playbookId="engram_formation_only"`.
6. После corrective action убедиться, что candidate backlog и oldest candidate age стабильно снижаются.

### memory-engram-formation-budget-burn-high
Сигнал: `RAIMemoryEngramFormationBudgetBurnHigh`

Шаги:
1. Проверить `memory_engram_formation_budget_usage_ratio` и подтвердить, что сигнал ещё не перешёл в `RAIMemoryEngramFormationStale`.
2. Проверить `MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL` и gauge `memory_engram_formation_paused`; если pause window включён осознанно, зафиксировать expected maintenance hold.
3. Проверить входной поток `TechMap`/`HarvestResult` и недавний formation throughput в логах `EngramFormationWorker`.
4. Если budget usage ratio продолжает расти, открыть maintenance window до появления hard breach и подготовить controlled catch-up.
5. После corrective action убедиться, что budget usage ratio возвращается ниже `0.8`.

### memory-engram-formation-burn-rate-multi-window
Сигнал: `RAIMemoryEngramFormationBurnRateMultiWindow`

Шаги:
1. Проверить, что одновременно выполняются оба сигнала: `delta(memory_engram_formation_budget_usage_ratio[6h])` и `delta(...[24h])` остаются положительными.
2. Проверить `MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL` и gauge `memory_engram_formation_paused`; если pause window включён осознанно, классифицировать как maintenance hold, а не неожиданный burn-rate.
3. Сравнить burn-rate alert с текущим `RAIMemoryEngramFormationBudgetBurnHigh` и `RAIMemoryEngramFormationStale`, чтобы понять фазу деградации.
4. Эскалировать в same-day maintenance: проверить входной поток кандидатов, scheduler freshness, bootstrap envelope и recommendations в `GET /api/memory/maintenance/control-plane`, пока сигнал не дошёл до hard breach.
5. После corrective action убедиться, что short-window и long-window delta выравниваются или уходят в ноль/минус.

### memory-prunable-active-engrams-high
Сигнал: `RAIMemoryPrunableActiveEngramsHigh`

Шаги:
1. Проверить `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_ENABLED`, `MEMORY_ENGRAM_PRUNING_SCHEDULE_ENABLED`, `MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL`, `MEMORY_ENGRAM_PRUNING_MIN_WEIGHT`, `MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS` и gauge `memory_engram_pruning_paused`.
2. Проверить `/api/invariants/metrics` -> блок `memory` и поле `prunableActiveEngramCount`.
3. Проверить, не перестал ли pruning path деактивировать stale/weak engrams из-за ошибок, новых критериев или неожиданных write conflicts.
4. Проверить `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS`: не слишком ли мал bootstrap envelope для накопившегося prune backlog.
5. Если pause window включён осознанно, зафиксировать maintenance hold как expected state; если нет, снять pause и продолжить triage.
6. Проверить `GET /api/memory/maintenance/control-plane`: предлагает ли control-plane `engram_pruning_only` / `engram_lifecycle_recovery` и не мешает ли automation cooldown.
7. При необходимости выполнить controlled engram pruning window через `POST /api/memory/maintenance/run` с `playbookId="engram_pruning_only"` или `actions=["engram_pruning"]` и зафиксировать scope cleanup.
8. После фикса убедиться, что количество prune candidates стабильно снижается минимум 30 минут.

### memory-engram-pruning-budget-burn-high
Сигнал: `RAIMemoryEngramPruningBudgetBurnHigh`

Шаги:
1. Проверить `memory_engram_pruning_budget_usage_ratio` и подтвердить, что сигнал ещё не перешёл в `RAIMemoryPrunableActiveEngramsHigh`.
2. Проверить `MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL` и gauge `memory_engram_pruning_paused`; если pause window включён осознанно, зафиксировать expected maintenance hold.
3. Проверить свежесть pruning throughput через `invariant_memory_engram_pruned_total` и логи `EngramService.pruneEngrams()`.
4. Если budget usage ratio продолжает расти, запланировать controlled pruning window до hard breach и проверить threshold drift.
5. После corrective action убедиться, что budget usage ratio возвращается ниже `0.8`.

### memory-engram-pruning-burn-rate-multi-window
Сигнал: `RAIMemoryEngramPruningBurnRateMultiWindow`

Шаги:
1. Проверить, что одновременно выполняются оба сигнала: `delta(memory_engram_pruning_budget_usage_ratio[6h])` и `delta(...[24h])` остаются положительными.
2. Проверить `MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL` и gauge `memory_engram_pruning_paused`; если pause window включён осознанно, классифицировать как maintenance hold, а не неожиданный burn-rate.
3. Сравнить burn-rate alert с текущим `RAIMemoryEngramPruningBudgetBurnHigh`, `RAIMemoryPrunableActiveEngramsHigh` и `RAIMemoryEngramPruningStalled`.
4. Эскалировать в same-day maintenance: проверить pruning throughput, threshold drift, recommendations в `GET /api/memory/maintenance/control-plane` и объём новых prune candidates до перехода в hard breach.
5. После corrective action убедиться, что short-window и long-window delta выравниваются или уходят в ноль/минус.

### memory-engram-pruning-stalled
Сигнал: `RAIMemoryEngramPruningStalled`

Шаги:
1. Проверить `/api/invariants/metrics/prometheus` и убедиться, что `invariant_memory_engram_pruned_total` не растёт при ненулевом `memory_prunable_active_engrams`.
2. Проверить `MEMORY_ENGRAM_PRUNING_SCHEDULE_ENABLED`, `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_ENABLED`, `MEMORY_ENGRAM_PRUNING_BOOTSTRAP_MAX_RUNS`, `MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL` и gauge `memory_engram_pruning_paused`.
3. Если pause window включён осознанно, зафиксировать maintenance hold как expected state; если нет, снять pause и продолжить triage.
4. Проверить логи `EngramFormationWorker` и `EngramService.pruneEngrams()` на ошибки и конфликты записи.
5. Проверить, не изменились ли pruning thresholds так, что worker ходит в пустой или неверный контур.
6. После фикса убедиться, что counter `invariant_memory_engram_pruned_total` снова растёт и backlog prune candidates снижается.

### memory-auto-remediation-failures
Сигнал: `RAIMemoryAutoRemediationFailures`

Шаги:
1. Проверить `invariant_memory_auto_remediation_failures_total`, `memory_auto_remediation_enabled` и последние ошибки `MemoryAutoRemediationService` в логах.
2. Проверить `GET /api/memory/maintenance/control-plane`: `automation.lastAutoRunAt`, `lastAutoRunPlaybookId`, `recentRuns` и актуальные recommendations.
3. Проверить, не упёрлись ли auto-runs в неверный cooldown, disabled playbook, pause window или в ошибку worker path.
4. Если auto-path нестабилен, выполнить equivalent manual recovery через `POST /api/memory/maintenance/run` и временно оставить automation в observability-only режиме до фикса.
5. После исправления убедиться, что failure counter больше не растёт минимум 1 час, а `invariant_memory_auto_remediations_total` снова увеличивается.

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
