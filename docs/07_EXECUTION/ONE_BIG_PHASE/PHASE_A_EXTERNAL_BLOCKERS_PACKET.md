---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-BLOCKERS-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-BLOCKERS-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-blockers-packet.cjs;scripts/phase-a-external-owner-queues.cjs;package.json;var/execution/phase-a-external-blockers-packet.json;var/execution/phase-a-external-blockers-packet.md;var/execution/phase-a-external-owner-queues.json;var/execution/phase-a-external-owner-queues.md;var/execution/phase-a-status.json;var/compliance/phase-a1-owner-queues.json;var/security/security-evidence-status.json;var/ops/phase-a4-pilot-handoff-status.json;var/compliance/phase-a5-status.json;var/compliance/phase-a5-chain-of-title-handoff.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md
---
# PHASE A EXTERNAL BLOCKERS PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-BLOCKERS-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает весь оставшийся внешний blocker-set `Phase A` в один owner-facing packet. Он не заменяет трековые status-gates, а переводит `A1`, `A2`, `A4` и `A5` в один practical handoff для реального внешнего intake.

Для раскладки этого packet по точным очередям исполнителей использовать также [PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md).

## 1. Команды

Собрать packet:

- `pnpm phase:a:external-blockers`

Проверить gate:

- `pnpm gate:phase:a:external-blockers`

Связанные статусы:

- `pnpm phase:a:status`
- `pnpm gate:phase:a:status`

## 2. Что входит

В этот packet входят только внешне удерживаемые треки:

- `A1` — legal / privacy / operator / residency
- `A2` — security evidence
- `A4` — pilot handoff evidence
- `A5` — chain-of-title external evidence

`A0` и `A3` в packet не входят, потому что они уже repo-side завершены и не удерживают фазу внешними артефактами.

## 3. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-blockers-packet.json`
- `var/execution/phase-a-external-blockers-packet.md`

Restricted delivery packet:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-BLOCKERS/REQUEST_PACKET.md`

## 4. Что считается сильным результатом

Сильный результат этого packet-слоя:

- весь остаток `Phase A` открыт одной точкой входа;
- видно не только `blocked_by = A1, A2, A4, A5`, но и конкретные owner очереди;
- legal, security, pilot handoff и chain-of-title больше не разорваны по разным operational пакетам;
- owner-ам можно передавать один consolidated handoff вместо ручной навигации между четырьмя треками.
- поверх этого packet уже можно выпускать и отдельные owner queue handoff без ручной склейки ролей.

## 5. Что должно измениться дальше

После первого реального intake по `ELP-20260328-01` и затем по `A2-S-01`:

- `phase-a-external-blockers-packet` покажет уже не только `requested`, а реальное движение по внешним хвостам;
- `overall_state` в [PHASE_A_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md) сможет перейти из `external_blocked` в `external_in_progress`;
- остаток `Phase A` станет управляемым не только по трекам, но и по единому внешнему execution-пакету.
