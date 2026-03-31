---
id: DOC-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/security/license-inventory.json;var/security/license-inventory.md;package.json;packages/eslint-plugin-tenant-security/package.json;node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild/package.json;node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild/LICENSE.md;node_modules/.pnpm/turbo@2.8.1/node_modules/turbo/package.json;node_modules/.pnpm/turbo@2.8.1/node_modules/turbo/LICENSE;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# PHASE A5 UNKNOWN LICENSE TRIAGE REGISTER

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-UNKNOWN-LICENSE-TRIAGE-REGISTER-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ разносит текущие `31 UNKNOWN` из `var/security/license-inventory.json` по группам triage. Это не legal verdict, а рабочий register для `A5.1`.

## 1. Baseline

На текущем baseline `pnpm security:licenses` показывает:

- `totalPackages = 159`
- `unknownLicenseCount = 31`
- `UNLICENSED = 2`

Это уже лучше прошлого состояния:

- root package `rai-enterprise-platform` больше не `UNKNOWN`, а явно помечен как `UNLICENSED`;
- `packages/eslint-plugin-tenant-security` больше не `UNKNOWN`, а явно помечен как `UNLICENSED`.

## 2. Triage groups

| Группа | Count | Что это за пакеты | Текущий triage-класс | Практический смысл |
|---|---:|---|---|---|
| `esbuild platform packages` | 25 | `@esbuild/*@0.27.2` platform-specific binaries | `conditional allow for Tier 1 internal/self-host` | локально подтверждены `esbuild@0.27.2` + `LICENSE.md` под `MIT`; у platform companions нет собственных markers в inventory, но family локально прослеживается |
| `fsevents` | 1 | `fsevents@2.3.3` | `linux Tier 1 out-of-scope / cross-platform review pending` | optional macOS-native dependency; для текущего Linux self-host pilot не должна блокировать runtime, но остаётся предметом review для distribution beyond Linux |
| `turbo platform packages` | 5 | `turbo-darwin-*`, `turbo-linux-arm64`, `turbo-windows-*` | `conditional allow for Tier 1 internal/self-host` | локально подтверждены `turbo@2.8.1` + `LICENSE` под `MIT`; platform companions пока остаются inventory-unknown без собственных markers |

## 3. First-party perimeter moved out of `UNKNOWN`

В этом шаге repo-side first-party ambiguity уже снята:

| Ref | Package | Предыдущее состояние | Текущее состояние | Evidence |
|---|---|---|---|---|
| `A5-F-01` | `rai-enterprise-platform` | `UNKNOWN` | `UNLICENSED` | [package.json](/root/RAI_EP/package.json), [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md) |
| `A5-F-02` | `eslint-plugin-tenant-security` | `UNKNOWN` | `UNLICENSED` | [package.json](/root/RAI_EP/packages/eslint-plugin-tenant-security/package.json), [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md) |

Это не закрывает `ELP-20260328-09`, но убирает ложную смесь first-party и third-party unknowns в одном списке.

## 4. Working register

| Ref | Group | Representative path | Current status | Next action |
|---|---|---|---|---|
| `A5-U-01` | `esbuild platform packages` | `node_modules/.pnpm/@esbuild+darwin-arm64@0.27.2/node_modules/@esbuild/darwin-arm64` | `triaged_conditional` | зафиксировать в `OSS_LICENSE_AND_IP_REGISTER` и notice packet, что это `MIT-family toolchain/platform companions` для `Tier 1`, но не объявлять final legal verdict для cross-platform distribution |
| `A5-U-02` | `fsevents` | `node_modules/.pnpm/fsevents@2.3.3/node_modules/fsevents` | `triaged_linux_out_of_scope` | удерживать вне Linux `Tier 1` notice bundle и вернуться к review только если появляется macOS distribution/install path |
| `A5-U-03` | `turbo platform packages` | `node_modules/.pnpm/turbo-darwin-64@2.8.1/node_modules/turbo-darwin-64` | `triaged_conditional` | зафиксировать в `OSS_LICENSE_AND_IP_REGISTER` и notice packet, что это `MIT-family dev-toolchain companions` для `Tier 1`, но не объявлять final cross-platform procurement verdict |

## 5. Что уже можно утверждать

- проблема `A5.1` уже не в отсутствии списка;
- проблема теперь уже не в first-party ambiguity;
- remaining `UNKNOWN` сузились до:
  - `25` `esbuild` platform companions
  - `5` `turbo` platform companions
  - `1` `fsevents`
- remaining `UNKNOWN` относятся не к главному Linux runtime perimeter `Tier 1`, а к optional/toolchain/platform хвосту.

## 6. Что этот register ещё не даёт

- он не закрывает legal interpretation;
- он не подтверждает совместимость лицензий;
- он не заменяет notice packet;
- он не снимает blocker для внешнего pilot.

Поэтому `A5.1` после публикации этого register переходит в `in_progress`, а не в `done`.
