---
id: DOC-ARC-DATABASE-DB-PHASE-8-STATUS-848C
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHASE_8_STATUS

## Scope

`Phase 8. Decide Physical Split Only If Proven`.

## Done

- [x] Выпущен decision record: `DB_PHYSICAL_SPLIT_DECISION.md`.
- [x] Текущее решение: оставить одну физическую Postgres БД.
- [x] Зафиксированы re-evaluation triggers и hard rule против split-by-size.
- [x] Зафиксирован `MG-Core` contour decision: `DB_MG_CORE_DECISION_NOTE.md`.

## Residual

- [ ] Пересмотр решения только по факту доказанного bottleneck.
