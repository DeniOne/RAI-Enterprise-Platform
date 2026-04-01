---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP09-CHAIN-OF-TITLE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.6.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP09-CHAIN-OF-TITLE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_WAVE_IP_OSS_CHECKLIST.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_SOURCE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_COLLECTION_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_HANDOFF_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_OWNER_PACKETS.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_REQUEST_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_CHAIN_OF_TITLE_DELIVERY_PACKET.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;var/compliance/phase-a5-chain-of-title-source-register.json;var/compliance/phase-a5-chain-of-title-collection.json;var/compliance/phase-a5-chain-of-title-handoff.json;var/compliance/phase-a5-chain-of-title-request-packet.json
---
# PHASE A1 ELP-09 CHAIN OF TITLE CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP09-CHAIN-OF-TITLE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-09` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-09` — это внешний документ, который подтверждает:

- права на first-party code;
- contractor contributions;
- database rights;
- достаточность прав для коммерческого использования.

Без этой карточки legal и commercial perimeter остаются красными даже при сильном техническом baseline.

## 2. Что должно быть внутри файла

Минимально обязательные блоки:

- employment evidence;
- contractor/IP transfer evidence;
- database rights;
- достаточность для commercial use;
- owner/sign-off.

## 3. Порядок исполнения

1. Открыть draft и template.
2. Выпустить repo-derived source register через `pnpm phase:a5:chain-of-title`.
3. Выпустить collection packet через `pnpm phase:a5:chain-of-title:collection`.
4. Выпустить handoff packet через `pnpm phase:a5:chain-of-title:handoff`.
5. Выпустить restricted owner packets через `pnpm phase:a5:chain-of-title:owner-packets`.
6. Выпустить единый request packet через `pnpm phase:a5:chain-of-title:request-packet`.
7. Выпустить итоговый restricted delivery packet через `pnpm phase:a5:chain-of-title:delivery-packet`.
8. Открыть delivery packet и раздать его владельцам.
9. Собрать список employment/contractor/IP transfer документов по owner queues.
10. Проверить, нет ли пробелов по first-party code и database rights.
11. Сохранить внешний файл.
12. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-09 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-09 --status=accepted
pnpm legal:evidence:verdict
```

## 4. Что должно измениться после acceptance

- legal verdict получает `chain-of-title` baseline;
- `A5` перестаёт зависеть только от общего IP-register;
- внешний pilot меньше блокируется спорным IP contour.
