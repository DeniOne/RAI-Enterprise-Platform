---
id: DOC-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-STATUS-GATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-STATUS-GATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-first-wave-status.cjs;scripts/phase-a1-status.cjs;package.json;var/compliance/phase-a1-first-wave-request-packet.json;var/compliance/external-legal-evidence-verdict.json;var/compliance/phase-a1-first-wave-status.json;var/compliance/phase-a1-first-wave-status.md;var/compliance/phase-a1-status.json;var/compliance/phase-a1-status.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md
---
# PHASE A1 FIRST WAVE STATUS GATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-STATUS-GATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ добавляет для первой legal-волны machine-readable `status/gate`. Его задача простая: показывать одной командой, началось ли реальное движение по `ELP-01 / 03 / 04 / 06`, и как это связано с текущим legal verdict.

Для общего состояния всего legal-трека `A1` использовать также [PHASE_A1_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md).

## 1. Команды

Статус:

- `pnpm phase:a1:first-wave:status`

Gate:

- `pnpm gate:phase:a1:first-wave:status`

## 2. Что именно проверяется

Этот слой читает:

- `var/compliance/phase-a1-first-wave-request-packet.json`
- `var/compliance/external-legal-evidence-verdict.json`

И публикует:

- `var/compliance/phase-a1-first-wave-status.json`
- `var/compliance/phase-a1-first-wave-status.md`

## 3. Что считается полезным результатом

Полезный результат этого gate:

- видно `wave_state = not_started | in_progress | completed`
- видно, сколько из первой четвёрки ещё `requested`
- видно, сколько уже `received / reviewed / accepted`
- видно текущий `Legal / Compliance` verdict рядом с первой волной

Этот gate не заменяет ни intake, ни verdict. Он просто делает первую legal-волну наблюдаемой как отдельный execution-slice.

## 4. Как трактовать состояния

- `not_started`
  - все четыре позиции всё ещё `requested`
  - первая волна остаётся чистым внешним blocker
- `in_progress`
  - хотя бы одна позиция ушла в `received`, `reviewed` или `accepted`
  - `A1` начала двигаться по фактическим файлам, а не по подготовке
- `completed`
  - все четыре позиции приняты
  - первая волна больше не удерживает `A1` в стартовом состоянии

## 5. Что должно измениться дальше

После каждого реального intake по `ELP-01 / 03 / 04 / 06` нужно прогонять:

1. `pnpm legal:evidence:status`
2. `pnpm legal:evidence:verdict`
3. `pnpm phase:a1:first-wave:packet`
4. `pnpm phase:a1:first-wave:status`

Эффект этого цикла:

- первая legal-волна начинает показывать не только пакет готовности, но и факт движения;
- `A1` можно отслеживать уже не на уровне общего legal backlog, а на уровне стартовой критической четвёрки.
