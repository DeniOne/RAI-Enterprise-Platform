# PLAN — Память в агентном чате (retrieve + append)
Дата: 2026-03-02  
Статус: draft  
Decision-ID: AG-CHAT-MEMORY-001  

## Результат (какой артефакт получим)
- Исполнимый план для `P1.3`: встроить tenant-scoped recall и policy-based append в канонический контур `POST /api/rai/chat` с использованием уже существующей memory-infra в `apps/api/src/shared/memory/*` и `@rai/vector-store`.
- Зафиксированный минимальный backend-scope: retrieval перед ответом, append после ответа, лимиты `top-K` / `minSimilarity` / timeout / budget, traceable logging и unit/smoke-покрытие.
- Явный admission-блокер: реализация запрещена, пока `AG-CHAT-MEMORY-001` не внесён в `DECISIONS.log` и не имеет статуса `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: анализ и доработка `apps/api/src/modules/rai-chat/*`, `apps/api/src/shared/memory/*`, возможная адаптация `MemoryManager` / `EpisodicRetrievalService` под чатовый retrieval/append-сценарий.
- Входит: tenant isolation только через доверенный контекст запроса; `companyId` из payload чата или memory payload не принимается как источник истины.
- Входит: политика записи памяти для чатового контура: какие фрагменты сохраняем, когда сохраняем, как ограничиваем размер, какие `memoryType`/TTL допустимы, как прокидываем `traceId`.
- Входит: метрики и структурные логи для `recall hit/miss`, latency, append count, применённых лимитов и tenant scope.
- Не входит: автодействия по результатам recall, изменение продуктовой логики вне ответа чата, UI-переработка, новые внешние источники сигналов, commit/push и финализация чеклистов/memory-bank до внешнего ревью.
- Не входит: бесконтрольное расширение unified memory в “общую платформу памяти”; в рамках задачи нужен тонкий чатовый срез.

## Риски (что может пойти не так)
- Блокирующий admission-риск: `AG-CHAT-MEMORY-001` ещё не подтверждён в `DECISIONS.log`; до `ACCEPTED` допустимо только планирование.
- Архитектурный риск смешения Brain/IO: retrieval/append должны оставаться инфраструктурным слоем вокруг чатового оркестратора, а не вшиваться в доменную логику ответа.
- Риск по latency: прямой recall через vector-store может заметно замедлить `POST /api/rai/chat`, если не зафиксировать `top-K`, `minSimilarity`, timeout и budget по размеру контекста.
- Security-риск: если `companyId` или memory filters попадут под контроль payload, можно получить cross-tenant recall/append.
- Риск шума в памяти: без политики append в хранилище начнёт записываться мусорный диалоговый хвост, который ухудшит качество recall и объяснимость.

## План работ (коротко, исполнимо)
- [ ] Проверить наличие `AG-CHAT-MEMORY-001` в `DECISIONS.log`; при отсутствии `ACCEPTED` остановить реализацию на admission-gate.
- [ ] Просмотреть текущий поток `POST /api/rai/chat`: DTO, controller, service/orchestrator, откуда берётся доверенный `companyId`, где лучше встраивать recall до генерации ответа и append после ответа.
- [ ] Зафиксировать чатовую memory policy: какие поля запроса/ответа попадают в append, какой `memoryType` используется, какие TTL и ограничения `maxTokens`/`maxChars` действуют, когда запись пропускается.
- [ ] Спроектировать retrieval adapter для чата поверх существующих `MemoryManager` / `EpisodicRetrievalService`: вход = tenant + query context + workspaceContext, выход = ограниченный список recalled entries или явный miss.
- [ ] После `ACCEPTED` встроить recall в входной пайплайн `POST /api/rai/chat` так, чтобы recalled context использовался только для формирования ответа и не менял поведение продукта вне чата.
- [ ] После `ACCEPTED` встроить append после формирования ответа с обязательным `traceId`, tenant-scope и policy guard, чтобы в память не писались запрещённые или слишком большие фрагменты.
- [ ] После `ACCEPTED` добавить structured logging/metrics: `companyId`, `traceId`, recall hit/miss, latency, append count, `topK`, `minSimilarity`, timeout outcome.
- [ ] После `ACCEPTED` покрыть unit-тестами tenant isolation и лимиты, затем прогнать smoke-сценарий `чат → recall → ответ → append` и подготовить артефакты для review packet.

## DoD
- [ ] На каждый запрос `POST /api/rai/chat` выполняется recall или явно фиксируется miss в tenant-scope.
- [ ] После ответа выполняется policy-based append/store с `traceId`.
- [ ] Лимиты `top-K`, `minSimilarity`, timeout и budget зафиксированы в коде/конфиге и реально применяются.
- [ ] `companyId` не принимается из payload; tenant берётся только из доверенного контекста.
- [ ] Есть логи/метрики, позволяющие проверить recall/append на одном запросе.
- [ ] Unit-тесты на tenant-scope и лимиты, а также минимум один smoke-прогон, проходят.
