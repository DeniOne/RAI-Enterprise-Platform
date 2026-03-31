---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-CAPTURE-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-CAPTURE-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-reply-capture-packet.cjs;scripts/phase-a-external-evidence-reconciliation.cjs;package.json;var/execution/phase-a-external-reply-capture-packet.json;var/execution/phase-a-external-reply-capture-packet.md;var/execution/phase-a-external-evidence-reconciliation.json;var/execution/phase-a-external-outreach-ledger.json;var/execution/phase-a-external-owner-queues.json;var/execution/phase-a-external-reply-intake-bridge.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md
---
# PHASE A EXTERNAL REPLY CAPTURE PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-CAPTURE-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот packet закрывает практический разрыв между внешним `replied` и реальным `intake`: он заранее создаёт restricted-perimeter, куда нужно положить raw owner reply и вложения по каждому `referenceId`, чтобы дальше использовать уже не почту и память, а конкретный файловый путь.

## 1. Команды

Собрать packet:

- `pnpm phase:a:external-reply-capture`

Проверить gate:

- `pnpm gate:phase:a:external-reply-capture`

Связанные команды:

- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=replied --contact=mail@example.com --at=2026-04-02 --note=получен пакет`
- `pnpm phase:a:external-reply-bridge`
- `pnpm phase:a:external-reconciliation`
- `pnpm phase:a:closeout`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-reply-capture-packet.json`
- `var/execution/phase-a-external-reply-capture-packet.md`

Restricted capture perimeter:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-REPLY-CAPTURE/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-REPLY-CAPTURE/<queue>/CAPTURE.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-REPLY-CAPTURE/<queue>/incoming/<referenceId>/DROP_HERE.md`

Связанный bridge-слой:

- [PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md)

Следующий reconciliation-слой:

- [PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md)

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- у каждого внешнего owner reply появляется одно каноническое restricted-место хранения;
- raw письмо, вложение, скан или screenshot не теряются между чатами, почтой и заметками;
- `intake` можно запускать по заранее понятному файловому пути, а не искать источник вручную;
- `Phase A` получает не только bridge к маршруту, но и operational capture-perimeter для самого внешнего ответа.

## 4. Что делает packet

- создаёт queue-level `CAPTURE.md` по каждой внешней очереди;
- создаёт per-reference drop-zone `incoming/<referenceId>/DROP_HERE.md`;
- заранее показывает, какой `source path` потом подставлять в `intake`;
- не смешивает raw reply с уже переработанными summary.

## 5. Что не делает packet

- не переводит `outreach_status` сам;
- не заменяет `intake -> reviewed -> accepted`;
- не означает, что blocker уже двинулся, пока raw reply не сохранён и intake не выполнен.

## 6. Что должно измениться дальше

Следующее реальное изменение после этого слоя:

- owner queue должна перейти в `replied`;
- raw ответ и вложения нужно положить в соответствующую `incoming/<referenceId>/` drop-zone;
- затем по [PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md) запускается правильный `intake`;
- после `intake` использовать [PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_EVIDENCE_RECONCILIATION.md), чтобы увидеть, дошёл ли `referenceId` до `reviewed/accepted` и можно ли закрывать owner queue;
- после этого evidence уже движется дальше по `reviewed` и `accepted`.
