# PROMPT — P2.1 Расширение WorkspaceContext на остальные страницы
Дата: 2026-03-02  
Статус: draft  
Приоритет: P2  
Decision-ID: AG-WORKSPACE-CONTEXT-EXPAND-001 (BLOCKER: добавить в DECISIONS.log и получить ACCEPTED до начала реализации)

## Цель
Сделать WorkspaceContext реально универсальным: кроме CRM/TechMap, остальные ключевые страницы (Operations/Commerce) публикуют корректные `activeEntityRefs` и краткие summaries, чтобы агент мог отвечать по “текущей рабочей ситуации”, а не гадать.

## Контекст
- Чеклист P2.1: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- Канонический WorkspaceContext уже существует (P0.2) и передаётся в `POST /api/rai/chat`

## Ограничения (жёстко)
- Admission gate: реализация допустима только после Decision-ID со статусом ACCEPTED
- Tenant isolation: контекст не должен содержать/принимать `companyId` из payload; tenant только из доверенного контекста
- Не тащить “тяжёлые данные”: только refs + краткие summaries (строго ограничить размер)
- Не переписывать страницы целиком: только publisher/summary слой и интеграция в общий store

## Задачи
- [ ] Внести AG-WORKSPACE-CONTEXT-EXPAND-001 в `DECISIONS.log` и получить ACCEPTED
- [ ] Определить минимальный набор страниц: CRM/TechMap (есть) + Operations + Commerce (точные пути страниц)
- [ ] Для каждой страницы: publisher `activeEntityRefs` + `selectedRowSummary` (+ lastUserAction при наличии)
- [ ] Гарантировать лимиты размера summaries и стабильность схемы
- [ ] Добавить smoke-прогон: открыть страницу → выбрать сущность → отправить сообщение в чат → backend получает контекст

## Definition of Done (DoD)
- [ ] Operations и Commerce публикуют корректные refs/summaries в канонический WorkspaceContext
- [ ] Контекст уходит в каждый запрос чата, размер ограничен
- [ ] Нет принятия `companyId` из payload

## Тест-план (минимум)
- [ ] Smoke: Operations (выбор сущности) → чат → контекст содержит правильные refs
- [ ] Smoke: Commerce (выбор сущности) → чат → контекст содержит правильные refs

## Что вернуть на ревью
- Decision-ID (ссылка на `DECISIONS.log`)
- Список изменённых файлов
- Пример 2 payload’ов WorkspaceContext (Operations/Commerce) с размером и refs
