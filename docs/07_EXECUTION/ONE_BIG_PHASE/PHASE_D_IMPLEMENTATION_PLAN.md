---
id: DOC-EXE-ONE-BIG-PHASE-D-IMPLEMENTATION-PLAN-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-D-IMPLEMENTATION-PLAN-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md;package.json;scripts/phase-d-status.cjs;scripts/phase-d-install-dry-run.cjs;scripts/phase-d-upgrade-rehearsal.cjs;scripts/phase-d-install-status.cjs;scripts/phase-d-restore-drill.cjs;scripts/phase-d-dr-status.cjs;scripts/phase-d-ops-drill.cjs;scripts/phase-d-ops-status.cjs;scripts/phase-d-pilot-status.cjs;scripts/phase-d-pilot-intake.cjs;scripts/phase-d-pilot-transition.cjs;var/ops/phase-d-status.json
---
# PHASE D IMPLEMENTATION PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-D-IMPLEMENTATION-PLAN-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ фиксирует практический пакет реализации `Phase D` для `self-host pilot + hardening`.

Для канона подфазы использовать также [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md).

Для живого статуса строк использовать также [PHASE_D_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md).

## 0. Статус реализации на 2026-04-01

- Реализован единый фазовый оркестратор `Phase D` через `phase:d:*` и `gate:phase:d:*` команды в `package.json`.
- Добавлены все требуемые скрипты контуров `D1-D5`:
  - `scripts/phase-d-install-dry-run.cjs`
  - `scripts/phase-d-upgrade-rehearsal.cjs`
  - `scripts/phase-d-install-status.cjs`
  - `scripts/phase-d-restore-drill.cjs`
  - `scripts/phase-d-dr-status.cjs`
  - `scripts/phase-d-ops-drill.cjs`
  - `scripts/phase-d-ops-status.cjs`
  - `scripts/phase-d-pilot-status.cjs`
  - `scripts/phase-d-pilot-intake.cjs`
  - `scripts/phase-d-pilot-transition.cjs`
  - `scripts/phase-d-status.cjs`
- Выпускаются machine-readable отчёты `var/ops/phase-d-*.json|md` по install/restore/ops/pilot и общему статусу фазы.
- Текущее итоговое состояние: `phase_d_ready` в [phase-d-status.json](/root/RAI_EP/var/ops/phase-d-status.json), `gate:phase:d:status` проходит в `--mode=enforce`.

## 1. Смысл и границы `Phase D`

`Phase D` запускается после закрытия `Phase C` и ведёт к одному результату: доказанный `Tier 1 self-host / localized` pilot с воспроизводимым install/recovery/operations контуром.

Что входит в объём:

- installability и upgrade-путь;
- backup/restore и DR-проверка;
- operational discipline (`monitoring`, `incident`, `rollback`, `support`);
- controlled pilot с формальным входом/выходом.

Что исключено из объёма:

- menu breadth и новые продуктовые экраны;
- расширение автономии AI и новые роли;
- движение в `SaaS / hybrid` до завершения `Tier 1` hardening.

## 2. Модель исполнения

Исполнение зафиксировано как `D1 -> D2 -> D3 -> D4` при постоянном `D5 guard_active`.

Треки:

- `D0` — phase-entry и scope lock.
- `D1` — self-host installability.
- `D2` — backup/restore и DR.
- `D3` — operational hardening.
- `D4` — controlled pilot.
- `D5` — anti-breadth guardrails.

## 3. Публичные CLI контракты репозитория

Базовые команды:

1. `pnpm phase:d:status`
2. `pnpm gate:phase:d:status`

Installability (`D1`):

1. `pnpm phase:d:install:dry-run`
2. `pnpm phase:d:upgrade:rehearsal`
3. `pnpm phase:d:install:status`
4. `pnpm gate:phase:d:install`

Recovery/DR (`D2`):

1. `pnpm phase:d:restore:drill`
2. `pnpm phase:d:dr:status`
3. `pnpm gate:phase:d:restore`

Operational hardening (`D3`):

1. `pnpm phase:d:ops:drill`
2. `pnpm phase:d:ops:status`
3. `pnpm gate:phase:d:ops`

Controlled pilot (`D4`):

1. `pnpm phase:d:pilot:status`
2. `pnpm phase:d:pilot:intake`
3. `pnpm phase:d:pilot:transition`
4. `pnpm gate:phase:d:pilot`

## 4. Контракт артефактов `Phase D`

Все фазовые отчёты публикуются в `var/ops` как `phase-d-*.json|md`.

Обязательный минимальный JSON-контракт:

1. `generatedAt`
2. `track`
3. `status`
4. `issues`
5. `evidenceRefs`
6. `nextAction`
7. `verdict`

Обязательные фазовые отчёты:

1. `phase-d-install-dry-run`
2. `phase-d-upgrade-rehearsal`
3. `phase-d-install-status`
4. `phase-d-restore-drill`
5. `phase-d-dr-status`
6. `phase-d-ops-drill`
7. `phase-d-ops-status`
8. `phase-d-pilot-status`
9. `phase-d-status`

## 5. Контракт pilot handoff metadata

Для controlled pilot используется reference-формат `D-H-XX`.

Статусы lifecycle:

1. `requested`
2. `received`
3. `reviewed`
4. `accepted`
5. `expired`

Обязательные поля metadata:

1. `status`
2. `owner`
3. `review_due`
4. `artifact_path`
5. `draft_path`

Переходы статусов и intake выполняются только через:

1. `pnpm phase:d:pilot:intake`
2. `pnpm phase:d:pilot:transition`
3. `pnpm phase:d:pilot:status`

## 6. Изменения публичных API/интерфейсов

- Публичные HTTP/API контуры продукта: без изменений.
- Публичные CLI интерфейсы репозитория: расширены командами `phase:d:*` и `gate:phase:d:*`.
- Публичный контракт handoff metadata: фиксирован формат `D-H-XX` и статусы lifecycle.

## 7. План проверок и приемки

1. Прогонять каждый новый `phase:d` скрипт в `--dry-run` и в `--mode=enforce` с негативными сценариями.
2. Для `D1` проводить минимум два повторных цикла `clean-install + upgrade rehearsal` без ручных шагов.
3. Для `D2` проходить `backup -> restore -> integrity verification` с фиксацией `rpo_minutes/rto_minutes`.
4. Для `D3` подтверждать owner chain `incident/rollback/support` и support boundary в machine-readable отчёте.
5. Для `D4` проводить полный lifecycle `intake -> reviewed -> accepted` с verdict `pilot_ready` или `pilot_blocked`.
6. Финальная приёмка: `pnpm gate:phase:d:status` зелёный только при закрытых `D-2.2.*`, `D-2.3.*`, `D-2.4.*`, `D-2.5.*` и без нарушений `D-2.6.*`.

## 8. Exit-критерии `Phase D`

`Phase D` считается закрытой только при одновременном выполнении:

1. установлен и подтверждён воспроизводимый `self-host` install path;
2. backup/restore подтверждён практическим dry-run и evidence;
3. operational контур (`monitoring/incident/rollback/support`) закрыт как исполняемый runbook;
4. controlled pilot проведён по формальному acceptance gate;
5. guardrail на `SaaS / hybrid` и breadth-расширение удержан до завершения `Tier 1`.

## 9. Допущения

1. `Phase C` считается закрытой и больше не является текущим execution-entrypoint.
2. Источник operational truth: `code/tests/gates` и generated evidence.
3. Фаза не включает расширение продуктовой ширины, новых агентных ролей и движение в `SaaS/hybrid` до pilot acceptance.
