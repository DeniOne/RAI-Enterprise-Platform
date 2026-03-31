---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP05-TRANSBORDER-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP05-TRANSBORDER-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md
---
# PHASE A1 ELP-05 TRANSBORDER CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP05-TRANSBORDER-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-05` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-05` — это внешний документ, который подтверждает:

- по каким внешним providers возможна трансграничная передача;
- какие категории данных затрагиваются;
- по какому основанию это разрешено или запрещено;
- какие mitigation и owner decision действуют.

## 2. Что обязательно покрыть

Обязательные внешние контуры:

- `OpenRouter`
- `Telegram`
- `DaData`
- иные processors, если они реально участвуют в deployment contour

Для каждого нужны:

- `country`
- `data categories`
- `lawful basis`
- `allow / deny decision`
- `mitigation`
- `owner`

## 3. Что считается достаточным файлом

Достаточно:

- transborder decision log;
- formal legal memo с decision table.

Недостаточно:

- просто список providers;
- общая пометка “requires review” без decision.

## 4. Порядок исполнения

1. Открыть draft и template.
2. Пройти по каждому external provider.
3. Зафиксировать `allow / deny` решение.
4. Сохранить внешний файл.
5. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-05 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-05 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-05 --status=accepted
pnpm legal:evidence:verdict
```

## 5. Что должно измениться после acceptance

- legal verdict получает transborder decision layer;
- внешний AI/provider contour перестаёт висеть как чисто неоформленный риск;
- `A1` становится ближе к `CONDITIONAL GO`.
