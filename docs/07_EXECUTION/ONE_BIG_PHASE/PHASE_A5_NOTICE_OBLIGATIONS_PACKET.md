---
id: DOC-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-NOTICE-OBLIGATIONS-PACKET-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: var/security/license-inventory.json;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md
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

## 2. Working obligations map

| License family | Working obligation для `Tier 1` | Current status |
|---|---|---|
| `MIT` | включить license text/attribution в distribution or procurement pack | `нужно оформить` |
| `Apache-2.0` | включить license text и сохранить `NOTICE`, если он есть у upstream | `нужно оформить` |
| `ISC` | включить license text/attribution | `нужно оформить` |
| `BSD-2-Clause / BSD-3-Clause` | включить license text/attribution и сохранить copyright notice | `нужно оформить` |
| `BlueOak / mixed family` | вручную подтвердить точный obligation set | `нужно оформить` |
| `UNKNOWN` | не считать закрытым до triage | `blocked by A5.1` |
| `first-party packages` | governed by first-party licensing strategy, not by third-party notice pack | `blocked by A5.4` |

## 3. Где notice packet должен жить

Для `Tier 1 self-host / localized` minimum pack должен быть привязан к:

- install/self-host packet;
- procurement or due-diligence handoff;
- при необходимости отдельному legal bundle вне runtime-кода.

## 4. Что ещё не закрыто

- actual assembled NOTICE bundle не собран;
- `UNKNOWN` perimeter ещё не прошёл triage;
- first-party licensing strategy ещё не завершена.

Поэтому `A5.2` после публикации этого packet можно вести в `in_progress`, но не считать закрытой.
