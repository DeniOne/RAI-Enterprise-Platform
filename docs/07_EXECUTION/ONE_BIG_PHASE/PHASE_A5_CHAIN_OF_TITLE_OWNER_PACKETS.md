---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-OWNER-PACKETS-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-OWNER-PACKETS-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-register.cjs;scripts/phase-a5-chain-of-title-collection.cjs;scripts/phase-a5-chain-of-title-handoff.cjs;scripts/phase-a5-chain-of-title-owner-packets.cjs;var/compliance/phase-a5-chain-of-title-handoff.json;var/compliance/phase-a5-chain-of-title-handoff.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_HANDOFF_PACKET.md
---
# PHASE A5 CHAIN OF TITLE OWNER PACKETS

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-OWNER-PACKETS-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A5 handoff` в отдельные owner-packets для реального сбора `ELP-20260328-09`.

## 1. Что делает этот слой

Он:

- читает `phase-a5-chain-of-title-handoff.json`;
- выпускает отдельный `HANDOFF.md` для каждой owner queue;
- кладёт эти owner packets в restricted perimeter;
- убирает необходимость вручную вырезать свою очередь из общего handoff report.

## 2. Как выпускать

Команда:

- `pnpm phase:a5:chain-of-title:owner-packets`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title:owner-packets`

Restricted output:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/chain-of-title-owner-packets/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/chain-of-title-owner-packets/<owner-scope>/HANDOFF.md`

## 3. Практический эффект

После появления этого слоя:

- `board`, `legal/data governance` и `engineering management` получают свои отдельные handoff-файлы;
- `ELP-09` собирается owner-by-owner, а не по одной большой таблице;
- repo-side подготовка `A5.3` становится owner-ready до фактического external intake.
