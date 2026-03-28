---
id: DOC-OPS-KEY-MATERIAL-SECRET-HYGIENE-INCIDENT-20260328
layer: Operations
type: Incident Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-KEY-MATERIAL-SECRET-HYGIENE-INCIDENT-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: infra/gateway/certs/README.md;package.json;scripts/scan-secrets.cjs;.github/workflows/security-audit.yml
---
# KEY MATERIAL AND SECRET HYGIENE INCIDENT 2026-03-28

## CLAIM
id: CLAIM-OPS-KEY-MATERIAL-SECRET-HYGIENE-INCIDENT-20260328
status: asserted
verified_by: code
last_verified: 2026-03-28

## Что произошло
- В истории репозитория ранее существовал `infra/gateway/certs/ca.key`.
- На `2026-03-28` repo baseline уже был очищен от этого файла в текущем индексе, но history debt оставался.
- В новом secret-scan baseline обнаружились ещё два tracked `.env` в `mg-core` с Telegram token; они сняты с индекса в том же remediation-cycle.

## Состояние после remediation

| Проверка | Результат |
|---|---|
| `infra/gateway/certs/` | в Git разрешены только `README.md`, `.gitignore` и `*.example` |
| `pnpm gate:secrets` | `tracked_findings=0`, `tracked_critical=0` |
| Workspace-only local secrets | остаются в `.env`, `apps/web/.env.local`, `mg-core/backend/.env`, `mg-core/backend/src/mg-chat/.env` и не должны коммититься |

## Обязательные follow-up действия
1. Подтвердить revocation / rotation для материалов, связанных с `ca.key`.
2. Подтвердить rotation для Telegram token из локальных `mg-core` env.
3. Не использовать локальные `.env` как источник для exchange между разработчиками; применять secret storage и `.env.example`.

## Operational verdict
Текущий repo-state очищен от tracked key material и tracked secret env-файлов, но history/rotation debt остаётся отдельным обязательным шагом вне Git.
