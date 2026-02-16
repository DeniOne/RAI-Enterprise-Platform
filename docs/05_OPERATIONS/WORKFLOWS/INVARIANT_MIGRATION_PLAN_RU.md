---
id: DOC-OPS-MIG-003
layer: Operations
type: Runbook
status: draft
version: 1.0.0
---

# Invariant Migration Plan (RU)

## Цель
Единый безопасный шаблон миграций для tenant/ledger/FSM/event инвариантов:
`expand -> backfill -> validate -> enforce -> contract`.

## Принцип
Ни один шаг не пропускается. Переход к следующему шагу только после формальных проверок и артефактов.

## Шаг 1. Expand
- Добавить новые поля/индексы/таблицы без ломающих ограничений.
- Для будущих обязательных полей использовать временно nullable схему.
- Не включать жесткие CHECK/trigger/NOT NULL до завершения backfill.

## Шаг 2. Backfill
- Выполнить пакетный backfill исторических данных (батчами, с лимитами).
- Логировать прогресс, ошибки, долю обработанных записей.
- Для длинных операций использовать resumable-подход (checkpoint/cursor).

## Шаг 3. Validate
- Прогнать SQL-проверки полноты/консистентности backfill.
- Прогнать инвариантные проверки:
- `pnpm lint:tenant-context:enforce`
- `pnpm gate:invariants:enforce`
- Зафиксировать артефакты проверки (отчет, дата, ответственный).

## Шаг 4. Enforce
- Включить ограничения целевой модели:
- `NOT NULL`, `CHECK`, `UNIQUE`, trigger/guard policy.
- Включить runtime enforcement в коде (strict mode/feature flag по необходимости).
- Наблюдать метрики нарушений в окне стабилизации.

## Шаг 5. Contract
- Удалить временные поля/ветки dual-write.
- Закрыть legacy-совместимость, если окно миграции завершено.
- Обновить документацию контракта и runbook отката/forward-fix.

## Минимальный чеклист на каждую миграцию
- Целевая модель и тип изменения зафиксированы.
- План backfill и критерии успеха зафиксированы.
- Plan pre/post validation зафиксирован.
- Rollout/rollback стратегия зафиксирована.
- Invariant gates зеленые после применения.

## Карточка изменения схемы (обязательно)
Использовать для каждого migration batch без исключений.

```md
### Migration Card: <migration_id_or_name>
- Target model(s):
- Migration type:
  - nullable -> not null / index / constraint / trigger / enum-state policy / other
- Backfill plan:
  - source of truth
  - batching strategy
  - idempotency/resume strategy
- Post-backfill validation plan:
  - SQL checks
  - invariant checks (`pnpm lint:tenant-context:enforce`, `pnpm gate:invariants:enforce`)
  - acceptance criteria
```

### Migration Card: 20260216152000_finance_replay_recon_locking
- Target model(s):
  - `EconomicEvent` (replay/dedup key path)
  - `CashAccount` (optimistic lock/version update path)
- Migration type:
  - index/constraint + schema hardening for reconciliation/replay safety
- Backfill plan:
  - source of truth: existing `EconomicEvent` stream and account rows
  - strategy: idempotent SQL with defensive guards, no destructive rewrite
  - resume: migration can be re-run safely via guarded DDL
- Post-backfill validation plan:
  - SQL checks: uniqueness/constraint presence + table existence guards
  - invariant checks: `pnpm lint:tenant-context:enforce`, `pnpm gate:invariants:enforce`
  - acceptance: `tenant_context_suspects=0`, `violations=0`

## Команды обязательной валидации
```bash
pnpm lint:tenant-context:enforce
pnpm gate:invariants:enforce
```

## Phased Migration: `companyId` (обязательный 4-step)
Применяется для новых и проблемных моделей, где tenant-контракт отсутствует или неполный.

### Шаг 1: Nullable поле + индекс (expand)
- Добавить `companyId` как nullable.
- Добавить индекс на `companyId` (и composite индекс, если нужен для hot-path).
- Не включать `NOT NULL` и жёсткие FK/constraints на этом шаге.

### Шаг 2: Пакетный backfill
- Заполнить `companyId` из source-of-truth (родительский aggregate, join-таблица, audit trail).
- Делать батчами с checkpoint/cursor.
- Повторный запуск должен быть идемпотентным.

### Шаг 3: Dual-write в коде
- Включить запись `companyId` для новых транзакций во всех write-path.
- Оставить обратную совместимость чтения на период стабилизации.
- Контроль: новые записи без `companyId` должны считаться нарушением контракта.

### Шаг 4: Consistency check + enforce
- Проверить, что `companyId IS NULL` больше не встречается.
- Прогнать post-backfill SQL и invariant проверки.
- После успешной валидации включить `NOT NULL` и связанные constraints/FK.

### Acceptance criteria
- NULL-хвост отсутствует (`companyId IS NULL = 0`).
- Все write-path пишут `companyId` (dual-write активен).
- `pnpm lint:tenant-context:enforce` и `pnpm gate:invariants:enforce` зеленые.

## OutboxMessage Tenant Contract (отдельно)
Решение: для `OutboxMessage` обязателен tenant-aware envelope в payload.

- Основной контракт:
  - `payload.companyId` обязателен для доменных событий.
- Исключение:
  - системные события допускаются только через явный `allowSystemScope=true`.
- Runtime guard:
  - publisher path блокирует создание outbox-события без tenant-контракта.
  - relay path переводит сообщение в `FAILED` при нарушении tenant-контракта.

### Backfill существующих outbox-записей
- Статус: `executed` (2026-02-16, текущий контур; `missing_before=0`, `missing_after=0`).
- Подход:
  - определить source-of-truth для `companyId` по `aggregateType/aggregateId`;
  - пакетно заполнить `payload.companyId` для legacy записей;
  - записи без восстановимого tenant пометить в quarantine/unknown bucket.
- Инструмент выполнения:
  - `pnpm backfill:outbox-companyid` (dry-run)
  - `pnpm backfill:outbox-companyid -- --apply` (apply)

### Publish check без tenant context
- Техническое правило:
  - публикация без `payload.companyId` запрещена (кроме `allowSystemScope=true`).
- Проверка:
  - unit test `apps/api/src/shared/outbox/outbox.service.spec.ts`
  - invariant gates после изменений обязательны.

## Constraint Rollout: `warn -> enforce` (immutability / ledger / FSM)
Принцип: сначала наблюдаем и фиксируем baseline ложных/реальных срабатываний, только потом включаем блокирующий режим.

### Фаза 1: Warn mode
- DB/runtime правила работают в режиме сигнализации (метрики/логи), без блокировки бизнес-операций.
- Сбор baseline минимум 7 дней или 1 полный бизнес-цикл (что больше).
- Обязательные метрики:
  - `financial_invariant_failures_total`
  - `illegal_transition_attempts_total`
  - tenant violation metrics для связанных write-path.

### Гейт перехода в Enforce
- Все обязательные проверки зеленые:
  - `pnpm lint:tenant-context:enforce`
  - `pnpm gate:invariants:enforce`
- Нет неклассифицированных alert spikes по invariant метрикам.
- Есть подтвержденный rollback/kill-switch plan для релизного окна.

### Фаза 2: Enforce mode
- Включается блокировка нарушений на runtime/DB уровне.
- Нарушения переводятся в hard-fail с инцидентным маршрутом реагирования.
- Наблюдение в усиленном режиме первые 24-72 часа.

### Rollback trigger
- Резкий рост отказов или критичный бизнес-impact после включения enforce.
- Действия:
  - откат feature flag / режимов enforcement,
  - фиксация инцидента и разбор причины,
  - повторный проход через warn mode перед новым включением.

## Pre/Post Migration Verification Protocol
Этот протокол обязателен для каждого migration batch.

### Pre-migration checks (до применения)
- Schema readiness:
  - проверить наличие целевых таблиц/индексов, от которых зависит миграция.
- Data risk snapshot:
  - зафиксировать объем строк, долю потенциально проблемных записей (NULL/duplicates/orphans).
- Invariant baseline:
  - выполнить `pnpm lint:tenant-context:enforce`
  - выполнить `pnpm gate:invariants:enforce`
  - сохранить результаты в batch-лог.

### Post-migration checks (после применения)
- SQL validation:
  - подтвердить, что новые индексы/constraints действительно применены;
  - проверить отсутствие целевых нарушений (`NULL tail`, duplicate keys, broken references).
- Runtime/invariant validation:
  - повторно выполнить `pnpm lint:tenant-context:enforce`
  - повторно выполнить `pnpm gate:invariants:enforce`
- Acceptance:
  - migration считается завершенной только при зеленом SQL + invariant наборе.

### SQL check template (адаптировать под migration card)
```sql
-- 1) NULL tail check
SELECT COUNT(*) AS null_tail
FROM <table_name>
WHERE <new_column> IS NULL;

-- 2) duplicate check
SELECT <key_columns>, COUNT(*) AS cnt
FROM <table_name>
GROUP BY <key_columns>
HAVING COUNT(*) > 1;

-- 3) referential/orphan check
SELECT COUNT(*) AS orphan_cnt
FROM <child_table> c
LEFT JOIN <parent_table> p ON p.id = c.<parent_id>
WHERE p.id IS NULL;
```
