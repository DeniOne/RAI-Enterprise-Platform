---
id: DOC-ARC-DATABASE-DB-PHASE-6-STATUS-1VJY
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_PHASE_6_STATUS

## Scope

`Phase 6. Workload-Driven Index Tuning`.

## Done

- [x] Добавлены workload-confirmed composite indexes в schema и migration wave:
- [x] `20260313113000_phase6_workload_index_tuning`.
- [x] Покрыты hot paths для `HarvestPlan`, `Task`, `DeviationReview`, `CmrRisk`, `EconomicEvent`, `LedgerEntry`, `Party`.
- [x] Создан evidence registry: `DB_INDEX_EVIDENCE_REGISTER.md`.
- [x] Добавлен gate: `scripts/check-index-evidence-register.cjs` + `gate:db:index-evidence:enforce`.
- [x] Проверены зеркальные индексы и отдельный кейс `Season(companyId,status)` vs `Season(status,companyId)` (зафиксировано в `DB_INDEX_AUDIT.md`).
- [x] Outbox scope ordering path нормализован: scope-колонки не добавлялись до доказанного workload.
- [x] Принято правило: без evidence speculative indexes на AI/runtime запрещены.
- [x] Выполнен practical evidence-run после миграций: `DB_EXPLAIN_ANALYZE_2026-03-13.md` (`Season`, `Task`, `HarvestPlan`, `Party`).
- [x] Открыт index removal observation window (`14 days`) и зафиксирован стартовый snapshot:
- [x] `DB_INDEX_OBSERVATION_WINDOW_2026-03-13.md`.

## Residual

- [ ] Removal wave для weak/duplicate indexes отложен до завершения observation window.
- [ ] Фактическое удаление low-value индексов допускается только после production query statistics window.
