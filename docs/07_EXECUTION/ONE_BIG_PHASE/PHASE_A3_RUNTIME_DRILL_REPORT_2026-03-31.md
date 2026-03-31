---
id: DOC-EXE-ONE-BIG-PHASE-A3-RUNTIME-DRILL-REPORT-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A3-RUNTIME-DRILL-REPORT-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/ops/phase-a4-advisory-oncall-drill-2026-03-31.json;var/ops/phase-a3-stage-progression-2026-03-31.json;var/ops/phase-a4-advisory-dr-rehearsal-2026-03-31.json;apps/api/scripts/ops/advisory-oncall-drill.mjs;apps/api/scripts/ops/advisory-stage-progression.mjs;apps/api/scripts/ops/advisory-dr-rollback-rehearsal.mjs;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_RELEASE_EVAL_SUITE.md
---
# PHASE A3 RUNTIME DRILL REPORT 2026-03-31

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A3-RUNTIME-DRILL-REPORT-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот отчёт фиксирует первый реальный runtime baseline для `A3.4` поверх advisory rollout scripts.

## 1. Что было проверено

В этой сессии выполнены и сохранены в `var/ops` три runtime-drill:

- [phase-a4-advisory-oncall-drill-2026-03-31.json](/root/RAI_EP/var/ops/phase-a4-advisory-oncall-drill-2026-03-31.json)
- [phase-a3-stage-progression-2026-03-31.json](/root/RAI_EP/var/ops/phase-a3-stage-progression-2026-03-31.json)
- [phase-a4-advisory-dr-rehearsal-2026-03-31.json](/root/RAI_EP/var/ops/phase-a4-advisory-dr-rehearsal-2026-03-31.json)

Одновременно был найден и устранён repo-side drift:

- ops scripts не передавали `Idempotency-Key` для mutating advisory endpoints;
- после исправления это требование API больше не ломает rehearsal path.

## 2. Drill summary

| Drill | Что проверяет | Итог |
|---|---|---|
| `advisory-oncall-drill.mjs` | gate fail, kill-switch, rollback, audit trail | `PASS` |
| `advisory-stage-progression.mjs` | безопасная `S1 -> S2 -> S3` progression | `PASS` |
| `advisory-dr-rollback-rehearsal.mjs` | containment и возврат в `S1` | `PASS` |

## 3. Подтверждённые runtime-факты

- high-impact advisory mutations теперь проходят только с явным `Idempotency-Key`;
- `kill-switch` реально отключает pilot path;
- rollback до `S1` реально отрабатывает;
- audit traces для kill-switch, rollback и gate-evaluation реально появляются;
- progression `S1 -> S3` и обратный возврат `S3 -> S1` воспроизводимы в локальной среде.

## 4. Что это даёт для `A3`

Этот пакет ещё не равен полному release eval suite, но он уже даёт:

- реальный runtime-derived fixture baseline;
- machine-readable outputs в `var/ops`;
- подтверждение, что advisory runtime жив и пригоден для formalization в evaluator layer.

## 5. Что ещё не закрыто

`A3.4` остаётся `in_progress`, потому что пока отсутствуют:

- единый evaluator runner;
- formal pass/fail manifest по всем safety clusters;
- consolidated machine-readable release gate, который бы падал на regression автоматически.

## 6. Decision impact

Этот отчёт:

- усиливает `A3.4` фактическим runtime evidence;
- переводит discussion про eval suite из чисто документарной в executable плоскость;
- не закрывает `A3`, но снимает часть неопределённости по advisory runtime и approval path.
