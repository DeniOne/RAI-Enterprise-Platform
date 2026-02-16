---
id: DOC-OPS-RUN-137
layer: Operations
type: Runbook
status: approved
version: 1.0.0
---

# CHAOS / GAME DAY RUNBOOK (RU)

Дата: 2026-02-16  
Частота: не реже 1 раза в квартал + после критичных изменений в reliability-контуре.

## 1. Цель
- Проверить устойчивость API/outbox/finance при контролируемых сбоях.
- Подтвердить, что rollback/containment и recovery выполняются в SLA.

## 2. Сценарии
1. `API latency spike`
- Инъекция: рост latency/p95 на критичных маршрутах.
- Ожидание: alert firing, rollout hold, деградация без data loss.

2. `Outbox relay degradation`
- Инъекция: задержки relay + рост retries.
- Ожидание: DLQ policy срабатывает, ordering не нарушается, replay-safe recovery.

3. `Finance invariant pressure`
- Инъекция: дубликаты/конфликтные команды ingestion.
- Ожидание: idempotency guard блокирует дубль, panic mode не активируется.

4. `Tenant isolation guard check`
- Инъекция: попытка cross-tenant запроса в canary-контуре.
- Ожидание: блокировка guard/middleware, инцидент не выходит за scope.

## 3. Процедура
1. Подготовка окна и уведомление stakeholders.
2. Запуск сценариев по одному (без параллельных инъекций).
3. Фиксация timeline: detect -> contain -> recover.
4. Валидация инвариантов и quality gates после recovery.
5. Постмортем с action items и owners.

## 4. Pass/Fail критерии
- PASS:
- нет tenant leakage и financial invariant breaches;
- TTA/TTC/TTR в пределах утверждённого SLA;
- все gates после recovery зелёные.
- FAIL:
- breach SLO/P0 инцидент вне контролируемого сценария;
- несоблюдение SLA containment/recovery;
- незакрытые critical findings без owner/deadline.

## 5. Выходные артефакты
- Drill report (дата, сценарии, метрики, результат PASS/FAIL).
- Обновления runbook/policy при выявленных пробелах.
- Запись в weekly/monthly governance review.
