---
id: DOC-EXE-ONE-BIG-PHASE-A-CLOSEOUT-STATUS-GATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-CLOSEOUT-STATUS-GATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-closeout-status.cjs;package.json;var/execution/phase-a-closeout-status.json;var/execution/phase-a-closeout-status.md;var/execution/phase-a-status.json;var/execution/phase-a-external-blockers-packet.json;var/execution/phase-a-external-owner-queues.json
---
# PHASE A CLOSEOUT STATUS GATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-CLOSEOUT-STATUS-GATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот gate отвечает на финальный repo-side вопрос по `Phase A`: осталась ли ещё внутренняя работа внутри репозитория, или фаза уже держится только на внешних evidence.

## 1. Команды

Собрать closeout status:

- `pnpm phase:a:closeout`

Проверить closeout gate:

- `pnpm gate:phase:a:closeout`

Связанные команды:

- `pnpm phase:a:status`
- `pnpm phase:a:external-blockers`
- `pnpm phase:a:external-owner-queues`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-closeout-status.json`
- `var/execution/phase-a-closeout-status.md`

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- видно, выжата ли `Phase A` до упора внутри репозитория;
- видно, какие треки ещё реально держат фазу;
- видно, сколько owner queues и references осталось до реального закрытия;
- появляется честный ответ, закончилась ли repo-side подготовка или нет.

## 4. Что означает `closeout_state`

- `repo_side_work_remaining` — внутри репозитория ещё остаются незакрытые хвосты
- `repo_side_exhausted_external_only` — внутри репозитория работа по фазе фактически выжата, дальше нужны только внешние артефакты
- `phase_a_closed` — `Phase A` закрыта полностью

## 5. Что должно измениться дальше

Следующее реальное изменение этого gate:

- либо `remaining_owner_queues` и `remaining_references_count` начинают уменьшаться после intake внешних evidence;
- либо `closeout_state` поднимается до `phase_a_closed`, когда внешний хвост реально принят.
