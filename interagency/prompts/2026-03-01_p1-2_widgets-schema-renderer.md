# PROMPT — P1.2 Widgets: canonical widgets[] schema + renderer
Дата: 2026-03-01
Статус: draft
Приоритет: P1
Decision-ID: AG-WIDGETS-SCHEMA-RENDERER-001 (уже в DECISIONS.log, ACCEPTED)

## Цель
Агент выдаёт структурный UI: каноническая схема widgets[] версионируема, минимум 2 виджета (DeviationList, TaskBacklog) работают end-to-end из ответа POST /api/rai/chat до отрисовки справа в веб-чате.

## Контекст
- Чеклист P1.2: docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md
- RAI Chat: apps/api/src/modules/rai-chat, apps/web/lib/stores/ai-chat-store.ts (widgets -> suggestedActions)
- Сейчас заглушка Last24hChanges, payload any

## Ограничения
- Tenant: данные виджетов только из доверенного контекста API, не companyId из payload пользователя
- Виджеты — только данные, no eval из payload
- Scope: схема + 2 виджета e2e, не переписывать весь чат

## Задачи
- [ ] Схема widgets[]: schemaVersion/type+version, type, payload по типам (discriminated union)
- [ ] API: DTO/типы для widgets без any, возврат /api/rai/chat по схеме
- [ ] 2 виджета e2e: DeviationList, TaskBacklog (данные из apps/api: consulting/deviations, tasks или мок)
- [ ] Web: renderer по type, убрать any в store для widgets
- [ ] Прогон: чат -> widgets[] -> панель справа показывает оба типа

## DoD
- [ ] widgets[] версионируемы
- [ ] Минимум 2 виджета e2e: API -> web renderer
- [ ] Типы не any в критичном контуре
- [ ] Tenant: нет companyId из пользовательского payload в виджетах

## Тест-план
- [ ] API: ответ с widgets[], ожидаемые type и структура payload
- [ ] Web: 2 типа виджетов отображаются справа
- [ ] Неизвестный type — без падения (placeholder/скрыт)

## Что вернуть на ревью
- Изменённые файлы (API DTO, web renderer, store)
- Схема widgets
- Описание/скрин прогона: чат -> 2 виджета справа
