# PROMPT — P1.3 Память в агентном чате (retrieve + append)
Дата: 2026-03-02  
Статус: done  
Приоритет: P1  
Decision-ID: AG-CHAT-MEMORY-001 (в `DECISIONS.log`, статус: ACCEPTED)

## Цель
Сделать память “потребляемой”: при каждом запросе чата выполняется recall (scoped по tenant), после ответа — append/store по политике. Эмбеддинги для текстовых сообщений детерминированы. Память ограничена метриками/лимитами (top-K, minSimilarity, budget), а не “бесконечная инфра”.

## Контекст
- Чеклист P1.3: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- RAI Chat endpoint: `POST /api/rai/chat` (канонический транспорт)
- Memory infra: `apps/api/src/shared/memory/*`, `@rai/vector-store`
- Интеграция в чат: `apps/api/src/modules/rai-chat/rai-chat.service.ts`

## Ограничения (жёстко)
- Tenant isolation: любой recall/append строго по `companyId` из доверенного контекста, не из payload
- Determinism: эмбеддинг текста строится детерминированно (без `Date.now()`, `Math.random()` и прочего недетерминизма)
- Latency budget: retrieval не должен “убивать” чат; лимиты top-K + minSimilarity + таймаут
- Никаких side effects в продукт: память влияет только на ответ чата (retrieval), без автодействий на пользователя

## Задачи
- [x] Decision: `AG-CHAT-MEMORY-001` добавлен в `DECISIONS.log` и принят (ACCEPTED)
- [x] Исправить импорты в `MemoryManager` (убрать проблемные `.js` для Jest/CJS)
- [x] Добавить детерминированный эмбеддинг текста: `buildTextEmbedding` в `signal-embedding.util.ts`
- [x] Внедрить `MemoryManager` и `EpisodicRetrievalService` в `RaiChatService`
- [x] Append: сохранять сообщения пользователя в векторное хранилище (tenant-scoped)
- [x] Retrieve: перед ответом искать похожие сообщения и подмешивать контекст (демо-режим)
- [x] Тесты: unit на tenant isolation + базовый retrieve/append
- [x] Обновить артефакты статуса: `memory-bank/*`, `interagency/INDEX.md`

## Definition of Done (DoD)
- [x] На каждый запрос чата происходит recall (или явный miss), scoped по tenant
- [x] После ответа выполняется append/store (tenant-scoped)
- [x] Эмбеддинги текста детерминированы (`buildTextEmbedding`)
- [x] Unit-тесты проходят
- [x] Нет принятия `companyId` из payload

## Тест-план (минимум)
- [x] `pnpm jest rai-chat.service.spec.ts` → PASS
- [x] Unit: изоляция tenant’ов (`companyId` только из доверенного контекста) → PASS
- [x] Unit: retrieve перед ответом + append после сообщения → PASS

## Что вернуть на ревью
- Decision-ID (ссылка на `DECISIONS.log`)
- Список изменённых файлов
- Логи/метрики (пример одного запроса: recall + append)
- Вывод тестов

## Изменённые файлы (факт)
- `DECISIONS.log`
- `apps/api/src/shared/memory/signal-embedding.util.ts`
- `apps/api/src/shared/memory/memory-manager.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `interagency/INDEX.md`
