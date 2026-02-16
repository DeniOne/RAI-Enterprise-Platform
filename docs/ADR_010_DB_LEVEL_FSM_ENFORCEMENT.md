---
id: DOC-ARC-ADR-010
layer: Architecture
type: ADR
status: approved
version: 1.0.0
---

# ADR 010: DB-level FSM Enforcement Strategy

## Decision Update (2026-02-16)
- Strategy selected for DB-level FSM enforcement: `Option A` as primary path.
- Implemented PoC scope: `Task` entity via migration
  `packages/prisma-client/migrations/20260215193000_task_fsm_db_enforcement_poc/migration.sql`.
- `Option B` implemented as fallback for transitional rollout in Task service:
  optimistic lock via guarded `updateMany(where: { id, companyId, status: current })`
  + service-level transition guard.
- `Option C` remains limited tactic for simple FSM only.

## Контекст
Сервисный FSM-контроль в коде недостаточен для invariant-driven архитектуры.  
Риск: прямые `prisma.update` и конкурентные операции могут допускать недопустимые переходы.

## Решение
Принять поэтапную стратегию:

1. `Option A (Primary)`: transition table + DB trigger validation.
2. `Option B (Secondary)`: versioning + optimistic lock + сервисный guard (временная мера).
3. `Option C (Limited)`: CHECK constraints только для простых FSM.

Итоговое целевое состояние: `Option A` для критичных сущностей (`Task`, `Season`, `TechMap`).

## Модель Option A
1. Таблица `fsm_allowed_transition`:
- `entity_type`
- `from_state`
- `to_state`
- `is_enabled`

2. Trigger `BEFORE UPDATE` на целевых таблицах:
- Проверяет, что `OLD.status -> NEW.status` разрешён в `fsm_allowed_transition`.
- При нарушении выбрасывает исключение.

3. Версионирование:
- Поле `version` (int) + optimistic concurrency check.
- Любой переход повышает `version`.

## Rollout
1. PoC на `Task`.
2. Shadow validation (логирование попыток недопустимого перехода).
3. Enforce mode для `Task`.
4. Расширение на `TechMap`, затем `Season`.

## Последствия
Плюсы:
- Детерминизм переходов на уровне БД.
- Защита от обхода сервисного слоя.

Минусы:
- Рост сложности миграций и тестирования.
- Требуются runbook и rollback стратегия на случай ложных блокировок.

## Критерии принятия
1. Недопустимый переход невозможно провести через API/Service/прямой SQL update.
2. Concurrency tests не приводят к неконсистентному state.
3. Метрика `illegal_transition_attempts_total` наблюдаема.
