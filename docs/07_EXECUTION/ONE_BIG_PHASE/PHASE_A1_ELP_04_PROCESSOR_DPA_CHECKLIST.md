---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP04-PROCESSOR-DPA-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP04-PROCESSOR-DPA-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md
---
# PHASE A1 ELP-04 PROCESSOR DPA CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP04-PROCESSOR-DPA-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-04` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-04` — это внешний документ, который подтверждает:

- кто является `processor / subprocessor`;
- какие `contract / DPA` реально действуют;
- в каких странах идёт обработка;
- с какой целью и по каким категориям данных работает каждый внешний provider.

Без этой карточки legal contour остаётся красным, потому что внешний perimeter обработки не доказан.

## 2. Текущий статус

- `reference_id`: `ELP-20260328-04`
- `artifact`: `Processor / subprocessor register + DPA pack`
- `status`: `requested`
- `review_due`: `2026-04-04`
- `owners`: `@chief_legal_officer`, `@backend-lead`

Связанные restricted-файлы:

- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-04/ELP-20260328-04__repo-derived-draft.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/templates/ELP-20260328-04/ELP-20260328-04__template.md`

## 3. Что считается достаточным файлом

Допустимая форма:

- processor register;
- legal memo с приложенным `DPA` pack;
- иной внешний документ того же уровня, если он покрывает acceptance criteria ниже.

Недостаточно:

- просто список интеграций из кода;
- незаполненный template;
- ссылка на `OpenRouter / Telegram / DaData` без contract refs.

## 4. Что должно быть внутри файла

Минимально обязательные поля:

- `Provider`;
- `Role`;
- `Country`;
- `Purpose`;
- `Data categories`;
- `Contract reference`;
- `DPA reference`.

Обязательные провайдеры стартовой волны:

- `OpenRouter`
- `Telegram`
- `DaData`
- `Hosting / storage`

## 5. Пошаговый порядок исполнения

1. Открыть draft и template.
2. По каждому provider вписать фактические contract/DPA references.
3. Проверить `role split` и `country`.
4. Сохранить внешний файл.
5. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-04 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-04 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-04 --status=accepted
```

6. После acceptance прогнать:

```bash
pnpm legal:evidence:status
pnpm legal:evidence:verdict
```

## 6. Что должно измениться после acceptance

- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) реально двигается `A-2.2.2`;
- legal verdict получает подтверждённый processor perimeter;
- `A1` перестаёт зависеть только от operator/residency слоя.

## 7. Условие завершения шага

Шаг считается завершённым только когда:

- есть реальный внешний файл;
- status карточки дошёл до `accepted`;
- `pnpm legal:evidence:verdict` пересчитан;
- processor perimeter больше не висит как `не подтверждено внешне`.
