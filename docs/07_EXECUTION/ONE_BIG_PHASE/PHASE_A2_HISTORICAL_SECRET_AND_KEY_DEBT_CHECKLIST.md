---
id: DOC-EXE-ONE-BIG-PHASE-A2-HISTORICAL-SECRET-KEY-DEBT-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A2-HISTORICAL-SECRET-KEY-DEBT-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md;docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md;var/security/secret-scan-report.json
---
# PHASE A2 HISTORICAL SECRET AND KEY DEBT CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A2-HISTORICAL-SECRET-KEY-DEBT-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы закрыть не текущий tracked-leak, а исторический security debt: старый `ca.key`, локальные Telegram token и любые rotation/revocation действия, которые не доказываются одним только чистым Git-индексом.

Связанные micro-checklists:

- [PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S1_CA_KEY_REVOCATION_CHECKLIST.md)
- [PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_S2_TELEGRAM_TOKEN_ROTATION_CHECKLIST.md)

Статус evidence-layer проверять через:

- `pnpm security:evidence:status`
- `pnpm gate:security:evidence`

## 1. Что именно считается хвостом

На сейчас подтверждено:

- `pnpm gate:secrets` даёт `tracked_findings=0`
- в истории репозитория раньше существовал `infra/gateway/certs/ca.key`
- локальные workspace-only `.env` всё ещё существуют и содержат чувствительные данные
- это уже не active leak в Git, но ещё и не доказанное закрытие инцидента

Это значит:

- repo-state очищен;
- incident-state ещё не доведён до полного security closeout.

## 2. Что сделать

### Шаг 1. Зафиксировать perimeter исторического долга

Нужно письменно перечислить:

- какой именно материал раньше лежал в Git;
- когда он был убран из индекса;
- какие токены или ключи могли считаться затронутыми;
- какие локальные `.env` продолжают существовать только как workspace-only risk.

Минимальные источники:

- [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md)
- `pnpm gate:secrets`

### Шаг 2. Подтвердить revocation / rotation по `ca.key`

Нужно получить внешний или restricted artifact, который подтверждает одно из двух:

- ключ был отозван и больше не используется;
- или весь связанный trust-perimeter перевыпущен заново.

Без этого нельзя считать historical key debt закрытым.

### Шаг 3. Подтвердить rotation по Telegram token и смежным локальным секретам

Нужно отдельно проверить:

- `mg-core/backend/.env`
- `mg-core/backend/src/mg-chat/.env`
- все локальные Telegram token, которые могли пережить старый remediation-cycle

Требуется не “кажется уже новый”, а явная фиксация rotation / invalidation.

### Шаг 4. Закрыть режим хранения локальных секретов

Нужно:

- не использовать локальные `.env` как способ передачи секретов между людьми;
- держать только `.env.example` в Git;
- реальные значения перенести в secret storage или другой ограниченный канал.

### Шаг 5. Обновить execution-след

После появления реальных evidence обновить:

- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md), если меняется сила доказательства
- [KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md](/root/RAI_EP/docs/05_OPERATIONS/KEY_MATERIAL_AND_SECRET_HYGIENE_INCIDENT_2026-03-28.md)

## 3. Что считается сильным доказательством

Сильное доказательство:

- restricted memo или artifact о revocation / rotation по `ca.key`;
- restricted memo или artifact о rotation затронутых Telegram token;
- зелёный `pnpm gate:secrets`, подтверждающий `tracked_findings=0`;
- обновлённый incident closeout, где historical debt уже не описан как открытый.

## 4. Что не считать закрытием

Не считать закрытием:

- просто удаление файла из Git;
- просто отсутствие файла в текущем дереве;
- устное подтверждение без artifact;
- наличие `.env.example` без подтверждения, что реальные токены перевыпущены.

## 5. Exit condition

Этот checklist считается закрытым только когда одновременно выполнено:

- есть evidence по revocation / rotation `ca.key`-related perimeter;
- есть evidence по rotation локальных Telegram token, если они считались затронутыми;
- `pnpm gate:secrets` остаётся зелёным по tracked perimeter;
- historical secret/key debt больше не описывается как open issue в `A2`.
