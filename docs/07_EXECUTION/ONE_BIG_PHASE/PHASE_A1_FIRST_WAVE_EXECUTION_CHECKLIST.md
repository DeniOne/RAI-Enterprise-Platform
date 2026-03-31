---
id: DOC-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/EXTERNAL_LEGAL_EVIDENCE_METADATA_REGISTER.md;var/compliance/external-legal-evidence-priority-board.md;var/compliance/external-legal-evidence-handoff.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md
---
# PHASE A1 FIRST WAVE EXECUTION CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A1-FIRST-WAVE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы начать реальное движение `A1` без необходимости держать в голове сразу metadata register, owner handoff, priority board и legal lifecycle tooling.

Он покрывает только первую волну:

1. `ELP-20260328-01`
2. `ELP-20260328-03`
3. `ELP-20260328-04`
4. `ELP-20260328-06`

Именно эта четвёрка сильнее всего двигает `Legal / Compliance` из чистого `NO-GO`.

Для самого первого шага использовать также [PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md).

## 1. Что делать прямо сейчас

Для каждой карточки идти только так:

1. Открыть repo-derived draft.
2. Дозаполнить его внешними реквизитами и реальными данными.
3. Сохранить отдельный внешний файл-источник.
4. Выполнить `intake`.
5. После owner review перевести в `reviewed`.
6. После acceptance перевести в `accepted`.
7. Сразу прогнать:
   - `pnpm legal:evidence:status`
   - `pnpm legal:evidence:verdict`

Правило:

- draft сам по себе не двигает статус;
- статус двигает только реальный внешний файл.

## 2. Первая волна `ELP-01 / 03 / 04 / 06`

| Priority | Reference ID | Что это за файл | Кто должен дать данные | Где лежит draft | Что обязательно вписать | Intake |
|---:|---|---|---|---|---|---|
| 1 | `ELP-20260328-01` | memo о том, кто оператор и на каком основании | `@board_of_directors`, `@chief_legal_officer`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-01/ELP-20260328-01__repo-derived-draft.md` | юрлицо, ОГРН/ИНН, адрес, operator/processor split, подпись и дата | `pnpm legal:evidence:intake -- --reference=ELP-20260328-01 --source=/abs/path/file` |
| 2 | `ELP-20260328-03` | attestation о том, где реально хранятся данные | `@backend-lead`, `@chief_legal_officer`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-03/ELP-20260328-03__repo-derived-draft.md` | provider, country, region, account reference, DB/storage residency, contract/invoice ref | `pnpm legal:evidence:intake -- --reference=ELP-20260328-03 --source=/abs/path/file` |
| 3 | `ELP-20260328-04` | register процессоров + `DPA` pack | `@backend-lead`, `@chief_legal_officer` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-04/ELP-20260328-04__repo-derived-draft.md` | provider list, role split, country, purpose, contract ref, DPA ref | `pnpm legal:evidence:intake -- --reference=ELP-20260328-04 --source=/abs/path/file` |
| 4 | `ELP-20260328-06` | matrix оснований обработки и privacy notices | `@chief_legal_officer`, `@product_lead`, `@techlead` | `/root/RAI_EP_RESTRICTED_EVIDENCE/legal-compliance/2026-03-28/drafts/ELP-20260328-06/ELP-20260328-06__repo-derived-draft.md` | lawful basis по flows, consent/no-consent, notice source, связь с operator/processors | `pnpm legal:evidence:intake -- --reference=ELP-20260328-06 --source=/abs/path/file` |

## 3. Детальный чеклист по каждой карточке

### `ELP-20260328-01` — operator identity and role memo

Сделать:

- открыть draft `ELP-20260328-01__repo-derived-draft.md`;
- вписать фактическое юрлицо;
- вписать ОГРН, ИНН, адрес;
- отдельно указать, одинаков ли оператор для `pilot`, `prod`, `staging`;
- подписать memo у уполномоченного лица;
- сохранить финальный файл вне Git;
- выполнить intake.

Что считается достаточным:

- signed memo или equivalent corporate memo;
- не просто заметка в markdown.

Что меняется после acceptance:

- двигается строка `A-2.2.1`;
- legal verdict получает подтверждённую operator identity baseline.

### `ELP-20260328-03` — hosting / residency attestation

Сделать:

- открыть draft `ELP-20260328-03__repo-derived-draft.md`;
- по средам `prod / pilot / staging` заполнить:
  - provider
  - country
  - region
  - primary DB location
  - object storage location
  - Redis/cache location
- добавить contract/invoice/account reference;
- отдельно зафиксировать, где первично хранятся ПДн граждан РФ;
- сохранить финальный внешний файл;
- выполнить intake.

Что считается достаточным:

- attestation с реальными hosting/residency данными;
- не просто ссылка на self-host path из docs.

Что меняется после acceptance:

- двигается строка `A-2.2.1`;
- legal verdict получает residency baseline вместо “частично описано”.

### `ELP-20260328-04` — processor / subprocessor register + `DPA`

Сделать:

- открыть draft `ELP-20260328-04__repo-derived-draft.md`;
- пройти по `OpenRouter`, `Telegram`, `DaData`, hosting/storage;
- для каждого указать:
  - operator / processor / subprocessor split
  - country
  - purpose
  - data categories
  - contract reference
  - DPA reference
- сохранить финальный внешний файл;
- выполнить intake.

Что считается достаточным:

- реальный register с contract/DPA references;
- не просто перечисление интеграций.

Что меняется после acceptance:

- двигается строка `A-2.2.2`;
- legal verdict получает processor perimeter вместо “не подтверждено внешне”.

### `ELP-20260328-06` — lawful basis matrix + privacy notice pack

Сделать:

- открыть draft `ELP-20260328-06__repo-derived-draft.md`;
- пройти по flows:
  - `auth / front-office`
  - `telegram notifications`
  - `AI / explainability`
  - `commerce / lookup`
  - `finance / contracts`
- для каждого flow указать:
  - lawful basis
  - нужен ли consent
  - источник notice wording
  - связь с operator memo и processor perimeter
- сохранить финальный внешний файл;
- выполнить intake.

Что считается достаточным:

- matrix с утверждёнными legal основаниями;
- privacy notice pack или явная ссылка на approved notices.

Что меняется после acceptance:

- двигается строка `A-2.2.3`;
- legal verdict получает basis/notice baseline вместо “частично описано”.

## 4. Что можно подготовить без внешних документов

Пока внешних файлов ещё нет, можно сделать только подготовительный слой:

- открыть и проверить все 4 draft-файла;
- собрать список пустых полей по каждой карточке;
- заранее определить, кто именно должен подписать или выдать финальный файл;
- подготовить абсолютные пути для будущего intake;
- зафиксировать owner-follow-up в board или handoff.

Это полезно, но это ещё не меняет evidence status.

## 5. Что считать реальным прогрессом

Реальный прогресс первой волны:

- `requested -> received` хотя бы по `ELP-01`;
- затем `reviewed -> accepted` по `ELP-01`, `03`, `04`, `06`;
- после каждого `accepted` меняется `pnpm legal:evidence:verdict`.

Не считать прогрессом:

- создание ещё одного описательного markdown;
- наличие только draft-файла;
- устное подтверждение без intake.

## 6. Минимальный daily-loop по `A1`

Каждый проход по `A1` делать так:

1. Проверить 4 карточки `01 / 03 / 04 / 06`.
2. Зафиксировать, по какой из них реально появился внешний файл.
3. Выполнить `intake`.
4. Обновить board.
5. Прогнать status/verdict.

Если внешнего файла нет, задача остаётся `waiting_external`.

## 7. Условие завершения первой волны

Первая волна считается завершённой только когда одновременно:

- `ELP-20260328-01` accepted;
- `ELP-20260328-03` accepted;
- `ELP-20260328-04` accepted;
- `ELP-20260328-06` accepted;
- `pnpm legal:evidence:verdict` показывает уменьшение blocker-set;
- строки `A-2.2.1`, `A-2.2.2`, `A-2.2.3` в board больше не висят в чистом `waiting_external`.
