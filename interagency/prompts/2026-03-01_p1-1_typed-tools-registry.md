# PROMPT — P1.1 Typed tools registry + строгие схемы вызовов
Дата: 2026-03-01  
Статус: draft  
Приоритет: P1  
Decision-ID: AG-TYPED-TOOLS-REGISTRY-001 (BLOCKER: добавить в DECISIONS.log и получить ACCEPTED до начала реализации)

## Цель
Сделать "typed tool calls only" реальностью: агент вызывает домен только через зарегистрированные инструменты со строгими схемами payload; все вызовы валидируются и логируются; в критичном контуре запрещены any[] и string-execution.

## Контекст
- Чеклист P1.1: docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md
- Reality map: docs/00_STRATEGY/STAGE 2/PROJECT_REALITY_MAP.md — Typed tool calls PARTIAL, suggestedActions: any[] не типизировано
- RAI Chat API: apps/api/src/modules/rai-chat/* — endpoint POST /api/rai/chat, возвращает text + widgets[]; пока без tool-call execution

## Ограничения (жёстко)
- Admission gate: реализация допустима только после Decision-ID со статусом ACCEPTED
- Tenant isolation: companyId только из доверенного контекста, не из payload инструмента
- Запрещено: any[] в типах tool-call payload; string-eval или динамический вызов по имени без регистрации
- Scope P1.1: backend registry + validation + logging; достаточно инфраструктуры и минимум 1–2 зарегистрированных инструмента с тестом

## Задачи (что сделать)
- [ ] Внести AG-TYPED-TOOLS-REGISTRY-001 в DECISIONS.log и получить ACCEPTED
- [ ] Создать ToolsRegistry в apps/api: регистрация (name, schema, handler), execute(name, payload, actorContext) с валидацией и логированием
- [ ] Зарегистрировать минимум 1–2 инструмента с типизированными payload
- [ ] Убрать any в критичном контуре: строгие типы для toolCalls/suggestedActions
- [ ] Логирование каждого вызова (toolName, companyId, traceId, success/fail)

## Definition of Done (DoD)
- [ ] Tool-call payload валидируются схемами перед исполнением
- [ ] Все вызовы логируются
- [ ] В критичном контуре нет any[] для tool payload
- [ ] Минимум 1 зарегистрированный инструмент с unit-тестом

## Тест-план (минимум)
- [ ] Unit: execute с валидным payload — handler вызван
- [ ] Unit: execute с невалидным payload — отказ, handler не вызван
- [ ] Unit: вызов логируется

## Что вернуть на ревью
- Изменённые файлы
- Схема/типы для registry и tool payload
- Вывод unit-тестов
