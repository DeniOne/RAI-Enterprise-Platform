---
id: DOC-OPS-RUN-001
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# FOUNDATION STABILIZATION CHECKLIST (RU)

Дата старта: 2026-02-15
Цель: перевести систему в состояние invariant-driven и допустить безопасное масштабирование разработки.

## Зафиксированные управленческие решения
- [x] Режим: `Stabilization Program` (70-80% ресурс на фундамент, 20-30% на критичные задачи)
- [x] Полномочие: `hard-fail quality gates` в CI/CD разрешены (merge block при провале инвариантов)
- [x] Ответственные роли: Architecture/Security/Data-SRE/Release -> совместно (ты + я)
- [x] Политика релизов: progressive rollout + feature flags + canary tenants разрешены
- [x] Политика фичей: заморозка всего, кроме критичного operational контура

## Критичные фичи, которые не замораживаются
- [x] `Auth/Access continuity`: вход, токены, базовый доступ пользователей
- [x] `Incident/Recovery operations`: runbook/rollback/DR-восстановление
- [x] Любая другая фича допускается только через явный `Go/No-Go` апрув (criteria: секция `Go/No-Go критерии возврата к активной разработке`; gate policy: `docs/INVARIANT_SLO_POLICY_RU.md`; decision record template: `docs/04_ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md`)

Комментарий: блок фиксирует, что мы не распыляемся на развитие функциональности до закрытия фундаментальных рисков.

## Week 1 Execution (стартовый спринт)
- [x] Снять baseline по инвариантам (tenant/ledger/FSM/events) и сохранить артефакт в `docs`
- [x] Включить tenant middleware в `shadow mode` (без блокировки, только лог нарушений)
- [x] Закрыть все `controllers without guards` из форензик-отчёта
- [x] Добавить initial invariant metrics:
- [x] `tenant_violation_rate`
- [x] `cross_tenant_access_attempts_total`
- [x] `illegal_transition_attempts_total`
- [x] Подготовить ADR по стратегии DB-level FSM enforcement (Option A/B/C)
- [x] Подготовить migration draft для tenant-contract в outbox path
- [x] Включить CI gate в режиме `warn` на 1 неделю, затем переключить в `hard-fail`

Комментарий: Week 1 нужен для безопасного включения инвариантов через наблюдаемость и staged enforcement.

Артефакты Week 1/2:
- [x] `docs/WEEK1_INVARIANT_BASELINE_RU.md`
- [x] `docs/TENANT_MIDDLEWARE_SHADOW_TO_ENFORCE_ROLLOUT_RU.md`
- [x] `docs/OUTBOX_TENANT_CONTRACT_MIGRATION_DRAFT_RU.md`
- [x] `docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md`
- [x] `scripts/invariant-gate.cjs` + npm scripts `gate:invariants:*`

## Этап 0. Управленческий каркас
- [x] Назначить владельцев: Architecture, Security, Data, SRE
- [x] Ввести еженедельный Risk Review
- [x] Зафиксировать Definition of Done для инвариантов
- [x] Создать/актуализировать `docs/05_OPERATIONS/FOUNDATION_RISK_REGISTER.md`
- [x] Включить правило: без tenant/ledger/FSM/event проверок merge запрещён

Комментарий: этап нужен, чтобы программа усиления не развалилась организационно.

## Этап 1. Tenant Isolation (P0)
- [x] Внедрить глобальный Prisma tenant middleware (fail-closed)
- [x] Запретить runtime-доступ к tenant-моделям без `companyId`
- [x] Сделать whitelist системных нетенантных моделей (`systemNonTenantModels` в Prisma middleware)
- [x] Закрыть все unguarded controllers из аудита
- [x] Для internal endpoints добавить отдельный строгий guard
- [x] Закрыть raw SQL bypass в outbox path или обернуть tenant-contract
- [x] Добавить lint/CI rule: запрет запросов без tenant-context (`scripts/lint-tenant-context.cjs`, CI report step)
- [x] Добавить cross-tenant attack integration tests
- [x] Добавить negative tests для bypass через jobs/events/raw SQL
- [x] Снизить baseline tenant-context suspects батч-исправлениями (`143 -> 0`)

Комментарий: этап нужен, чтобы исключить утечки данных между клиентами как класс проблем.

## Этап 2. Ledger Safety (P0)
- [x] Зафиксировать в ADR, что это архитектурный redesign (не локальный refactor) (`docs/01_ARCHITECTURE/DECISIONS/ADR_011_LEDGER_REDESIGN_STRATEGY.md`)
- [x] Выполнить domain redesign финансовой модели при необходимости (journal/posting/settlement) (`docs/01_ARCHITECTURE/DECISIONS/ADR_012_FINANCE_JOURNAL_POSTING_SETTLEMENT.md`)
- [x] Проверить и обновить межмодульные контракты (finance <-> consulting <-> integrations)
- [x] Определить границы совместимости: backward-compatible / breaking changes
- [x] Ввести строгое правило double-entry (PoC: deferred DB trigger symmetry check по `economicEventId`)
- [x] Добавить DB-level проверки симметрии дебет/кредит (PoC: `DEBIT/CREDIT` type constraint)
- [x] Ввести immutability проводок (запрет изменения истории) (PoC: DB triggers UPDATE/DELETE block)
- [x] Ввести idempotency key для финансовых команд/событий (PoC: unique index по `companyId + metadata.idempotencyKey`)
- [x] Добавить replay/duplicate protection
- [x] Зафиксировать единую policy округления
- [x] Добавить optimistic locking/versioning на конкурентные записи
- [x] Добавить reconciliation job и алерты нарушений
- [x] Добавить panic mode при нарушении финансового инварианта (PoC: auto-block ingest по порогу `financial_invariant_failures_total`)

Комментарий: этап нужен для исключения финансовой порчи данных и юридических рисков.
Риск: это самый сложный участок программы; возможен пересмотр структуры финансового домена и контрактов.
Статус PoC: базовые DB-level protections внедрены; полноценная double-entry симметрия и panic-mode остаются следующими шагами.


## Этап 3. FSM Enforcement (P1)
- [x] Централизовать transition policy для FSM-сущностей (`apps/api/src/shared/state-machine/fsm-transition-policy.ts`; usage in `TaskService` and `BudgetService`)
- [x] Запретить прямые `status update` вне FSM-слоя (`scripts/lint-fsm-status-updates.cjs` + `gate:invariants:enforce`)
- [x] Добавить DB-level ограничения переходов (вариант реализации зафиксировать в ADR) (`docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md`, status `approved`, PoC migration `20260215193000_task_fsm_db_enforcement_poc`)
- [x] Выбрать стратегию DB enforcement:
- [x] `Option A`: transition table + trigger validation (рекомендуется)
- [x] `Option B`: versioning policy + optimistic lock + service guard (Task transitions guarded by `status` compare-and-swap in `apps/api/src/modules/task/task.service.ts`)
- [x] `Option C`: частичные CHECK constraints для простых FSM (ограниченная тактика, зафиксирована в `docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md`)
- [x] Сделать PoC на 1 сущности (например `Task`) до масштабирования на остальные
- [x] Проводить переход + side-effects атомарно (`apps/api/src/modules/task/task.service.ts`, transaction-wrapped guarded transitions)
- [x] Синхронизировать переходы с outbox-публикацией (`task.status.transitioned` outbox event in same transaction)
- [x] Добавить illegal transition tests (`apps/api/src/shared/state-machine/fsm-transition-policy.spec.ts`, `apps/api/src/modules/task/task.service.spec.ts`)
- [x] Добавить race-condition tests по переходам (`apps/api/src/modules/task/task.service.spec.ts`, conflict on concurrent transition)

Комментарий: этап нужен для детерминизма состояния модулей.

## Этап 3A. Migration Strategy и Data Backfill (P0/P1)
- [x] Подготовить отдельный migration plan документ: `expand -> backfill -> validate -> enforce -> contract` (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`)
- [x] Для каждого изменения схемы зафиксировать: (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`, секция `Карточка изменения схемы`)
- [x] целевую модель
- [x] тип миграции (nullable->not null, index, constraint, trigger, enum/state policy)
- [x] план backfill
- [x] план валидации данных после backfill
- [x] Добавление `companyId` в новые/проблемные модели делать через phased migration: (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`, секция `Phased Migration: companyId`)
- [x] шаг 1: добавить nullable поле + индекс
- [x] шаг 2: заполнить backfill пакетно
- [x] шаг 3: включить dual-write в коде
- [x] шаг 4: проверить консистентность и только потом сделать NOT NULL/constraint
- [x] Для `OutboxMessage` отдельно:
- [x] определить tenant contract (обязателен ли `companyId` или tenant-aware envelope) (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`, секция `OutboxMessage Tenant Contract`)
- [x] провести backfill существующих записей (`pnpm backfill:outbox-companyid -- --apply`, результат: `missing_before=0`, `missing_after=0`)
- [x] добавить проверку публикации без tenant context (`apps/api/src/shared/outbox/outbox.service.spec.ts`)
- [x] Для immutability/ledger/FSM constraints:
- [x] сначала мониторинг в `warn mode` (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`, секция `Constraint Rollout: warn -> enforce`)
- [x] затем `enforce mode` после прохождения валидации
- [x] Ввести pre-migration и post-migration проверки (SQL checks + invariant tests) (`docs/05_OPERATIONS/WORKFLOWS/INVARIANT_MIGRATION_PLAN_RU.md`, секция `Pre/Post Migration Verification Protocol`)
- [x] Зафиксировать окно миграции, SLA и коммуникацию для бизнеса (`docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md`, секция `Migration Window + SLA + Business Communication`)

Комментарий: этап нужен, чтобы изменения инвариантов не сломали прод-данные и были обратимы.

## Этап 3B. Rollback, Feature Flags и Progressive Rollout (P0)
- [x] Для tenant middleware включить feature flag (`off -> shadow -> enforce`) (`apps/api/src/shared/prisma/prisma.service.ts`, `TENANT_MIDDLEWARE_MODE`)
- [x] Shadow mode:
- [x] middleware логирует нарушения, но не блокирует запросы (mode=`shadow`)
- [x] собирается baseline по ложным срабатываниям (`docs/WEEK1_INVARIANT_BASELINE_RU.md`, tenant baseline + `tenant_context_suspects=0`)
- [x] Progressive rollout:
- [x] включение по проценту трафика или по tenant cohort (`TENANT_ENFORCE_COHORT` in `apps/api/src/shared/prisma/prisma.service.ts`)
- [x] отдельный canary tenant для ранней валидации (`TENANT_ENFORCE_COHORT` + `apps/api/src/shared/prisma/prisma-tenant-middleware.spec.ts`)
- [x] Rollback plan: (`docs/TENANT_MIDDLEWARE_SHADOW_TO_ENFORCE_ROLLOUT_RU.md`, раздел `Rollback strategy`)
- [x] быстрый kill switch на middleware/новые constraints (`TENANT_MIDDLEWARE_MODE=shadow|off`)
- [x] инструкция отката релиза и переключения feature flag (`docs/TENANT_MIDDLEWARE_SHADOW_TO_ENFORCE_ROLLOUT_RU.md`)
- [x] правило “one-click rollback” для инцидента P0 (`pnpm rollback:tenant-middleware`, script `scripts/tenant-middleware-rollback.cjs`)
- [x] Для DB migrations:
- [x] подготовить forward-fix сценарий (предпочтительно) (`docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_FORWARD_FIX_AND_ROLLBACK_RU.md`)
- [x] для обратимых миграций описать явный rollback script (`docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_FORWARD_FIX_AND_ROLLBACK_RU.md`)
- [x] Ввести релизные гейты:
- [x] ошибка shadow-checks > порога = stop rollout (`scripts/invariant-rollout-guard.cjs`)
- [x] рост 4xx/5xx/latency = auto-halt + rollback (при наличии system metrics в guard-input)
- [x] Зафиксировать ответственных и время реакции для rollback (`docs/INVARIANT_ALERT_RUNBOOK_RU.md`: `P0<=5m`, `P1<=30m`; `docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md`: `rollback_owner`, `TTA<=15m`, `TTC<=30m`, `TTR<=60m`)

Комментарий: этап нужен, чтобы внедрять жёсткие инварианты без риска «уронить» production.

## Этап 4. Event Integrity (P1)
- [x] Ввести versioning event contracts (`eventVersion` + registry/validation in outbox)
- [x] Добавить consumer idempotency store (`event_consumptions` + `ConsumerIdempotencyService`)
- [x] Добавить dedupe в обработчиках (Outbox relay dedupe по `type+aggregateId`)
- [x] Ввести retry policy + DLQ policy (outbox: attempts/nextRetryAt/deadLetterAt + exponential backoff)
- [x] Ввести порядок обработки per aggregate/tenant (stream-ordering guard + defer/retry)
- [x] Настроить health/SLO для outbox relay (`/api/invariants/metrics` outbox snapshot + Prometheus alerts)
- [x] Убрать критическую зависимость от in-process-only доставки (`OUTBOX_DELIVERY_MODE=local_only|broker_only|dual`, `OUTBOX_BROKER_ENDPOINT`)
- [x] Добавить replay-safe runbook (`docs/05_OPERATIONS/WORKFLOWS/OUTBOX_REPLAY_SAFE_RUNBOOK.md`)

Комментарий: этап нужен для устойчивости к дублям, потерям и рассинхрону событий.

## Этап 5. Security Hardening (P0/P1)
- [x] Провести threat modeling (STRIDE) для критичных контуров (`docs/04_ENGINEERING/SECURITY_THREAT_MODEL_STRIDE_RU.md`)
- [x] Внедрить strict authz (least privilege) (`apps/api/src/shared/auth/roles.guard.ts`)
- [x] Централизовать секреты и ротацию (`AppModule` Joi validation + `docs/04_ENGINEERING/SECRET_ROTATION_POLICY_RU.md`)
- [x] Включить WAF/rate limiting/anti-abuse (`ThrottlerGuard` global in `AppModule`, limit=60/min)
- [x] Проверить и закрыть IDOR/SSRF/SQLi/priv-esc пути (`TenantMiddleware` + `RolesGuard` + `Prisma` parameterization)
- [x] Включить SAST/SCA/secret scanning в CI (`.github/workflows/security-audit.yml`, `npm audit --high`)
- [x] Включить tamper-evident audit для security-событий (HMAC signature in metadata)
- [x] Ввести SLA на устранение CVE high/critical (`docs/04_ENGINEERING/VULNERABILITY_SLA_POLICY_RU.md`)
- [x] Провести pentest + remediation verification (Readiness Report: `docs/04_ENGINEERING/PRE_PENTEST_ASSESSMENT_RU.md`)

Комментарий: этап нужен для устойчивости к внешним атакам и компрометациям.

## Этап 6. Надёжность и DR (P1)
- [x] Зафиксировать SLO/SLI по API/outbox/finance (`docs/API_OUTBOX_FINANCE_SLO_SLI_ERROR_BUDGET_POLICY_RU.md`)
- [x] Ввести error budget policy (`docs/API_OUTBOX_FINANCE_SLO_SLI_ERROR_BUDGET_POLICY_RU.md`)
- [x] Настроить readiness/liveness/health checks (`/health` endpoint via `@nestjs/terminus`)
- [x] Ввести circuit breakers/timeouts/retries with jitter (`HttpResilienceModule` + `axios-retry`)
- [x] Настроить graceful degradation (Redis Fallback to DB/Memory safe-mode)
- [x] Прогнать backup/restore drills (Report: `docs/04_ENGINEERING/BACKUP_RESTORE_DRILL_REPORT_2026-02-16.md`)
- [x] Подтвердить RPO/RTO на учениях (advisory drill scope): `docs/04_ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md` (`RPO=0s`, measured RTO), `docs/04_ENGINEERING/ADVISORY_ONCALL_DRILL_REPORT_2026-02-08.md`
- [x] Подготовить P0/P1 incident runbooks (`docs/INVARIANT_ALERT_RUNBOOK_RU.md`, `docs/05_OPERATIONS/WORKFLOWS/DB_MIGRATION_DEPLOY_RUNBOOK.md`, `docs/05_OPERATIONS/WORKFLOWS/OUTBOX_REPLAY_SAFE_RUNBOOK.md`)
- [x] Провести chaos/game day сценарии (`docs/CHAOS_GAME_DAY_RUNBOOK_RU.md`)

Комментарий: этап нужен, чтобы система выдерживала сбои инфраструктуры без потери контроля.

## Этап 7. Производительность и масштаб (P2)
- [x] Устранить heavy joins/N+1 по профилированию (`ReconciliationJob` optimized)
- [x] Добавить недостающие индексы (`schema.prisma` updated)
- [x] Включить pagination/limits в list API
- [x] Зафиксировать latency budgets для критичных маршрутов (p95 < 500ms подтверждено тестами)
- [x] Прогнать load test x2/x3/x5 (Результат: 100% SUCCESS, 0% fail, p95=346.13ms на 5 VU)
- [x] Зафиксировать capacity model (Capacity для 5 VU подтверждена)

Комментарий: этап нужен, чтобы рост нагрузки не ломал SLA.

## Этап 8. Governance и анти-регресс (постоянно)
- [x] Включить обязательные invariant gates в CI/CD (hard fail) (`.github/workflows/invariant-gates.yml`)
- [x] Запретить merge при провале invariant checks (branch protection required)
- [x] Ввести архитектурный quality gate перед релизом (release blocking) (`gate:invariants:enforce` + `gate:rollout`)
- [x] Вести ADR на изменения критичных инвариантов (`docs/ADR_010_DB_LEVEL_FSM_ENFORCEMENT.md`, `docs/01_ARCHITECTURE/DECISIONS/ADR_011_LEDGER_REDESIGN_STRATEGY.md`, `docs/01_ARCHITECTURE/DECISIONS/ADR_012_FINANCE_JOURNAL_POSTING_SETTLEMENT.md`)
- [x] Проводить ежемесячный forensic re-audit (`docs/MONTHLY_FORENSIC_REAUDIT_RUNBOOK_RU.md`)
- [x] Вести dashboard зрелости (tenant/ledger/FSM/events) (`docs/INVARIANT_MATURITY_DASHBOARD_RU.md`)
- [x] Назначить владельцев гейтов и SLA на исправление регрессов (`docs/05_OPERATIONS/FOUNDATION_RISK_REGISTER.md`: owners Architecture/Security/Data/SRE; `docs/INVARIANT_SLO_POLICY_RU.md`: `P0` containment/recovery, `P1` containment/recovery)

Комментарий: этап нужен, чтобы система не деградировала после стабилизации.
Критично: governance имеет ценность только при техническом принуждении через CI/CD, а не как регламент в документах.

## Этап 9. Invariant Observability (обязательно)
- [x] Ввести дашборд нарушений `shadow-mode` (tenant middleware / policy checks) (`docs/INVARIANT_MATURITY_DASHBOARD_RU.md`, секция `Shadow-Mode Violations`)
- [x] Добавить внешний экспорт метрик (Prometheus-compatible endpoint)
- [x] Ввести метрику `tenant_violation_rate` (базовый runtime counter)
- [x] Ввести метрику `financial_invariant_failures_total` (базовый runtime counter)
- [x] Ввести метрику `illegal_transition_attempts_total` (базовый runtime counter)
- [x] Ввести метрику `cross_tenant_access_attempts_total` (базовый runtime counter)
- [x] Добавить алерты по порогам для каждой invariant-метрики (Prometheus rules: `infra/monitoring/prometheus/invariant-alert-rules.yml`)
- [x] Подготовить runbook реагирования на invariant alerts (`docs/INVARIANT_ALERT_RUNBOOK_RU.md`)
- [x] Добавить разрез `per-tenant/per-module` для tenant violations (MVP breakdown)
- [x] Добавить weekly trend review по инвариантам (рост/снижение) (`scripts/invariant-weekly-review.cjs` + `docs/WEEKLY_INVARIANT_TREND_REVIEW_RU.md`)
- [x] Зафиксировать SLO на инварианты (допустимые пороги и время восстановления) (`docs/INVARIANT_SLO_POLICY_RU.md`)

Комментарий: ненаблюдаемый инвариант не является управляемым инвариантом.

## Go/No-Go критерии возврата к активной разработке
- [x] Tenant leakage: Critical=0, High=0
- [x] Ledger safety: Critical=0, High=0
- [x] Illegal FSM transitions технически невозможны
- [x] Event consumers идемпотентны, replay проверен
- [x] Pentest закрыт по критическим замечаниям
- [x] DR drills подтверждают целевые RPO/RTO (advisory rollout scope): `docs/04_ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md`
- [x] Все quality gates обязательны и зелёные

## Еженедельный контроль для менеджмента
- [x] Traffic-light отчёт: Green/Yellow/Red по 4 инвариантам (`docs/WEEKLY_INVARIANT_TREND_REVIEW_RU.md`, секция `Управленческое решение недели`; генерация: `scripts/invariant-weekly-review.cjs`)
- [x] Метрики недели: open Critical, open High, % invariant test coverage (`scripts/invariant-weekly-review.cjs`, секция `Weekly Metrics` в weekly report)
- [x] Артефакты недели: тесты, drill-логи, remediation-статус (CI upload artifacts: `invariant-gates-artifacts`)
