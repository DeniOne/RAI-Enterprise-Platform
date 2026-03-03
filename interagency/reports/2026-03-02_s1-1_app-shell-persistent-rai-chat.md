# REPORT — AppShell с персистентным RAI Chat
Дата: 2026-03-02  
Статус: final  

## Что было целью
- Ввести глобальный `AppShell` в `apps/web`, где `RAI Chat` живёт в левой колонке и не размонтируется при навигации.
- Сохранить историю сообщений, режимы `Dock/Focus` и состояние правого rail без backend-изменений и без переписывания продуктовых страниц.

## Что сделано (факты)
- Добавлен общий shell-компонент `AppShell`, который объединяет `Sidebar`, `GovernanceBar`, `WorkSurface`, левый dock чата и основной workspace.
- Создан `LeftRaiChatDock`; в нём `AiChatPanel` монтируется как постоянная shell-панель и остаётся в DOM при переходах между страницами внутри общего app-контура.
- `AuthenticatedLayout`, `app/(app)/layout.tsx` и `consulting/layout.tsx` переведены на единый `AppShell`, чтобы убрать дублирование layout-логики и дать чату постоянную точку монтирования.
- `AiChatPanel` адаптирован под `variant="shell"`: встроенный режим вместо overlay, с сохранением `Dock/Focus`, toggle виджетов и закрытия в режим сворачивания dock.
- `AiChatRoot` оставлен как глобальный controller для route-context и hotkeys, но без overlay/FAB-рендера.
- В `ai-chat-store` изменена логика `ROUTE_CHANGE`: навигация больше не закрывает чат и не сбрасывает `panelMode/widgetsOpen`; эти состояния также добавлены в persist.
- Обновлён unit-test store: теперь он проверяет сохранение shell-состояния при `ROUTE_CHANGE`.

## Изменённые файлы
- `apps/web/components/layouts/AppShell.tsx`
- `apps/web/components/ai-chat/LeftRaiChatDock.tsx`
- `apps/web/components/layouts/AuthenticatedLayout.tsx`
- `apps/web/app/(app)/layout.tsx`
- `apps/web/app/consulting/layout.tsx`
- `apps/web/components/ai-chat/AiChatPanel.tsx`
- `apps/web/components/ai-chat/AiChatRoot.tsx`
- `apps/web/lib/stores/ai-chat-store.ts`
- `apps/web/__tests__/ai-chat-store.spec.ts`
- `interagency/INDEX.md`
- `interagency/plans/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`

## Проверки/прогоны
- `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit` — PASS
- `cd apps/web && pnpm test -- --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-chat-widgets-rail.spec.tsx` — PASS

## Что сломалось / что не получилось
- Manual smoke в браузере не выполнялся в рамках этого пакета; визуальная проверка на 2-3 страницах остаётся задачей внешнего ревью.
- В рабочем дереве есть посторонние изменения вне scope (`DECISIONS.log`, стратегические docs, starter prompt); они не входят в этот review packet.

## Ревью: APPROVED
- Код соответствует scope, без секретов/companyId из payload.
- tsc и unit-тесты пройдены.
- **Ограничение:** manual smoke не выполнен; по канону финализация (commit, VERIFIED в чеклистах) не производится до его выполнения или явной команды USER.

## Следующий шаг
- Выполнить manual smoke (2–3 страницы, сообщение в чат, навигация, Dock/Focus) — затем финализация.
- Либо явная команда USER: финализировать без manual smoke.
