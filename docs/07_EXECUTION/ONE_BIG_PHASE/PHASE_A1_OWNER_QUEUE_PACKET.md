---
id: DOC-EXE-ONE-BIG-PHASE-A1-OWNER-QUEUE-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-OWNER-QUEUE-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a1-owner-queues.cjs;package.json;var/compliance/phase-a1-owner-queues.json;var/compliance/phase-a1-owner-queues.md;var/compliance/phase-a1-priority-eight-request-packet.json;var/compliance/phase-a1-status.json;var/compliance/external-legal-evidence-verdict.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_PRIORITY_EIGHT_REQUEST_PACKET.md
---
# PHASE A1 OWNER QUEUE PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-OWNER-QUEUE-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ раскладывает `A1 priority-eight` по owner queues. Он не меняет legal priority order, а даёт owner-by-owner handoff, чтобы внешний intake запускался не из одной большой таблицы, а из отдельных очередей ответственности.

## 1. Команды

Собрать owner queues:

- `pnpm phase:a1:owner-queues`

Проверить gate:

- `pnpm gate:phase:a1:owner-queues`

Связанные слои:

- `pnpm phase:a1:priority-eight:packet`
- `pnpm phase:a1:status`

## 2. Что делает этот слой

Он:

- читает `phase-a1-priority-eight-request-packet.json`;
- берёт уже назначенные `namedOwners` по всем восьми `ELP-*`;
- выпускает owner-specific `HANDOFF.md` в restricted perimeter;
- публикует generated сводку owner queues в `var/compliance`.

## 3. Что выпускается

Generated evidence:

- `var/compliance/phase-a1-owner-queues.json`
- `var/compliance/phase-a1-owner-queues.md`

Restricted owner packets:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-OWNER-QUEUES/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/request-packets/PHASE-A1-OWNER-QUEUES/<owner>/HANDOFF.md`

## 4. Что считается сильным результатом

Сильный результат этого слоя:

- весь `A1` больше не висит только как общий priority-eight packet;
- каждый owner видит только свои `ELP-*`;
- wave-order при этом не ломается;
- handoff становится practical owner-facing очередью, а не только стратегическим packet-слоем.

## 5. Что должно измениться дальше

После появления первого реального внешнего файла по любой owner queue:

1. выполнить соответствующий `pnpm legal:evidence:intake`
2. выполнить `pnpm legal:evidence:transition -- --status=reviewed`
3. выполнить `pnpm legal:evidence:transition -- --status=accepted`
4. пересчитать:
   - `pnpm phase:a1:first-wave:status`
   - `pnpm phase:a1:status`
   - `pnpm phase:a1:owner-queues`

Эффект этого цикла:

- owner queue перестанет быть только подготовкой;
- `A1` начнёт двигаться уже по конкретным owner очередям;
- внешний legal intake станет проще контролировать и по общей critical восьмёрке, и по людям.
