---
id: DOC-ARC-DATABASE-DB-MG-CORE-DECISION-NOTE-CDZ9
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_MG_CORE_DECISION_NOTE

## Decision date

`2026-03-13`

## Decision

`MG-Core` не используется как active runtime contour для current platform.

## Hard prohibitions

- `MG-Core` не используется как parallel production contour.
- `MG-Core` не используется для dual-write.
- `MG-Core` не используется как hot backup active schema.

## Allowed secondary roles

- `read-only archive` для historical lookup.
- `migration sandbox` для rehearsal/backfill/compat testing.
- `reference diff contour` для domain divergence анализа.

## Evaluation matrix result

- `read-only archive`: `approved`.
- `migration sandbox`: `approved`.
- `reference diff contour`: `approved`.
- `selective auxiliary contour`: `deferred`, только при подтвержденной выгоде.
- `parallel active contour`: `rejected`.

## Rationale

- отдельная migration history (`35`) и отдельный schema contour;
- подключение как active source добавляет sync-cost, operational ambiguity и latency risk;
- выгода как historical/reference/sandbox contour сохраняется без dual-source-of-truth.

## Re-evaluation trigger

Пересмотр только при наличии измеримой выгоды, которая одновременно:
- снижает migration-cost;
- не вводит dual-write;
- не ухудшает p95 latency и reliability текущего контура.
