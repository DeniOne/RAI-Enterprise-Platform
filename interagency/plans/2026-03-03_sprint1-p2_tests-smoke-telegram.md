# PLAN — Sprint 1 / P2: тесты, E2E smoke и Telegram linking
Дата: 2026-03-03  
Статус: draft

## Результат (какой артефакт получим)
- Зафиксированный план верификации Sprint 1 P1 без изменения продуктовой логики.
- Подтверждённый набор проверок для unit-тестов, `POST /api/rai/chat` smoke-сценариев и Telegram linking cascade.
- Основание для последующего отчёта `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md` после получения `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: проверка текущего покрытия `rai-tools.registry.spec.ts` и `supervisor-agent.service.spec.ts`.
- Входит: smoke-верификация 4 tool-маршрутов через `POST /api/rai/chat`.
- Входит: чтение `apps/telegram-bot/src/telegram/telegram.update.ts` и проверка проброса `fieldRef` и `seasonId` в `workspaceContext`.
- Входит: минимальный фикс Telegram mapping только если будет найден реальный локальный дефект в linking cascade и это не потребует переписывания потока.
- Входит: обновление `PROJECT_EXECUTION_CHECKLIST.md` и подготовка отчёта в `interagency/reports/`.
- Не входит: расширение intent-routing, свободный парсинг `fieldRef` из текста, изменение доменной логики tools, рефакторинг Telegram-модуля, commit/push.

## Риски (что может пойти не так)
- В промте не указан явный `Decision-ID`; перед исполнением требуется подтвердить привязку задачи к принятому решению со статусом `ACCEPTED`.
- Smoke для `generate_tech_map_draft` зависит от существования корректного tenant-context и тестовых сущностей поля/сезона.
- Проверка создания `TechMap` в БД может потребовать поднятого локального окружения и доступной тестовой базы.
- Если `telegram.update.ts` не прокидывает нужный контекст, даже минимальный фикс должен остаться строго в границах linking cascade без побочных правок.
- Обновление чеклистов допустимо только после фактической верификации и внешнего ревью согласно канону процесса.

## План работ (коротко, исполнимо)
- [ ] Подтвердить `Decision-ID` и соответствие scope задачи принятому архитектурному решению.
- [ ] Прочитать артефакты Sprint 1 P1: исходный промт, отчёт и релевантные сценарии из `SPEC_AGENT_FIRST_RAI_EP.md`.
- [ ] Проверить текущее unit-покрытие для 4 tools и `detectIntent`, не выходя за рамки существующей логики.
- [ ] Подготовить и выполнить 4 smoke-сценария через `POST /api/rai/chat` с tenant-safe контекстом через `actorContext` и/или доверенный заголовок окружения, не используя `companyId` как источник истины в пользовательском payload.
- [ ] Проверить сценарий `generate_tech_map_draft` с `fieldRef` и `seasonId`, затем подтвердить появление `TechMap` со статусом `DRAFT` в БД.
- [ ] Прочитать `apps/telegram-bot/src/telegram/telegram.update.ts`, зафиксировать маршрут проброса `fieldRef`/`seasonId` в `workspaceContext` и определить, нужен ли минимальный локальный фикс.
- [ ] После успешной верификации подготовить обновление `PROJECT_EXECUTION_CHECKLIST.md` и отчёт `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`.

## DoD
- [ ] Подтверждён `Decision-ID`, позволяющий исполнять задачу в рамках принятого scope.
- [ ] `pnpm --filter api test -- rai-tools.registry.spec.ts supervisor-agent.service.spec.ts` проходит без регрессий.
- [ ] Все 4 smoke-проверки через `POST /api/rai/chat` выполнены и задокументированы.
- [ ] Для `generate_tech_map_draft` подтверждено создание `TechMap` со статусом `DRAFT`.
- [ ] Проверка Telegram linking cascade завершена; при наличии дефекта подготовлен только минимальный допустимый фикс.
- [ ] Подготовлены обновления `PROJECT_EXECUTION_CHECKLIST.md` и отчёт `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`.
