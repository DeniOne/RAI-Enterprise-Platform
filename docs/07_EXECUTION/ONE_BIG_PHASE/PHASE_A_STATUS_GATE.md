---
id: DOC-EXE-ONE-BIG-PHASE-A-STATUS-GATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-STATUS-GATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-status.cjs;scripts/phase-a-external-blockers-packet.cjs;scripts/phase-a-external-owner-queues.cjs;scripts/phase-a-closeout-status.cjs;package.json;var/execution/phase-a-status.json;var/execution/phase-a-status.md;var/execution/phase-a-external-blockers-packet.json;var/execution/phase-a-external-blockers-packet.md;var/execution/phase-a-external-owner-queues.json;var/execution/phase-a-external-owner-queues.md;var/execution/phase-a-closeout-status.json;var/execution/phase-a-closeout-status.md;var/compliance/phase-a1-status.json;var/security/security-evidence-status.json;var/ops/phase-a3-release-eval-summary-2026-03-31.json;var/ops/phase-a4-pilot-handoff-status.json;var/compliance/phase-a5-status.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md
---
# PHASE A STATUS GATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-STATUS-GATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит всю `Phase A` в один machine-readable status/gate. Он не заменяет `PHASE_A_EXECUTION_BOARD`, а даёт один агрегированный ответ: какие треки уже repo-side закрыты, какие ещё внешне заблокированы и каков реальный общий статус всей фазы.

Для одного consolidated handoff по всем оставшимся внешним хвостам использовать также [PHASE_A_EXTERNAL_BLOCKERS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_BLOCKERS_PACKET.md).

Для owner-by-owner dispatch по этому же внешнему хвосту использовать также [PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md).

Для финального ответа “внутри репозитория ещё осталось что-то кроме внешних evidence или уже нет” использовать также [PHASE_A_CLOSEOUT_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md).

## 1. Что именно проверяется

`phase:a:status` пересобирает и сверяет:

- `var/compliance/phase-a1-status.json`
- `var/security/security-evidence-status.json`
- `var/ops/phase-a3-release-eval-summary-2026-03-31.json`
- `var/ops/phase-a4-pilot-handoff-status.json`
- `var/compliance/phase-a5-status.json`
- supporting execution-docs для `A0`, `A2`, `A3`, `A4`

На выходе публикуются:

- `var/execution/phase-a-status.json`
- `var/execution/phase-a-status.md`

## 2. Команды

Статус:

- `pnpm phase:a:status`

Gate:

- `pnpm gate:phase:a:status`

## 3. Что считается сильным результатом

Сильный результат этого gate:

- все треки `A0–A5` видны одной командой;
- честно видно `overall_state`;
- видно, какие треки уже `repo_side_complete` или `done`;
- видно, какие треки удерживаются внешними evidence;
- становится понятно, осталась ли ещё repo-side работа или фаза уже упёрлась в intake/acceptance.

## 4. Что этот gate не разрешает

Даже при зелёном `pnpm gate:phase:a:status` запрещено считать `Phase A` завершённой, если:

- `overall_state` остаётся `external_blocked`;
- `A1` всё ещё `external_blocked`;
- `A2` security evidence всё ещё не приняты;
- `A4` pilot handoff всё ещё не принят;
- `A5` всё ещё держится на `ELP-20260328-09`.

То есть этот gate подтверждает не “фаза закрыта”, а:

- repo-side слои уже собраны и синхронизированы;
- внешний blocker больше не спрятан в десятках packet-слоёв;
- остаток `Phase A` можно оценить одним машинным снимком.

## 5. Что должно измениться дальше

После первого реального intake по `ELP-20260328-01` и затем по `A2-S-01`:

- `A1` и `A2` перестанут быть чисто `external_blocked`;
- `overall_state` сможет перейти из `external_blocked` в `external_in_progress`;
- `Phase A` начнёт двигаться уже не по внутренней подготовке, а по настоящим accepted evidence.

До этого момента `PHASE A STATUS GATE` нужен как честный machine-readable ответ на вопрос:

“мы ещё не собрали саму фазу, или уже упёрлись только во внешние доказательства?”
