---
id: DOC-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-REQUEST-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-REQUEST-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-first-wave-request-packet.cjs;package.json;var/compliance/external-legal-evidence-status.json;var/compliance/phase-a1-first-wave-request-packet.json;var/compliance/phase-a1-first-wave-request-packet.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_04_PROCESSOR_DPA_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_06_LAWFUL_BASIS_CHECKLIST.md
---
# PHASE A1 FIRST WAVE REQUEST PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-REQUEST-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает первую legal-волну `ELP-01 / 03 / 04 / 06` в один execution-пакет. Он нужен, чтобы owner-ы и `techlead` открывали не register, handoff, priority-board и четыре чеклиста по отдельности, а один packet с текущими статусами, draft-путями и готовыми командами.

## 1. Команды

Собрать packet:

- `pnpm phase:a1:first-wave:packet`

Проверить gate:

- `pnpm gate:phase:a1:first-wave:packet`

## 2. Что именно входит

Первая волна всегда состоит из:

1. `ELP-20260328-01`
2. `ELP-20260328-03`
3. `ELP-20260328-04`
4. `ELP-20260328-06`

Эти четыре артефакта сильнее всего двигают `A1` из чистого `waiting_external`.

## 3. Что выпускается

Generated evidence:

- `var/compliance/phase-a1-first-wave-request-packet.json`
- `var/compliance/phase-a1-first-wave-request-packet.md`

Restricted handoff:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-FIRST-WAVE/REQUEST_PACKET.md`

## 4. Что считается сильным результатом

Сильный результат этого packet-слоя:

- все четыре reference существуют в legal status report;
- для всех четырёх есть repo-derived draft;
- для всех четырёх есть micro-checklist;
- packet даёт готовые `intake / reviewed / accepted` команды без ручной сборки.

Этот слой не заменяет внешний signed evidence. Он нужен, чтобы первая волна была execution-ready одной точкой входа.

## 5. Что должно измениться дальше

После появления реального внешнего файла по любой позиции:

1. выполнить `pnpm legal:evidence:intake`
2. выполнить `pnpm legal:evidence:transition -- --status=reviewed`
3. выполнить `pnpm legal:evidence:transition -- --status=accepted`
4. пересчитать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`
   - `pnpm phase:a1:first-wave:packet`

Эффект этого цикла:

- пакет покажет не только `requested`, а начнёт фиксировать реальное движение по первой legal-четвёрке;
- `A1` перестанет быть абстрактным legal backlog и станет видимой execution-очередью.
