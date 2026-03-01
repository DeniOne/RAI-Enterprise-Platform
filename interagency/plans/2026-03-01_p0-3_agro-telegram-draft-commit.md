# PLAN — Боевой Agro Draft→Commit в apps/api
Дата: 2026-03-01  
Статус: draft  
Decision-ID: AG-AGRO-DRAFT-COMMIT-001  

## Результат (какой артефакт получим)
- Исполнимый план переноса контура `Draft -> Fix/Link -> Confirm -> Commit` из `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` в боевой backend-модуль `apps/api/src/modules/agro-events/*`.
- Зафиксированный scope реализации для `apps/api`: операции `create draft`, `fix`, `link`, `confirm`, `commit`, подключение модуля в `AppModule`, unit-тесты MUST-gate.
- Явный admission/security-гейт: реализация допустима только после подтверждения релевантного `Decision-ID` со статусом `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: анализ код-спеки в `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*`, адаптация под NestJS/Prisma, tenant-safe получение `companyId` из доверенного контекста, wiring в `apps/api/src/app.module.ts`, unit-тесты на MUST-gate.
- Входит: перенос только backend-контура для `apps/api`, без выхода за рамки операций, перечисленных в промте.
- Не входит: UI, полировка UX, изменения Telegram-бота как транспорта, `commit/push`, обновление чеклистов/memory-bank до внешнего ревью.
- Не входит: изменение Prisma schema/migrations, если в ходе реализации не будет доказана несовместимость уже существующих моделей `AgroEventDraft` и `AgroEventCommitted`.

## Риски (что может пойти не так)
- В промте не указан `Decision-ID`; по оркестратору и `SECURITY_CANON.md` это блокирующий admission-риск. Без `Decision-ID` реализация не должна стартовать.
- Код-спека в `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` может расходиться с фактическими контрактами NestJS/Prisma в `apps/api`, поэтому перенос потребует локальной адаптации DTO, сервисов и репозитория.
- Логика `missingMust[]`, TTL и `provenanceHash` может не совпасть 1:1 с полями Prisma-моделей; это нужно проверить до начала реализации.
- Есть security-риск, если контроллер примет `companyId` из payload вместо `@CurrentUser()` или `TenantContextService`.
- В memory-bank уже есть заявления о выполненности части Agro intake; возможны расхождения между заявленным и фактическим кодом, что потребует аккуратной верификации перед переносом.

## План работ (коротко, исполнимо)
- [ ] Подтвердить релевантный `Decision-ID` со статусом `ACCEPTED` и проверить, что scope решения покрывает перенос `Agro Draft->Commit` в `apps/api`; если нет, остановить реализацию и запросить уточнение.
- [ ] Сверить код-спеку в `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` с текущими моделями Prisma и проектными примитивами `apps/api` (`PrismaModule`, `TenantContextService`, `@CurrentUser()`), чтобы зафиксировать целевую структуру модуля `agro-events`.
- [ ] Спроектировать структуру `apps/api/src/modules/agro-events/*` с разделением `Service = IO / Orchestrator = Brain`: DTO/контроллер для входных операций, сервис(ы) доменной оркестрации, Prisma-репозиторий/адаптер хранения draft/committed, валидатор MUST-gate, генерация `provenanceHash`.
- [ ] После `ACCEPTED` реализовать `create draft` с TTL и первичным вычислением `missingMust[]`, затем операции `fix`, `link`, `confirm`, `commit` с жёстким запретом commit при непустом `missingMust[]`.
- [ ] После `ACCEPTED` подключить модуль в `apps/api/src/app.module.ts` и убрать/не допустить любой приём `companyId` из payload: источник tenant должен быть только доверенный контекст (`@CurrentUser()` и/или `TenantContextService`).
- [ ] После `ACCEPTED` написать unit-тесты на MUST-gate: блок commit при непустом `missingMust[]`, перевод в `READY_FOR_CONFIRM` после `link()` при закрытии MUST, успешный `confirm()` с созданием committed и переводом draft в `COMMITTED`.
- [ ] После `ACCEPTED` прогнать релевантные тесты и подготовить пакет на ревью: список изменённых файлов, фрагмент вывода тестов, краткое описание доступных API/методов.

## DoD
- [ ] В `apps/api/src/modules/agro-events/*` существует боевой модуль, реализующий `create draft`, `fix`, `link`, `confirm`, `commit`.
- [ ] `AgroEventDraft` создаётся и обновляется с TTL и `missingMust[]`, а `AgroEventCommitted` создаётся только после прохождения MUST-gate и содержит `provenanceHash`.
- [ ] `companyId` не принимается как источник истины из payload и берётся только из доверенного tenant/auth context.
- [ ] Модуль подключён в `apps/api/src/app.module.ts`.
- [ ] Unit-тесты на MUST-gate написаны и проходят в целевом тестовом прогоне.
