# PLAN — Typed tools registry и строгие схемы вызовов
Дата: 2026-03-02  
Статус: accepted  
Decision-ID: AG-TYPED-TOOLS-REGISTRY-001  

## Результат (какой артефакт получим)
- Исполнимый план для P1.1: ввести в `apps/api` реестр инструментов с явной регистрацией, строгой схемной валидацией payload, типизированным исполнением и обязательным логированием каждого вызова.
- Зафиксированный минимальный scope backend-only: registry infrastructure, typed contracts для tool calls, минимум 1-2 зарегистрированных инструмента, unit-тесты на validate/execute/logging.
- Явный admission-блокер: реализация запрещена, пока `AG-TYPED-TOOLS-REGISTRY-001` не внесён в `DECISIONS.log` и не имеет статуса `ACCEPTED`.

## Границы (что входит / что НЕ входит)
- Входит: анализ текущего контура `apps/api/src/modules/rai-chat/*`, поиск мест с `toolCalls`/`suggestedActions`, проектирование `ToolsRegistry` с контрактом `register(name, schema, handler)` и `execute(name, payload, actorContext)`.
- Входит: tenant-safe actor context, где `companyId` приходит только из доверенного auth/request context, а не из payload инструмента.
- Входит: structured logging для `toolName`, `companyId`, `traceId`, `success/fail`, а также unit-тесты на валидный и невалидный payload.
- Не входит: полноценная agentic orchestration, динамическое исполнение произвольных строк, UI, commit/push, обновление чеклистов и memory-bank до внешнего ревью.
- Не входит: расширение scope за пределы P1.1, включая массовую интеграцию всех доменных сервисов в registry за один проход.

## Риски (что может пойти не так)
- Блокирующий admission-риск: `AG-TYPED-TOOLS-REGISTRY-001` отсутствует в `DECISIONS.log`; без статуса `ACCEPTED` реализация стартовать не должна.
- В `RAI Chat API` текущий контракт может быть ещё не рассчитан на реальное tool execution, поэтому интеграцию придётся ограничить инфраструктурой и минимальным proof path.
- Если существующие `suggestedActions` или tool-like структуры типизированы через `any[]`, их замена может затронуть несколько DTO, сервисов и тестов одновременно.
- Есть security-риск, если payload инструмента сможет протащить tenant identity или обойти регистрацию через строковое имя без белого списка.
- Есть архитектурный риск смешения orchestration и IO: registry должен диспетчеризовать зарегистрированные handler'ы, но не превращаться в бизнес-оркестратор домена.

## План работ (коротко, исполнимо)
- [ ] Внести `AG-TYPED-TOOLS-REGISTRY-001` в `DECISIONS.log` и получить статус `ACCEPTED`; при отсутствии допуска остановить реализацию.
- [ ] Просмотреть текущий код `apps/api/src/modules/rai-chat/*` и смежные типы, чтобы зафиксировать, где сейчас объявлены или подразумеваются `toolCalls`, `suggestedActions` и контракты ответов.
- [ ] Спроектировать `ToolsRegistry` как backend-infrastructure primitive: явная регистрация инструмента, schema-based validation payload, typed handler contract, `execute(...)` с обязательным actor context и structured logging.
- [ ] Определить формат типизированных payload без `any[]` в критичном контуре и выбрать схему валидации, совместимую с текущим стеком `apps/api`.
- [ ] Подобрать 1-2 минимальных инструмента для регистрации, которые можно подключить без архитектурного разрастания и без нарушения принципа `Service = IO / Orchestrator = Brain`.
- [ ] После `ACCEPTED` реализовать registry, wiring зарегистрированных инструментов и запрет на вызов незарегистрированного имени или невалидного payload.
- [ ] После `ACCEPTED` покрыть unit-тестами сценарии: валидный payload -> handler вызван; невалидный payload -> отказ без вызова handler; каждый вызов логируется с `toolName`, `companyId`, `traceId`, `success/fail`.
- [ ] После `ACCEPTED` подготовить пакет на ревью: изменённые файлы, финальные типы/схемы, вывод unit-тестов.

## DoD
- [ ] В `apps/api` существует `ToolsRegistry` с явной регистрацией инструмента и схемной валидацией payload перед исполнением.
- [ ] В критичном контуре tool payload отсутствует `any[]`; контракты типизированы явно.
- [ ] Вызов незарегистрированного инструмента или невалидного payload отклоняется до исполнения handler.
- [ ] Каждый вызов registry логируется с `toolName`, `companyId`, `traceId` и статусом `success/fail`.
- [ ] Минимум 1 зарегистрированный инструмент покрыт unit-тестом.
