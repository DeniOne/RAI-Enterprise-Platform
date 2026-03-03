# PLAN — S1.3 TopNav / Role Switch Hotfix
Дата: 2026-03-03  
Статус: draft  
Промпт-источник: `interagency/prompts/2026-03-03_s1-3_topnav-role-switch-hotfix.md`  
Чеклист-источник: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (AppShell / TopNav)  

## Результат
- Внеплановые UI-изменения меню и role switch будут заведены в канонический execution-cycle.
- Появится формальный review packet для уже изменённых `TopNav.tsx` и `GovernanceBar.tsx`.
- После принятия появится основание для дальнейшей финализации этих правок в `memory-bank` и git-flow.

## Границы
- Входит: только уже сделанные правки `apps/web/components/navigation/TopNav.tsx` и `apps/web/shared/components/GovernanceBar.tsx`, плюс формализация артефактов review.
- Входит: проверка `tsc` и manual smoke по меню/role switch.
- Не входит: новые изменения навигационной архитектуры, backend, chat API, memory, widget logic.

## Риски
- Есть риск, что внеплановые UI-правки останутся “висящими” вне процесса, если их не провести отдельным hotfix-контуром.
- Есть риск повторного расхождения индекса и реального состояния, если оформить это как DONE без review packet.
- Есть риск скрытых UX-дефектов в hover/flyout логике, поэтому manual smoke обязателен.

## План работ
- [ ] Зафиксировать hotfix task в `interagency/prompts/...` и `interagency/plans/...`.
- [ ] Не менять существующий код сверх уже внесённых правок без отдельной необходимости.
- [ ] Собрать review packet:
  - отчёт с фактами по `TopNav.tsx` и `GovernanceBar.tsx`,
  - `git status`,
  - ключевой `git diff`,
  - лог `tsc`,
  - manual check по меню/role switch.
- [ ] Перевести запись задачи в `interagency/INDEX.md` в `READY_FOR_REVIEW`.

## DoD
- [ ] Есть canonical prompt, plan и report для hotfix-задачи.
- [ ] `tsc` по `apps/web` зелёный.
- [ ] Manual smoke по меню/role switch зафиксирован.
- [ ] Задача стоит в `INDEX.md` как `READY_FOR_REVIEW`, не `DONE`.
