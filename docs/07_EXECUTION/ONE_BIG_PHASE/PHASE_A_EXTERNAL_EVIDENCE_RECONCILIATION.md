---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-evidence-reconciliation.cjs;package.json;var/execution/phase-a-external-evidence-reconciliation.json;var/execution/phase-a-external-evidence-reconciliation.md;var/execution/phase-a-external-outreach-ledger.json;var/execution/phase-a-external-reply-capture-packet.json;var/compliance/external-legal-evidence-status.json;var/security/security-evidence-status.json;var/ops/phase-a4-pilot-handoff-status.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md
---
# PHASE A EXTERNAL EVIDENCE RECONCILIATION

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот reconciliation-слой связывает внешний owner queue lifecycle с реальным lifecycle evidence. Он показывает не только `prepared / sent / replied`, но и то, дошёл ли каждый `referenceId` до `received / reviewed / accepted`, есть ли raw reply в drop-zone и можно ли уже закрывать очередь без самообмана.

## 1. Команды

Собрать reconciliation:

- `pnpm phase:a:external-reconciliation`

Проверить gate:

- `pnpm gate:phase:a:external-reconciliation`

Связанные команды:

- `pnpm phase:a:external-reply-capture`
- `pnpm phase:a:external-reply-bridge`
- `pnpm phase:a:closeout`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-evidence-reconciliation.json`
- `var/execution/phase-a-external-evidence-reconciliation.md`

Restricted reconciliation perimeter:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-EVIDENCE-RECONCILIATION/<queue>/RECONCILE.md`

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- по каждой owner queue видно, где именно стоп: нет ответа, нет raw reply, нет intake, нет review, нет accept;
- `Phase A` перестаёт путать “нам ответили” с “блокер реально закрывается”;
- очередь можно закрывать не по ощущению, а только после фактической сверки со status-файлами `A1`, `A2` и `A4`.

## 4. Что именно сверяется

Для каждой owner queue reconciliation сверяет:

- `outreach_status` из `phase-a-external-outreach-ledger`;
- наличие raw reply files в `PHASE-A-EXTERNAL-REPLY-CAPTURE`;
- фактический `requested / received / reviewed / accepted` из:
  - `external-legal-evidence-status`
  - `security-evidence-status`
  - `phase-a4-pilot-handoff-status`

## 5. Что не делает этот слой

- не отправляет сообщения;
- не выполняет `intake`;
- не переводит evidence дальше по lifecycle;
- не закрывает owner queue автоматически.

## 6. Что должно измениться дальше

Следующее реальное изменение после этого слоя:

- очереди с `waiting_capture` должны получить raw reply в drop-zone;
- очереди с `waiting_intake` должны пройти соответствующий `intake`;
- очереди с `waiting_review` и `waiting_acceptance` должны дойти до `accepted`;
- только после этого owner queue можно переводить в `closed` без дрифта между outreach и реальным evidence.
