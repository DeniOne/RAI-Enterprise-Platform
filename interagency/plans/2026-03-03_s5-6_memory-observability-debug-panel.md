# PLAN — S5.6 Memory Observability Debug Panel
Дата: 2026-03-03
Статус: active
Decision-ID: AG-MEMORY-CANON-001

## Результат
- В Agent OS появляется прозрачный debug-layer для памяти в admin/debug режиме.
- Пользователь с соответствующим доступом видит, какая память реально была использована агентом при ответе.
- В `RaiChatResponseDto` появляется структурированное поле memory observability, которое может быть безопасно показано в UI debug-плашке.

## Цель
Сделать память объяснимой и enterprise-ready:
- что агент вспомнил
- почему это попало в reasoning path
- какой profile/episode context реально был применён
- с какой уверенностью

## Предлагаемый UX
Debug-плашка только для admin/debug режима:

`Memory Used:`
- `Episode: deviation PANy 2d ago`
- `Profile: prefers dashboard summary`
- `Confidence: 0.82`

## Границы
- Входит:
  - backend contract для memory observability
  - сбор observability в `SupervisorAgent`
  - безопасный вывод в web debug/admin UI
  - role/flag gate, чтобы обычный пользователь это не видел
- Не входит:
  - полный forensic memory explorer
  - ручное редактирование memory tiers из UI
  - раскрытие сырых internal payload всем ролям

## Архитектурный подход
- На backend:
  - добавить typed поле вроде `memoryUsed` / `memoryContextApplied[]` в `RaiChatResponseDto`
  - `SupervisorAgent` заполняет его на основе:
    - top recall item(s)
    - profile summary
    - confidence / source / schemaKey
- На frontend:
  - debug-плашка рендерится только при admin/debug gate
  - плашка живет рядом с existing chat/widgets output и не ломает основной UX

## Security / Canon
- Никакого раскрытия tenant-чужих данных.
- Никакого вывода полного hidden chain-of-thought.
- Только безопасный explainability summary на уровне applied memory context.
- Gate только для admin/debug режима.

## Риски
- Легко случайно превратить debug-плашку в утечку внутреннего reasoning.
- Возможен конфликт между “прозрачностью” и перегрузкой UI.
- Нужно четко отделить explainability summary от внутренней технической телеметрии.

## План работ
- [ ] Сформировать interagency prompt на реализацию memory observability.
- [ ] Добавить typed DTO/contract для `memoryUsed`.
- [ ] Обновить `SupervisorAgent`, чтобы он возвращал безопасный summary по profile/episode usage.
- [ ] Добавить admin/debug gate в web UI.
- [ ] Реализовать debug-плашку в chat UI.
- [ ] Покрыть backend/web unit tests.
- [ ] После реализации обновить report/index/checklists/memory-bank.

## Критерии приемки
- [ ] В ответе API есть безопасное структурированное поле memory observability.
- [ ] В admin/debug режиме UI показывает debug-плашку `Memory Used`.
- [ ] Для обычного режима плашка не отображается.
- [ ] Нет утечки скрытого reasoning или tenant-sensitive raw payload.

## Артефакты на ревью
- `interagency/prompts/2026-03-03_s5-6_memory-observability-debug-panel.md`
- `interagency/plans/2026-03-03_s5-6_memory-observability-debug-panel.md`
