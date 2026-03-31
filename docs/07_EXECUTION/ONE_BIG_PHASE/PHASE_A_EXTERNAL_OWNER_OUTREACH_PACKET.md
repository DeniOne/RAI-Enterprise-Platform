---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-OUTREACH-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-OUTREACH-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-owner-outreach.cjs;scripts/phase-a-external-outreach-ledger.cjs;package.json;var/execution/phase-a-external-owner-outreach.json;var/execution/phase-a-external-owner-outreach.md;var/execution/phase-a-external-outreach-ledger.json;var/execution/phase-a-external-outreach-ledger.md;var/execution/phase-a-external-owner-queues.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_QUEUE_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OUTREACH_LEDGER.md
---
# PHASE A EXTERNAL OWNER OUTREACH PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OWNER-OUTREACH-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот packet превращает `Phase A external owner queues` в ready-to-send outreach messages. Он не заменяет queue/status/gate-слой, а делает следующий практический шаг: даёт готовые owner-facing сообщения по каждой внешней очереди.

## 1. Команды

Собрать outreach packet:

- `pnpm phase:a:external-owner-outreach`

Проверить gate:

- `pnpm gate:phase:a:external-owner-outreach`

Связанные команды:

- `pnpm phase:a:external-owner-queues`
- `pnpm phase:a:external-outreach-ledger`
- `pnpm phase:a:closeout`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-owner-outreach.json`
- `var/execution/phase-a-external-owner-outreach.md`

Restricted outreach packets:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OWNER-OUTREACH/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OWNER-OUTREACH/<queue>/MESSAGE.md`

Следующий operational слой:

- [PHASE_A_EXTERNAL_OUTREACH_LEDGER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OUTREACH_LEDGER.md)

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- owner queues уже можно не только читать, но и отправлять;
- расстояние между packet-слоями и реальным outreach сокращается до одного шага;
- `Phase A` выходит из режима “структура готова” в режим “вот готовые тексты запросов”.

## 4. Что не делает этот packet

- не переводит evidence в `received` автоматически;
- не заменяет intake/runbook;
- не отменяет приоритет `A1 -> A2 -> A4 -> A5`.

## 5. Что должно измениться дальше

После отправки первых outreach messages:

- начнут появляться реальные входящие внешние файлы;
- `requested` начнёт переходить в `received`;
- `Phase A closeout` начнёт двигаться уже не по подготовке packet-слоёв, а по реальным acceptance-изменениям.
- до появления первых входящих ответов этот packet должен вестись через [PHASE_A_EXTERNAL_OUTREACH_LEDGER.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OUTREACH_LEDGER.md), чтобы было видно, что уже отправлено, а что всё ещё лежит только как подготовленный текст.
