---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-REQUEST-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-REQUEST-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-register.cjs;scripts/phase-a5-chain-of-title-collection.cjs;scripts/phase-a5-chain-of-title-handoff.cjs;scripts/phase-a5-chain-of-title-owner-packets.cjs;scripts/phase-a5-chain-of-title-request-packet.cjs;var/compliance/phase-a5-chain-of-title-handoff.json;var/compliance/phase-a5-chain-of-title-request-packet.json;var/compliance/phase-a5-chain-of-title-request-packet.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_OWNER_PACKETS.md
---
# PHASE A5 CHAIN OF TITLE REQUEST PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-REQUEST-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает `A5.3` в один owner-facing request packet перед реальным intake `ELP-20260328-09`.

## 1. Что делает этот слой

Он:

- читает `phase-a5-chain-of-title-handoff.json`;
- проверяет наличие restricted owner packets;
- выпускает единый request packet;
- убирает необходимость собирать общий запрос вручную из нескольких handoff-файлов.

## 2. Как выпускать

Команда:

- `pnpm phase:a5:chain-of-title:request-packet`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title:request-packet`

Generated output:

- `var/compliance/phase-a5-chain-of-title-request-packet.json`
- `var/compliance/phase-a5-chain-of-title-request-packet.md`

## 3. Практический эффект

После появления этого слоя:

- есть один готовый packet для owner-facing сбора `ELP-20260328-09`;
- repo-side подготовка `A5.3` доходит до последней стадии перед real external intake;
- следующий шаг после этого уже не в генерации, а в реальном сборе signed evidence.
