---
id: DOC-EXE-ONE-BIG-PHASE-A0-DAILY-TRIAGE-CHECKLIST-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A0-DAILY-TRIAGE-CHECKLIST-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A0_TRIAGE_EXECUTION_RULES.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md
---
# PHASE A0 DAILY TRIAGE CHECKLIST

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A0-DAILY-TRIAGE-CHECKLIST-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ превращает `A0` из общего governance-правила в один исполняемый ежедневный ритуал. Его задача — не дать `Phase A` расползтись в breadth и не путать активность с настоящим progress.

## 1. Когда использовать

Использовать этот checklist:

- в начале каждого рабочего цикла `Phase A`;
- при появлении любого нового work-item;
- перед тем как поднимать в работу задачу вне уже известных blocker-строк.

## 2. Порядок triage

1. Открыть [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md).
2. Смотреть только строки со статусом:
   - `waiting_external`
   - `open`
3. Проверить, меняет ли новый work-item хотя бы один контур:
   - `A1 legal`
   - `A2 security`
   - `A3 AI governance`
   - `A4 installability / self-host`
   - `A5 IP / OSS / chain-of-title`
4. Если не меняет — пометить как `breadth / later`.
5. Если меняет — привязать задачу к конкретной board-строке `A-*`.
6. Обновить только одно из трёх:
   - `status`
   - `evidence`
   - `next action`

## 3. Обязательные вопросы

Перед принятием любой новой задачи ответ должен быть явным:

1. Какой именно blocker двигается?
2. Какой evidence появится после выполнения?
3. Что именно изменится в board?
4. Не подменяет ли эта задача закрытие красного блока шириной?

Если хотя бы на один вопрос нет прямого ответа, задача не идёт в верх очереди `Phase A`.

## 4. Результаты triage

Каждый новый work-item после triage должен попасть ровно в одну из категорий:

- `run now` — двигает строку `waiting_external/open`
- `queue under blocker` — полезен, но идёт после более сильного blocker
- `breadth / later` — не считается progress `Phase A`
- `blocked by external evidence` — можно двигать только после появления внешнего артефакта

## 5. Что запрещено

Нельзя:

- считать `menu breadth`, новые экраны и декоративную полировку progress `Phase A`;
- продвигать `CRM / front-office` expansion выше красных blocker-строк;
- брать в работу новую autonomy-expansion задачу, пока `A3` остаётся guard-sensitive;
- считать новый markdown сам по себе закрытием blocker.

## 6. Условие done для `A0`

`A0` считается закрытой как внутренний execution-layer, когда:

- для ежедневного triage есть явный checklist;
- каждая новая задача должна привязываться к `A-*` строке board;
- breadth-задачи формально отделены от blocker-work;
- review ритм держится через `board + evidence`, а не через хаотичный backlog.
