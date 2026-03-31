---
id: DOC-EXE-ONE-BIG-PHASE-A1-ELP03-HOSTING-RESIDENCY-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP03-HOSTING-RESIDENCY-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_REQUEST_PACKET.md;docs/05_OPERATIONS/WORKFLOWS/EXTERNAL_LEGAL_EVIDENCE_ACCEPTANCE_RUNBOOK.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md
---
# PHASE A1 ELP-03 HOSTING RESIDENCY CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-ELP03-HOSTING-RESIDENCY-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `ELP-20260328-03` в один конкретный чеклист исполнения.

Его цель:

- не гадать, что именно считается достаточным `Hosting / residency attestation`;
- не путать self-host path в docs с реальным подтверждением geography;
- дать один короткий маршрут `подготовить -> intake -> review -> accepted`.

## 1. Что это за карточка

`ELP-20260328-03` — это внешний документ, который подтверждает:

- где реально живут среды `prod`, `pilot`, `staging`;
- кто provider по каждой среде;
- в каких `country / region` лежат `DB`, `object storage`, `Redis / cache`;
- где первично хранятся ПДн граждан РФ, если это заявляется.

Без этой карточки legal contour остаётся красным, потому что локализация и residency остаются “описанными”, но не доказанными.

## 2. Текущий статус

- `reference_id`: `ELP-20260328-03`
- `artifact`: `Hosting / residency attestation`
- `status`: `requested`
- `review_due`: `2026-04-04`
- `owners`: `@backend-lead`, `@techlead`, `@chief_legal_officer`

Связанные execution-артефакты:

- [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)

Связанные restricted-файлы:

- draft: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-03/ELP-20260328-03__repo-derived-draft.md`
- template: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/templates/ELP-20260328-03/ELP-20260328-03__template.md`
- metadata card: `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/metadata/ELP-20260328-03-hosting-and-residency-attestation.md`

## 3. Что считается достаточным файлом

Допустимая форма:

- attestation от owner-а среды;
- equivalent infra/legal memo;
- иной внешний документ того же уровня, если он покрывает acceptance criteria ниже.

Недостаточно:

- просто ссылка на `docker-compose.yml`;
- запись “self-host path preferred” без actual среды;
- repo-derived draft без provider/account/region данных;
- устное подтверждение без файла.

## 4. Что должно быть внутри файла

Минимально обязательные поля:

- `prod / pilot / staging` как отдельные строки;
- `provider` по каждой среде;
- `country`;
- `region`;
- `Primary DB`;
- `Object storage`;
- `Redis / cache`;
- путь локализации ПДн граждан РФ;
- `contract / invoice reference`;
- `account / subscription reference`;
- дата и owner/sign-off.

Если какая-то среда отсутствует, это должно быть указано явно, а не оставлено пустым по умолчанию.

## 5. Пошаговый порядок исполнения

### Шаг 1. Открыть draft и template

Открыть:

- draft `ELP-20260328-03__repo-derived-draft.md`
- template `ELP-20260328-03__template.md`

Задача этого шага:

- взять repo-derived facts как подсказку;
- не использовать их как финальный evidence.

### Шаг 2. Дозаполнить внешний файл

Нужно:

- заполнить matrix по средам `prod / pilot / staging`;
- указать actual provider/account reference;
- указать actual geography;
- отметить, где первично хранятся ПДн граждан РФ;
- проверить, нет ли конфликта с `HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX`.

Результат:

- внешний файл-источник, который уже можно заводить через intake.

### Шаг 3. Intake

Команда:

```bash
pnpm legal:evidence:intake -- --reference=ELP-20260328-03 --source=/abs/path/file
```

После этого должно измениться:

- status карточки: `requested -> received`
- restricted metadata
- repo-side metadata register

### Шаг 4. Review

Команда:

```bash
pnpm legal:evidence:transition -- --reference=ELP-20260328-03 --status=reviewed
```

Перед этим проверить:

- документ покрывает фактический deployment contour;
- `country / region` указаны без двусмысленности;
- storage path и residency не противоречат текущему ops baseline.

### Шаг 5. Acceptance

Команда:

```bash
pnpm legal:evidence:transition -- --reference=ELP-20260328-03 --status=accepted
```

После acceptance сразу прогнать:

```bash
pnpm legal:evidence:status
pnpm legal:evidence:verdict
```

## 6. Что должно измениться после acceptance

Должно измениться не только состояние карточки, но и execution-layer:

- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) начинает реально двигаться `A-2.2.1`;
- legal verdict получает подтверждённый residency baseline;
- `A1` перестаёт зависеть только от operator memo и получает второе реальное accepted evidence.

Если legal verdict не пересчитан, шаг не считается завершённым.

## 7. Что проверить перед тем как считать шаг завершённым

- есть ли реальный внешний файл;
- прошёл ли `intake`;
- статус стал `received`, потом `reviewed`, потом `accepted`;
- пересчитан ли `pnpm legal:evidence:verdict`;
- обновлён ли `board`, если изменилась рабочая стадия `A1`.

## 8. Что делать сразу после `ELP-03`

После `ELP-03` идти по этой очереди:

1. `ELP-20260328-04`
2. `ELP-20260328-06`

Эффект:

- первая critical wave закрывается не одним документом, а уже связанным legal + residency пакетом;
- verdict получает более сильный foundation для перехода вверх.
