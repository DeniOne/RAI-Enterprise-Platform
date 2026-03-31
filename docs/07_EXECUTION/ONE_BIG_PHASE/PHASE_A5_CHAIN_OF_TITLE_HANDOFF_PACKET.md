---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-HANDOFF-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-HANDOFF-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-register.cjs;scripts/phase-a5-chain-of-title-collection.cjs;scripts/phase-a5-chain-of-title-handoff.cjs;var/compliance/phase-a5-chain-of-title-source-register.json;var/compliance/phase-a5-chain-of-title-collection.json;var/compliance/phase-a5-chain-of-title-handoff.json;var/compliance/phase-a5-chain-of-title-handoff.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_COLLECTION_PACKET.md
---
# PHASE A5 CHAIN OF TITLE HANDOFF PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-HANDOFF-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `ELP-20260328-09` из collection matrix в owner-ready handoff очередь.

## 1. Что делает этот packet

Он:

- читает repo-derived source register;
- читает collection packet по evidence-классам;
- раскладывает активы по owner queues;
- показывает, кто именно должен собрать какой внешний документ для `ELP-20260328-09`.

## 2. Как выпускать

Команда:

- `pnpm phase:a5:chain-of-title:handoff`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title:handoff`

Generated output:

- `var/compliance/phase-a5-chain-of-title-handoff.json`
- `var/compliance/phase-a5-chain-of-title-handoff.md`

## 3. Как использовать для `ELP-20260328-09`

Правильный порядок:

1. Выпустить source register.
2. Выпустить collection packet.
3. Выпустить handoff packet.
4. Открыть `var/compliance/phase-a5-chain-of-title-handoff.md`.
5. Для каждой owner queue собрать только те внешние документы, которые перечислены в её таблице.
6. После сбора owner-пакета использовать его как основу для внешнего `ELP-20260328-09`.

## 4. Практический эффект

После появления этого packet:

- `ELP-09` собирается по owner queues, а не по общей таблице;
- legal owner видит, что идёт к `board`, что к `engineering management`, а что к `data governance`;
- repo-side подготовка chain-of-title становится handoff-ready, а не только collection-ready.
