---
id: DOC-EXE-ONE-BIG-PHASE-A1-PRIORITY-EIGHT-REQUEST-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-PRIORITY-EIGHT-REQUEST-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-priority-eight-request-packet.cjs;package.json;var/compliance/external-legal-evidence-status.json;var/compliance/external-legal-evidence-verdict.json;var/compliance/phase-a1-status.json;var/compliance/phase-a1-first-wave-request-packet.json;var/compliance/phase-a1-second-wave-request-packet.json;var/compliance/phase-a1-priority-eight-request-packet.json;var/compliance/phase-a1-priority-eight-request-packet.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md
---
# PHASE A1 PRIORITY EIGHT REQUEST PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-PRIORITY-EIGHT-REQUEST-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает всю critical priority-eight `A1` в один owner-facing packet. Он не отменяет wave-order и не разрешает прыгать сразу во вторую волну, а даёт один входной файл для всего legal-пути до `CONDITIONAL GO`.

## 1. Команды

Собрать packet:

- `pnpm phase:a1:priority-eight:packet`

Проверить gate:

- `pnpm gate:phase:a1:priority-eight:packet`

Общее состояние `A1`:

- `pnpm phase:a1:status`
- `pnpm gate:phase:a1:status`

## 2. Что именно входит

В этот packet всегда входят:

1. `ELP-20260328-01`
2. `ELP-20260328-03`
3. `ELP-20260328-04`
4. `ELP-20260328-06`
5. `ELP-20260328-02`
6. `ELP-20260328-05`
7. `ELP-20260328-08`
8. `ELP-20260328-09`

То есть весь legal blocker-set, который удерживает переход `NO-GO -> CONDITIONAL GO`.

## 3. Что выпускается

Generated evidence:

- `var/compliance/phase-a1-priority-eight-request-packet.json`
- `var/compliance/phase-a1-priority-eight-request-packet.md`

Restricted handoff:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-PRIORITY-EIGHT/REQUEST_PACKET.md`

## 4. Что считается сильным результатом

Сильный результат этого packet-слоя:

- обе priority-wave уже собраны в один owner-facing файл;
- wave-order `first -> second` остаётся зафиксированным;
- рядом с packet видны `current_state`, `tier1_state`, `first_wave_state`, `second_wave_state`;
- legal closeout до `CONDITIONAL GO` больше не зависит от переключения между несколькими packet-слоями.

Этот слой не заменяет внешний signed evidence. Он нужен, чтобы весь critical legal path открывался одной точкой входа.

## 5. Что должно измениться дальше

После первого реального intake по `ELP-20260328-01`:

1. `pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file`
2. `pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=reviewed`
3. `pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=accepted`
4. пересчитать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`
   - `pnpm phase:a1:first-wave:status`
   - `pnpm phase:a1:status`
   - `pnpm phase:a1:priority-eight:packet`

Эффект этого цикла:

- unified priority-eight packet начнёт показывать не только структуру, но и фактическое движение;
- `A1` перестанет быть просто внешне заблокированным legal-пакетом и начнёт двигаться по реально принятым артефактам;
- путь до `CONDITIONAL GO` станет наблюдаемым одной командой и одним packet-файлом.
