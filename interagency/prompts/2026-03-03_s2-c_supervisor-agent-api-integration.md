# PROMPT — Phase B: SupervisorAgent -> API Integration
Дата: 2026-03-03
Статус: active
Приоритет: P0

## Цель
Подключить `SupervisorAgent` к API-контуру `RAI Chat` как отдельный orchestration layer, закрыв последний незавершенный пункт `Phase B`.

## Контекст
- В `SPEC_AGENT_FIRST_RAI_EP.md` `SupervisorAgent` описан как orchestrator.
- В текущем коде orchestration уже существовала, но жила внутри `RaiChatService`.
- Нужно выделить `SupervisorAgent` в отдельный runtime-layer без поломки контракта `POST /api/rai/chat`.

## Задачи
1. Создать `SupervisorAgent` в модуле `rai-chat`.
2. Перенести orchestration из `RaiChatService` в `SupervisorAgent`.
3. Сохранить existing flow:
   - `retrieve`
   - typed tool calls
   - external signals
   - widgets
   - appendInteraction
4. Обновить unit-тесты.
5. Выполнить truth-sync и закрыть `Phase B`.

## DoD
- [ ] `SupervisorAgent` существует и используется в runtime.
- [ ] `RaiChatService` стал thin facade над `SupervisorAgent`.
- [ ] Контракт ответа `POST /api/rai/chat` не сломан.
- [ ] `tsc` и targeted `jest` проходят.
- [ ] Документы синхронизированы, `Phase B` закрыта.

