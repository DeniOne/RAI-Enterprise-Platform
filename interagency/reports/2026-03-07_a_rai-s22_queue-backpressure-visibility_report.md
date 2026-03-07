# REPORT — A_RAI S22 Queue & Backpressure Visibility

Дата: 2026-03-07
Промт: `interagency/prompts/2026-03-07_a_rai-s22_queue-backpressure-visibility.md`
Статус: READY_FOR_REVIEW

## Что сделано

- Канонический live source выбран в текущем runtime-контуре: `AgentRuntimeService` теперь пишет per-instance queue snapshots через `QueueMetricsService.beginRuntimeExecution/endRuntimeExecution`.
- Источник не synthetic и не single-instance-only:
  - snapshot берётся из реального количества активных runtime execution и активных tool calls в процессе исполнения;
  - snapshot persist’ится с instance identity;
  - tenant-wide current backlog собирается суммой latest snapshot по всем живым instance внутри окна;
  - snapshot persist’ится в `PerformanceMetric` с `metricType=QUEUE_SIZE`.
- `QueueMetricsService` больше не отдаёт только `last/avg` по stub-контракту:
  - добавлены `peakSize`, `samples`, `lastObservedAt`;
  - добавлен `getQueuePressure(companyId, timeWindowMs)` -> `pressureState`, `signalFresh`, `totalBacklog`, `hottestQueue`, `observedQueues`.
- В explainability API добавлен endpoint `GET /rai/explainability/queue-pressure`.
- `Control Tower` теперь читает live queue/backpressure signal и показывает:
  - `Runtime pressure`;
  - `Backlog depth`;
  - freshness сигнала (`live/stale`);
  - top queue contour (`last / peak`).

## Какой source выбран

Выбран не внешний broker, а канонический source текущей архитектуры: in-process runtime queue gauge вокруг `AgentRuntimeService`.

Причина:

- В текущем Stage 2 нет production queue broker как authority-layer.
- Весь боевой orchestration path уже сходится в `AgentRuntimeService`.
- Значит минимально честный signal перегруза сейчас — это живой счётчик:
  - активных runtime executions;
  - активных tool calls.

Это не “оценка на глаз” и не hand-made число: snapshot берётся из реального execution path и сразу persists в existing observability storage.

## Где signal входит в backend contract

- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`
  - runtime начинает и завершает live queue snapshot вокруг canonical execution path.
- `apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts`
  - хранит local runtime counters только для текущего процесса;
  - persist’ит per-instance snapshots в `PerformanceMetric`;
  - собирает tenant-wide queue/backpressure summary из live rows через aggregation `queueName + instanceId`.
- `apps/api/src/modules/explainability/explainability-panel.service.ts`
  - отдаёт tenant-scoped `QueuePressureResponseDto`.
- `apps/api/src/modules/explainability/explainability-panel.controller.ts`
  - публикует `GET /rai/explainability/queue-pressure`.

## Где signal входит в Control Tower

- `apps/web/lib/api.ts`
  - добавлен `api.explainability.queuePressure(...)`.
- `apps/web/app/(app)/control-tower/page.tsx`
  - панель SLO теперь показывает runtime pressure, backlog depth, signal freshness и queue contour.

## Изменённые файлы

- [agent-runtime.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [queue-metrics.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.ts)
- [queue-metrics.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/performance/queue-metrics.service.spec.ts)
- [agent-runtime.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts)
- [runtime-spine.integration.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts)
- [explainability-panel.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.service.ts)
- [explainability-panel.service.spec.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.service.spec.ts)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [queue-pressure.dto.ts](/root/RAI_EP/apps/api/src/modules/explainability/dto/queue-pressure.dto.ts)
- [rai-chat.module.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.module.ts)
- [supervisor-agent.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts)
- [rai-chat.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.spec.ts)
- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [control-tower-page.spec.tsx](/root/RAI_EP/apps/web/__tests__/control-tower-page.spec.tsx)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [interagency/INDEX.md](/root/RAI_EP/interagency/INDEX.md)
- [2026-03-07_a_rai-s22_queue-backpressure-visibility_report.md](/root/RAI_EP/interagency/reports/2026-03-07_a_rai-s22_queue-backpressure-visibility_report.md)

## Верификация

### API

PASS:

```text
CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles \
  src/modules/rai-chat/performance/queue-metrics.service.spec.ts \
  src/modules/rai-chat/runtime/agent-runtime.service.spec.ts \
  src/modules/explainability/explainability-panel.service.spec.ts \
  src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts
```

Результат: `4 passed, 26 passed`.

### Web

PASS:

```text
CI=1 pnpm --filter web test -- __tests__/control-tower-page.spec.tsx
```

Результат: `1 passed, 1 total`.

### Typecheck

PASS:

```text
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit
```

## Вывод по readiness

Пункт `Есть queue/backpressure visibility` теперь можно честно поднять в `[x]`.

Ограничение зафиксировано явно: текущий source отражает live saturation канонического runtime path, а не внешнюю distributed broker queue. При этом он уже корректен для multi-instance semantics текущего API runtime: snapshots persist’ятся per instance и tenant-wide backlog агрегируется как сумма latest instance state внутри окна. Synthetic fallback больше не нужен.
