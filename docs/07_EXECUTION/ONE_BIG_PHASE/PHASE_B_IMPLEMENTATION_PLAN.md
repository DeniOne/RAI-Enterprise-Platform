---
id: DOC-EXE-ONE-BIG-PHASE-B-IMPLEMENTATION-PLAN-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.2.0
owners: ["@techlead"]
last_updated: 2026-04-01
claim_id: CLAIM-EXE-ONE-BIG-PHASE-B-IMPLEMENTATION-PLAN-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-04-01
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md;docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md;docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md;docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/07_EXECUTION/RAI_EP_MVP_EXECUTION_CHECKLIST.md;docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md;docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;apps/api/src/modules/rai-chat;apps/api/src/modules/tech-map;apps/api/src/modules/explainability
---
# PHASE B IMPLEMENTATION PLAN

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-B-IMPLEMENTATION-PLAN-20260331
status: asserted
verified_by: manual
last_verified: 2026-04-01

Этот документ переводит `Phase B` из общего канона в конкретную схему исполнения. Он фиксирует рабочие подфазы `B0–B4`, их порядок, критерии завершения и жёсткие границы против расползания `Phase B` в `Phase C` и `Phase D`.

`Phase A` при этом не отменяется и не считается закрытой. Она осознанно припаркована как checkpoint по [PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_CHECKPOINT_AND_PARKING_DECISION.md), а `Phase B` становится следующей активной подфазой исполнения внутри `One Big Phase`.

Для общего канона `Phase B` использовать также [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md).

Для живого статуса работ по строкам использовать также [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md).

## 0. Текущий статус реализации (2026-04-01)

`Phase B` уже переведена в активный runtime-режим и частично закрыта по board-строкам:

- `done`: `B-2.1.1`, `B-2.1.2`, `B-2.2.1`, `B-2.3.1`, `B-2.3.2`, `B-2.4.1`, `B-2.5.1`
- `in_progress`: `B-2.2.2`, `B-2.2.3`, `B-2.3.3`, `B-2.4.2`, `B-2.5.2`
- `guard_active`: `B-2.1.3`, `B-2.4.3`, `B-2.5.3`

Источником статусной истины остаётся [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md). Этот implementation-plan задаёт порядок и критерии, а board фиксирует факт исполнения.

## 1. Смысл `Phase B`

`Phase B` нужна, чтобы собрать реальное ядро продукта до минимальной `web`-поверхности и до `self-host / pilot`-контуров.

Пока `Phase B` не завершена:

- Техкарта ещё не считается реальным центром исполнения;
- agent runtime ещё нельзя считать замкнутым управляемым ядром;
- `execution / deviation / result` loop ещё не считается единым рабочим путём;
- explainability и evidence ещё нельзя считать встроенными в основной сценарий;
- нельзя выдавать наличие чата или отдельных runtime-фич за готовность `web`-поверхности или `pilot`.

## 2. Подфазы исполнения

### `B0` — scope lock и защита границ фазы

Что входит:

- зафиксировать, что активный объём `Phase B` ограничен `governed core`, `TechMap`, `execution loop`, `explainability/evidence`, controlled orchestration;
- отделить задачи ядра от задач `web`-поверхности и от задач `self-host / ops`;
- перевести планирование работ на board-логику `что двигает ядро, а что создаёт ширину`.

Детальный чеклист:

- [x] Каждую новую задачу проверять вопросом: она замыкает ядро или уводит в `Phase C/D`.
- [x] Не брать в `Phase B` menu breadth, вторичные `web`-экраны, `settings/admin` shell.
- [x] Не брать в `Phase B` installability, `backup / restore`, support boundary и pilot handoff.
- [x] Не расширять agent roles, если это не требуется для замыкания уже существующего governed core.

Что меняется:

- `Phase B` перестаёт быть расплывчатым “восстановлением MVP” и становится узким execution-контуром ядра.

Выход:

- любая новая работа умеет быть отнесена либо к `B`, либо к `C`, либо к `D`;
- secondary breadth не подменяет движение ядра.

### `B1` — закрепить Техкарту как центр системы

Что входит:

- связать runtime-логику с тем, что Техкарта является главным управленческим объектом;
- подтянуть путь `контекст -> TechMap draft/review state -> execution intent`;
- не оставлять Техкарту отдельным артефактом, живущим рядом с чатом.

Детальный чеклист:

- [x] Подтвердить, что основной бизнес-owner workflow в ядре ведёт к Техкарте, а не мимо неё.
- [ ] Зафиксировать, какие состояния Техкарты являются рабочими входами в исполнение и объяснение результата.
- [x] Не держать критичную логику Техкарты в побочных путях без связи с governed workflow.
- [ ] Убедиться, что рекомендации, отклонения и revision привязаны к lifecycle Техкарты, а не существуют как отдельные ответы.

Что меняется:

- Техкарта становится операционным центром ядра, а не “ещё одним документом”.

Выход:

- основной рабочий сценарий больше не теряет связь с lifecycle Техкарты;
- команда может показать, где в ядре живут `draft / review / approval / execution / revision`-смыслы.

### `B2` — замкнуть `execution / deviation / result` loop

Что входит:

- довести цепочку от контекста и Техкарты до фактического исполнения;
- сделать отклонения видимым и управляемым участком сценария;
- сделать результат и объяснение результата частью того же пути.

Детальный чеклист:

- [x] Явно различать `execution state`, `deviation state` и `result state`.
- [x] Не прятать отклонения в свободный чат без структурированного follow-up.
- [ ] Показать, как результат связан с исходным замыслом Техкарты и с фактическими отклонениями.
- [x] Не считать loop закрытым, если есть только draft generation или только отдельный deviation tool.

Что меняется:

- ядро начинает вести пользователя к результату, а не только выдавать частичные ответы.

Выход:

- основной путь `контекст -> TechMap -> execution -> deviation -> result` описан как единый governed contour;
- результат и отклонения перестают выпадать в side-path.

### `B3` — стабилизировать governed orchestration без расширения ширины

Что входит:

- удержать текущий agent runtime управляемым;
- связать orchestration с задачей ядра, а не с ростом числа ролей;
- закрепить controlled routing, policy boundaries и human confirmation там, где это уже нужно текущему core-loop.

Детальный чеклист:

- [x] Не добавлять новые agent roles для компенсации незамкнутого ядра.
- [ ] Проверить, что orchestration служит TechMap-centered workflow, а не отдельным демонстрациям “умности”.
- [x] Удерживать policy и runtime governance в роли ограничителя, а не декоративного слоя.
- [ ] Не размывать ownership между orchestration, business-owner и explainability контуром.

Что меняется:

- orchestrator и agent runtime становятся опорой ядра, а не источником хаотической ширины.

Выход:

- текущий набор agent/runtime ролей достаточен для доказательства полезности ядра;
- маршрутизация и policy не конфликтуют с центральным TechMap-loop.

### `B4` — встроить explainability и evidence в реальный сценарий

Что входит:

- превратить explainability и evidence из инфраструктурного следа в обязательную часть основного пути;
- обеспечить объяснение решений, отклонений и результатов внутри ядра;
- не переносить user-facing explainability в `Phase C`, если сама логика уже должна существовать в `Phase B`.

Детальный чеклист:

- [x] Для ключевых шагов ядра явно показать `почему система пришла к этому выводу`.
- [x] Для ключевых ответов и действий удерживать evidence/perimeter, а не prose без опоры.
- [x] Не считать explainability закрытой только потому, что есть отдельные сервисы, если она не встроена в core-flow.
- [x] Зафиксировать, что user-facing визуальная подача explainability относится к `Phase C`, а сама логика и контракты explainability относятся к `Phase B`.

Что меняется:

- explainability и evidence перестают быть скрытым инженерным слоем и становятся частью продукта.

Выход:

- ядро умеет не только что-то делать, но и честно объяснять, почему и на чём это основано;
- `Phase C` получает уже существующий explainability-core, а не должна изобретать его заново на уровне UI.

## 3. Порядок исполнения

Исполнять в таком режиме:

1. Сначала включить `B0`.
2. После этого вести `B1`, `B2`, `B3`, `B4` как один связанный пакет ядра.
3. Приоритет внутри пакета:
   - сначала `B1`;
   - затем `B2`;
   - затем `B3`;
   - затем `B4`.
4. Ни одна подфаза не считается завершённой, пока её состояние не отражено в board.

## 4. Явная граница `B` против `C` и `D`

### Что относится к `Phase B`

- governed core;
- `Agent Core`;
- lifecycle Техкарты как ядра;
- controlled orchestration;
- `execution / deviation / result` loop;
- explainability/evidence логика и контракт;
- рабочие runtime-границы, нужные именно для core-loop.

### Что уже относится к `Phase C`

- `login / session / thread`;
- `web chat` как пользовательский рабочий вход;
- governed work windows в пользовательском интерфейсе;
- user-facing визуализация explainability/evidence;
- minimal access model для `web`-поверхности;
- стабилизация пути `thread -> message -> response`.

### Что уже относится к `Phase D`

- installability;
- install/upgrade packet;
- `backup / restore`;
- support boundary;
- monitoring / incident / rollback contour;
- controlled `self-host / localized` pilot;
- hardening перед pilot.

Правило:

- если задача может жить только через `web`-вход, это уже `Phase C`;
- если задача имеет смысл только в контуре `self-host / ops / pilot`, это уже `Phase D`;
- если задача нужна, чтобы ядро вообще стало честным центром исполнения, это `Phase B`.

## 5. Артефакты управления

Главные рабочие артефакты `Phase B`:

- [02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/02_PHASE_B_GOVERNED_CORE_AND_TECHMAP.md)
- [PHASE_B_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_IMPLEMENTATION_PLAN.md)
- [PHASE_B_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_B_EXECUTION_BOARD.md)
- [03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/03_PHASE_C_MINIMAL_WEB_AND_ACCESS.md)
- [04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/04_PHASE_D_SELF_HOST_PILOT_AND_HARDENING.md)
- [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md)
- [TECH_MAP_GOVERNED_WORKFLOW.md](/root/RAI_EP/docs/03_ENGINEERING/TECH_MAP_GOVERNED_WORKFLOW.md)

Правило:

- если работа не двигает эти артефакты или реальный runtime-контур, это не progress `Phase B`.

## 6. Условия завершения `Phase B`

`Phase B` считается завершённой только когда одновременно выполнены все условия:

- Техкарта стала реальным центром governed execution, а не соседним артефактом;
- путь `контекст -> TechMap -> execution -> deviation -> result` описан и удерживается как единый ядровой сценарий;
- controlled orchestration работает на замыкание ядра без расширения ролей и без уводa в breadth;
- explainability и evidence встроены в рабочий сценарий ядра;
- границы против `Phase C` и `Phase D` удержаны, и `Phase B` не подменила собой ни `web`-surface, ни `self-host / pilot` hardening.

Если хотя бы один из этих блоков остаётся незамкнутым, `Phase B` остаётся незавершённой.

## 7. Что запрещено до завершения `Phase B`

- превращать `Phase B` в “весь MVP целиком”;
- переносить в неё `login / session / thread` и широкий `web`-объём;
- переносить в неё installability, `backup / restore` и support boundary;
- добирать новые agent roles вместо замыкания текущего core-loop;
- считать ширину `CRM / finance / control tower / front-office` признаком progress ядра.
