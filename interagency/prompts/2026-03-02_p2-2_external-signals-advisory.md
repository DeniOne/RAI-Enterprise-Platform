# PROMPT — P2.2 Интеграция NDVI/погоды/внешних сигналов в controller/advisory
Дата: 2026-03-02  
Статус: draft  
Приоритет: P2  
Decision-ID: AG-EXTERNAL-SIGNALS-001 (BLOCKER: добавить в DECISIONS.log и получить ACCEPTED до начала реализации)

## Цель
Подключить внешние сигналы (NDVI/погода/иные) в контур advisory: signals → advisory → объяснение → user feedback → формирование эпизодической памяти. Без автодействий, только рекомендации и след.

## Контекст
- Чеклист P2.2: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- Агентный чат и memory контур (P1.3) — точки потребления/сохранения объяснений и feedback

## Ограничения (жёстко)
- Admission gate: реализация допустима только после Decision-ID со статусом ACCEPTED
- Tenant isolation: все сигналы и advisory строго изолированы по `companyId` из доверенного контекста
- Human-in-the-loop: никаких автоматических действий на пользователя (только advisory)
- Explainability: каждое advisory обязано иметь объяснение источников/факторов
- Минимальный срез: 1–2 источника сигналов + 1 advisory pipeline (не строить “всю платформу”)

## Задачи
- [ ] Внести AG-EXTERNAL-SIGNALS-001 в `DECISIONS.log` и получить ACCEPTED
- [ ] Зафиксировать модель сигналов (минимум: source, observedAt, geo/entityRef, value, confidence, provenance)
- [ ] Реализовать ingestion (складирование) для 1–2 источников (NDVI/погода) в tenant-scope
- [ ] Реализовать advisory pipeline: вход (signals + контекст) → рекомендация + explainability
- [ ] Добавить user feedback (минимум: accept/reject + причина) и запись в эпизодическую память
- [ ] Добавить тест/прогон: сигнал → advisory → feedback → memory append

## Definition of Done (DoD)
- [ ] Есть end-to-end тонкий срез: signal ingestion → advisory → explainability → feedback → memory append
- [ ] Tenant isolation проверяемо: нет кросс-тенантных чтений/записей
- [ ] Advisory не делает side effects (только рекомендации)

## Тест-план (минимум)
- [ ] Unit: advisory формируется из входных signals и содержит explainability
- [ ] Smoke: 1 сигнал → advisory → feedback → запись в память

## Что вернуть на ревью
- Decision-ID (ссылка на `DECISIONS.log`)
- Список изменённых файлов
- Пример одного advisory объекта с explainability и traceId
- Логи smoke-прогона
