---
id: DOC-EXE-ONE-BIG-PHASE-A2-S3-GITHUB-ACCESS-REVIEW-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-S3-GITHUB-ACCESS-REVIEW-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_EXTERNAL_ACCESS_GOVERNANCE_CHECKLIST.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;.github/CODEOWNERS
---
# PHASE A2 S3 GITHUB ACCESS REVIEW CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-S3-GITHUB-ACCESS-REVIEW-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает внешний access-governance review в один конкретный шаг по GitHub perimeter.

## 1. Что именно нужно проверить

Нужно внешне подтвердить:

- branch protection для `main`;
- required reviewers;
- обязательные status checks;
- admin bypass policy;
- deploy keys и machine access;
- environments и доступ к secrets.

## 2. Текущий статус

- artifact code: `A2-S-03`
- статус: `requested`
- owner perimeter: `techlead / security / repo-admin`

Связанные restricted-файлы:

- metadata: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata/A2-S-03-github-access-review.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-03/A2-S-03__github-access-review-template.md`
- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-03/A2-S-03__repo-derived-draft.md`

## 3. Что считается достаточным артефактом

Допустимая форма:

- restricted access review memo;
- dated screenshot pack;
- admin export или equivalent review artifact.

Минимально обязательные поля:

- дата review;
- кто проводил;
- branch protection status;
- required reviewers;
- admin bypass policy;
- deploy keys summary;
- environment access summary;
- итоговый verdict: `confirmed` или `gap remains`.

## 4. Пошаговый порядок

### Шаг 1. Открыть template

Открыть:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-03/A2-S-03__github-access-review-template.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-03/A2-S-03__repo-derived-draft.md`

Задача этого шага:

- использовать уже подтверждённые repo-факты как основу;
- не выдавать draft за внешний accepted artifact.

### Шаг 2. Снять GitHub UI snapshot

Нужно руками зафиксировать:

- protection rules
- reviewers
- checks
- environments
- deploy keys

### Шаг 3. Сформировать restricted memo

Нужно собрать один итоговый artifact со status и gap list.

Команда intake:

```bash
pnpm security:evidence:intake -- --reference=A2-S-03 --source=/abs/path/file
```

### Шаг 4. Обновить execution-layer

После получения артефакта обновить:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)

После owner-review:

```bash
pnpm security:evidence:transition -- --reference=A2-S-03 --status=reviewed
pnpm security:evidence:transition -- --reference=A2-S-03 --status=accepted
```

## 5. Exit condition

Шаг считается завершённым только когда:

- restricted access review artifact реально существует;
- branch protection, owner-review, deploy keys и environments описаны;
- `A-2.3.5` можно вывести из `waiting_external`.
