---
id: DOC-EXE-ONE-BIG-PHASE-A1-LEGAL-CLOSEOUT-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.8.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-LEGAL-CLOSEOUT-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_OWNER_QUEUE_PACKET.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;var/compliance/external-legal-evidence-verdict.md;var/compliance/external-legal-evidence-priority-board.md;var/compliance/external-legal-evidence-handoff.md;var/compliance/phase-a1-first-wave-request-packet.md;var/compliance/phase-a1-first-wave-status.md;var/compliance/phase-a1-second-wave-request-packet.md;var/compliance/phase-a1-priority-eight-request-packet.md;var/compliance/phase-a1-owner-queues.md;var/compliance/phase-a1-status.md
---
# PHASE A1 LEGAL CLOSEOUT PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-LEGAL-CLOSEOUT-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A1` из общей формулировки “закрыть legal” в прямую рабочую очередь по `ELP-*` артефактам, владельцам и командам.

Для общего machine-readable состояния всего `A1` использовать также [PHASE_A1_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_STATUS_GATE.md).

Для самой первой рабочей волны `ELP-01 / 03 / 04 / 06` использовать также [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md).

Для owner-facing packet по этой же четвёрке использовать также [PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_REQUEST_PACKET.md).

Для machine-readable статуса этой же четвёрки использовать также [PHASE_A1_FIRST_WAVE_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_STATUS_GATE.md).

Для второй волны `ELP-02 / 05 / 08 / 09` использовать также [PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md).

Для owner-facing packet второй волны использовать также [PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_REQUEST_PACKET.md).

Для unified owner-facing packet всей priority-eight использовать также [PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md).

Для owner-by-owner handoff очередей использовать также [PHASE_A1_OWNER_QUEUE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_OWNER_QUEUE_PACKET.md).

## 1. Текущее состояние `A1`

На текущий момент:

- `current_verdict = NO-GO`
- `next_target_verdict = CONDITIONAL GO`
- `accepted = 0 / 11`
- приоритетных blockers до `CONDITIONAL GO = 8`

Текущее фактическое состояние:

- все `ELP-*` ещё в статусе `requested`
- `received = 0`
- `reviewed = 0`
- `accepted = 0`

Это означает:

- `A1` не двигается на внутренних заметках;
- нужен реальный внешний intake;
- пока не начнётся intake, `Phase A` по legal фактически стоит на месте.

## 2. Порядок закрытия

Исполнять только в этом порядке:

1. `ELP-20260328-01` — operator identity and role memo
2. `ELP-20260328-03` — hosting / residency attestation
3. `ELP-20260328-04` — processor / subprocessor register + `DPA`
4. `ELP-20260328-06` — lawful basis matrix + privacy notice pack
5. `ELP-20260328-02` — РКН notification evidence / exemption memo
6. `ELP-20260328-05` — transborder decision log
7. `ELP-20260328-08` — retention / deletion / archive schedule approval
8. `ELP-20260328-09` — first-party chain-of-title pack

Нельзя:

- начинать с `ELP-07`, `ELP-10`, `ELP-11`, пока не двинулась приоритетная восьмёрка;
- считать repo-derived draft закрытием;
- переводить карточку в `received` без реального внешнего файла.

## 3. Рабочая очередь `A1`

| Priority | Reference ID | Артефакт | Главные owners | Draft path | Intake command | Review command | Accept command |
|---:|---|---|---|---|---|---|---|
| 1 | `ELP-20260328-01` | Operator identity and role memo | `@board_of_directors`, `@chief_legal_officer`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-01/ELP-20260328-01__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=accepted` |
| 2 | `ELP-20260328-03` | Hosting / residency attestation | `@backend-lead`, `@chief_legal_officer`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-03/ELP-20260328-03__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-03 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-03 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-03 --status=accepted` |
| 3 | `ELP-20260328-04` | Processor / subprocessor register + `DPA` pack | `@backend-lead`, `@chief_legal_officer` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-04/ELP-20260328-04__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-04 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-04 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-04 --status=accepted` |
| 4 | `ELP-20260328-06` | Lawful basis matrix + privacy notice pack | `@chief_legal_officer`, `@product_lead`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-06/ELP-20260328-06__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-06 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-06 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-06 --status=accepted` |
| 5 | `ELP-20260328-02` | РКН notification evidence / exemption memo | `@chief_legal_officer` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-02/ELP-20260328-02__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-02 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-02 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-02 --status=accepted` |
| 6 | `ELP-20260328-05` | Transborder decision log | `@backend-lead`, `@chief_legal_officer`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-05/ELP-20260328-05__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-05 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-05 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-05 --status=accepted` |
| 7 | `ELP-20260328-08` | Retention / deletion / archive schedule approval | `@backend-lead`, `@chief_legal_officer`, `@data-architecture` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-08/ELP-20260328-08__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-08 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-08 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-08 --status=accepted` |
| 8 | `ELP-20260328-09` | First-party chain-of-title pack | `@board_of_directors`, `@chief_legal_officer` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-09/ELP-20260328-09__repo-derived-draft.md` | `pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=reviewed` | `pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=accepted` |

## 4. Режим исполнения

Для каждого `ELP-*` идти только так:

1. Открыть соответствующий draft.
2. Дозаполнить внешние реквизиты и приложить реальный внешний файл.
3. Выполнить `intake`.
4. После проверки owner-ом перевести в `reviewed`.
5. После sync register/docs/verdict перевести в `accepted`.
6. Сразу прогнать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`

После каждого `accepted` также пересчитывать:

- `pnpm legal:evidence:handoff`
- `pnpm legal:evidence:owner-packets`
- `pnpm legal:evidence:priority-board`

## 5. Что обновлять в execution-пакете

После каждого движения по `A1` обновлять:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- при необходимости [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md), если изменилась форма исполнения трека

Board должен меняться так:

- `waiting_external` -> `in_progress` после появления реального intake;
- `in_progress` -> `done` только после `accepted` и подтверждённого сдвига verdict или blocker-set;
- если нет внешнего файла, статус не повышать.

## 6. Условие выхода для `A1`

Трек `A1` считается закрытым только когда одновременно выполняются условия:

- `Legal / Compliance` перестаёт быть безусловным `NO-GO` для `Tier 1`;
- приоритетная восьмёрка перестаёт висеть в чистом `requested`;
- в board строки `A-2.2.1`, `A-2.2.2`, `A-2.2.3` уходят из `waiting_external`;
- verdict и blocker-set в `var/compliance/external-legal-evidence-verdict.*` меняются не на словах, а машинно.
