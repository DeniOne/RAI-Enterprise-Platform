---
id: DOC-ARC-ADR-011
layer: Architecture
type: ADR
status: Draft
version: 1.0.0
---

# ADR 011: Ledger Safety Requires Architectural Redesign

## Контекст
Текущие улучшения Ledger сделаны как PoC-level hardening (DB constraints/triggers, idempotency key, panic-mode).
Этого недостаточно для долгосрочной финансовой целостности при росте нагрузки и числа интеграций.

Риски локального refactor подхода:
- частичное покрытие invariants на уровне отдельных сервисов;
- drift между модулями `finance <-> consulting <-> integrations`;
- отсутствие единого canonical financial lifecycle (`journal/posting/settlement`).

## Решение
Зафиксировать: дальнейшее усиление Ledger выполняется как архитектурный redesign, а не как набор локальных refactor-правок.

Целевая модель redesign:
1. Явный журнал финансовых событий (`journal`) как source of truth.
2. Нормализованные проводки (`postings`) с жесткой double-entry симметрией.
3. Слой расчетов/закрытия (`settlement`) отделен от ingest.
4. Стандартизированный idempotency/replay контракт на уровне domain boundary.
5. Единый lifecycle и invariants, применимые ко всем финансовым входам.

## Границы и совместимость
- Поддержать phased migration: `expand -> backfill -> validate -> enforce -> contract`.
- До полного cutover допускается dual-write/dual-read с явной консистентностной валидацией.
- Все breaking изменения контрактов фиксируются отдельными ADR/contract docs.

## Последствия
Плюсы:
- устойчивость финансовых инвариантов как свойства архитектуры, а не отдельных обработчиков;
- предсказуемость replay/recovery;
- снижение риска скрытой финансовой порчи данных.

Минусы:
- выше стоимость внедрения (схемы, миграции, интеграционные контракты);
- требуется staged rollout и управляемое migration окно.

## Критерии завершения redesign-фазы
1. Double-entry симметрия технически не может быть нарушена бизнес-кодом.
2. Replay/duplicate protection проходит на ingest и settlement путях.
3. Reconciliation job подтверждает консистентность на продовом срезе.
4. Контракты между finance/consulting/integrations синхронизированы и версионированы.

