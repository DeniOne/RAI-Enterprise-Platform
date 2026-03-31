---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP01-OPERATOR-MEMO-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP01-OPERATOR-MEMO-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;var/compliance/external-legal-evidence-priority-board.md
---
# PHASE A1 ELP-01 OPERATOR MEMO CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP01-OPERATOR-MEMO-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-01` в один конкретный чеклист исполнения.

Его цель:

- не гадать, что именно считается достаточным `operator identity and role memo`;
- не путать repo-derived draft с реальным внешним evidence;
- дать один короткий маршрут `подготовить -> intake -> review -> accepted`.

## 1. Что это за карточка

`ELP-20260328-01` — это внешний документ, который подтверждает:

- кто именно является оператором;
- какие реквизиты у этого юрлица;
- кто отвечает за контур;
- как разделяются `operator / processor` роли по deployment contour.

Без этой карточки legal contour остаётся красным, потому что невозможно корректно интерпретировать obligations по `152-ФЗ`.

## 2. Текущий статус

- `reference_id`: `ELP-20260328-01`
- `artifact`: `Operator identity and role memo`
- `status`: `requested`
- `review_due`: `2026-04-04`
- `owners`: `@chief_legal_officer`, `@board_of_directors`, `@techlead`

Связанные execution-артефакты:

- [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)

Связанные restricted-файлы:

- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-01/ELP-20260328-01__repo-derived-draft.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/templates/ELP-20260328-01/ELP-20260328-01__template.md`
- metadata card: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/ELP-20260328-01-operator-identity-and-role-memo.md`

## 3. Что считается достаточным файлом

Допустимая форма:

- signed memo;
- equivalent corporate memo;
- иной внешний документ того же уровня, если он покрывает acceptance criteria ниже.

Недостаточно:

- просто markdown в репозитории;
- незаполненный template;
- repo-derived draft без внешних реквизитов и подписи;
- устное подтверждение без файла.

## 4. Что должно быть внутри файла

Минимально обязательные поля:

- полное наименование юридического лица;
- `ОГРН`;
- `ИНН`;
- юридический адрес;
- контактное лицо и канал связи;
- указание, кто оператор по `prod`;
- указание, кто оператор по `pilot`;
- указание, кто оператор по `staging`;
- `operator / processor split`, если роли различаются;
- дата утверждения;
- owner/sign-off.

Если `pilot`, `prod` и `staging` имеют разные роли, это должно быть указано явно, а не подразумеваться.

## 5. Пошаговый порядок исполнения

### Шаг 1. Открыть draft и template

Открыть:

- draft `ELP-20260328-01__repo-derived-draft.md`
- template `ELP-20260328-01__template.md`

Задача этого шага:

- взять repo-derived facts как подсказку;
- не использовать их как финальный evidence.

### Шаг 2. Дозаполнить внешний файл

Нужно:

- подставить реальные реквизиты;
- зафиксировать operator role по каждому deployment contour;
- проверить, совпадает ли оператор с product/governance owner;
- получить sign-off.

Результат:

- внешний файл-источник, который уже можно заводить через intake.

### Шаг 3. Intake

Команда:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file
```

После этого должно измениться:

- status карточки: `requested -> received`
- restricted metadata
- repo-side metadata register

### Шаг 4. Review

Команда:

```bash
pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=reviewed
```

Перед этим проверить:

- файл покрывает `prod / pilot / staging`;
- реквизиты и owner заполнены;
- роль `operator / processor` не двусмысленна.

### Шаг 5. Acceptance

Команда:

```bash
pnpm legal:evidence:transition -- --reference=ELP-20260328-01 --status=accepted
```

После acceptance сразу прогнать:

```bash
pnpm legal:evidence:status
pnpm legal:evidence:verdict
```

## 6. Что должно измениться после acceptance

Должно измениться не только состояние карточки, но и execution-layer:

- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) начинает реально двигаться `A-2.2.1`;
- в legal verdict появляется принятый baseline по operator identity;
- `A1` перестаёт быть полностью “без внешнего intake”.

Если legal verdict не пересчитан, шаг не считается завершённым.

## 7. Что проверить перед тем как считать шаг завершённым

- есть ли реальный внешний файл;
- прошёл ли `intake`;
- статус стал `received`, потом `reviewed`, потом `accepted`;
- пересчитан ли `pnpm legal:evidence:verdict`;
- обновлён ли `board`, если изменилась рабочая стадия `A1`.

## 8. Что делать сразу после `ELP-01`

После `ELP-01` не перескакивать в ширину. Сразу идти по этой очереди:

1. `ELP-20260328-03`
2. `ELP-20260328-04`
3. `ELP-20260328-06`

Эффект:

- первая critical wave закрывается как единый пакет;
- `Legal / Compliance` получает не один случайный документ, а связанную четвёрку, которая реально двигает verdict вверх.
