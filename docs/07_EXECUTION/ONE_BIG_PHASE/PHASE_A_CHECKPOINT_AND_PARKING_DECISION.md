---
id: DOC-EXE-ONE-BIG-PHASE-A-CHECKPOINT-PARKING-DECISION-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-CHECKPOINT-PARKING-DECISION-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md;var/execution/phase-a-status.json;var/execution/phase-a-closeout-status.json
---
# PHASE A CHECKPOINT AND PARKING DECISION

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-CHECKPOINT-PARKING-DECISION-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ фиксирует простое управленческое решение: `Phase A` в её текущем состоянии не отменяется, но её внешний хвост осознанно паркуется до момента, когда программа снова станет реально рабочей и пригодной для дальнейшего доведения до `pilot`.

## 1. Решение

Текущее решение такое:

- не продолжать сейчас дальнейшее раскладывание и добивание внешнего хвоста `Phase A`;
- сохранить всё, что уже собрано в checklist, board, gate и packet-слоях;
- вернуться к реальному закрытию `A1 / A2 / A4 / A5` только после того, как программа снова будет работать как продукт, а не только как execution-пакет.

Это не отказ от `Phase A`.

Это осознанная пауза внешнего closeout-слоя.

## 2. Почему это решение принято

Причина простая:

- проект сейчас ведёт один человек;
- он одновременно выступает как `owner`, `techlead`, `legal`, `ops` и исполнитель;
- при таком режиме нет смысла и дальше тратить основной фокус на внешний documentation-closeout, если сама программа ещё не даёт ощущение “она работает”.

Главный приоритет сейчас:

- вернуть рабочую программу;
- закрепить реальный пользовательский и продуктовый контур;
- только после этого возвращаться к внешним доказательствам и формальному завершению `Phase A`.

## 3. Что уже зафиксировано и не потеряется

На момент этой точки уже зафиксировано:

- `Phase A` внутри репозитория доведена до состояния `repo_side_exhausted_external_only`;
- все основные checklist, board, packet, bridge, capture и reconciliation-слои уже собраны;
- machine-readable статус уже отвечает на вопрос “что именно ещё держит фазу”.

Ключевые текущие опорные точки:

- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_STATUS_GATE.md)
- [PHASE_A_CLOSEOUT_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md)

Текущий machine-readable снимок:

- `overall_state = external_blocked`
- `closeout_state = repo_side_exhausted_external_only`
- `remaining_owner_queues = 13`
- `remaining_references_count = 12`

Это означает:

- внутри репозитория основная подготовка уже сделана;
- дальше фаза держится почти полностью на внешних артефактах и ответах.

## 4. Что именно паркуется

До возвращения к `Phase A` осознанно паркуются:

- реальный внешний intake по `ELP-*`;
- реальный внешний intake по `A2-S-*`;
- реальный `pilot handoff` intake по `A4-H-01`;
- полный `chain-of-title` closeout по `ELP-20260328-09`;
- дальнейшее размельчение owner queue / outreach / capture / reconciliation-слоёв.

Прямое правило:

- не строить новые packet-слои ради самой `Phase A`, пока не восстановлен работающий продуктовый контур.

## 5. Что становится главным приоритетом вместо этого

Главный фокус теперь переносится с завершения `Phase A` на:

- восстановление работающей программы;
- рабочий пользовательский сценарий;
- реально пригодный контур `agent core / chat / minimal web surface`;
- устранение того, что сейчас ощущается как “программа не работает”.

Проще:

- сначала снова сделать работающий продукт;
- потом вернуться к формальному внешнему closeout.

## 6. Когда возвращаться к окончанию `Phase A`

Возврат к окончанию `Phase A` делать только после такого условия:

- программа снова работает настолько, что есть смысл доводить её до честного `pilot`;
- основная боль уже не “программа не работает”, а “нужно формально и безопасно завершить запускной контур”.

То есть возвращение к фазе правильно делать не по календарю, а по смыслу.

## 7. Как правильно вернуться позже

Когда придёт момент вернуться, порядок такой:

1. открыть [PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md)
2. открыть [PHASE_A_CLOSEOUT_STATUS_GATE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CLOSEOUT_STATUS_GATE.md)
3. открыть [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
4. взять первый реальный внешний blocker, а не строить новый meta-layer вокруг фазы

## 8. Главный смысл этой фиксации

Смысл этого checkpoint не в том, чтобы “заморозить всё навсегда”.

Смысл в том, чтобы:

- не потерять уже собранную работу;
- не распыляться дальше на formal closeout раньше времени;
- честно признать, что сейчас важнее рабочая программа, чем дальнейшее добивание внешнего хвоста `Phase A`.
