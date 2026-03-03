# PROMPT — 2.1 Канонический контракт WorkspaceContext
Дата: 2026-03-03  
Статус: active  
Приоритет: P0  

## Цель
Формализовать и внедрить канонический контракт `WorkspaceContext`, чтобы AI-агент получал структурированную информацию о текущем состоянии интерфейса (маршрут, активные сущности, фильтры, действия).

## Контекст
- Основание: `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` (п. 2.1).
- Существующий код:
    - Контракт: `apps/web/shared/contracts/workspace-context.ts` (Zod схема).
    - Стор: `apps/web/lib/stores/workspace-context-store.ts`.
    - API DTO: `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`.

## Ограничения (жёстко)
- **Data Weight**: Запрещено передавать в контексте тяжелые данные (массивы объектов, полные таблицы). Только ссылки (Refs) и краткие текстовые Summary (до 160-240 символов).
- **Tenant Isolation**: Контекст не должен передавать `companyId` (он берётся из JWT на бэкенде).
- **Security**: Не передавать в `SelectedRowSummary` чувствительные данные (пароли, личные контакты без необходимости).

## Задачи (что сделать)
- [ ] **Frontend (Shell/Store Integration)**:
    - Убедиться, что `AiChatStore.sendMessage` всегда захватывает текущий `workspaceContext` из `useWorkspaceContextStore`. (Уже есть в коде, проверить на регрессии).
    - Внедрить автоматический вызов `resetPageContext` при смене маршрута в `AppShell` (чтобы мусор с прошлой страницы не попадал в контекст новой).
- [ ] **Frontend (Page Registration)**:
    - Внедрить хук/механизм публикации контекста на ключевых страницах:
        - `CRM Details` (Kind: 'party', 'contract').
        - `TechMap Details` (Kind: 'techmap').
        - `Yield/KPI Page` (Kind: 'operation', 'farm').
    - Контекст должен включать `activeEntityRefs` (ID и Kind) и `selectedRowSummary` (если выбрана строка в таблице).
- [ ] **Backend (Observability)**:
    - Проверить, что `RaiChatController` логирует полученный `workspaceContext`.
    - (Опционально) Убедиться, что контекст подмешивается в системный промт агента (если логика уже есть, если нет — просто зафиксировать получение).

## Definition of Done (DoD)
- [ ] При отправке сообщения в чат на странице CRM, в Network запросе `/api/rai/chat` виден объект `workspaceContext` с `activeEntityRefs` (kind: 'party').
- [ ] При навигации на другую страницу поле `activeEntityRefs` сбрасывается (пустой массив или удаляется из объекта).
- [ ] Типизация на фронте и бэкенде синхронизирована (tsc PASS).
- [ ] Сообщения в чате уходят без ошибок.

## Что вернуть на ревью
- Список измененных страниц.
- Скриншот или JSON-дамп из вкладки Network, подтверждающий наличие контекста в запросе.
