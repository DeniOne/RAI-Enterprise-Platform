---
id: DOC-EXE-ONE-BIG-PHASE-A5-STATUS-GATE-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-STATUS-GATE-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-status.cjs;package.json;var/compliance/phase-a5-status.json;var/compliance/phase-a5-status.md;var/security/license-inventory.json;var/security/notice-bundle.json;var/compliance/phase-a5-chain-of-title-source-register.json;var/compliance/phase-a5-chain-of-title-collection.json;var/compliance/phase-a5-chain-of-title-handoff.json;var/compliance/phase-a5-chain-of-title-request-packet.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md
---
# PHASE A5 STATUS GATE

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-STATUS-GATE-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ переводит `A5` из набора отдельных packet-слоёв в один machine-readable status/gate. Он не заменяет `ELP-20260328-09`, а формально показывает, что уже закрыто для `Tier 1`, а что всё ещё удерживается внешним chain-of-title evidence.

## 1. Что именно проверяется

`phase:a5:status` пересобирает и сверяет один общий контур:

- `var/security/license-inventory.json`
- `var/security/notice-bundle.json`
- `var/compliance/phase-a5-chain-of-title-source-register.json`
- `var/compliance/phase-a5-chain-of-title-collection.json`
- `var/compliance/phase-a5-chain-of-title-handoff.json`
- `var/compliance/phase-a5-chain-of-title-request-packet.json`
- restricted metadata `ELP-20260328-09`
- restricted delivery packet для `ELP-20260328-09`

На выходе публикуются:

- `var/compliance/phase-a5-status.json`
- `var/compliance/phase-a5-status.md`

## 2. Команды

Статус:

- `pnpm phase:a5:status`

Gate:

- `pnpm gate:phase:a5:status`

## 3. Что считается сильным результатом

Сильный repo-side результат для `A5`:

- `A5.1` зафиксирован как `done_for_tier1`
- `A5.2` зафиксирован как `assembled_for_tier1`
- `A5.3 repo-side` зафиксирован как `complete`
- `A5.4` зафиксирован как `done_for_tier1`
- общий `current_state` становится `external_blocked`
- общий `tier1_state` становится `conditional_ready_pending_elp09`

Это означает:

- внутри репозитория `A5` подготовлена достаточно глубоко для `Tier 1 self-host / localized`
- внешний blocker теперь уже не в packet-структуре, а в signed evidence по `ELP-20260328-09`

## 4. Что этот gate не разрешает

Даже при зелёном `pnpm gate:phase:a5:status` запрещено считать `A5` полностью закрытой, если:

- `ELP-20260328-09` остаётся в `requested`, `received` или `reviewed`
- нет accepted chain-of-title pack
- board всё ещё держит `A-2.6.3` как `guard_active`

То есть этот gate подтверждает не “всё закрыто”, а:

- repo-side perimeter собран без drift
- внешний blocker формализован и больше не спрятан в хаотичных handoff-слоях

## 5. Что должно измениться дальше

После реального acceptance `ELP-20260328-09`:

- `external_status` должен стать `accepted`
- `current_state` может перейти из `external_blocked` в `closed`
- `tier1_state` может перейти в `ready`
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md) может пересматривать `A-2.6.2` и `A-2.6.3`

До этого момента `PHASE A5 STATUS GATE` нужен как честный machine-readable ответ на вопрос:

“repo-side уже готова или мы всё ещё не собрали даже внутренний контур?”
