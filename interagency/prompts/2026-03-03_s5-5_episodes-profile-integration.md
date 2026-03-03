# PROMPT — S5.5 Episodes/Profile Integration
Дата: 2026-03-03
Статус: active
Приоритет: P0

## Цель
Закрыть последний memory DoD: сделать так, чтобы `MemoryEpisode` и `MemoryProfile` не только существовали в схеме, но реально сохранялись и использовались при ответах.

## Контекст
- `MemoryEpisode` и `MemoryProfile` уже созданы в Prisma (S5.3).
- `MemoryInteraction` уже пишет raw logs (S5.4).
- `getProfile` / `updateProfile` до этого шага были заглушками.
- `Definition of Done` в `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` всё ещё содержал незакрытый пункт по `Episodes/Profile`.

## Задачи
1. Реализовать `getProfile` / `updateProfile` в `DefaultMemoryAdapter`.
2. Добавить минимальный write path для `MemoryEpisode`.
3. Подключить `SupervisorAgent` к profile context.
4. Обновить тесты памяти и `rai-chat`.
5. Выполнить truth-sync и закрыть DoD по `Episodes/Profile`.

## DoD
- [ ] `MemoryProfile` читается и обновляется в runtime.
- [ ] `MemoryEpisode` записывается в runtime-path.
- [ ] `SupervisorAgent` использует profile context при ответе.
- [ ] Тесты и `tsc` проходят.
- [ ] Пункт DoD по `Episodes/Profile` переведен в выполненное состояние.

