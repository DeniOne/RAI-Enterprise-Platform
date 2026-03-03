# PROMPT — S5.1 Memory Adapter Contract (Abstraction Layer)
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель
Внедрить слой абстракции `MemoryAdapter` для работы с памятью агента, чтобы изолировать бизнес-логику чата от конкретной реализации хранилища (Vector DB, Redis, etc.) и подготовить систему к внедрению "вечной памяти" (User Profiles / Episodes).

## Контекст
- Сейчас `RaiChatService` напрямую вызывает `MemoryManager` и `EpisodicRetrievalService` [rai-chat.service.ts](file:///root/RAI_EP/apps/api/src/modules/rai-chat/rai-chat.service.ts).
- Это нарушает принцип изоляции доменов и усложняет тестирование.
- Основание: [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) раздел 5.

## Ограничения (жёстко)
- **Tenant Isolation**: все методы адаптера обязаны принимать `companyId` и обеспечивать фильтрацию.
- **No breaking changes**: существующая функциональность (append/retrieve) не должна сломаться, адаптер должен стать прослойкой.
- **Fail-open**: ошибки адаптера не должны вешать чат (использовать существующие паттерны таймаутов).

## Задачи (что сделать)
- [ ] Создать интерфейс `MemoryAdapter` в `apps/api/src/shared/memory/memory-adapter.interface.ts`.
- [ ] Определить методы:
  - `appendInteraction(ctx, userMessage, agentResponse, toolCalls)`
  - `retrieve(ctx, query, limit)`
  - `getProfile(ctx)` / `updateProfile(ctx, patch)` (пока как заглушки)
- [ ] Реализовать `DefaultMemoryAdapter`, который делегирует работу текущим сервисам (`MemoryManager`, `EpisodicRetrievalService`).
- [ ] Интегрировать адаптер в `RaiChatService`:
  - Заменить прямые вызовы на методы адаптера.
  - Убедиться, что логика санитизации и таймаутов сохранена.
- [ ] Обновить/добавить тесты, подтверждающие корректность проброса данных через адаптер.

## Definition of Done (DoD)
- [ ] Интерфейс `MemoryAdapter` определен и типизирован.
- [ ] `RaiChatService` больше не импортирует `MemoryManager` и `EpisodicRetrievalService` напрямую.
- [ ] Все существующие тесты чата PASS.
- [ ] Новый unit-test для адаптера PASS.

## Тест-план (минимум)
- `pnpm --dir apps/api test src/modules/rai-chat/rai-chat.service.spec.ts` -> PASS.
- `pnpm --dir apps/api test src/shared/memory/memory-adapter.spec.ts` (новый) -> PASS.

## Что вернуть на ревью
- Изменённые файлы: `rai-chat.service.ts`, `memory-adapter.interface.ts`, `default-memory-adapter.ts`, `memory.module.ts`.
- Логи успешного прогона тестов.
