# PROMPT — S1.1 AppShell: persistent RAI Chat в Shell layout
Дата: 2026-03-02  
Статус: draft  
Приоритет: P2  

## Цель
Сделать глобальный `AppShell` в `apps/web`, где RAI Chat живёт в левой колонке и **не размонтируется при навигации**, сохраняя состояние (история, Dock/Focus режим).

## Контекст
- Основание: `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (раздел **1.1 AppShell**, DoD пункт **8**: чат не сбрасывается при навигации).
- Truth-sync/контроль реальности: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md` (P2.3 VERIFIED, но “чат в Shell” ещё не закрыт).
- Уже есть компоненты/стор чата: `apps/web/components/ai-chat/AiChatPanel.tsx`, `apps/web/lib/stores/ai-chat-store.ts`, правый rail: `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`.

## Ограничения (жёстко)
- **Без расползания**: не переписывать продуктовые страницы/роуты, только обёртка Shell + минимальные правки чата.
- **Без “полировки ради полировки”**: никаких редизайнов/анимаций/новых UI-паттернов сверх нужного для Shell.
- **Без backend-изменений**: API/контракты `/api/rai/chat`, `WorkspaceContext` не трогаем (они VERIFIED).
- **Без регрессий Dock/Focus**: поведение из `interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md` должно сохраниться.

## Задачи (что сделать)
- [ ] Найти текущую точку монтирования чата (overlay/страничный компонент) и определить, почему он закрывается/размонтируется на `ROUTE_CHANGE`.
- [ ] Ввести `AppShell` layout: `TopNav` (может быть stub/минимальный контейнер), `LeftRaiChatDock`, `MainWorkspace` (slot для страниц).
- [ ] Переместить `AiChatPanel` в `LeftRaiChatDock` внутри Shell так, чтобы компонент **оставался в DOM** при смене роутов.
- [ ] Обеспечить, что правый вывод (`AiChatWidgetsRail`) продолжает работать и не блокирует `MainWorkspace`.
- [ ] Починить логику закрытия чата при навигации: либо убрать auto-close, либо сделать его условным (например, не закрывать в режиме Docked).
- [ ] Убедиться, что Dock/Focus режим сохраняется (localStorage) и не сбрасывается на навигации.

## Definition of Done (DoD)
- [ ] При переходах между страницами чат **не размонтируется** (история сообщений и UI-состояние не теряются).
- [ ] Dock/Focus toggle работает как раньше, режим персистится.
- [ ] Нет регрессий виджетов справа (`AiChatWidgetsRail`).
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` в `apps/web` проходит.
- [ ] Существующие тесты чата проходят (см. тест-план).

## Тест-план (минимум)
- [ ] `cd apps/web && pnpm test -- --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-chat-widgets-rail.spec.tsx`
- [ ] `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit`
- [ ] Manual smoke: открыть 2–3 разные страницы, отправить сообщение в чат, переключить Dock/Focus, перейти на другую страницу — чат и история остаются.

## Что вернуть на ревью
- Изменённые файлы (список).
- Команды/вывод тестов (`pnpm test`, `tsc`).
- Короткое описание: где теперь монтируется Shell и что поменялось в логике route-change.

