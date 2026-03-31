---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-COLLECTION-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-COLLECTION-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-register.cjs;scripts/phase-a5-chain-of-title-collection.cjs;var/compliance/phase-a5-chain-of-title-source-register.json;var/compliance/phase-a5-chain-of-title-collection.json;var/compliance/phase-a5-chain-of-title-collection.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md
---
# PHASE A5 CHAIN OF TITLE COLLECTION PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-COLLECTION-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `ELP-20260328-09` из карты активов в практическую матрицу сбора внешних evidence-классов.

## 1. Что делает этот packet

Он:

- читает repo-derived source register;
- разворачивает его в collection matrix по классам внешних доказательств;
- показывает, какие активы требуют:
  - `board ownership / licensing`
  - `employment or contractor IP assignment`
  - `database rights / schema authorship`
  - `derived artifact linkage`

## 2. Как выпускать

Команда:

- `pnpm phase:a5:chain-of-title:collection`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title:collection`

Generated output:

- `var/compliance/phase-a5-chain-of-title-collection.json`
- `var/compliance/phase-a5-chain-of-title-collection.md`

## 3. Как использовать для `ELP-20260328-09`

Правильный порядок:

1. Выпустить source register.
2. Выпустить collection packet.
3. Открыть `var/compliance/phase-a5-chain-of-title-collection.md`.
4. Для каждой строки собрать ровно тот внешний документ, который указан в колонке `External document needed`.
5. После сборки пакета использовать его как основу для внешнего `ELP-20260328-09`.

## 4. Практический эффект

После появления этого packet:

- `ELP-09` собирается по evidence-классам, а не по общему ощущению;
- legal owner видит, что относится к employment, что к contractor IP, а что к DB rights;
- repo-side подготовка chain-of-title становится операционной, а не абстрактной.
