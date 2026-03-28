---
id: DOC-OPS-SECURITY-BASELINE-ACCESS-REVIEW-POLICY-20260328
layer: Operations
type: Policy
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-SECURITY-BASELINE-ACCESS-REVIEW-POLICY-20260328
claim_status: asserted
verified_by: code
last_verified: 2026-03-28
evidence_refs: .github/workflows/invariant-gates.yml;.github/workflows/security-audit.yml;.github/workflows/codeql-analysis.yml;.github/workflows/dependency-review.yml;.github/CODEOWNERS;package.json
---
# SECURITY BASELINE AND ACCESS REVIEW POLICY

## CLAIM
id: CLAIM-OPS-SECURITY-BASELINE-ACCESS-REVIEW-POLICY-20260328
status: asserted
verified_by: code
last_verified: 2026-03-28

## Обязательный baseline

| Контроль | Источник | Статус на 2026-03-28 |
|---|---|---|
| Invariant governance | `.github/workflows/invariant-gates.yml`, `pnpm gate:invariants` | `active` |
| Reproducible dependency audit | `.github/workflows/security-audit.yml`, `pnpm security:audit:ci` | `active` |
| Secret scanning | `.github/workflows/security-audit.yml`, `pnpm gate:secrets` | `active` |
| Safe schema validation | `.github/workflows/security-audit.yml`, `pnpm gate:db:schema-validate` | `active` |
| OSS license inventory | `.github/workflows/security-audit.yml`, `pnpm security:licenses` | `active` |
| SBOM generation | `.github/workflows/security-audit.yml`, `pnpm security:sbom` | `active` |
| SAST | `.github/workflows/codeql-analysis.yml` | `active in CI, local scan not required by default` |
| PR dependency review | `.github/workflows/dependency-review.yml` | `active` |
| CODEOWNERS coverage for critical contours | `.github/CODEOWNERS` | `expanded`, но branch protection still external |

## Access review minimum
1. Все изменения в `.github/workflows`, `scripts`, `apps/api/src/shared/**`, `apps/api/src/modules/rai-chat/**`, `apps/telegram-bot/src/**`, `apps/web/app/**`, `apps/web/lib/**` и `docs/05_OPERATIONS/**` должны проходить owner review через `CODEOWNERS`.
2. Branch protection, required reviewers, admin bypass, deploy keys и environment secrets должны проверяться отдельно в GitHub UI минимум раз в квартал.
3. Результат quarterly review фиксировать outside repo или в отдельном restricted evidence packet; из локального Git этот статус не выводится автоматически.

## Исторические security-инциденты, которые нельзя забывать
- `infra/gateway/certs/ca.key` раньше был закоммичен и затем удалён; history/rotation debt остаётся до отдельного подтверждения revocation.
- На `2026-03-28` из индекса удалены tracked `.env` в `mg-core`, но локальные untracked `.env` продолжают существовать как workspace-only risk и не должны попадать в Git.

## Stop criteria
- Любой новый tracked secret / key material.
- Любой новый high/critical finding, который попадает в PR dependency review без triage.
- Любой merge в security-critical paths без owner review.
