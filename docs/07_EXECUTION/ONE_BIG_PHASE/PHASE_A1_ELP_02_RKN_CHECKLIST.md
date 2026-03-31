---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP02-RKN-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP02-RKN-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_SECOND_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# PHASE A1 ELP-02 RKN CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP02-RKN-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-02` в один конкретный чеклист исполнения.

## 1. Что это за карточка

`ELP-20260328-02` — это внешний документ, который подтверждает:

- есть ли уведомление в `РКН`;
- если уведомления нет, почему это допустимо;
- кто принял это решение и на какой основе.

Без этой карточки legal contour остаётся красным, потому что notification status остаётся юридически неопределённым.

## 2. Что считается достаточным файлом

Допустимая форма:

- evidence по notification number/date;
- reasoned exemption memo;
- иной внешний документ того же уровня, если он покрывает acceptance criteria.

Недостаточно:

- просто мнение без номера/даты/обоснования;
- незаполненный template;
- общая фраза “кажется, уведомление не требуется”.

## 3. Что должно быть внутри файла

Минимально обязательные поля:

- notification number/date или formal exemption basis;
- scope, к которому относится решение;
- owner/sign-off;
- дата документа;
- ограничения и follow-up, если они есть.

## 4. Порядок исполнения

1. Открыть draft и template.
2. Подставить notification evidence или exemption memo.
3. Сохранить внешний файл.
4. Выполнить:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-02 --source=/abs/path/file
pnpm legal:evidence:transition -- --reference=ELP-20260328-02 --status=reviewed
pnpm legal:evidence:transition -- --reference=ELP-20260328-02 --status=accepted
pnpm legal:evidence:verdict
```

## 5. Что должно измениться после acceptance

- legal verdict получает определённый notification status;
- исчезает один из критичных regulatory gaps;
- `A1` получает завершённый `РКН`-контур вместо предположения.
