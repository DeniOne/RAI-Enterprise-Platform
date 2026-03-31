---
id: DOC-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;var/compliance/external-legal-evidence-priority-board.md;var/compliance/external-legal-evidence-handoff.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md
---
# PHASE A1 SECOND WAVE EXECUTION CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-SECOND-WAVE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ покрывает вторую волну `A1`:

1. `ELP-20260328-02`
2. `ELP-20260328-05`
3. `ELP-20260328-08`
4. `ELP-20260328-09`

Эта четвёрка идёт строго после первой волны `01 / 03 / 04 / 06`.

## 1. Что делать прямо сейчас

Для каждой карточки идти только так:

1. Открыть draft и template.
2. Дозаполнить его внешними реквизитами и реальными данными.
3. Сохранить отдельный внешний файл-источник.
4. Выполнить `intake`.
5. После owner review перевести в `reviewed`.
6. После acceptance перевести в `accepted`.
7. Сразу прогнать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`

## 2. Вторая волна `ELP-02 / 05 / 08 / 09`

| Priority | Reference ID | Что это за файл | Кто должен дать данные | Где лежит draft | Что обязательно вписать | Intake |
|---:|---|---|---|---|---|---|
| 5 | `ELP-20260328-02` | подтверждение по `РКН` или reasoned exemption memo | `@chief_legal_officer` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-02/ELP-20260328-02__repo-derived-draft.md` | notification number/date или reasoned exemption, scope, owner, дата | `pnpm legal:evidence:intake -- --reference=ELP-20260328-02 --source=/abs/path/file` |
| 6 | `ELP-20260328-05` | transborder decision log | `@chief_legal_officer`, `@techlead`, `@backend-lead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-05/ELP-20260328-05__repo-derived-draft.md` | country, categories of data, lawful basis, allow/deny decision, mitigation, owner | `pnpm legal:evidence:intake -- --reference=ELP-20260328-05 --source=/abs/path/file` |
| 7 | `ELP-20260328-08` | approved retention / deletion / archive rules | `@chief_legal_officer`, `@data-architecture`, `@backend-lead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-08/ELP-20260328-08__repo-derived-draft.md` | retention matrix, deletion triggers, archive rules, legal hold | `pnpm legal:evidence:intake -- --reference=ELP-20260328-08 --source=/abs/path/file` |
| 8 | `ELP-20260328-09` | chain-of-title pack | `@chief_legal_officer`, `@board_of_directors` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-09/ELP-20260328-09__repo-derived-draft.md` | employment/contractor/IP transfer evidence, DB rights, commercial-use sufficiency | `pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file` |

## 3. Что считать реальным прогрессом

Реальный прогресс:

- карточки второй волны начинают переходить `requested -> received -> reviewed -> accepted`;
- legal verdict пересчитывается после каждого `accepted`;
- board перестаёт держать вторую волну как чисто теоретический хвост.

Не считать прогрессом:

- новый markdown без внешнего файла;
- draft без `intake`;
- устное подтверждение без артефакта.

## 4. Условие завершения второй волны

Вторая волна считается завершённой только когда:

- `ELP-20260328-02` accepted;
- `ELP-20260328-05` accepted;
- `ELP-20260328-08` accepted;
- `ELP-20260328-09` accepted;
- `pnpm legal:evidence:verdict` показывает дальнейшее уменьшение blocker-set;
- строки `A-2.2.1`, `A-2.2.2`, `A-2.2.3` в board перестают зависеть от этой четвёрки как от чисто внешнего хвоста.
