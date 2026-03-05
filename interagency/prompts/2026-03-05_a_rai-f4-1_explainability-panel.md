# PROMPT — ExplainabilityPanel Service (Phase 4.1)
Дата: 2026-03-05
Статус: active
Приоритет: P0

## Цель
Поднять, блять, ExplainabilityPanel Service и API для Forensics/Explorer (Decision Timeline + provenance).
Суть в том, чтобы любой инцидент можно было разобрать по `traceId` в UI, а не копаться в ебучих логах. Это первый шаг Phase 4.

## Контекст
- **Почему это важно сейчас:** Агенты принимают решения автономно, и нам нужен инструмент, который покажет весь граф решения (от Intent Router до результата) по конкретному `traceId`.
- **Связанные документы:** 
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` (Phase 4, пункт 1 спринта).
  - `docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`

## Ограничения (жёстко)
- **Security / tenant isolation:** Строгая изоляция по `companyId`. Никто не должен видеть чужие трейсы, это пиздец как важно.
- **Trace Boundaries:** Чтение данных исключительно в режиме READ-ONLY. Никаких сайд-эффектов.
- **Запреты:** UI-фронтенд сейчас НЕ ДЕЛАЕМ. Только бэкенд и API.
- **Маскировка данных:** Все данные идут через `SensitiveDataFilterService`.

## Задачи (что сделать)
- [ ] Написать DTO `ExplainabilityTimelineResponse` (включает узлы: роутер, агенты, вызванные инструменты, итоговый composer, временные метки, статусы).
- [ ] Создать `ExplainabilityPanelService` с методом `getTraceTimeline(traceId: string, companyId: string)`. Агрегировать события из базы.
- [ ] Оформить API (Controller/Resolver) для отдачи этого таймлайна.
- [ ] Внедрить `SensitiveDataFilterService` для маскировки PII перед отправкой ответа.
- [ ] Написать ебейшие unit-тесты для сервиса (успех, изоляция, маскировка).

## Definition of Done (DoD)
- [ ] `ExplainabilityPanelService` и API готовы.
- [ ] Чужой `traceId` выдаёт 403 / ошибку изоляции.
- [ ] Все тесты PASS (tsc, jest).

## Тест-план (минимум)
- [ ] Unit-тест: агрегация событий по `traceId` в таймлайн.
- [ ] Unit-тест: tenant check (ожидаем Exception при несовпадении `companyId`).
- [ ] Unit-тест: PII маскировка работает.

## Что вернуть на ревью
- Изменённые файлы (список)
- Результаты `tsc` & `jest` по новым файлам
