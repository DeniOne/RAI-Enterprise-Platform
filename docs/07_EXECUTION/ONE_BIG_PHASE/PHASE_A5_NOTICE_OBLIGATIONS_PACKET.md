---
id: DOC-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/security/license-inventory.json;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_FIRST_PARTY_LICENSING_STRATEGY.md
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

## 2. Working obligations map

| License family | Working obligation для `Tier 1` | Current status |
|---|---|---|
| `MIT` | включить license text/attribution в distribution or procurement pack | `нужно оформить` |
| `Apache-2.0` | включить license text и сохранить `NOTICE`, если он есть у upstream | `нужно оформить` |
| `ISC` | включить license text/attribution | `нужно оформить` |
| `BSD-2-Clause / BSD-3-Clause` | включить license text/attribution и сохранить copyright notice | `нужно оформить` |
| `BlueOak / mixed family` | вручную подтвердить точный obligation set | `нужно оформить` |
| `UNKNOWN esbuild/turbo companions` | для `Tier 1 Linux self-host` считать `conditional toolchain mirror`, держать out of final public distribution bundle до formal legal sign-off | `частично оттриажено` |
| `UNKNOWN fsevents` | не включать в Linux `Tier 1` bundle; вернуться только если появляется macOS distribution/install path | `частично оттриажено` |
| `first-party packages` | governed by first-party licensing strategy, not by third-party notice pack | `repo-side baseline подтверждён` |

## 3. Где notice packet должен жить

Для `Tier 1 self-host / localized` minimum pack должен быть привязан к:

- install/self-host packet;
- procurement or due-diligence handoff;
- при необходимости отдельному legal bundle вне runtime-кода.

Рабочее правило для текущего `Tier 1 Linux`:

- `esbuild`/`turbo` parent-family notices надо подготовить как минимум в procurement/due-diligence bundle;
- `fsevents` не считать частью текущего Linux runtime-distribution perimeter;
- `UNLICENSED` first-party packages не должны попадать в third-party notice bundle.

## 4. Что ещё не закрыто

- actual assembled NOTICE bundle не собран;
- `UNKNOWN` perimeter уже сужен до optional/toolchain хвоста, но final legal sign-off ещё отсутствует;
- first-party licensing strategy уже имеет repo-side baseline, но внешняя chain-of-title верификация ещё не завершена.

Поэтому `A5.2` после публикации этого packet можно вести в `in_progress`, но не считать закрытой.
