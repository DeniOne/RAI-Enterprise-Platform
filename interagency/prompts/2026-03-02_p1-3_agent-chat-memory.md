# PROMPT — P1.3 Память в агентном чате (retrieve + append)
Дата: 2026-03-02  
Статус: draft  
Приоритет: P1  
Decision-ID: AG-CHAT-MEMORY-001 (BLOCKER: добавить в DECISIONS.log и получить ACCEPTED до начала реализации)

## Цель
Сделать память “потребляемой”: при каждом запросе чата выполняется recall (scoped по tenant), после ответа — append/store по политике. Память ограничена метриками/лимитами (top-K, minSimilarity, budget), а не “бесконечная инфра”.

## Контекст
- Чеклист P1.3: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- RAI Chat endpoint: `POST /api/rai/chat` (канонический транспорт)
- Memory infra (если уже есть): `apps/api/src/shared/memory/*`, `@rai/vector-store` (возможные точки интеграции)

## Ограничения (жёстко)
- Admission gate: реализация допустима только после Decision-ID со статусом ACCEPTED
- Tenant isolation: любой recall/append строго по `companyId` из доверенного контекста, не из payload
- Latency budget: retrieval не должен “убивать” чат; лимиты top-K + minSimilarity + таймаут
- Никаких side effects в продукт: память влияет только на ответ чата (retrieval), без автодействий на пользователя

## Задачи
- [ ] Внести AG-CHAT-MEMORY-001 в `DECISIONS.log` и получить ACCEPTED
- [ ] Зафиксировать политику памяти: что пишем (append), когда пишем, TTL/категории, лимиты (top-K, minSimilarity, maxTokens/maxChars)
- [ ] Реализовать recall на входе `POST /api/rai/chat` (scoped по tenant + workspaceContext)
- [ ] Реализовать append после формирования ответа (policy-based; включить traceId)
- [ ] Добавить метрики/логирование: recall hits/misses, latency, append count, topK/minSimilarity, companyId
- [ ] Тесты: unit на tenant-scope + лимиты; smoke сценарий “чат → recall → ответ → append”

## Definition of Done (DoD)
- [ ] На каждый запрос чата происходит recall (или явный miss), scoped по tenant
- [ ] После ответа выполняется append/store по политике
- [ ] Лимиты (top-K, minSimilarity, timeout) зафиксированы и применяются
- [ ] Метрики/логи есть, есть traceId
- [ ] Нет принятия `companyId` из payload

## Тест-план (минимум)
- [ ] Unit: recall получает только companyId из доверенного контекста; payload игнорируется
- [ ] Unit: top-K/minSimilarity ограничивают результат
- [ ] Smoke: запрос чата → recall выполнен → append выполнен (лог/метрика)

## Что вернуть на ревью
- Decision-ID (ссылка на `DECISIONS.log`)
- Список изменённых файлов
- Логи/метрики (пример одного запроса: recall + append)
- Вывод тестов
