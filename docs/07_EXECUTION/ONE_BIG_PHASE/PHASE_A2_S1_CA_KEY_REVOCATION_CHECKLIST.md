---
id: DOC-EXE-ONE-BIG-PHASE-A2-S1-CA-KEY-REVOCATION-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-S1-CA-KEY-REVOCATION-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md;docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md
---
# PHASE A2 S1 CA KEY REVOCATION CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-S1-CA-KEY-REVOCATION-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит хвост по старому `infra/gateway/certs/ca.key` в один конкретный execution-шаг.

## 1. Что именно нужно доказать

Нужно доказать одно из двух:

- старый `ca.key` официально отозван и больше нигде не используется;
- или весь связанный trust-perimeter перевыпущен и старый материал недействителен.

Без этого historical incident остаётся открытым даже при чистом Git-индексе.

## 2. Текущий статус

- artifact code: `A2-S-01`
- статус: `requested`
- owner perimeter: `techlead / ops / infra-owner`

Связанные restricted-файлы:

- metadata: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata/A2-S-01-ca-key-revocation.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-01/A2-S-01__ca-key-revocation-template.md`
- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-01/A2-S-01__repo-derived-draft.md`

## 3. Что считается достаточным артефактом

Допустимая форма:

- infra memo;
- security incident closeout memo;
- certificate authority revocation note;
- equivalent restricted artifact с датой и owner sign-off.

Минимально обязательные поля:

- какой именно key material считался затронутым;
- где он раньше мог использоваться;
- дата удаления из Git/perimeter;
- revocation или reissue действие;
- дата выполнения;
- кто подтвердил;
- текущий статус: `revoked` или `replaced`.

## 4. Пошаговый порядок

### Шаг 1. Открыть template

Открыть:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-01/A2-S-01__ca-key-revocation-template.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/drafts/A2-S-01/A2-S-01__repo-derived-draft.md`

Задача этого шага:

- использовать уже подтверждённые repo-факты как основу;
- не выдавать draft за внешний accepted artifact.

### Шаг 2. Заполнить фактами

Нужно вписать:

- старый perimeter использования;
- точное действие `revoked` или `reissued`;
- дату и ответственного.

### Шаг 3. Положить итоговый restricted artifact

Итоговый файл должен лежать рядом с metadata card в restricted evidence store.

### Шаг 4. Обновить execution-layer

После появления артефакта обновить:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md)

## 5. Exit condition

Шаг считается завершённым только когда:

- restricted artifact реально существует;
- revocation/reissue подтверждён явно;
- historical `ca.key` debt больше не описан как открытый.
