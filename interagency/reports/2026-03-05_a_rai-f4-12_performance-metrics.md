# Отчёт — Performance & Queue Metrics (F4.12)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-12_performance-metrics.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma` — модель `PerformanceMetric`, enum `PerformanceMetricType`, связь `Company.performanceMetrics`
- `apps/api/src/modules/rai-chat/performance/performance-metrics.service.ts` — новый
- `apps/api/src/modules/rai-chat/performance/performance-metrics.service.spec.ts` — новый
- `apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts` — новый
- `apps/api/src/modules/rai-chat/performance/queue-metrics.service.spec.ts` — новый
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — регистрация `PerformanceMetricsService`, `QueueMetricsService`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` — моки `TraceSummaryService`, `AutonomyPolicyService` (для прохождения тестов)
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` — моки `TraceSummaryService`, `AutonomyPolicyService` (для прохождения тестов)

## Реализовано

- **PerformanceMetric:** `id`, `companyId`, `metricType` (LATENCY | ERROR_RATE | QUEUE_SIZE), `agentRole?`, `toolName?`, `value` (Float), `timestamp`
- **PerformanceMetricsService:** `recordLatency(companyId, latencyMs, agentRole?, toolName?)`, `recordError(companyId, agentRole?, toolName?)`, `getAggregatedMetrics(companyId, timeWindowMs)` → successRatePct, avgLatencyMs, p95LatencyMs, byAgent[]
- **QueueMetricsService:** заглушка без внешней очереди: `recordQueueSize(companyId, queueName, size)`, `getQueueMetrics(companyId, timeWindowMs, queueName?)` → lastSize, avgSize по очередям
- Tenant isolation: `getAggregatedMetrics` и `getQueueMetrics` фильтруют строго по `companyId`

## Результаты проверок

### tsc — noEmit (apps/api)
```
PASS
```

### jest (целевые тесты)
```
PASS  performance-metrics.service.spec.ts  4 tests
PASS  queue-metrics.service.spec.ts       2 tests
```

### jest (все rai-chat)
```
Test Suites: 35 passed, 35 total
Tests:       150 passed, 150 total
```

## DoD

- [x] Схема Prisma обновлена
- [x] Метрики агрегируются (среднее, P95, Error Rate / successRatePct)
- [x] Тесты PASS (tsc, jest)
- [x] Unit: агрегация recordLatency — среднее
- [x] Unit: изоляция арендаторов в getAggregatedMetrics

## Примечание

Миграция БД не запускалась (только `prisma generate`). Для прод-деплоя потребуется `prisma migrate dev` или эквивалент для создания таблицы `performance_metrics`.
