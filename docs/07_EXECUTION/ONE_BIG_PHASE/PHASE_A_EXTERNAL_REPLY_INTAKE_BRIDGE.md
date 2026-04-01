---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-reply-intake-bridge.cjs;scripts/phase-a-external-reply-capture-packet.cjs;package.json;var/execution/phase-a-external-reply-intake-bridge.json;var/execution/phase-a-external-reply-intake-bridge.md;var/execution/phase-a-external-reply-capture-packet.json;var/execution/phase-a-external-outreach-ledger.json;var/execution/phase-a-external-owner-queues.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OUTREACH_LEDGER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md
---
# PHASE A EXTERNAL REPLY INTAKE BRIDGE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот bridge закрывает разрыв между внешним `replied` и реальным evidence intake. Он не заменяет owner outreach и не меняет статус сам по себе, а заранее привязывает каждую внешнюю owner queue к конкретным командам `intake -> reviewed -> accepted`.

## 1. Команды

Собрать bridge:

- `pnpm phase:a:external-reply-bridge`

Проверить gate:

- `pnpm gate:phase:a:external-reply-bridge`

Связанные команды:

- `pnpm phase:a:external-outreach-ledger`
- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=replied --contact=mail@example.com --at=2026-04-02`
- `pnpm phase:a:external-reply-capture`
- `pnpm phase:a:closeout`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-reply-intake-bridge.json`
- `var/execution/phase-a-external-reply-intake-bridge.md`

Restricted bridge perimeter:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-REPLY-INTAKE-BRIDGE/<queue>/INTAKE.md`

Связанный capture-слой:

- [PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md)

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- после внешнего ответа не нужно вручную искать, какой именно `intake` запускать;
- legal, security, pilot handoff и chain-of-title routes заранее собраны по owner queues;
- путь `replied -> intake -> reviewed -> accepted` становится operational, а не держится на памяти.

## 4. Какие маршруты связываются

- `ELP-*` -> `pnpm legal:evidence:intake` и `pnpm legal:evidence:transition`
- `A2-S-*` -> `pnpm security:evidence:intake` и `pnpm security:evidence:transition`
- `A4-H-*` -> `pnpm phase:a4:handoff:intake` и `pnpm phase:a4:handoff:transition`

## 5. Что не делает этот bridge

- не переводит `outreach_status` сам;
- не хранит raw owner reply и вложения;
- не подменяет owner reply;
- не означает, что blocker уже двинулся, пока не выполнен фактический `intake`.

## 6. Что должно измениться дальше

Следующее реальное изменение после этого слоя:

- owner queue должна перейти в `replied`;
- затем raw owner reply нужно положить в capture-perimeter через [PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md);
- затем по её `INTAKE.md` должен выполниться соответствующий `intake`;
- после этого уже трековые lifecycle-команды должны сдвинуть evidence из `received` в `reviewed` и `accepted`.
