# PLAN — IntentRouter (классификация запросов консультанта)
Дата: 2026-03-04  
Статус: draft  
Промпт: `interagency/prompts/2026-03-04_a-rai-s1_intent-router.md`

## Результат (какой артефакт получим)
- Сервис `IntentRouterService` с методом `classify(message, context) → { intent, confidence, suggestedAgents? }`.
- Типы/enum `RaiIntent` в общем контракте AI-слоя.
- Встраивание в цепочку RaiChatService → IntentRouter → (далее существующий SupervisorAgent/агенты).
- traceId от HTTP-запроса проходит через classify в метаданные для AuditLog.

## Границы (что входит / что НЕ входит)
- **Входит:** один сервис классификации, контракт интентов, вызов LLM для classify (GPT-4o-mini), unit-тесты, проброс traceId.
- **Не входит:** BudgetController, AgentRuntime, доменные реестры (Agro/Finance/Risk/Knowledge), параллельный fan-out, изменение контракта API чата (вход/выход DTO).

## Риски (что может пойти не так)
- Латентность LLM увеличит время ответа чата — митигация: короткий промпт, таймаут 3–5 с, при сбое — fallback intent GENERAL_CHAT.
- Размытая классификация (низкий confidence) — возвращаем GENERAL_CHAT, не блокируем поток.
- Зависимость от внешнего LLM — в тестах мокать, в рантайме обрабатывать ошибки gracefully.

## План работ (коротко, исполнимо)
- [ ] **Шаг 1.** Определить `RaiIntent` (enum или union) и интерфейс `IntentClassificationResult` в пакете контрактов/ai (например `packages/ai-contract` или рядом с SupervisorAgent).
- [ ] **Шаг 2.** Создать `IntentRouterService`: зависимость от LLM-провайдера (OpenAI/Anthropic), метод `classify(text, workspaceContext)`, системный промпт с 5–7 примерами (TECHMAP_DRAFT, ECONOMY_WHATIF, KNOWLEDGE_QUERY, MONITORING_STATUS, GENERAL_CHAT).
- [ ] **Шаг 3.** Проброс traceId: принимать traceId в classify (или из контекста запроса), передавать в логирование; при наличии AuditService — одна запись "intent.classified" с intent, confidence, traceId.
- [ ] **Шаг 4.** Интеграция: в RaiChatService (или месте вызова SupervisorAgent) перед вызовом агентов вызвать IntentRouterService.classify(); результат передать в следующий слой (пока можно только залогировать или положить в контекст агента).
- [ ] **Шаг 5.** Unit-тесты: 5+ кейсов (разные фразы → ожидаемый intent), проверка confidence в [0,1], мок LLM; тест на timeout/ошибку → fallback intent.
- [ ] **Шаг 6.** Регистрация сервиса в NestJS-модуле (ai/rai-chat), tsc + jest PASS.

## DoD
- [ ] IntentRouterService реализован, тип RaiIntent и IntentClassificationResult зафиксированы.
- [ ] Классификация вызывается в пути чат-запроса; traceId прокинут до AuditLog/логов.
- [ ] tsc без ошибок; jest для intent-router (и затронутых вызовов) PASS.
- [ ] Документация: маппинг intent → suggestedAgents (комментарий в коде или ADR).
