---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP06-LAWFUL-BASIS-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP06-LAWFUL-BASIS-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md;docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md
---
# PHASE A1 ELP-06 LAWFUL BASIS CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP06-LAWFUL-BASIS-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-06` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-06` — это внешний документ, который подтверждает:

- по какому основанию обрабатывается каждый ключевой flow;
- где нужен `consent`, а где нет;
- какие `privacy notices` реально действуют;
- как lawful basis связан с operator memo и processor perimeter.

Без этой карточки legal contour остаётся красным, потому что основания обработки и transparency obligations остаются частично описанными, но не утверждёнными.

## 2. Текущий статус

- `reference_id`: `ELP-20260328-06`
- `artifact`: `Lawful basis matrix + privacy notice pack`
- `status`: `requested`
- `review_due`: `2026-04-04`
- `owners`: `@chief_legal_officer`, `@product_lead`, `@techlead`

Связанные restricted-файлы:

- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-06/ELP-20260328-06__repo-derived-draft.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/templates/ELP-20260328-06/ELP-20260328-06__template.md`

## 3. Что считается достаточным файлом

Допустимая форма:

- matrix оснований обработки;
- privacy notice pack;
- единый legal memo, если он покрывает acceptance criteria ниже.

Недостаточно:

- просто общая фраза “обработка на законном основании”;
- незаполненный template;
- product flow list без basis/no-consent/notice source.

## 4. Что должно быть внутри файла

Обязательные flows стартовой волны:

- `auth / front-office`
- `telegram notifications`
- `AI / explainability`
- `commerce / lookup`
- `finance / contracts`

Для каждого flow обязательны:

- `Subjects`
- `Data categories`
- `Purpose`
- `Lawful basis`
- `Consent needed`
- `Notice source`

Дополнительно:

- ссылка на public notice;
- ссылка на internal notice;
- contractual wording, если применимо.

## 5. Пошаговый порядок исполнения

1. Открыть draft и template.
2. Пройти по всем 5 flows.
3. Заполнить lawful basis и consent/no-consent логику.
4. Привязать notice source к каждому flow.
5. Сохранить внешний файл.
6. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-06 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-06 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-06 --status=accepted
```

7. После acceptance прогнать:

```bash
pnpm legal:evidence:status
pnpm legal:evidence:verdict
```

## 6. Что должно измениться после acceptance

- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) реально двигается `A-2.2.3`;
- legal verdict получает basis/notice perimeter;
- первая legal-волна закрывается уже не только по структуре обработки, но и по её правовым основаниям.

## 7. Условие завершения шага

Шаг считается завершённым только когда:

- есть реальный внешний файл;
- status карточки дошёл до `accepted`;
- `pnpm legal:evidence:verdict` пересчитан;
- lawful basis/per-flow notice contour перестал быть `частично описано`.
