---
id: DOC-EXE-ONE-BIG-PHASE-A2-FIRST-WAVE-SECURITY-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
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

На `2026-03-31` подтверждено:

- `pnpm security:audit:ci` -> `critical=2`, `high=37`
- `pnpm gate:secrets` -> `tracked_findings=0`, `workspace_local_findings=8`
- `pnpm gate:invariants` -> `violations=0`, `raw_sql_unsafe=0`, `controllers_without_guards=0`

Это означает:

- security baseline уже существует;
- tracked secret leakage сейчас не блокирует выпуск;
- главный открытый хвост в `A2` — dependency-risk и historical debt outside repo.

## 2. Что делать первой волной

### Шаг 1. Зафиксировать current security snapshot

Проверить и сохранить:

- `var/security/npm-audit.json`
- `var/security/security-audit-summary.json`
- `var/security/secret-scan-report.json`

Цель:

- не спорить о baseline на словах;
- опираться на конкретный reproducible snapshot.

### Шаг 2. Разобрать `critical=2`

Нужно:

- выделить оба `critical` finding;
- понять, какие dependency paths их тянут;
- определить, можно ли обновить пакет, заменить пакет или заизолировать path.

Это самый верхний приоритет `A2`.

### Шаг 3. Разобрать release-impact часть из `high=37`

Нужно:

- не закрывать все `high` подряд;
- сначала выделить те, что реально влияют на `Tier 1`;
- отделить отложимые `high` от блокирующих.

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

- `critical=2` начинает уменьшаться;
- `high=37` уменьшается по release-impact части;
- `tracked_findings=0` сохраняется;
- `violations=0` сохраняется.

Не считать прогрессом:

- новый policy-файл без remediation;
- одноразовый ручной просмотр без пересчёта baseline;
- discussion про security без изменения цифр или evidence.

## 4. Команды первой волны

```bash
pnpm security:audit:ci
pnpm gate:secrets
pnpm gate:invariants
pnpm security:licenses
```

## 5. Условие завершения первой волны `A2`

Первая волна считается завершённой только когда:

- `critical` больше не остаются без triage;
- release-impact `high` выделены отдельно;
- baseline по secrets и invariants остаётся зелёным;
- в [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) `A-2.3.1` меняется из чистого `open` в реальный remediation-state.
