# PROMPT — Performance & Queue Metrics (SLO/Backpressure) (Phase 4.12)
Дата: 2026-03-05
Статус: active
Приоритет: P2

## Цель
Подготовить фундамент для контроля производительности (`SLO / Error Budget` и `Queues & Backpressure Panel`). Нужно научить систему собирать метрики по задержкам (latency) агентов/тулзов, ошибкам и загруженности пула воркеров (супервайзора), агрегируя это для дашбордов.

## Контекст
- **Связанные документы:**
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` (Phase 4, пункты 4.3: SLO / Error Budget, Queues & Backpressure).
- У нас уже есть базис трейсов (`AiAuditEntry`, `TraceSummary`). Теперь нам нужен отдельный агрегатор метрик производительности для дашборда Ops-инженеров: чтобы они видели, например, что `ConsultingAgent` стал отвечать в 3 раза медленнее, или очередь PendingAction/отложенных тасок забита.

## Ограничения
- Фокус на Backend API (Сбор метрик + отдача JSON).
- Изоляция тенантов обязательна (`companyId`).

## Задачи (что сделать)
- [ ] Добавить в Prisma модель `PerformanceMetric` (`id`, `companyId`, `metricType` (LATENCY, ERROR_RATE, QUEUE_SIZE), `agentRole` (опц.), `toolName` (опц.), `value` (Float), `timestamp`).
- [ ] Описать `PerformanceMetricsService`:
  - `recordLatency(companyId, agentRole, toolName, latencyMs)` — пишет стату по выполнению.
  - `recordError(companyId, agentRole, toolName)` — инкрементит счетчик ошибок.
  - `getAggregatedMetrics(companyId, timeWindow)` — возвращает "Error Budget" (% успешных) и средний/P95 latency по агентам за период.
- [ ] Добавить `QueueMetricsService`:
  - Интеграция с очередью (если есть) или заглушка для RabbitMQ/Kafka/BullMQ (сбор текущего размера очереди и количества ретраев). Могут писаться в `PerformanceMetric` с типом QUEUE_SIZE.
- [ ] Покрыть сервисы базовыми unit-тестами (запись и агрегация).

## Definition of Done (DoD)
- [ ] Схема Prisma обновлена.
- [ ] Метрики успешно агрегируются (среднее, P95, Error Rate).
- [ ] Тесты PASS (`tsc`, `jest`).

## Тест-план (минимум)
- [ ] Unit: Агрегация `recordLatency` считает среднее арифметическое.
- [ ] Unit: Изоляция арендаторов при выдаче `getAggregatedMetrics`.

## Что вернуть на ревью
- Изменённые файлы (список)
- Результаты `tsc` & `jest` по пакету
