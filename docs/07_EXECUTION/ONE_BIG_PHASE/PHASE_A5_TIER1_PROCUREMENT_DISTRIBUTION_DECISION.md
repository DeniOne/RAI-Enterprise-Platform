---
id: DOC-EXE-ONE-BIG-PHASE-A5-TIER1-PROCUREMENT-DISTRIBUTION-DECISION-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-TIER1-PROCUREMENT-DISTRIBUTION-DECISION-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: package.json;packages/eslint-plugin-tenant-security/package.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md
---
# PHASE A5 TIER1 PROCUREMENT AND DISTRIBUTION DECISION

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-TIER1-PROCUREMENT-DISTRIBUTION-DECISION-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ связывает `A5.1`, `A5.2` и `A5.4` в одно рабочее решение для `Tier 1 self-host / localized MVP pilot`. Он не заменяет `ELP-20260328-09`, но убирает серую зону между triage лицензий, notice bundle и first-party licensing strategy.

## 1. Scope решения

Решение действует только для:

- `Tier 1 self-host / localized MVP pilot`
- Linux runtime perimeter
- controlled procurement / due-diligence handoff
- private/internal deployment path без публичной дистрибуции

Решение не действует автоматически для:

- public distribution
- cross-platform shipping
- marketplace/public installer
- wider procurement beyond current pilot perimeter

## 2. Что уже считается достаточным для Tier 1

Для `Tier 1` уже можно считать зафиксированным:

- first-party perimeter держится как `UNLICENSED / all rights reserved / internal-private by default`
- third-party known-license perimeter уже имеет assembled notice baseline
- `esbuild` и `turbo` platform companions разрешены только как `Tier 1 conditional toolchain perimeter`
- `fsevents` считается `linux Tier 1 out-of-scope`

Это означает:

- self-host pilot не трактуется как публичная раздача ПО;
- procurement packet может опираться на current `NOTICE` bundle и текущий OSS/IP register;
- никакая implied public license не возникает из-за private repo или self-host handoff.

## 3. Что обязательно включать в Tier 1 handoff packet

В любой `Tier 1` procurement / due-diligence / self-host handoff пакет должны входить:

- [PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md)
- generated `NOTICE` bundle:
  - `var/security/notice-bundle.json`
  - `var/security/notice-bundle.md`
- [PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_TOOLCHAIN_LICENSE_DECISION.md)
- [PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md)
- [OSS_LICENSE_AND_IP_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md)

## 4. Что прямо запрещено до ELP-09

До acceptance `ELP-20260328-09` запрещено считать разрешённым:

- публичную дистрибуцию first-party кода
- передачу прав на код или БД по умолчанию
- внешний pilot с обещанием завершённого chain-of-title
- трактовку `NOTICE` bundle как замены IP evidence

## 5. Decision rule для команды

До закрытия `ELP-20260328-09` действует такое правило:

- `Tier 1 self-host` допустим только как controlled private deployment perimeter
- first-party code остаётся в режиме `all rights reserved / internal-private`
- third-party obligations закрываются assembled `NOTICE` baseline и toolchain decision
- любые вопросы о правах на код, БД и redistribution уходят в `ELP-20260328-09`

## 6. Practical effect

Практический эффект этого решения такой:

- `A5.4` можно считать закрытой для внутреннего `Tier 1` execution perimeter;
- `A5` больше не висит между “есть first-party strategy” и “непонятно, как это связано с handoff”;
- главный оставшийся блокер `A5` теперь уже не repo-side ambiguity, а внешний `ELP-20260328-09`.
