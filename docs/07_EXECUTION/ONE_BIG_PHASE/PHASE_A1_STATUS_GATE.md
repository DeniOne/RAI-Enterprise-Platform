---
id: DOC-EXE-ONE-BIG-PHASE-A1-STATUS-GATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-STATUS-GATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-status.cjs;package.json;var/compliance/external-legal-evidence-status.json;var/compliance/external-legal-evidence-verdict.json;var/compliance/phase-a1-first-wave-request-packet.json;var/compliance/phase-a1-first-wave-status.json;var/compliance/phase-a1-status.json;var/compliance/phase-a1-status.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md
---
# PHASE A1 STATUS GATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-STATUS-GATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ собирает `A1` в один machine-readable status/gate. Он не заменяет global `legal:evidence:status` и не заменяет first-wave status, а склеивает их в один управленческий слой по всему legal-треку `A1`.

## 1. Что именно проверяется

`phase:a1:status` пересобирает и сверяет один общий контур:

- `var/compliance/external-legal-evidence-status.json`
- `var/compliance/external-legal-evidence-verdict.json`
- `var/compliance/phase-a1-first-wave-request-packet.json`
- `var/compliance/phase-a1-first-wave-status.json`

На выходе публикуются:

- `var/compliance/phase-a1-status.json`
- `var/compliance/phase-a1-status.md`

## 2. Команды

Статус:

- `pnpm phase:a1:status`

Gate:

- `pnpm gate:phase:a1:status`

## 3. Что считается сильным результатом

Сильный repo-side результат для `A1`:

- первая волна видна как отдельный `state`
- вторая волна видна как отдельный `state`
- priority-eight blocker-set виден отдельно от хвоста `ELP-07 / 10 / 11`
- общий `current_state` честно показывает:
  - `repo_side_incomplete`
  - `external_blocked`
  - `external_in_progress`
  - `closed`

Это означает:

- legal-трек можно читать одной командой;
- стало видно, где `A1` реально движется, а где всё ещё стоит на внешнем intake;
- `Phase A` больше не зависит от ручного сравнения нескольких разных legal-отчётов.

## 4. Что этот gate не разрешает

Даже при зелёном `pnpm gate:phase:a1:status` запрещено считать `A1` закрытой, если:

- priority-eight всё ещё не принята;
- `current_legal_verdict` остаётся `NO-GO`;
- первая волна не сдвинулась из `requested`;
- второй волной пытаются подменить движение по первой.

То есть этот gate подтверждает не “legal закрыт”, а:

- `A1` repo-side собрана без дрифта;
- external blocker больше не спрятан в хаотичных packet-слоях;
- порядок `first wave -> second wave -> tail` наблюдаем машинно.

## 5. Что должно измениться дальше

После первого реального intake по `ELP-20260328-01`:

- `first_wave_state` должен перейти из `not_started` в `in_progress`
- `current_state` должен перейти из `external_blocked` в `external_in_progress`
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) должен оставаться в `waiting_external`, но уже с фактическим движением по первой волне

После завершения первой волны:

- `first_wave_state` должен стать `completed`
- вторая волна становится допустимой верхней очередью
- legal verdict получает реальный шанс перейти из `NO-GO` к следующему уровню

До этого момента `PHASE A1 STATUS GATE` нужен как честный machine-readable ответ на вопрос:

“`A1` уже реально двигается по внешним документам или мы всё ещё только подготовили repo-side слой?”
