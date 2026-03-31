---
id: DOC-EXE-ONE-BIG-PHASE-A5-FIRST-PARTY-LICENSING-STRATEGY-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-FIRST-PARTY-LICENSING-STRATEGY-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: package.json;docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_UNKNOWN_LICENSE_TRIAGE_REGISTER.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# PHASE A5 FIRST-PARTY LICENSING STRATEGY

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-FIRST-PARTY-LICENSING-STRATEGY-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует рабочую first-party licensing strategy для `Phase A`. Он не заменяет внешние IP-доказательства, но снимает двусмысленность, что `private repo` якобы сам по себе решает вопрос правового режима.

## 1. Текущее состояние

Сейчас подтверждено только следующее:

- root package помечен как `private`
- root `LICENSE` в репозитории отсутствует
- `ELP-20260328-09` ещё не принят

Это означает:

- current state не даёт автоматической публичной лицензии;
- current state не даёт доказанного chain-of-title;
- current state подходит только как внутренний/private baseline, но не как завершённая licensing strategy.

## 2. Working strategy для `Phase A`

До закрытия `ELP-20260328-09` считать first-party perimeter так:

- `RAI_EP` = `all rights reserved / internal-private by default`
- никакая внешняя дистрибуция не считается автоматически разрешённой только из-за private repo
- procurement, self-host handoff и external pilot требуют отдельного owner/legal decision

## 3. Что должно появиться до выхода из `A5`

- accepted `ELP-20260328-09`
- явное решение по правовому режиму first-party кода и БД
- понятная связь между first-party perimeter и third-party notice packet
- при необходимости root licensing/notice artifact для external distribution path

## 4. Что этот документ уже решает

Он уже убирает двусмысленность:

1. private repo не равен finished licensing strategy
2. first-party packages из `UNKNOWN` нельзя вечно держать как “наверное нормально”
3. до external pilot действует conservative режим `all rights reserved / no implied public license`

## 5. Что ещё не закрыто

- это не legal conclusion;
- это не заменяет chain-of-title evidence;
- это не открывает внешний pilot без `ELP-20260328-09`.

Поэтому `A5.4` после публикации этой стратегии можно вести как рабочий execution-state, но не как закрытый IP-perimeter.
