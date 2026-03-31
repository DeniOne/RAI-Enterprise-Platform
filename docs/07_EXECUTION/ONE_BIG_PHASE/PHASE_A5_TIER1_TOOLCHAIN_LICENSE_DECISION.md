---
id: DOC-EXE-ONE-BIG-PHASE-A5-TIER1-TOOLCHAIN-LICENSE-DECISION-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-TIER1-TOOLCHAIN-LICENSE-DECISION-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/security/license-inventory.json;var/security/notice-bundle.json;var/security/notice-bundle.md;node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild/package.json;node_modules/.pnpm/esbuild@0.27.2/node_modules/esbuild/LICENSE.md;node_modules/.pnpm/turbo@2.8.1/node_modules/turbo/package.json;node_modules/.pnpm/turbo@2.8.1/node_modules/turbo/LICENSE;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md
---
# PHASE A5 TIER1 TOOLCHAIN LICENSE DECISION

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-TIER1-TOOLCHAIN-LICENSE-DECISION-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует manual `Tier 1`-решение по последнему `UNKNOWN` perimeter внутри `A5.1`.

Это не universal legal verdict для любой формы дистрибуции. Это консервативное operational решение только для:

- `Tier 1 self-host / localized MVP pilot`
- Linux runtime perimeter
- procurement / due-diligence handoff без публичной cross-platform дистрибуции

## 1. Входной baseline

На момент этого решения подтверждено:

- `pnpm security:licenses` -> `unknownLicenseCount = 31`
- весь remaining `UNKNOWN` perimeter состоит только из:
  - `25` `@esbuild/*` platform companions
  - `5` `turbo-*` platform companions
  - `1` `fsevents`
- first-party ambiguity уже снята через `UNLICENSED`
- assembled `NOTICE` bundle уже собран через `pnpm security:notices`

## 2. Decision table

| Ref | Perimeter | Tier 1 decision | Почему это допустимо сейчас | Что запрещено считать этим решением |
|---|---|---|---|---|
| `A5-U-01` | `@esbuild/*` platform companions | `ALLOW_TIER1_CONDITIONAL` | parent package `esbuild@0.27.2` локально подтверждён как `MIT`; companions трактуются как platform-specific toolchain mirror, а не отдельный first-party/runtime legal perimeter | нельзя считать это final legal verdict для public cross-platform distribution |
| `A5-U-03` | `turbo-*` platform companions | `ALLOW_TIER1_CONDITIONAL` | parent package `turbo@2.8.1` локально подтверждён как `MIT`; companions трактуются как dev-toolchain mirror для текущего Linux self-host perimeter | нельзя считать это final procurement/legal verdict для multi-platform distribution |
| `A5-U-02` | `fsevents@2.3.3` | `OUT_OF_SCOPE_TIER1_LINUX` | пакет относится к macOS-native optional path и не нужен для текущего Linux `Tier 1` self-host perimeter | нельзя считать это review-closed для macOS install/distribution path |

## 3. Правило применения

Это решение действительно только при одновременном соблюдении условий:

- текущий целевой perimeter остаётся `Tier 1 Linux self-host / localized`
- third-party notice bundle собирается через `pnpm security:notices`
- `esbuild` и `turbo` companions не объявляются отдельными runtime-license verdict outside текущего perimeter
- `fsevents` не включается в Linux `Tier 1` distribution/procurement bundle

Если появляется один из сценариев ниже, решение надо пересматривать:

- macOS distribution/install path
- Windows distribution/install path
- публичная cross-platform binary distribution
- enterprise procurement, требующий package-level legal sign-off beyond parent-family mirror rule

## 4. Что это закрывает

Это решение закрывает внутри `Tier 1` именно следующее:

- `A5.1` больше не висит на неразнесённом `UNKNOWN` perimeter;
- procurement/self-host handoff может опираться на assembled `NOTICE` bundle и зафиксированное решение по toolchain хвосту;
- `PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md` перестаёт быть только рабочим triage и получает decision-outcome.

## 5. Что это не закрывает

Это решение не закрывает:

- `ELP-20260328-09`
- chain-of-title
- final legal sign-off для внешней дистрибуции beyond `Tier 1`
- compatibility review для новых платформенных периметров

## 6. Decision impact

После фиксации этого документа:

- `A5.1` можно считать закрытым для `Tier 1 self-host / localized MVP pilot`
- `A5.2` остаётся собранным assembled bundle, но ещё не universal legal distribution verdict
- основной открытый blocker `A5` смещается с `UNKNOWN` triage на:
  - `ELP-20260328-09`
  - procurement/distribution legal sign-off outside `Tier 1`
  - first-party rights chain closeout
