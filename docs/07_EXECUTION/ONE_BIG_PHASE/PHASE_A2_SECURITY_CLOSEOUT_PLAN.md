---
id: DOC-EXE-ONE-BIG-PHASE-A2-SECURITY-CLOSEOUT-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-SECURITY-CLOSEOUT-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md
---
# PHASE A2 SECURITY CLOSEOUT PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-SECURITY-CLOSEOUT-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A2` из общей строки “закрыть security” в прямой execution-пакет по dependency-risk, secret hygiene и invariants.

Для первого рабочего прохода использовать также [PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_FIRST_WAVE_SECURITY_CHECKLIST.md).

## 1. Текущее состояние `A2`

На текущий момент подтверждено:

- `pnpm gate:invariants` проходит;
- `controllers_without_guards = 0`;
- `raw_sql_unsafe = 0`;
- `pnpm gate:secrets` и `pnpm security:audit:ci` существуют как обязательный baseline;
- policy-контур security в проекте есть и активен.
- первая remediation-волна dependency-risk уже проведена:
  - `critical: 2 -> 0`
  - `high: 37 -> 30`
  - advisories по `fast-xml-parser`, `handlebars` и `axios <= 1.13.4` больше не воспроизводятся;
  - после refresh проходят `pnpm --filter api build` и `pnpm --filter web build`.

Одновременно остаются реальные незакрытые вопросы:

- dependency-risk ещё не опущен до очевидно безопасного release-порога;
- historical secret/key debt остаётся отдельным follow-up;
- branch protection и часть access governance всё ещё зависят от внешнего evidence, а не от локального Git.

## 2. Что именно нужно закрыть

### `A2.1` Dependency-risk

Сделать:

- запускать `pnpm security:audit:ci` как baseline-снимок;
- удержать `critical=0`;
- выделить верхний слой оставшихся `high`-зависимостей;
- закрывать сначала то из `high`, что реально блокирует `Tier 1`;
- вести remediation не по количеству пакетов, а по release-impact.

Сильное доказательство:

- новый reproducible report, где release-impact debt заметно ниже и не блокирует `Tier 1`.

### `A2.2` Secret hygiene

Сделать:

- удерживать `tracked_findings = 0`;
- не допускать возврата секретов в индекс;
- отдельно довести historical key/rotation debt;
- не путать workspace-only локальные `.env` с закрытым security-вопросом.

Сильное доказательство:

- `pnpm gate:secrets` остаётся зелёным;
- historical secret debt закрыт отдельным evidence, а не просто удалением файла из дерева.

### `A2.3` Unsafe paths и governance discipline

Сделать:

- удерживать `pnpm gate:invariants` зелёным;
- не допускать появления новых unsafe raw SQL и обходов;
- не вносить security-critical изменения без owner review;
- не позволять velocity ломать invariants.

Сильное доказательство:

- reproducible `pnpm gate:invariants` без новых violations;
- нет нового tracked bypass в критичных контурах.

### `A2.4` Access governance outside repo

Сделать:

- зафиксировать, что branch protection, required reviewers, admin bypass, deploy keys и environment secrets проверяются отдельно;
- не считать локальный Git доказательством этих настроек;
- собрать внешний access review evidence.

Сильное доказательство:

- внешний access-governance artifact, подтверждающий review/protection perimeter.

## 3. Режим исполнения `A2`

Работать в таком порядке:

1. Сначала удерживать зелёными `gate:secrets` и `gate:invariants`.
2. Затем разбирать dependency-risk.
3. Затем закрывать historical key/rotation debt.
4. Затем добирать внешний access-governance evidence.

Нельзя:

- считать `A2` закрытой только потому, что baseline-команды существуют;
- считать policy-файл доказательством того, что риск уже снят;
- двигать `Tier 1`, если dependency-risk остаётся явно красным.

## 4. Что обновлять в execution-пакете

После каждого движения по `A2` обновлять:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- при необходимости [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)
- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md), если изменилась форма исполнения трека

Board должен меняться так:

- `open` -> `in_progress`, когда появился реальный remediation-проход, а не только обсуждение;
- `in_progress` сохраняется, пока `critical=0` уже достигнут, но release-impact часть `high` ещё не дотриажена;
- `guard_active` остаётся guard-статусом, пока есть policy/gate, но ещё нет полного closeout;
- `done` допустим только после снижения release-impact risk, а не после единичного зелёного запуска.

## 5. Проверки `A2`

Обязательные команды:

- `pnpm security:audit:ci`
- `pnpm gate:secrets`
- `pnpm gate:invariants`

Смотреть нужно не просто на `PASS`, а на содержимое:

- удерживается ли `critical=0`;
- сколько осталось release-impact `high`;
- остаётся ли `tracked_findings=0`;
- не появились ли новые invariant-нарушения.

## 6. Условие выхода для `A2`

Трек `A2` считается закрытым только когда одновременно выполняются условия:

- dependency-risk опущен до уровня, который не блокирует `Tier 1`;
- tracked secret leakage не возвращается;
- invariants остаются зелёными без новых unsafe путей;
- historical secret/key debt закрыт или переведён в явно доказанный остаточный follow-up;
- access governance подтверждён настолько, чтобы security не оставалась условной только на локальном baseline.
