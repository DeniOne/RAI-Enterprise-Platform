---
id: DOC-ARC-DATABASE-DB-PHYSICAL-SPLIT-DECISION-3P4D
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHYSICAL_SPLIT_DECISION

## Decision (2026-03-13)

Текущее решение: **оставить одну физическую Postgres БД**.

## Rationale

- Phase 0-3 логическая стабилизация еще не завершена полностью.
- Phase 7 operational aggregate migration еще не прошел production wave loop.
- Доказанный physical bottleneck для split не зафиксирован.

## Allowed next step before split

- logical fragments + ownership + CI gates;
- selective archival contour;
- optional Postgres schemas/namespaces без multi-DB split.

## Re-evaluation triggers

Physical split рассматривается только если есть доказательства:
- sustained write saturation;
- security/privilege boundary pressure, не решаемый в single DB;
- archive/event/AI contour load, создающий measurable bottleneck.

## Hard rule

`schema.prisma size` или организационный дискомфорт не являются достаточным основанием для physical split.
