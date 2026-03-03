# PLAN — S5.1 Memory Adapter Contract (Abstraction Layer)
Дата: 2026-03-03  
Статус: active (ACCEPTED)  
Decision-ID: AG-MEMORY-ADAPTER-001

## Результат (какой артефакт получим)
- Интерфейс `MemoryAdapter` в `apps/api/src/shared/memory/memory-adapter.interface.ts`.
- Реализация `DefaultMemoryAdapter` в `apps/api/src/shared/memory/default-memory-adapter.service.ts`.
- Рефакторинг `RaiChatService` и `ExternalSignalsService` для использования адаптера.

## Границы (что входит / что НЕ входит)
- Входит: Создание интерфейса, прокси-реализация текущей логики, внедрение в сервисы чата.
- Не входит: Смена векторной базы, реализация реальных профилей (только заглушки).

## Риски (что может пойти не так)
- Нарушение санитизации или таймаутов при переносе логики в адаптер.
- Решение: строгое следование текущим тестам и копирование логики из `RaiChatService`.

## План работ (коротко, исполнимо)
- [ ] Определение интерфейса `MemoryAdapter` и DTO.
- [ ] Реализация `DefaultMemoryAdapter` (делегирование в `MemoryManager` и `EpisodicRetrievalService`).
- [ ] Регистрация адаптера в `MemoryModule`.
- [ ] Рефакторинг `RaiChatService`: внедрение адаптера, упрощение `handleChat`.
- [ ] Рефакторинг `ExternalSignalsService`: использование адаптера для записи сигналов и фидбека.
- [ ] Написание unit-теста для `DefaultMemoryAdapter`.
- [ ] Прогон регрессионных тестов чата.

## DoD
- [ ] Интерфейс `MemoryAdapter` типизирован и внедрен.
- [ ] Прямые импорты `MemoryManager` и `EpisodicRetrievalService` удалены из сервисов чата.
- [ ] `tsc` PASS, `jest` (rai-chat + memory-adapter) PASS.
