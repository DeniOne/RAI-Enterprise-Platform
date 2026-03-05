# PROMPT — Explainability Explorer & Decision Timeline (Phase 4.10)
Дата: 2026-03-05
Статус: active
Приоритет: P2

## Цель
Подготовить API / инфраструктуру для фичи `Explainability Explorer (Forensics)`. Задача состоит в том, чтобы взять уже имеющуюся хронологию (которую мы написали в 4.1 "ExplainabilityPanel Service" — свитч `getTraceTimeline`), и расширить её данными из Truthfulness Engine и Evidence Tagging, чтобы получить полноценный граф или сложный таймлайн для UI.

## Контекст
- **Почему это важно сейчас:** Мы научились собирать evidenceRefs (Фаза 4.3), считать BS% (Фаза 4.4) и наказывать агентов (4.7, 4.8). Если менеджер (или Supervisor) увидит, что BS% взлетел до 50%, он откроет `Explainability Explorer`. Этому дашборду нужно не просто "список событий", а понимание причинно-следственной связи: какой агент принёс какой эвиденс и почему это привело к ошибке.
- **Связанные документы:**
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` (Phase 4, пункт 4.3: "Decision Timeline разбора инцидентов").
- **Внимание:** В 4.1 мы уже сделали базу (`getTraceTimeline` в `ExplainabilityPanelService`). Сейчас её нужно проапгрейдить.

## Ограничения
- Фокус только на Backend API. Никакого фронтенда мы пока не пишем. Возвращаем JSON.
- Изоляция тенантов обязательна (`companyId`).

## Задачи (что сделать)
- [ ] Обновить `ExplainabilityPanelService`, добавив новый метод (или расширив существующий) `getTraceForensics(traceId, companyId)`.
- [ ] Он должен возвращать комбинированную DTO:
  - Основной `TraceSummary` (timing, tokens, bsScorePct).
  - Таймлайн: список `AiAuditEntry`, но _каждый_ entry, отправленный агентом, должен быть обогащен его `evidenceRefs` (из `metadata`), если они есть.
  - Список задетых `QualityAlert` или инцидентов (если были алерты BS_DRIFT за время этого трейса).
- [ ] Реализовать HTTP-эндпоинт `GET /rai/explainability/trace/:traceId/forensics`.
- [ ] Покрыть логику unit-тестами.

## Definition of Done (DoD)
- [ ] Эндпоинт `forensics` возвращает древовидную или обогащенную структуру трейса.
- [ ] Тесты PASS (`tsc`, `jest`).

## Тест-план (минимум)
- [ ] Unit: Вызов для traceId, у которого есть TraceSummary, AiAuditEntry с evidence и QualityAlert возвращает ожидаемую структуру.
- [ ] Unit: Вызов для чужого traceId -> 403 Forbidden.

## Что вернуть на ревью
- Изменённые файлы (список)
- Результаты `tsc` & `jest` по пакету
