---
id: DOC-EXE-ONE-BIG-PHASE-A4-FIRST-WAVE-INSTALLABILITY-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A4-FIRST-WAVE-INSTALLABILITY-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md
---
# PHASE A4 FIRST WAVE INSTALLABILITY CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A4-FIRST-WAVE-INSTALLABILITY-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы начать `A4` как конкретный operational пакет по установке и восстановлению.

## 1. Что делать первой волной

### Шаг 1. Собрать install/upgrade packet

Нужно:

- описать минимальный self-host path;
- перечислить обязательные env/secrets;
- перечислить bootstrap для `PostgreSQL`, `Redis`, `storage`, runtime;
- отделить обязательное от опционального.

### Шаг 2. Подготовить dry-run install path

Нужно:

- пройти install packet как будто у исполнителя нет скрытого знания;
- выписать все ручные шаги;
- отметить, где install path разваливается без автора системы.

### Шаг 3. Подготовить recovery rehearsal

Нужно:

- связать runbook с фактическим drill;
- заранее описать, какие артефакты считать достаточным execution evidence.

### Шаг 4. Зафиксировать support boundary

Нужно:

- отделить ответственность команды от ответственности среды пилота;
- не смешивать `self-host` и `managed`.

## 2. Что считать реальным прогрессом

Реальный прогресс:

- появляется install packet;
- появляется dry-run report;
- появляется backup/restore execution evidence;
- появляется support boundary packet.

Не считать прогрессом:

- один только runbook без rehearsal;
- общую фразу “self-host поддерживается”;
- опору на память автора системы.

## 3. Условие завершения первой волны `A4`

Первая волна считается завершённой только когда:

- есть install/upgrade packet;
- есть план dry-run;
- есть оформленный recovery evidence target;
- в board `A-2.5.1..A-2.5.3` переходят из чистого `open` в рабочий execution-state.
