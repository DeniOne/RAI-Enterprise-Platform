---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-DELIVERY-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-DELIVERY-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-request-packet.cjs;scripts/phase-a5-chain-of-title-delivery-packet.cjs;var/compliance/phase-a5-chain-of-title-request-packet.json;var/compliance/phase-a5-chain-of-title-request-packet.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_REQUEST_PACKET.md
---
# PHASE A5 CHAIN OF TITLE DELIVERY PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-DELIVERY-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A5 request packet` в один restricted delivery-packet для реального owner handoff по `ELP-20260328-09`.

## 1. Что делает этот слой

Он:

- читает `phase-a5-chain-of-title-request-packet.json`;
- собирает единый restricted `REQUEST_PACKET.md`;
- кладёт его рядом с legal restricted evidence perimeter;
- убирает необходимость вручную собирать итоговый пакет из `var/compliance` и отдельных owner files.

## 2. Как выпускать

Команда:

- `pnpm phase:a5:chain-of-title:delivery-packet`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title:delivery-packet`

Restricted output:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/ELP-20260328-09/REQUEST_PACKET.md`

## 3. Практический эффект

После появления этого слоя:

- `ELP-09` можно отдавать owners уже как один итоговый restricted packet;
- repo-side подготовка `A5.3` доходит до последнего handoff-формата перед signed evidence;
- следующий реальный шаг уже не в docs/runtime, а в сборе и intake внешних документов.
