---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-QUEUE-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-QUEUE-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-owner-queues.cjs;package.json;var/execution/phase-a-external-owner-queues.json;var/execution/phase-a-external-owner-queues.md;var/execution/phase-a-external-blockers-packet.json;var/compliance/phase-a5-status.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_BLOCKERS_PACKET.md
---
# PHASE A EXTERNAL OWNER QUEUE PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-QUEUE-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает owner queues по всему внешнему хвосту `Phase A`. Он не заменяет [PHASE_A_EXTERNAL_BLOCKERS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_BLOCKERS_PACKET.md), а раскладывает его по точным очередям исполнения: named owners, shared scopes и governance scopes.

## 1. Команды

Собрать owner queues:

- `pnpm phase:a:external-owner-queues`

Проверить gate:

- `pnpm gate:phase:a:external-owner-queues`

Связанные команды:

- `pnpm phase:a:external-blockers`
- `pnpm gate:phase:a:external-blockers`

## 2. Что входит

В owner queues входят только внешние удерживатели фазы:

- `A1` — legal priority-eight owner queues
- `A2` — security evidence owner scopes
- `A4` — pilot handoff owner scope
- `A5` — chain-of-title owner scopes

## 3. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-owner-queues.json`
- `var/execution/phase-a-external-owner-queues.md`

Restricted owner packets:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OWNER-QUEUES/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OWNER-QUEUES/<queue>/HANDOFF.md`

## 4. Что считается сильным результатом

Сильный результат этого слоя:

- весь внешний хвост `Phase A` читается не только по трекам, но и по очередям исполнителей;
- видно, какие очереди single-owner, а какие shared scope;
- legal, security, pilot handoff и chain-of-title можно раздавать по очередям без ручной склейки разных packet-слоёв;
- owner-facing handoff становится адресным, а не “вот вам ещё один общий статус”.

## 5. Что должно измениться дальше

После первого реального движения по `ELP-20260328-01` и `A2-S-01`:

- owner queue summary покажет уже не только `requested`, а переход в `received / reviewed`;
- unified внешний остаток `Phase A` станет читаться не только по трекам, но и по живым owner queues;
- следующее решение можно будет принимать по тому, какая именно очередь реально тормозит фазу, а не просто по `A1/A2/A4/A5`.
