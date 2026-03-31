---
id: DOC-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/generate-notice-bundle.cjs;var/security/license-inventory.json;var/security/notice-bundle.json;var/security/notice-bundle.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md
---
# PHASE A5 NOTICE OBLIGATIONS PACKET

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует минимальный working packet по notice/attribution obligations для `A5.2`. Это не финальная legal интерпретация, а operational baseline, который не даёт забыть про обязательные действия по дистрибуции и procurement.

## 1. Базовое правило

До закрытия `UNKNOWN` perimeter нельзя считать notice packet финальным. Но рабочий пакет уже должен существовать, чтобы:

- не потерять обязательства по known license families;
- не смешивать first-party код и third-party notices;
- не выпускать self-host packet без ясного места для license texts и attributions.

На текущем шаге важно новое уточнение:

- first-party packages уже выведены из `UNKNOWN` через `UNLICENSED`;
- remaining `UNKNOWN` для `Tier 1` — это в основном optional/toolchain platform companions.
- assembled baseline уже существует в:
  - [notice-bundle.md](/root/RAI_EP/var/security/notice-bundle.md)
  - [notice-bundle.json](/root/RAI_EP/var/security/notice-bundle.json)

## 2. Working obligations map

| License family | Working obligation для `Tier 1` | Current status |
|---|---|---|
| `MIT` | включить license text/attribution в distribution or procurement pack | `assembled baseline создан` |
| `Apache-2.0` | включить license text и сохранить `NOTICE`, если он есть у upstream | `assembled baseline создан` |
| `ISC` | включить license text/attribution | `assembled baseline создан` |
| `BSD-2-Clause / BSD-3-Clause` | включить license text/attribution и сохранить copyright notice | `assembled baseline создан` |
| `BlueOak / mixed family` | вручную подтвердить точный obligation set | `assembled baseline создан` |
| `UNKNOWN esbuild/turbo companions` | для `Tier 1 Linux self-host` считать `conditional toolchain mirror`, держать out of final public distribution bundle до formal legal sign-off | `частично оттриажено` |
| `UNKNOWN fsevents` | не включать в Linux `Tier 1` bundle; вернуться только если появляется macOS distribution/install path | `частично оттриажено` |
| `first-party packages` | governed by first-party licensing strategy, not by third-party notice pack | `repo-side baseline подтверждён` |

## 3. Assembled bundle baseline

Первый assembled bundle уже собран командой:

```bash
pnpm security:notices
```

Что он даёт:

- тянет актуальный inventory через `pnpm security:licenses`;
- собирает first generated bundle в `var/security/notice-bundle.{json,md}`;
- прикладывает representative license texts для основных known license families;
- связывает `esbuild/turbo/fsevents` perimeter с triage-решением, а не оставляет его только в register.

Execution-evidence этого шага зафиксирован в:

- [PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_NOTICE_BUNDLE_REPORT_2026-03-31.md)

## 4. Где notice packet должен жить

Для `Tier 1 self-host / localized` minimum pack должен быть привязан к:

- install/self-host packet;
- procurement or due-diligence handoff;
- при необходимости отдельному legal bundle вне runtime-кода.

Рабочее правило для текущего `Tier 1 Linux`:

- `esbuild`/`turbo` parent-family notices надо подготовить как минимум в procurement/due-diligence bundle;
- `fsevents` не считать частью текущего Linux runtime-distribution perimeter;
- `UNLICENSED` first-party packages не должны попадать в third-party notice bundle.

## 5. Что ещё не закрыто

- final legal sign-off по assembled bundle отсутствует;
- `UNKNOWN` perimeter уже сужен до optional/toolchain хвоста, но final legal sign-off ещё отсутствует;
- first-party licensing strategy уже имеет repo-side baseline, но внешняя chain-of-title верификация ещё не завершена.

Для `Tier 1 self-host / localized` этот packet теперь уже связан с handoff-решением:

- [PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_TIER1_PROCUREMENT_DISTRIBUTION_DECISION.md)

Поэтому `A5.2` внутри `Tier 1` больше не висит как “собранный bundle без режима применения”. Рабочий остаток теперь уже не в packet-е, а в:

- final legal sign-off beyond `Tier 1`
- `ELP-20260328-09`
- wider distribution/per-procurement perimeter
