---
id: DOC-EXE-ONE-BIG-PHASE-A-IMPLEMENTATION-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-IMPLEMENTATION-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/01_PHASE_A_STOP_BLOCKERS_AND_GATES.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# PHASE A IMPLEMENTATION PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-IMPLEMENTATION-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `Phase A` из общего плана в конкретную схему исполнения. Он определяет треки `A0–A5`, их порядок, выходные условия и правила обновления board/evidence.

## 1. Смысл `Phase A`

`Phase A` нужна, чтобы снять всё, что сейчас блокирует честный `Tier 1 self-host / localized MVP pilot`.

Пока `Phase A` не закрыта:

- нельзя считать MVP готовым к pilot;
- нельзя расширять продукт в ширину;
- нельзя поднимать новый уровень автономии AI;
- нельзя подменять реальные доказательства красивыми документами.

## 2. Треки исполнения

### `A0` — управленческий triage и защита от распыления

Что входит:

- маркировка новых задач кодами `A-*` или их понижение в breadth;
- привязка каждой новой инициативы к blocker-строке из board;
- review только по строкам `open` и `waiting_external`;
- использование evidence-matrix как фильтра силы доказательств.

Что меняется:

- `Phase A` начинает жить по board, а не по хаотичному входящему потоку.

Выход:

- breadth-задачи не стоят выше `A1–A5`;
- board обновляется как главный execution-артефакт;
- команда различает “движение” и “настоящий progress”.

### `A1` — `legal / privacy / operator / residency`

Что входит:

- приоритетная восьмёрка `ELP-01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`;
- цикл `intake -> reviewed -> accepted`;
- пересчёт legal-verdict после каждого `accepted`.
- рабочая очередь из [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)

Что меняется:

- `Legal / Compliance` перестаёт быть безусловным стопом для `Tier 1`.

Выход:

- строки `A-2.2.1`, `A-2.2.2`, `A-2.2.3` в board уходят из `waiting_external`;
- verdict в `var/compliance/external-legal-evidence-verdict.*` сдвигается вверх;
- legal claims подтверждены внешними accepted-артефактами, а не внутренними markdown-файлами.

### `A2` — `security / AppSec / secret hygiene`

Что входит:

- `pnpm security:audit:ci`;
- `pnpm gate:secrets`;
- `pnpm gate:invariants`;
- triage `critical` и верхнего слоя `high` dependency-risk;
- удержание `tracked_findings=0`.
- рабочая очередь из [PHASE_A2_SECURITY_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md)

Что меняется:

- security перестаёт быть техническим стопом первого уровня.

Выход:

- `A-2.3.1` перестаёт быть красной строкой;
- `A-2.3.2`, `A-2.3.3`, `A-2.3.4` остаются guard-правилами, но не блокируют `Tier 1`;
- нет возврата tracked secret leakage и unsafe path drift.

### `A3` — `AI governance: tool / HITL / eval`

Что входит:

- `tool-permission matrix`;
- `HITL matrix`;
- `advisory-only` перечень;
- formal `eval-suite` для risky-сценариев.
- рабочая очередь из [PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md)

Что меняется:

- agent core получает реальные границы допустимого поведения.

Выход:

- строки `A-2.4.1..A-2.4.4` уходят из `open`;
- risky flows имеют явное правило `можно / нельзя / только с человеком`;
- autonomy expansion больше не может проскакивать как “просто новая фича”.

### `A4` — `installability / self-host / backup-restore`

Что входит:

- install/upgrade packet;
- dry-run установки;
- фиксация скрытых ручных шагов;
- `backup / restore` drill;
- execution evidence по восстановлению.
- рабочая очередь из [PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md)

Что меняется:

- продукт становится не только работающим, но и реально разворачиваемым.

Выход:

- `A-2.5.1`, `A-2.5.2`, `A-2.5.3` уходят из `open`;
- `A-2.5.4` перестаёт быть release-stop условием;
- есть не только runbook, но и evidence исполнения.

### `A5` — `IP / OSS / chain-of-title`

Что входит:

- triage `unknown licenses`;
- отделение допустимых и спорных зависимостей;
- закрытие `ELP-09`;
- связка внешнего IP evidence с `OSS_LICENSE_AND_IP_REGISTER`.
- рабочая очередь из [PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md)

Что меняется:

- product/IP perimeter перестаёт висеть как красный коммерческий риск.

Выход:

- `A-2.6.1` и `A-2.6.2` уходят из `open / waiting_external`;
- `A-2.6.3` перестаёт быть активным stop-guard;
- права на код, БД и know-how не держатся на предположениях.

## 3. Порядок исполнения

Исполнять в таком режиме:

1. Сначала включить `A0`.
2. После этого параллельно вести `A1`, `A2`, `A3`, `A4`, `A5`.
3. Приоритет внутри параллельной работы:
   - сначала `A1`;
   - затем `A2`;
   - затем `A3`;
   - затем `A4`;
   - затем `A5`.
4. Ни один трек не считается завершённым, пока его статус не отражён в board и не подкреплён подходящим evidence.

## 4. Артефакты управления

Главные рабочие артефакты `Phase A`:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- `var/compliance/external-legal-evidence-verdict.*`
- security gates и security reports
- install/restore execution evidence

Правило:

- если работа не меняет хотя бы один из этих артефактов, это не progress `Phase A`.

## 5. Ритм исполнения

На каждом review нужно делать только это:

1. Смотреть строки `waiting_external`.
2. Смотреть строки `open`.
3. Проверять, появилось ли сильное доказательство из evidence-matrix.
4. Обновлять только `status`, `evidence` и `next action`.

Нельзя на review:

- обсуждать ширину продукта как будто это progress фазы;
- считать наличие нового документа само по себе закрытием blocker;
- поднимать `Phase B`, пока `Phase A` красная.

## 6. Условия завершения `Phase A`

`Phase A` считается завершённой только когда одновременно выполнены все условия:

- legal перестаёт быть безусловным `NO-GO` для `Tier 1`;
- security и dependency-risk опущены до управляемого уровня;
- AI perimeter `tool / HITL / eval` существует как рабочий контур;
- installability и `backup / restore` подтверждены execution evidence;
- `IP / OSS / chain-of-title` перестают быть красным стопом.

Если хотя бы один из этих блоков остаётся красным, вся `Phase A` остаётся незавершённой.
