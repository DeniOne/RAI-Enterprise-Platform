---
id: DOC-EXE-ONE-BIG-PHASE-E-IMPLEMENTATION-PLAN-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-E-IMPLEMENTATION-PLAN-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_D_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md;package.json;scripts/phase-e-status.cjs;scripts/phase-e-governance-status.cjs;scripts/phase-e-ops-drill.cjs;scripts/phase-e-ops-status.cjs;scripts/phase-e-legal-status.cjs;scripts/phase-e-pilot-status.cjs;scripts/phase-e-pilot-intake.cjs;scripts/phase-e-pilot-transition.cjs
---
# PHASE E IMPLEMENTATION PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-E-IMPLEMENTATION-PLAN-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ фиксирует практический пакет реализации `Phase E` для `Tier 2 managed deployment + governance evidence`.

Для канона подфазы использовать также [05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/05_PHASE_E_TIER2_MANAGED_DEPLOYMENT_AND_GOVERNANCE.md).

Для живого статуса строк использовать также [PHASE_E_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_E_EXECUTION_BOARD.md).

## 0. Статус реализации на 2026-04-01

- Реализован единый оркестратор `Phase E` через `phase:e:*` и `gate:phase:e:*` команды в `package.json`.
- Добавлены скрипты контуров `E1-E5`:
  - `scripts/phase-e-governance-status.cjs`
  - `scripts/phase-e-ops-drill.cjs`
  - `scripts/phase-e-ops-status.cjs`
  - `scripts/phase-e-legal-status.cjs`
  - `scripts/phase-e-pilot-status.cjs`
  - `scripts/phase-e-pilot-intake.cjs`
  - `scripts/phase-e-pilot-transition.cjs`
  - `scripts/phase-e-status.cjs`
- Выпускаются machine-readable отчёты `var/ops/phase-e-*.json|md` по governance/ops/legal/pilot и общему статусу фазы.
- Целевой итоговый verdict фазы: `phase_e_ready_tier2`.
- Фактический итог на 2026-04-01:
  - `pnpm gate:phase:e:status` проходит в enforce-режиме;
  - `var/ops/phase-e-status.json` фиксирует `status=done`, `verdict=phase_e_ready_tier2`;
  - треки `E1-E4` закрыты в `done`, `E5` удерживается как `guard_active`.

## 1. Смысл и границы `Phase E`

`Phase E` фокусируется на переходе в `Tier 2 managed deployment` с подтверждённым governance-контуром и операционной доказуемостью.

Что входит в объём:

- external evidence по `branch protection` и `access governance`;
- managed operations contour (`monitoring/SLO`, incident, rollback, support);
- transborder/legal operational closure для фактических внешних провайдеров;
- controlled managed pilot wave с формальным verdict.

Что исключено из объёма:

- широкий `SaaS/hybrid external production` rollout;
- menu/agent/integration breadth, не усиливающий `Tier 2` evidence;
- расширение AI-автономии вне текущего governance baseline.

## 2. Модель исполнения

Исполнение зафиксировано как `E1 -> E2 -> E3 -> E4` при постоянном `E5 guard_active`.

Треки:

- `E0` — phase-entry и scope lock.
- `E1` — release governance evidence.
- `E2` — managed operations contour.
- `E3` — legal/transborder operational closure.
- `E4` — controlled managed pilot wave.
- `E5` — anti-breadth guardrails.

## 3. Публичные CLI контракты репозитория

Базовые команды:

1. `pnpm phase:e:status`
2. `pnpm gate:phase:e:status`

Release governance (`E1`):

1. `pnpm phase:e:governance:status`
2. `pnpm gate:phase:e:governance`

Managed operations (`E2`):

1. `pnpm phase:e:ops:drill`
2. `pnpm phase:e:ops:status`
3. `pnpm gate:phase:e:ops`

Legal/transborder (`E3`):

1. `pnpm phase:e:legal:status`
2. `pnpm gate:phase:e:legal`

Managed pilot (`E4`):

1. `pnpm phase:e:pilot:status`
2. `pnpm phase:e:pilot:intake`
3. `pnpm phase:e:pilot:transition`
4. `pnpm gate:phase:e:pilot`

## 4. Контракт артефактов `Phase E`

Все фазовые отчёты публикуются в `var/ops` как `phase-e-*.json|md`.

Обязательный минимальный JSON-контракт:

1. `generatedAt`
2. `track`
3. `status`
4. `issues`
5. `evidenceRefs`
6. `nextAction`
7. `verdict`

Дополнительные обязательные поля:

1. в `phase-e-status`: `scope_violations`, `tracks`, `checks`;
2. в `phase-e-pilot-status`: `counts`, `rows`, `restrictedRoot`.

Обязательные фазовые отчёты:

1. `phase-e-governance-status`
2. `phase-e-ops-drill`
3. `phase-e-ops-status`
4. `phase-e-legal-status`
5. `phase-e-pilot-status`
6. `phase-e-status`

## 5. Контракт managed pilot metadata

Для controlled managed pilot используется reference-формат `E-H-XX`.

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
6. `cohort_id`
7. `success_metric_ref`

Переходы статусов и intake выполняются только через:

1. `pnpm phase:e:pilot:intake`
2. `pnpm phase:e:pilot:transition`
3. `pnpm phase:e:pilot:status`

## 6. Изменения публичных API/интерфейсов

- Публичные HTTP/API контуры продукта: без изменений.
- Публичные CLI интерфейсы репозитория: расширены командами `phase:e:*` и `gate:phase:e:*`.
- Публичный контракт handoff metadata: фиксирован формат `E-H-XX` и статусы lifecycle.

## 7. План проверок и приемки

1. Прогнать каждый `phase:e` скрипт в обычном режиме и в `--mode=enforce`, включая негативные сценарии.
2. Для `E1` проверять, что отсутствие `exception_register_ref` или `A2-S-03 != accepted` блокирует gate.
3. Для `E2` проверять, что отсутствие `slo_baseline_ref` или owner-chain блокирует gate.
4. Для `E3` проверять, что `currentVerdict=NO-GO` или `ELP-20260328-05 != accepted` блокирует gate.
5. Для `E4` проверять, что неверные статус-переходы и overdue review блокируют gate.
6. Финальная приёмка: `pnpm gate:phase:e:status` зелёный только при закрытых `E-2.2.*`, `E-2.3.*`, `E-2.4.*`, `E-2.5.*` и без нарушений `E-2.6.*`.

## 8. Exit-критерии `Phase E`

`Phase E` считается закрытой только при одновременном выполнении:

1. строки `E-2.2.*`, `E-2.3.*`, `E-2.4.*`, `E-2.5.*` не имеют `open/in_progress`;
2. `branch protection` и `access governance` подтверждены external evidence;
3. managed operations contour подтверждён drill-отчётами;
4. legal/transborder пакет для фактических провайдеров закрыт;
5. managed pilot wave завершена формальным verdict;
6. guardrails `E-2.6.*` удерживаются без нарушений.

## 9. Допущения и defaults

1. `Phase D` остаётся базовым закрытым контуром (`phase_d_ready`).
2. Источник operational truth: `code/tests/gates` и generated evidence.
3. До закрытия `Phase E` запрещено воспринимать внешний `SaaS/hybrid` rollout как активную цель.
4. Default путь managed pilot handoff: `../RAI_EP_RESTRICTED_EVIDENCE/managed-pilot-handoffs/2026-04-01` (override через `PHASE_E_HANDOFF_ROOT`).
