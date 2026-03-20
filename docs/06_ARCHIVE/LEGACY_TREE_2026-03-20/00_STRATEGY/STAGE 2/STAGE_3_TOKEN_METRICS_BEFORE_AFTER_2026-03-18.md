---
id: DOC-STR-STAGE-2-STAGE-3-TOKEN-METRICS-BEFORE-AFTER-4DDR
layer: Strategy
type: Economics
status: draft
version: 0.1.0
---
# Stage 3 Token Metrics Before/After Report

Дата: 2026-03-18  
Контур: `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`

## Методика

Снят воспроизводимый benchmark-тест:

- файл: `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
- тест: `фиксирует before/after token-cost метрики для legacy-long-text vs stage3-json`
- команда:

```bash
pnpm -C apps/api test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts -t "фиксирует before/after token-cost метрики"
```

Тест сравнивает два режима на одном и том же orchestration path:

1. `legacy-long-text` (до Stage 3 JSON-worker паттерна),
2. `stage3-json` (JSON-worker + trust cross-check pipeline).

Метрика стоимости считается в тесте формулой:

```text
cost_usd = total_tokens / 1000 * 0.002 + latency_ms * 0.000002
```

## Зафиксированный вывод benchmark

```text
[STAGE3_TOKEN_METRICS] {"legacyTokens":2800,"stage3Tokens":1400,"legacyLatencyMs":2,"stage3LatencyMs":2,"legacyCostUsd":0.005604,"stage3CostUsd":0.002804}
```

## Before/After

| Metric | Before (legacy-long-text) | After (stage3-json) | Delta |
|---|---:|---:|---:|
| total tokens | 2800 | 1400 | -50.0% |
| latency (ms) | 2 | 2 | 0.0% |
| estimated cost (USD) | 0.005604 | 0.002804 | -49.96% |

## Вывод

- Stage 3 JSON-worker контур уменьшает token footprint в 2 раза на целевом сценарии benchmark.
- По benchmark latency осталась на том же уровне.
- Интегральная оценка `token+latency cost` снизилась на ~50%, что закрывает критерий `before/after` для чеклиста Stage 3.
