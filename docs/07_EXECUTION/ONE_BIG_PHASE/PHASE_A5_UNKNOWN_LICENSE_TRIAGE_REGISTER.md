---
id: DOC-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/security/license-inventory.json;var/security/license-inventory.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# PHASE A5 UNKNOWN LICENSE TRIAGE REGISTER

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ разносит текущие `33 UNKNOWN` из `var/security/license-inventory.json` по группам triage. Это не legal verdict, а рабочий register для `A5.1`.

## 1. Baseline

На текущем baseline `pnpm security:licenses` показывает:

- `totalPackages = 189`
- `unknownLicenseCount = 33`

## 2. Triage groups

| Группа | Count | Что это за пакеты | Текущий triage-класс | Практический смысл |
|---|---:|---|---|---|
| `esbuild platform packages` | 25 | `@esbuild/*@0.27.2` platform-specific binaries | `manual confirmation required` | похоже на toolchain/platform companions, но локального evidence о license metadata недостаточно |
| `fsevents` | 1 | `fsevents@2.3.3` | `manual confirmation required` | optional macOS-native dependency, не использовать как auto-closed до ручного review |
| `turbo platform packages` | 5 | `turbo-darwin-*`, `turbo-linux-arm64`, `turbo-windows-*` | `manual confirmation required` | build/dev toolchain packages, но всё ещё требуют явной license confirmation |
| `first-party workspace package` | 1 | `packages/eslint-plugin-tenant-security` | `first-party classification required` | это не third-party unknown, а внутренний пакет без явного licensing marker |
| `root package` | 1 | `rai-enterprise-platform` | `first-party classification required` | отсутствие root licensing strategy не даёт автоматически закрыть запись |

## 3. Working register

| Ref | Group | Representative path | Current status | Next action |
|---|---|---|---|---|
| `A5-U-01` | `esbuild platform packages` | `node_modules/.pnpm/@esbuild+darwin-arm64@0.27.2/node_modules/@esbuild/darwin-arm64` | `open` | подтвердить upstream license metadata и зафиксировать legal interpretation |
| `A5-U-02` | `fsevents` | `node_modules/.pnpm/fsevents@2.3.3/node_modules/fsevents` | `open` | вручную подтвердить license text и optional-distribution effect |
| `A5-U-03` | `turbo platform packages` | `node_modules/.pnpm/turbo-darwin-64@2.8.1/node_modules/turbo-darwin-64` | `open` | подтвердить upstream license metadata и зафиксировать legal interpretation |
| `A5-U-04` | `first-party workspace package` | `packages/eslint-plugin-tenant-security` | `open` | перевести под first-party licensing strategy |
| `A5-U-05` | `root package` | repo root | `open` | перевести под first-party licensing strategy |

## 4. Что уже можно утверждать

- проблема `A5.1` уже не в отсутствии списка;
- проблема в том, что `UNKNOWN` периметр не прошёл manual legal classification;
- часть `UNKNOWN` относится не к сторонним runtime libraries, а к first-party или toolchain/platform packages.

## 5. Что этот register ещё не даёт

- он не закрывает legal interpretation;
- он не подтверждает совместимость лицензий;
- он не заменяет notice packet;
- он не снимает blocker для внешнего pilot.

Поэтому `A5.1` после публикации этого register переходит в `in_progress`, а не в `done`.
