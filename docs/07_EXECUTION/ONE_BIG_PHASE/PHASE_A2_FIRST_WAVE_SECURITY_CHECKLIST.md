---
id: DOC-EXE-ONE-BIG-PHASE-A2-FIRST-WAVE-SECURITY-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-FIRST-WAVE-SECURITY-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;var/security/npm-audit.json;var/security/security-audit-summary.json;var/security/secret-scan-report.json
---
# PHASE A2 FIRST WAVE SECURITY CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-FIRST-WAVE-SECURITY-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы начать `A2` не с общих слов про security, а с текущего воспроизводимого baseline.

## 1. Текущий baseline

После текущего remediation-baseline на `2026-03-31` подтверждено:

- `pnpm security:audit:ci` -> `critical=0`, `high=5`
- `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
- `pnpm gate:invariants` -> `violations=0`, `raw_sql_unsafe=0`, `controllers_without_guards=0`
- dependency refresh и targeted overrides уже применены:
  - `minio 8.0.7`
  - `axios 1.14.0`
  - `handlebars 4.7.9`
  - `effect 3.21.0`
  - `flatted 3.4.2`
  - `rollup 4.60.1`
  - `undici 7.24.6`
  - `multer 2.1.1` через `@nestjs/platform-express`
  - `serialize-javascript 7.0.3`
  - `glob 10.5.0`
  - targeted `minimatch` / `picomatch` overrides
- после dependency refresh проходят:
  - `pnpm --filter api build`
  - `pnpm --filter web build`

Это означает:

- security baseline уже существует;
- tracked secret leakage сейчас не блокирует выпуск;
- runtime-impact dependency-remediation уже сняла все `critical` и основную release-impact часть `high`;
- главный открытый хвост в `A2` — toolchain-only остаток `high=5`, historical debt outside repo и внешний access evidence.

## 2. Что делать первой волной

### Шаг 1. Зафиксировать current security snapshot

Проверить и сохранить:

- `var/security/npm-audit.json`
- `var/security/security-audit-summary.json`
- `var/security/secret-scan-report.json`

Цель:

- не спорить о baseline на словах;
- опираться на конкретный reproducible snapshot.

### Шаг 2. Зафиксировать закрытие бывших `critical=2` и runtime-impact `high`

Нужно:

- зафиксировать, что advisories по `fast-xml-parser` и `handlebars` больше не воспроизводятся;
- зафиксировать, что advisory по `axios <= 1.13.4` тоже больше не воспроизводится;
- зафиксировать, что advisories по `effect`, `flatted`, `rollup`, `undici`, `multer`, `serialize-javascript`, `glob` и release-impact цепочкам `path-to-regexp` тоже больше не воспроизводятся;
- не откатывать overrides и package bumps без повторного audit-подтверждения.

Это уже не только первый remediation-проход `A2`, а текущий runtime-safe baseline.

### Шаг 3. Формально разобрать toolchain-tail из `high=5`

Нужно:

- не делать вид, что `high=5` эквивалентны прошлому release-impact риску;
- явно зафиксировать, что остаток сосредоточен в dev-toolchain:
  - `@typescript-eslint/typescript-estree -> minimatch@9.0.3`
  - `@angular-devkit/core -> picomatch@4.0.1/4.0.2` через `@nestjs/cli`
- принять управленческое решение:
  - либо этот хвост допустим для `Tier 1` как не-runtime debt,
  - либо нужен ещё один toolchain refresh.

Это решение уже зафиксировано в [PHASE_A2_TIER1_TOOLCHAIN_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_TIER1_TOOLCHAIN_DECISION.md).

### Шаг 4. Удерживать invariants и secrets

Нужно:

- не допускать возврата tracked secrets;
- не допускать новых unsafe paths;
- повторять:

```bash
pnpm gate:secrets
pnpm gate:invariants
```

после security-remediation проходов.

### Шаг 5. Вынести historical debt отдельно

Нужно:

- не смешивать `workspace_local_findings=8` с repo-tracked leak;
- отдельно вести historical key/rotation debt как follow-up;
- не объявлять `A2` закрытой только потому, что текущий индекс чистый.

## 3. Что считать реальным прогрессом

Реальный прогресс:

- `critical=0` удерживается;
- `high=5` удерживается как узкий toolchain-tail;
- `tracked_findings=0` сохраняется;
- `violations=0` сохраняется.

Не считать прогрессом:

- новый policy-файл без remediation;
- одноразовый ручной просмотр без пересчёта baseline;
- discussion про security без изменения цифр, evidence или явного решения по residual toolchain debt.

## 4. Команды первой волны

```bash
pnpm security:audit:ci
pnpm gate:secrets
pnpm gate:invariants
pnpm security:licenses
```

## 5. Условие завершения первой волны `A2`

Первая волна считается завершённой только когда:

- `critical=0` подтверждено reproducible audit-отчётом;
- release-impact `high` сняты, а остаток `high=5` явно классифицирован как toolchain-only;
- baseline по secrets и invariants остаётся зелёным;
- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) `A-2.3.1` переводится в `done` для `Tier 1`, а residual toolchain-tail уходит в follow-up для более высоких tiers.
