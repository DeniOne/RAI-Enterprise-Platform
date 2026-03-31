---
id: DOC-EXE-ONE-BIG-PHASE-A0-TRIAGE-RULES-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.1.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A0-TRIAGE-RULES-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_DAILY_TRIAGE_CHECKLIST.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md
---
# PHASE A0 TRIAGE EXECUTION RULES

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A0-TRIAGE-RULES-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы `Phase A` не расползалась в ширину и не теряла приоритеты.

## 1. Базовое правило

Любая новая задача сначала проходит один вопрос:

`это закрывает blocker Phase A или это только ширина?`

Если это только ширина, задача не поднимается выше `A1–A5`.

## 2. Что считать blocker-задачей

Blocker-задача обязана менять хотя бы один из этих контуров:

- `legal / privacy / operator / residency`
- `security / AppSec / secret hygiene`
- `AI governance / tool / HITL / eval`
- `installability / self-host / backup-restore`
- `IP / OSS / chain-of-title`

Если задача не меняет ни один из этих контуров, она не считается progress `Phase A`.

## 3. Что считать шириной

Ширина в `Phase A`:

- расширение меню;
- новые экраны ради полноты интерфейса;
- рост `CRM / front-office` вширь;
- новые agent roles сверх текущего важного состава;
- новые интеграции;
- `SaaS / hybrid` ambitions;
- визуальная полировка вместо закрытия gate.

Важно:

- существующие `front-office / CRM` контуры не запрещены;
- запрещено их преждевременное расширение выше стоп-блокеров.

## 4. Daily triage loop

Каждый новый рабочий день `Phase A` начинать так:

1. Открыть [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md).
2. Смотреть только строки `waiting_external` и `open`.
3. Проверить, какое новое evidence реально появилось.
4. Разрешить в верх очереди только то, что двигает эти строки.

## 5. Stop-правила

Нельзя:

- считать breadth-задачи прогрессом ядра;
- поднимать `Phase B`, пока `Phase A` красная;
- принимать новый work-item без привязки к строке board;
- подменять evidence новым красивым markdown.

## 6. Условие выхода для `A0`

`A0` считается рабочей, когда:

- ни одна breadth-задача не стоит выше `A1–A5`;
- каждая новая задача привязана к `board`;
- review идёт по `status / evidence / next action`, а не по идеям вообще.

Практический execution-артефакт для этого режима:

- [PHASE_A0_DAILY_TRIAGE_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_DAILY_TRIAGE_CHECKLIST.md)
