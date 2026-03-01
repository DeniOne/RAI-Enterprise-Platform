# PROMPT — P0.5 AgroEscalation + controller loop (verify/connect)
Дата: 2026-03-01  
Статус: draft  
Приоритет: P0  
Decision-ID: AG-AGRO-ESCALATION-LOOP-001 (BLOCKER: добавить в `DECISIONS.log` и получить `ACCEPTED` до начала реализации)

## Цель
Перестать жить в самообмане “эскалации вроде есть”: сделать так, чтобы после коммита Agro событий в `apps/api` реально создавалась запись `AgroEscalation` при пороге severity S3/S4 — и это было доказано тестом.

## Контекст
- Чеклист P0.5: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- Reality map фиксирует UNKNOWN по эскалациям: `docs/00_STRATEGY/STAGE 2/PROJECT_REALITY_MAP.md` (строка “Agro Controller + escalations”)
- Модель БД уже существует: `packages/prisma-client/schema.prisma` (`model AgroEscalation`, `@@map("agro_escalations")`)
- Коммит событий уже есть в `apps/api`: `apps/api/src/modules/agro-events/agro-events.orchestrator.service.ts` (создаёт `AgroEventCommitted`)

## Ограничения (жёстко)
- Admission gate: **никакой реализации до `Decision-ID` со статусом `ACCEPTED`**.
- Tenant isolation: `companyId` берётся только из доверенного контекста (`@CurrentUser()`/tenant context в `apps/api`), не из payload/callback.
- Без миграций/изменений Prisma schema в рамках P0.5 (модель `AgroEscalation` уже есть). Если внезапно не бьётся — сначала доказать несовместимость.
- Не делать UI и “красивые тексты”. Только backend loop + доказательство тестом.
- Не размазывать логику по “случайным” модулям: доменная реакция на commit должна жить рядом с agro-доменом.

## Задачи (что сделать)
- [ ] Внести `AG-AGRO-ESCALATION-LOOP-001` в `DECISIONS.log` и получить статус `ACCEPTED` (иначе стоп).
- [ ] Верифицировать факты в коде:
  - [ ] есть ли уже сервис/модуль, который пишет `AgroEscalation` (поиск по `apps/api/src`).
  - [ ] есть ли уже “controller loop” (обработчик committed events / deviations / thresholds).
  - [ ] если что-то существует — подключить к реальному моменту коммита `AgroEventCommitted` (не к мокам/ручным вызовам).
- [ ] Если реализации нет (ожидаемо по reality-map): сделать минимальный controller loop в `apps/api`:
  - [ ] точка входа: **после** успешного `commit` в `AgroEventsOrchestratorService` (или через доменный emitter, если уже принят паттерн).
  - [ ] вычисление severity по одному минимальному метрику:
    - `metricKey = "operationDelayDays"`
    - severity: `S3` если delayDays ≥ 4, `S4` если delayDays ≥ 7 (порог можно зафиксировать в коде как константы P0.5)
  - [ ] запись в `AgroEscalation`:
    - `metricKey`, `severity`, `reason` (детерминированная строка), `references` минимум `{ eventId, fieldRef?, taskRef? }`
    - `status = "OPEN"`
  - [ ] Идемпотентность минимально: не плодить дубликаты для одного `eventId + metricKey` (через `findFirst` перед `create` или иной принятый механизм).
- [ ] Добавить unit-тест(ы), которые доказывают, что loop реально создаёт escalation при пороге:
  - [ ] delayDays=4 → severity S3 → escalation created
  - [ ] delayDays=0 → escalation НЕ создаётся

## Definition of Done (DoD)
- [ ] После коммита Agro события в `apps/api` создаётся `AgroEscalation` при пороге S3/S4.
- [ ] Доказательство: есть unit-тест, который падает без loop и зелёный с loop.
- [ ] Tenant isolation соблюдён (нет `companyId` из недоверенного ввода).
- [ ] Нет миграций Prisma / изменений схемы в рамках P0.5.

## Тест-план (минимум)
- [ ] Unit: delayDays=4 → escalation created (severity=S3, metricKey="operationDelayDays", references.eventId = committed.id).
- [ ] Unit: delayDays=0 → escalation not created.
- [ ] Negative/security: попытка протащить `companyId` через payload не влияет на tenant — запись создаётся только в пределах `actor.companyId`.

## Что вернуть на ревью
- Изменённые файлы (список)
- Дифф ключевых мест (где hook на commit, где создаётся `AgroEscalation`)
- Вывод прогона unit-тестов (фрагмент)
