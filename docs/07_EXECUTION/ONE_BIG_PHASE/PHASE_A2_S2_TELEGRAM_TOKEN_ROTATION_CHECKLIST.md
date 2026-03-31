---
id: DOC-EXE-ONE-BIG-PHASE-A2-S2-TELEGRAM-TOKEN-ROTATION-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-S2-TELEGRAM-TOKEN-ROTATION-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_HISTORICAL_SECRET_AND_KEY_DEBT_CHECKLIST.md;docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md;var/security/secret-scan-report.json
---
# PHASE A2 S2 TELEGRAM TOKEN ROTATION CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-S2-TELEGRAM-TOKEN-ROTATION-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит rotation локальных Telegram token из общей фразы в один конкретный security-шаг.

## 1. Что именно нужно доказать

Нужно подтвердить:

- какие Telegram token считались затронутыми;
- были ли они перевыпущены или инвалидированы;
- где теперь хранится действующий secret;
- что старые значения больше не считаются действующими.

## 2. Текущий статус

- artifact code: `A2-S-02`
- статус: `requested`
- owner perimeter: `techlead / bot-owner / ops`

Связанные restricted-файлы:

- metadata: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/metadata/A2-S-02-telegram-token-rotation.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-02/A2-S-02__telegram-token-rotation-template.md`

Под проверку попадают минимум:

- `mg-core/backend/.env`
- `mg-core/backend/src/mg-chat/.env`

## 3. Что считается достаточным артефактом

Допустимая форма:

- restricted token rotation memo;
- security/admin note с owner sign-off;
- equivalent artifact из secret manager/admin console.

Минимально обязательные поля:

- какой token считался затронутым;
- где он раньше использовался;
- rotation / invalidation action;
- дата действия;
- кто подтвердил;
- куда перемещён текущий действующий secret.

## 4. Пошаговый порядок

### Шаг 1. Открыть template

Открыть:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/security/2026-03-31/templates/A2-S-02/A2-S-02__telegram-token-rotation-template.md`

### Шаг 2. Перечислить затронутые места

Нужно явно вписать:

- все локальные `.env`, где мог остаться старый token;
- какой контур реально его использовал.

### Шаг 3. Зафиксировать rotation / invalidation

Нужно получить owner-sign-off, что старый token больше не используется.

### Шаг 4. Обновить incident closeout

После получения артефакта обновить:

- [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)

## 5. Exit condition

Шаг считается завершённым только когда:

- есть restricted artifact по token rotation;
- старые значения признаны недействительными;
- incident больше не описывает Telegram token rotation как открытый хвост.
