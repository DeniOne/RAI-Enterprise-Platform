---
id: DOC-OPS-RUN-133
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# OUTBOX REPLAY SAFE RUNBOOK (RU)

Дата: 2026-02-16
Область: безопасный replay событий из outbox/DLQ.

## 1. Когда запускать replay
- После устранения причины падения consumer/broker.
- После исправления contract/schema ошибки.
- После подтверждения, что idempotency store активен.

## 2. Preconditions (обязательные)
- `OUTBOX_DELIVERY_MODE` зафиксирован для выбранной стратегии (`broker_only` или `dual`).
- Consumer idempotency store работает (`event_consumptions` write/read OK).
- Нет активного `financial panic mode`.
- Есть свежий backup и назначен ответственный on-call.

## 3. Dry-run (без фактической доставки)
1. Выбрать окно replay (`createdAt`/`type`/tenant scope).
2. Подсчитать объём `FAILED` и `PENDING` сообщений.
3. Проверить долю потенциальных дублей:
- пересечение с `event_consumptions` по `(consumer,eventId)`;
- события с одинаковым `type+aggregateId`.
4. Если найден tenant-contract breach, replay запрещён до фикса.

## 4. Controlled replay
1. Запускать батчами (например, 50-200 сообщений).
2. Сначала canary tenant/cohort, потом расширение.
3. После каждого батча проверять:
- `outbox_failed_messages`;
- `outbox_oldest_pending_age_seconds`;
- `invariant_event_duplicates_prevented_total`;
- tenant leakage counters.
4. При росте критичных инвариантов -> немедленный stop.

## 5. Stop criteria (авто/ручной стоп)
- Любой cross-tenant инцидент.
- Рост `financial_invariant_failures_total`.
- Рост DLQ после replay-батча.
- Повторяемые contract ошибки на одном типе события.

## 6. Recovery после stop
1. Остановить replay.
2. Вернуть поток в безопасный режим (`local_only` или pause producer path).
3. Зафиксировать failing sample set и root cause.
4. Подготовить fix + regression test.
5. Повторный replay только после Go/No-Go апрува.

## 7. Post-check и завершение
- Все replay-сообщения перешли в `PROCESSED` или обоснованный `FAILED`.
- Нет роста critical invariant alerts в течение 30 минут.
- Обновлён weekly invariant trend report.
- Постмортем создан для каждого P0/P1 отклонения.

