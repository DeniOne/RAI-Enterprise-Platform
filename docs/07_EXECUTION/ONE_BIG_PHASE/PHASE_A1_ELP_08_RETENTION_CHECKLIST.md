---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP08-RETENTION-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP08-RETENTION-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md
---
# PHASE A1 ELP-08 RETENTION CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP08-RETENTION-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-08` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-08` — это внешний документ, который подтверждает:

- сроки хранения;
- триггеры удаления;
- archive rules;
- `legal hold` правила.

Без этой карточки retention остаётся частично описанной, но не утверждённой.

## 2. Что должно быть внутри файла

Минимально обязательные поля:

- основные data classes;
- срок хранения;
- trigger удаления;
- archive rule;
- `legal hold` carve-outs;
- owner/sign-off.

## 3. Порядок исполнения

1. Открыть draft и template.
2. Заполнить retention matrix.
3. Добавить delete/archive/legal-hold rules.
4. Сохранить внешний файл.
5. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-08 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-08 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-08 --status=accepted
pnpm legal:evidence:verdict
```

## 4. Что должно измениться после acceptance

- retention contour перестаёт быть только runbook-level описанием;
- `A1` получает утверждённый schedule хранения и удаления;
- legal verdict получает более полный privacy/data-governance слой.
