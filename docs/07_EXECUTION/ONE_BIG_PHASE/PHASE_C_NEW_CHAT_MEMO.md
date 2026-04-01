---
id: DOC-EXE-ONE-BIG-PHASE-C-NEW-CHAT-MEMO-20260401
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-C-NEW-CHAT-MEMO-20260401
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md;docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md;docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md;apps/web/app;apps/web/components/ai-chat;apps/api/src/modules/rai-chat
---
# PHASE C NEW CHAT MEMO

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-C-NEW-CHAT-MEMO-20260401
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ — памятка для запуска нового чата по `Phase C`, чтобы сразу войти в рабочий контур и не возвращаться к повторному аудиту или к размытию границ между фазами.

## 1. Контекст на входе

- Большой аудит уже выполнен и зафиксирован в `One Big Phase` контуре.
- `Phase A` не отменена, но припаркована как checkpoint.
- `Phase B` частично реализована и задокументирована; незакрытые хвосты `B` остаются carry-over backlog.
- Управленческий фокус этого нового чата переносится на `Phase C`.

Опорные документы:

- [INDEX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md)
- [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md)
- [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md)
- [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md)
- [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md)
- [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md)

## 2. Что именно такое `Phase C`

`Phase C` — это минимальная `web`-поверхность над уже собранным ядром:

- `login / session / thread`;
- `thread -> message -> response` для governed чата;
- governed work windows;
- user-facing explainability/evidence;
- минимальная модель доступа.

Ключевая цель:

- превратить `web` из витрины в рабочий вход в уже существующий backend/runtime контур.

## 3. Что НЕ нужно делать в новом чате

- не возвращаться к внешнему closeout `Phase A` (`A1/A2/A4/A5`);
- не запускать новый общий audit;
- не расширять `Phase C` до `Phase D` задач (`installability`, `backup/restore`, pilot hardening);
- не раздувать `web`-breadth вторичными экранами до стабилизации базового пути;
- не уводить чат в новые agent-role расширения вместо стабилизации текущего контура.

## 4. Как обращаться с незакрытыми хвостами `Phase B`

Открытые строки `Phase B` считаются известным carry-over:

- `B-2.2.2`
- `B-2.2.3`
- `B-2.3.3`
- `B-2.4.2`
- `B-2.5.2`

Правило:

- закрывать эти хвосты только если они блокируют минимальный `Phase C` путь;
- не открывать отдельный поток “доделать весь `Phase B`”, если блокера для `web`-пути нет.

## 5. Главная задача нового чата

Собрать рабочий execution-пакет `Phase C` уровня `Phase B`:

- `Phase C implementation plan`;
- `Phase C execution board`;
- подфазы и детальные чеклисты;
- явные критерии завершения `Phase C`;
- жёсткая граница между `Phase C` и `Phase D`.

## 6. Правильный первый шаг в новом чате

1. Прочитать [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md).
2. Сопоставить границы `C` с [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md) и [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md).
3. После этого проектировать и исполнять `Phase C` пакет без расширения в `D`.

## 7. Технические правила для нового чата

- соблюдать `AGENTS.md`;
- весь текст вести на русском;
- логические изменения фиксировать в `memory-bank`;
- правки файлов выполнять через `apply_patch`;
- после изменений в docs запускать:
  - `pnpm lint:docs`;
  - `pnpm lint:docs:matrix:strict` при изменении claims/матрицы/структуры.
