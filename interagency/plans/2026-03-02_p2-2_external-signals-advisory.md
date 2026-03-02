# PLAN — Внешние сигналы в advisory контуре
Дата: 2026-03-02  
Статус: draft  
Decision-ID: AG-EXTERNAL-SIGNALS-001  

## Результат (какой артефакт получим)
- Исполнимый план для `P2.2`: ввести тонкий tenant-safe контур внешних сигналов в `apps/api`, где 1-2 источника (`NDVI`/погода) проходят путь ingestion → advisory → explainability → user feedback → episodic memory append.
- Зафиксированный минимальный backend-first scope: модель сигнала, хранение и чтение в tenant-scope, один advisory pipeline без автодействий, контракт feedback и запись в память с `traceId`.
- Явное соответствие `AG-EXTERNAL-SIGNALS-001`: human-in-the-loop only, explainability обязательна, `companyId` только из доверенного контекста, без расползания в “полную платформу внешних данных”.

## Границы (что входит / что НЕ входит)
- Входит: анализ текущих контуров `apps/api/src/modules/rai-chat/*`, `apps/api/src/shared/memory/*`, agro/advisory-модулей и существующих entity/DTO, чтобы найти минимальную точку встраивания внешних сигналов без нарушения принципа `Service = IO / Orchestrator = Brain`.
- Входит: минимальная каноническая модель сигнала с полями `source`, `observedAt`, `entityRef` или `geoRef`, `value`, `confidence`, `provenance`, `traceId` и tenant-scope через доверенный `companyId`.
- Входит: ingestion для 1-2 источников сигналов, один advisory pipeline с explainability, feedback `accept/reject + reason`, append в эпизодическую память.
- Входит: unit и smoke-проверки e2e пути `signal -> advisory -> feedback -> memory append`.
- Не входит: автодействия, публикация advisory напрямую в production UI без существующего канала, новые публичные контроллеры вне минимально нужного scope, full-scale ingestion platform, сложная геоаналитика, массовая интеграция всех внешних провайдеров.
- Не входит: приём `companyId` из payload сигнала, feedback или advisory; tenant identity берётся только из доверенного auth/request context.

## Риски (что может пойти не так)
- Есть риск нарушения tenant isolation, если ingestion/advisory/read path хоть в одном месте примет `companyId` из payload, а не из доверенного контекста.
- Есть архитектурный риск смешения инфраструктуры и бизнес-оркестрации: ingestion должен оставаться IO-слоем, а решение по advisory должно жить в orchestration-слое, а не в storage adapter.
- Есть риск ложной explainability, если advisory начнёт выдавать рекомендации без явной ссылки на источники сигнала, confidence и provenance.
- Есть риск scope-bloat: внешний сигналовый контур легко расползается в полноценный ETL и отдельную платформу, поэтому нужен жёсткий thin slice на 1-2 источника и 1 pipeline.
- Есть security-риск, если feedback или advisory trace не будут иметь auditable связку через `traceId`, actor и timestamp.

## План работ (коротко, исполнимо)
- [ ] Просмотреть существующий код `rai-chat`, `shared/memory`, advisory/agro-модули и определить минимальную точку интеграции внешних сигналов без создания нового архитектурного слоя сверх нужного.
- [ ] Зафиксировать канонический контракт сигнала и advisory DTO: какие поля обязательны, где хранится explainability, как передаётся `traceId`, какой минимальный формат feedback допустим.
- [ ] Подтвердить, где будет tenant-safe хранение сигналов и каким trusted context в текущем `apps/api` прокидывается `companyId` для ingestion, advisory и memory append.
- [ ] Спроектировать ingestion thin slice для 1-2 источников (`NDVI`/погода): вход, валидация, storage contract, dedup/idempotency при необходимости.
- [ ] Спроектировать advisory pipeline: вход = signals + domain/workspace context, выход = рекомендация + explainability + confidence + trace metadata, без side effects.
- [ ] Спроектировать контур feedback: `accept/reject + reason`, привязка к advisory/trace, append в эпизодическую память через существующий memory контур.
- [ ] После реализации проверить unit-сценарии на tenant isolation, explainability и запрет side effects, затем прогнать smoke `signal -> advisory -> feedback -> memory append`.
- [ ] Подготовить review packet: ссылки на `Decision-ID`, список файлов, пример advisory-объекта, evidence smoke-прогона и точку memory append.

## DoD
- [ ] Есть e2e тонкий срез `signal ingestion -> advisory -> explainability -> feedback -> memory append`.
- [ ] Весь поток tenant-safe: кросс-тенантные чтения/записи отсутствуют, `companyId` не принимается из payload.
- [ ] Advisory не создаёт side effects и работает только как рекомендация.
- [ ] Каждый advisory содержит explainability с источниками/факторами, `confidence` и `traceId`.
- [ ] Есть минимум unit-покрытие и один smoke-прогон на полный путь.
