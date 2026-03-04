# PROMPT — A_RAI Фаза 2.3: Качество и оценка (Eval)
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (завершение ФАЗЫ 2 A_RAI)  
Decision-ID: AG-ARAI-F2-003  
Зависит от: AG-ARAI-F2-002

---

## Цель

Реализовать базовую инфраструктуру для оценки качества ответов AI-агентов (Eval-фреймворк). Это включает в себя метрики агентов (`AgentScoreCard`), автоматизированное тестирование на эталонных наборах данных (`GoldenTestSet`) и документирование процесса безопасного изменения промтов (`PromptChange RFC`).

**Архитектурные требования:** `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` §7.1, §7.2, §7.3, §7.4.

---

## Задачи (что сделать)

### 1. AgentScoreCard (Схема БД и Сервис)
- [ ] Добавить в `packages/prisma/schema.prisma` (или `schema.prisma` проекта) новую модель `AgentScoreCard`.
  - Поля: `id`, `createdAt`, `agentName`, `promptVersion` (String, хэш), `modelVersion` (String), `toolFailureRate` (Float), `hallucinationFlagRate` (Float), `avgConfidence` (Float), `avgLatencyMs` (Float), `avgTokensUsed` (Float), `acceptanceRate` (Float).
- [ ] Обязательно запустить `pnpm db:push` / `prisma db push` и сгенерировать клиент (`prisma generate`).
- [ ] Создать `apps/api/src/modules/rai-chat/eval/agent-scorecard.service.ts` для записи и извлечения этих метрик. (Реализовать 2 метода: `saveScoreCard` и `getScoreCardByVersion`).

### 2. GoldenTestSet (Инфраструктура EvalRun)
- [ ] Создать директорию `apps/api/src/modules/rai-chat/eval/golden-data/` и добавить туда базовый JSON-файл `agronom-golden-set.json` (минимум 2-3 мок-примера). Формат: `[{ id, requestText, expectedIntent, expectedToolCalls: [] }]`.
- [ ] Создать независимый скрипт/сервис `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`.
  - Поля/методы: `runEval(agentName, testSet)` → возвращает структуру `EvalRun` (passed, failed, regressions).
  - На данном этапе скрипт может делать стаб-проверки (сравнивать захардкоженные ожидаемые результаты). Нам важен интерфейс и инфраструктура для CI/CD.

### 3. PromptChange RFC (Документация)
- [ ] Создать файл `docs/00_STRATEGY/STAGE 2/PROMPT_CHANGE_RFC.md`.
- [ ] Описать в нём строгий процесс изменения промтов для агентов A_RAI.
- [ ] Он должен включать 6 шагов из `RAI_AI_SYSTEM_ARCHITECTURE.md` §7.4 (RFC → EvalRun → Rollback-гвард → Canary rollout → 7 дней мониторинга → Auto-rollback по rejectionRate).

### 4. Интеграция
- [ ] Зарегистрировать `AgentScoreCardService` и `GoldenTestRunnerService` в `RaiChatModule` (как провайдеры).
- [ ] Проверить DI.

---

## Definition of Done (DoD)

- [ ] Модель `AgentScoreCard` создана в Prisma, типы сгенерированы.
- [ ] Создана базовая инфраструктура `GoldenTestSet` и `EvalRun` (с заглушечными проверками).
- [ ] Написан документ `PROMPT_CHANGE_RFC.md`.
- [ ] `tsc --noEmit` — ПРОХОДИТ.
- [ ] Все тесты `rai-chat` проходят.

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `prisma db push` (или `validate` схемы).
2. Выводом `tsc --noEmit`.
3. Содержимым `PROMPT_CHANGE_RFC.md` (или ссылкой на него, если он длинный).
4. Заготовкой `agronom-golden-set.json` (как пример формата).
