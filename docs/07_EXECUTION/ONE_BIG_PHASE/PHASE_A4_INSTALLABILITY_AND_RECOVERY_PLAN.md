---
id: DOC-EXE-ONE-BIG-PHASE-A4-INSTALLABILITY-RECOVERY-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALLABILITY-RECOVERY-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
---
# PHASE A4 INSTALLABILITY AND RECOVERY PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-INSTALLABILITY-RECOVERY-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A4` из общей строки “installability / self-host / backup-restore” в прямой execution-пакет по установке, обновлению, dry-run и recovery evidence.

## 1. Текущее состояние `A4`

На текущий момент подтверждено:

- `self-host / localized` путь остаётся приоритетным маршрутом для ближайшего MVP;
- deployment matrix уже зафиксировала, что `on-prem / self-hosted` — наиболее реалистичный pilot path;
- `backup / restore / DR` runbook существует;
- release criteria прямо требуют:
  - install/upgrade packet
  - deployment topology
  - backup/restore runbook и свежий execution evidence
  - support boundary

Одновременно остаются реальные незакрытые вопросы:

- нет formal installer/bootstrap pack;
- нет подтверждённого install/upgrade packet;
- нет свежего `backup / restore` execution evidence;
- `support boundary` и часть `managed/on-prem` operational пакета ещё неполны.

## 2. Что именно нужно закрыть

### `A4.1` Install / upgrade packet

Сделать:

- собрать пошаговый install path для `self-host / localized` сценария;
- зафиксировать обязательные параметры среды;
- описать bootstrap для secrets, БД, Redis, storage и runtime;
- отделить минимально обязательное от опционального.

Сильное доказательство:

- отдельный install/upgrade packet, по которому можно пройти установку без устных пояснений.

### `A4.2` Dry-run установки

Сделать:

- пройти установку по документу с чистого листа;
- выписать все скрытые ручные шаги;
- убрать неявные зависимости на память отдельных людей.

Сильное доказательство:

- dry-run report с найденными пробелами и подтверждённым working path.

### `A4.3` Backup / restore execution evidence

Сделать:

- выполнить rehearsal по `backup / restore`;
- зафиксировать, что backup реально существует до schema-affecting релиза;
- проверить rollback/containment path по runbook;
- сохранить не только runbook, но и execution evidence.

Сильное доказательство:

- execution report по drill;
- не просто наличие скриптов, а подтверждение, что ими реально можно восстановиться.

### `A4.4` Support / operational boundary

Сделать:

- зафиксировать минимальную support model для `self-host / localized` pilot;
- определить, где кончается ответственность команды и где начинается ответственность среды пилота;
- отделить `on-prem / self-host` от `managed` и не смешивать их ожидания.

Сильное доказательство:

- operational handoff/support packet, достаточный для controlled pilot.

## 3. Режим исполнения `A4`

Работать в таком порядке:

1. Сначала собрать install/upgrade packet.
2. Затем провести dry-run установки.
3. Затем провести `backup / restore` drill.
4. Затем закрыть support / operational boundary.

Нельзя:

- считать runbook достаточным без execution evidence;
- объявлять `Tier 1` готовым, пока installability не доказана;
- смешивать `self-host` с `managed` как будто это один и тот же режим эксплуатации.

## 4. Что обновлять в execution-пакете

После каждого движения по `A4` обновлять:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- при необходимости [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md), если изменилась форма исполнения трека

Board должен меняться так:

- `open` -> `in_progress`, когда появился отдельный installability/recovery артефакт или начат rehearsal;
- `guard_active` остаётся guard-статусом только для запрета pilot без installability evidence;
- `done` допустим только после появления dry-run и recovery execution evidence.

## 5. Проверки `A4`

Обязательные проверяемые артефакты:

- install/upgrade packet
- dry-run install report
- `backup / restore` execution report
- release checklist / deployment topology
- support boundary packet

Смотреть нужно не просто на наличие документов, а на то:

- можно ли повторить установку без скрытого знания;
- есть ли актуальное recovery evidence;
- соответствует ли пакет требованиям `self-host / localized` из release criteria.

## 6. Условие выхода для `A4`

Трек `A4` считается закрытым только когда одновременно выполняются условия:

- строки `A-2.5.1`, `A-2.5.2`, `A-2.5.3` уходят из `open`;
- существует install/upgrade packet;
- существует dry-run install evidence;
- существует актуальный `backup / restore` execution report;
- `A-2.5.4` перестаёт быть активным release-stop условием для `Tier 1`;
- `self-host / localized` pilot можно честно назвать installable и recoverable.
