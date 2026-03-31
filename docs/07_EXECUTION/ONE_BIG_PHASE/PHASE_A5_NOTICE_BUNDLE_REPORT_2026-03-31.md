---
id: DOC-EXE-ONE-BIG-PHASE-A5-NOTICE-BUNDLE-REPORT-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-BUNDLE-REPORT-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/generate-notice-bundle.cjs;var/security/license-inventory.json;var/security/notice-bundle.json;var/security/notice-bundle.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_OBLIGATIONS_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md
---
# PHASE A5 NOTICE BUNDLE REPORT 2026-03-31

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-BUNDLE-REPORT-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот отчёт фиксирует первый реально assembled `NOTICE` bundle для `A5.2`, а не только policy-пакет по obligations.

## 1. Как собран bundle

- Команда: `pnpm security:notices`
- Generated artifacts:
  - [notice-bundle.json](/root/RAI_EP/var/security/notice-bundle.json)
  - [notice-bundle.md](/root/RAI_EP/var/security/notice-bundle.md)
- Source inventory:
  - [license-inventory.json](/root/RAI_EP/var/security/license-inventory.json)

Bundle собирается через [generate-notice-bundle.cjs](/root/RAI_EP/scripts/generate-notice-bundle.cjs) и поэтому является воспроизводимым, а не ручной заметкой.

## 2. Что реально включено

В первый assembled bundle уже включены representative license texts для семей:

- `MIT`
- `Apache-2.0`
- `ISC`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `BlueOak-1.0.0`

Одновременно в bundle отдельно зафиксированы:

- `esbuild` platform companions как `conditional allow for Tier 1 Linux self-host`
- `turbo` platform companions как `conditional allow for Tier 1 Linux self-host`
- `fsevents` как `linux Tier 1 out-of-scope`
- first-party `UNLICENSED` perimeter как исключённый из third-party notice bundle

## 3. Что это доказывает

Этот отчёт уже позволяет утверждать:

- `A5.2` больше не висит на одном только working packet;
- procurement/self-host handoff теперь имеет реальный generated `NOTICE` baseline;
- triage по `esbuild/turbo/fsevents` связан с assembled bundle, а не живёт отдельно от него;
- first-party perimeter больше не смешивается с third-party notice obligations.

## 4. Что всё ещё не закрыто

Этот bundle ещё не равен final legal sign-off, потому что:

- остаётся final manual classification для remaining `UNKNOWN`;
- `esbuild/turbo` companions пока идут как conditional `Tier 1` решение, а не как universal distribution verdict;
- `ELP-20260328-09` всё ещё не accepted и chain-of-title не закрыт полностью;
- compatibility/legal interpretation по внешней дистрибуции остаётся отдельным решением.

## 5. Decision impact

После публикации этого отчёта:

- `A5.2` усиливается с `working packet only` до `assembled generated bundle`;
- `A-2.6.1` остаётся `in_progress`, но next action теперь уже не “собрать bundle с нуля”, а “дать final legal classification и связать bundle с procurement/distribution decision”;
- `A5` становится ближе к operational closeout внутри `Tier 1`, хотя полный внешний legal/IP closeout ещё не завершён.
