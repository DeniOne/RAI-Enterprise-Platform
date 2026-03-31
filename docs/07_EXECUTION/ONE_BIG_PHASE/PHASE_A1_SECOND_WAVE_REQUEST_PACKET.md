---
id: DOC-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-REQUEST-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-REQUEST-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-second-wave-request-packet.cjs;package.json;var/compliance/external-legal-evidence-status.json;var/compliance/phase-a1-second-wave-request-packet.json;var/compliance/phase-a1-second-wave-request-packet.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_09_CHAIN_OF_TITLE_CHECKLIST.md
---
# PHASE A1 SECOND WAVE REQUEST PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-REQUEST-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает вторую legal-волну `ELP-02 / 05 / 08 / 09` в один execution-пакет. Он нужен, чтобы после реального движения по первой волне у `A1` сразу была готова следующая owner-очередь без ручной пересборки drafts, checklist-ов и команд.

## 1. Команды

Собрать packet:

- `pnpm phase:a1:second-wave:packet`

Проверить gate:

- `pnpm gate:phase:a1:second-wave:packet`

Общее состояние `A1`:

- `pnpm phase:a1:status`
- `pnpm gate:phase:a1:status`

## 2. Что именно входит

Вторая волна всегда состоит из:

1. `ELP-20260328-02`
2. `ELP-20260328-05`
3. `ELP-20260328-08`
4. `ELP-20260328-09`

Эти четыре артефакта нельзя использовать как замену первой волне. Их задача — продолжить legal closeout сразу после `ELP-01 / 03 / 04 / 06`.

## 3. Что выпускается

Generated evidence:

- `var/compliance/phase-a1-second-wave-request-packet.json`
- `var/compliance/phase-a1-second-wave-request-packet.md`

Restricted handoff:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-SECOND-WAVE/REQUEST_PACKET.md`

## 4. Что считается сильным результатом

Сильный результат этого packet-слоя:

- все четыре reference существуют в legal status report;
- для всех четырёх есть repo-derived draft;
- вторая волна открывается одной owner-facing точкой входа;
- `ELP-09` сразу входит в эту очередь как legal/IP continuation, а не как отдельный потерянный хвост.

Этот слой не заменяет внешний signed evidence. Он нужен, чтобы вторая волна стала execution-ready до того, как команда доберётся до неё фактическим intake.

## 5. Что должно измениться дальше

После завершения первой волны:

1. открыть generated packet второй волны;
2. идти по нему в порядке `ELP-02 -> 05 -> 08 -> 09`;
3. после каждого принятого артефакта пересчитывать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`
   - `pnpm phase:a1:status`
   - `pnpm phase:a1:second-wave:packet`

Эффект этого цикла:

- `A1` не остановится после первой четвёрки;
- вторая волна будет уже заранее собрана как owner-ready очередь;
- legal closeout продолжится без нового слоя организационного дрифта.
