# PROMPT — S5.6 Memory Observability Debug Panel
Дата: 2026-03-03
Статус: active
Приоритет: P1

## Цель
Сделать memory-layer прозрачным в admin/debug режиме: показать, какая память реально повлияла на ответ агента.

## Контекст
- `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` уже подключены к runtime-path.
- Пользователь пока не видит, какой memory context был применён.
- Нужен безопасный explainability summary без утечки hidden reasoning.

## Задачи
1. Добавить typed `memoryUsed` в `RaiChatResponseDto`.
2. Заполнить `memoryUsed` в `SupervisorAgent` на основе episode/profile context.
3. Прокинуть `memoryUsed` в web chat store.
4. Показать debug-плашку `Memory Used` только в привилегированном режиме.
5. Покрыть backend/web тестами.

## DoD
- [ ] API возвращает `memoryUsed`.
- [ ] В admin/debug gate UI показывает `Memory Used`.
- [ ] Обычный пользователь не видит debug-плашку.
- [ ] Нет утечки raw internal payload.
- [ ] `tsc` и targeted tests проходят.

