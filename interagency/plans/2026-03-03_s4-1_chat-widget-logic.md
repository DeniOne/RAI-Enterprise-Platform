# PLAN — S4.1 Chat Widget Logic (Domain Bridge)
Дата: 2026-03-03  
Статус: ACCEPTED (by TECHLEAD)  
Промпт-источник: `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md`  
Decision-ID: AG-WIDGET-DOMAIN-BRIDGE-001
Чеклист-источник: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (п. 4.1)  

## Результат
- Логика формирования `widgets[]` будет вынесена из `RaiChatService` в отдельный компактный builder/service.
- Виджеты `DeviationList` и `TaskBacklog` станут динамически зависеть от `companyId` и `workspaceContext`, а не только от захардкоженного текста.
- Появится тестовое доказательство, что содержимое виджетов меняется при смене `route` и `companyId`, без изменений frontend renderer.

## Границы
- Входит: `apps/api/src/modules/rai-chat/rai-chat.service.ts`, новый helper/service для widget building, тесты на builder или обновлённый сервис.
- Входит: подготовка архитектурной точки для будущего подключения реальных domain services/repositories.
- Не входит: изменения frontend компонентов `AiChatWidgetsRail`, изменения базовых типов виджетов, новые типы виджетов, любые `any`.
- Не входит: реальная интеграция с полноценными `TasksService`/`DeviationsService`, если их ещё нет; допускаются только context-aware заглушки `v2`.

## Риски
- Есть риск оставить динамику “фальшивой”, если builder останется просто новым местом для тех же хардкодов без реальной зависимости от `workspaceContext`.
- Есть риск расползания scope в доменные интеграции, если начать тянуть неготовые сервисы вместо компактного extension-point.
- Есть риск несоответствия контракту ответа, если после рефакторинга виджеты перестанут соответствовать текущим `RaiChatWidget` типам.

## План работ
- [ ] Выделить из `RaiChatService.buildWidgets(...)` отдельный `RaiChatWidgetBuilder` или аналогичный helper с явным входом:
  - `companyId: string`
  - `workspaceContext?: WorkspaceContextDto`
- [ ] Сохранить текущие типы `DeviationList` и `TaskBacklog`, но заменить статические тексты на context-aware `v2`:
  - route-aware отклонения для `DeviationList`,
  - company/user-aware backlog для `TaskBacklog`.
- [ ] Подготовить в builder архитектурный extension-point для будущих real domain services, не внедряя сейчас full integration.
- [ ] Обновить `RaiChatService`, чтобы он только делегировал сборку виджетов builder'у.
- [ ] Добавить тесты, которые подтверждают:
  - смена `route` меняет текст/содержимое виджетов,
  - смена `companyId` меняет company-scoped маркеры,
  - builder возвращает валидный `RaiChatWidget[]`.
- [ ] Прогнать `jest` по затронутым тестам и `tsc` для `apps/api`.
- [ ] Подготовить review packet: отчёт, `git status`, `git diff`, логи прогонов, статус `READY_FOR_REVIEW` в `interagency/INDEX.md`.

## DoD
- [ ] `RaiChatService` больше не держит у себя статическую сборку виджетов.
- [ ] Виджеты динамически зависят от `companyId` и `workspaceContext`.
- [ ] Логика сборки виджетов изолирована в отдельном builder/helper.
- [ ] Тесты подтверждают реакцию на `route` и `companyId`.
- [ ] `apps/api` проходит `tsc`.
- [ ] Для задачи собран review packet по канону.
