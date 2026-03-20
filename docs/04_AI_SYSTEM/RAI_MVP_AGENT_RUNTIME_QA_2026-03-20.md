---
id: DOC-AI-SYSTEM-MVP-AGENT-RUNTIME-QA-20260320
layer: Engineering
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-20
claim_id: CLAIM-AI-MVP-AGENT-RUNTIME-QA-20260320
claim_status: asserted
verified_by: code
last_verified: 2026-03-20
evidence_refs: apps/api/src/modules/rai-chat;apps/api/src/shared/rai-chat;apps/api/src/modules/explainability
---
# RAI MVP: ответы по боевому контуру агентов (на 20 марта 2026)

## CLAIM
id: CLAIM-AI-MVP-AGENT-RUNTIME-QA-20260320
status: asserted
verified_by: code
last_verified: 2026-03-20

## Статус документа
- Версия: `v1`
- Дата: `2026-03-20`
- Источник истины: текущий код `apps/api/src/modules/rai-chat/*` и `apps/api/src/shared/rai-chat/*`.

## 1) Какие агенты боевые в ближайшем MVP, а какие проектные

### Ближайший MVP (боевые)
- `agronomist` -> техкарты/отклонения -> `compute_deviations` -> `generate_tech_map_draft`
- `economist` -> plan/fact, сценарии, риск-оценка -> `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment` -> нет `write` в текущем наборе
- `knowledge` -> запросы в базу знаний/память -> `query_knowledge` -> нет `write`
- `crm_agent` -> реестр контрагентов и CRM workspace -> `lookup_counterparty_by_inn`, `get_crm_account_workspace` -> `register_counterparty`, `create/update/delete_*` по аккаунтам/контактам/обязательствам
- `front_office_agent` -> логирование диалогов, классификация, эскалация -> `log_dialog_message`, `classify_dialog_thread` -> `create_front_office_escalation`
- `contracts_agent` -> договоры/обязательства/исполнение/счета/платежи -> `list/get_*`, `get_ar_balance` -> `create_*`, и критические `post_invoice`, `confirm_payment`, `allocate_payment`
- `monitoring` -> сигналы и прогноз -> `emit_alerts`, `get_weather_forecast` -> нет `write` в фактической реализации реестра (сейчас оба инструмента зарегистрированы как `READ`)

### Проектные/экспертные (не базовый контур MVP)
- `chief_agronomist` -> экспертные заключения и разбор аномалий -> внешние tool bindings по умолчанию пустые -> мутаций через реестр инструментов по умолчанию нет
- `data_scientist` -> исследовательская аналитика/паттерны -> внешние tool bindings по умолчанию пустые -> мутаций через реестр инструментов по умолчанию нет

Эффект: видно, что углубленное рассуждение действительно нужно прежде всего для `knowledge`, `economist`, экспертных ролей и слоя синтеза; для большинства `write`-операций нужен детерминированный оркестрационный контур с governance.

## 2) Какие агенты имеют право на mutation/write-action

### Только чтение/анализ
- `knowledge`
- `economist` (в текущем tool set)
- `monitoring` (фактическая регистрация инструментов в `RiskToolsRegistry`)

### Чтение + запись
- `agronomist` (`generate_tech_map_draft`)
- `crm_agent` (регистрация/создание/изменение/удаление CRM-сущностей)
- `front_office_agent` (эскалации)
- `contracts_agent` (создание договорных и финансовых сущностей)

### Критические write-action
- Только `contracts_agent`: `post_invoice`, `confirm_payment`, `allocate_payment` (risk=`CRITICAL`)

Эффект: low-risk и high-risk пути разделены на уровне `TOOL_RISK_MAP` и дальше обрабатываются через `RiskPolicyEngine + PendingAction`.

## 3) Какие данные считать чувствительными по классам

В коде есть маскирование PII и redaction telemetry, но полной 4-классовой корпоративной матрицы пока нет как единого артефакта. Для MVP фиксируем:

- `public`: публичные справочники и обезличенные агрегаты
- `internal`: служебные метаданные маршрутизации и аудита без ПДн
- `confidential`: коммерческие сущности (договоры, обязательства, статусы исполнений, AR, CRM-пайплайн)
- `personal+regulated`: ПДн и регулируемые реквизиты (email, телефон, длинные идентификаторы, ИНН-подобные поля)

Что уже в коде:
- `SensitiveDataFilterService`: маскирует email/телефоны/ИНН-подобные значения в ответах
- `routing-telemetry-redaction.ts`: очистка свободного текста перед сохранением telemetry

Эффект: появляется практическая база для policy routing, маскирования и explainability без утечек.

## 4) Какие запросы всегда вести через deterministic tool-path

Для текущего MVP: 
- plan/fact
- риск-оценка по структурированным данным
- AR balance/договорные статусы/счета/платежи
- CRM lookup/workspace и любые write в CRM/Contracts
- генерация техкарты как governed write

Правило: LLM используется как интерфейс и синтез объяснения, но не как источник фактов для числовых и статусных ответов.

Эффект: исключается «творческая» ошибка в критичных бизнес-операциях.

## 5) Где нужен свободный режим рассуждения

- синтез результатов нескольких tools
- приоритизация рисков и следующих действий
- объяснение сложных выводов пользователю
- экспертные разборы (`chief_agronomist`, `data_scientist`)
- работа с неполным контекстом через `clarify/confirm`

Эффект: свободный режим рассуждения остается там, где дает прирост качества, а не подменяет детерминированные вычисления.

## 6) Есть ли формальная taxonomy intent/task complexity/risk

Да, частично уже формализовано:
- `SemanticIntent`: `domain/entity/action/interactionMode/mutationRisk/resolvability/ambiguityType/confidenceBand`
- `RouteDecision`: `decisionType` (`execute/navigate/clarify/confirm/block/abstain`) и `recommendedExecutionMode`
- `TOOL_RISK_MAP`: `READ/WRITE/CRITICAL`

Что еще нужно закрепить до полной зрелости: единая таблица `task_complexity` (simple/composite/analysis/recommendation/write/high-risk-write) как обязательный policy input.

Эффект: `ModelPolicyResolver` будет опираться на типизированную модель, а не на локальные ad hoc правила.

## 7) Долгоживущая память у агентов или централизованная память платформы

Текущая реализация: память централизована на платформенном уровне (`MemoryCoordinatorService`, `MemoryAdapter`, рабочая память, engram-слой). Агентам подмешивается контекст во время выполнения (`memoryContext`), а не «личная» автономная память вне платформы.

Эффект: проще контроль утечек, аудит и tenant isolation.

## 8) Нужен ли параллельный запуск нескольких агентов

Да, уже поддерживается: `tool-call planner` строит группы и батчи с параллельным fan-out, затем `ResponseComposer` собирает ответ.

Текущий приоритет для MVP: `primary route + ограниченный fan-out по tools`, без полноценного произвольного графа оркестрации.

Эффект: сохраняется производительность без неконтролируемого усложнения оркестрации.

## 9) Кто принимает решение `clarify vs execute`

Сейчас решение двухуровневое:
- уровень роутинга: `SemanticRouter` формирует `RouteDecision` (`clarify/execute/...`)
- уровень исполнения: адаптер агента может вернуть `NEEDS_MORE_DATA`, даже если наверху была попытка `execute`

Эффект: guardrail по недостающему контексту не завязан на один слой и не ломается от одного ошибочного решения.

## 10) Насколько жестко ограничивать tools per route

Текущий режим фактически: `allowlist + bounded fallback`.
- `filterRequestedToolsByKernel` (role/tool allowlist)
- `filterRequestedToolsBySemanticRoute` (если включен `enforceCapabilityGating`)

Для MVP фиксируем стратегию: `Вариант B (allowlist + bounded fallback)`.

Эффект: контролируемое выполнение без полной потери отказоустойчивости.

## 11) Нужен ли интернет в боевом execution path

Текущий факт по коду:
- отдельных web/search/fetch инструментов в `RaiToolName` нет
- `get_weather_forecast` сейчас `stub`
- LLM-провайдер зовется через OpenRouter API

Решение для MVP по категориям:
- новости/рынок: не в боевом path
- нормативка/законы: не в боевом path (только curated источники вне базового контура)
- контрагенты/реестры: через внутренние/интеграционные инструменты, не свободный веб-поиск
- конкурентный мониторинг: вне базового контура MVP
- открытые данные (цены/курсы/погода/биржи): только через отдельные проверяемые интеграции; сейчас в core не включено

Эффект: снижается операционный и юридический риск от неконтролируемого web-зависимого поведения.

## 12) Что разрешить российским моделям

Текущий факт: runtime-провайдер типизирован как `openrouter`; явного боевого контура для `Yandex/GigaChat` в коде сейчас нет.

Политика MVP: использовать как внешний исследовательский/синтез-контур вне базового execution path до появления полноценного governance и аудита по ним.

Эффект: не создается скрытая критическая зависимость от непроверенного провайдера.

## 13) Допустимый бюджет задержки по классам задач

Явные инженерные лимиты сейчас:
- runtime deadline per role: обычно `20–30s`
- LLM timeout в runtime profile задается по ролям

Целевая продуктовая шкала для MVP:
- chat UX: быстрый ответ с деградацией при превышении
- composite analytics: допускается длиннее, но в пределах runtime deadline
- тяжелые отчеты: перевод в асинхронный job

Эффект: предсказуемый UX и управляемые деградации вместо подвисаний.

## 14) Допустимый режим деградации при недоступности модели/провайдера

Уже есть формализованные fallback-reason/fallback-mode и runtime governance события:
- `READ_ONLY_SUPPORT`, `MANUAL_HUMAN_REQUIRED`, `ROUTE_FALLBACK`
- причины: `LLM_UNAVAILABLE`, `BUDGET_DENIED`, `NEEDS_MORE_DATA` и др.

Практический порядок деградации для MVP:
- сначала частичный детерминированный поднабор
- затем `clarify`/manual gate
- жесткая ошибка только когда ни один безопасный путь невозможен

Эффект: UX не рушится полностью при частичных отказах.

## 15) Есть ли human approval gate перед опасными действиями

Да.
- `RiskPolicyEngineService`: `READ/WRITE/CRITICAL` -> verdict
- `PendingActionService` + `PendingActionsController`: одно/двухэтапное подтверждение
- для финального подтверждения и исполнения нужны привилегированные роли (`ADMIN/CEO`)

Эффект: опасные действия проходят через управляемую human-in-the-loop схему.

## 16) Как валидировать составной ответ перед отдачей

Частично уже есть:
- `validation` в `AgentExecutionResult`
- требования output contract (evidence/deterministic validation)
- masked output через `SensitiveDataFilterService`

Что фиксируем как обязательный следующий шаг:
- schema validator
- numeric consistency check
- policy check
- evidence/citation check

Эффект: появляется отдельный слой `ResponseVerifier`, уменьшающий риск недостоверных ответов.

## 17) Где хранится telemetry/audit и что доказываем

Текущий факт:
- `AiAuditEntry.metadata` содержит `routingTelemetry`, runtime governance, memory lane, phases, structured outputs и др.
- есть explainability endpoint `GET /rai/explainability/routing/divergence`

Через telemetry уже можно доказывать:
- почему выбран route (legacy vs semantic + divergence)
- почему `block/clarify/abstain`
- какие tools реально вызывались
- execution path (`tool_call_primary`/`heuristic_fallback`/`semantic_router_primary`)
- были ли fallback и redaction

Эффект: аудит становится управленческим инструментом, а не только отладочным логом.

## 18) Нужна ли explainability на уровне пользователя

Да, и уже есть частичный контур:
- intermediate steps
- pending clarification
- evidence в ответе
- пояснения по blocked actions через composer

Для MVP фиксируем правило: пользователь всегда видит, чего не хватает для исполнения и почему запрошено уточнение/подтверждение.

Эффект: снижается ощущение «агент живет своей жизнью».

## 19) Какие языки и типы контента в бою

Текущий основной контур: RU text + структурированные данные/виджеты.
Дополнительно: работа с контекстом workspace и внутренними сущностями.

Не как core-MVP: полноценный multimodal контур (изображения/голос/PDF parsing) как обязательная часть agent-runtime.

Эффект: ограничивается зона сложности, ускоряется стабилизация боевого контура.

## 20) Принцип по иностранным сильным LLM

Для ближайшего MVP: `limited internal analyst workspace` + `sanitized research packs`, но не базовый execution path с сырыми чувствительными данными.

Эффект: сохраняется доступ к сильному reasoning, но без превращения внешнего LLM в неконтролируемую критическую зависимость.

---

## Приложение: ключевые кодовые опоры
- `apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `apps/api/src/shared/rai-chat/rai-tools.types.ts`
- `apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts`
- `apps/api/src/modules/rai-chat/security/pending-action.service.ts`
- `apps/api/src/modules/rai-chat/pending-actions.controller.ts`
- `apps/api/src/shared/rai-chat/semantic-routing.types.ts`
- `apps/api/src/modules/rai-chat/semantic-router/semantic-router.service.ts`
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`
- `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`
- `apps/api/src/modules/rai-chat/supervisor-forensics.service.ts`
- `apps/api/src/shared/rai-chat/routing-telemetry-redaction.ts`
- `apps/api/src/modules/explainability/explainability-panel.controller.ts`
- `apps/api/src/modules/explainability/explainability-panel.service.ts`
