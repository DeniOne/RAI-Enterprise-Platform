# REPORT — A_RAI Фаза 1.2: Доменные реестры (Finance/Risk/Knowledge) + AgronomAgent Stub
Дата: 2026-03-04  
Статус: READY_FOR_REVIEW  
Промпт: `interagency/prompts/2026-03-04_a_rai-f1-2_domain-registries-agronom-stub.md`  
Decision-ID: AG-ARAI-F1-002

## Цель
Завершить доменные реестры инструментов и реализовать заглушку AgronomAgent: FinanceToolsRegistry, RiskToolsRegistry, KnowledgeToolsRegistry, AgronomAgent Stub.

## Что сделано
- **FinanceToolsRegistry** (`finance-tools.registry.ts`): перенесён `compute_plan_fact` из RaiToolsRegistry; добавлены stubs `simulate_scenario`, `compute_risk_assessment`. READ-only. Провайдер в RaiChatModule.
- **RiskToolsRegistry** (`risk-tools.registry.ts`): перенесён `emit_alerts`; добавлен stub `get_weather_forecast` (forecast: "unavailable", source: "stub"). Провайдер в RaiChatModule.
- **KnowledgeToolsRegistry** (`knowledge-tools.registry.ts`): инструмент `query_knowledge` (READ), stub — поиск по `MemoryProfile.lastMessagePreview`. Провайдер в RaiChatModule.
- **RaiToolsRegistry:** удалены регистрации `compute_plan_fact` и `emit_alerts`; в `execute()` добавлено делегирование в finance/risk/knowledge по `has()`. Оставлены только EchoMessage и WorkspaceSnapshot.
- **Типы** (`rai-tools.types.ts`): добавлены RaiToolName.SimulateScenario, ComputeRiskAssessment, GetWeatherForecast, QueryKnowledge; соответствующие Payload/Result интерфейсы и мапы.
- **AgronomAgent** (`agents/agronom-agent.service.ts`): контракт AgronomAgentInput/AgronomAgentResult; stub-логика для `generate_tech_map_draft` (при наличии fieldRef/seasonRef — вызов AgroToolsRegistry, confidence 0.6, explain) и `compute_deviations` (вызов реестра, confidence 0.9). NEEDS_MORE_DATA при отсутствии полей.
- **SupervisorAgent:** при toolCall GenerateTechMapDraft или ComputeDeviations делегирование в AgronomAgent; результат (в т.ч. explain) попадает в response.text через summarizeExecutedTools.
- **Тесты:** finance-tools.registry.spec (5), risk-tools.registry.spec (3), knowledge-tools.registry.spec (3), agronom-agent.service.spec (4). Обновлены rai-tools.registry.spec, supervisor-agent.service.spec, rai-chat.service.spec (провайдеры + MEMORY_ADAPTER в external-signals.service.spec).

## Изменённые/новые файлы
- **Новые:**  
  `apps/api/src/modules/rai-chat/tools/finance-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/tools/finance-tools.registry.spec.ts`  
  `apps/api/src/modules/rai-chat/tools/risk-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/tools/risk-tools.registry.spec.ts`  
  `apps/api/src/modules/rai-chat/tools/knowledge-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/tools/knowledge-tools.registry.spec.ts`  
  `apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts`  
  `apps/api/src/modules/rai-chat/agents/agronom-agent.service.spec.ts`
- **Изменённые:**  
  `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`  
  `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`  
  `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`  
  `apps/api/src/modules/rai-chat/rai-chat.module.ts`  
  `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`  
  `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`  
  `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`  
  `apps/api/src/modules/rai-chat/external-signals.service.spec.ts`

## Проверки
- `cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit` — **PASS**
- `pnpm test -- --runInBand --testPathPattern="src/modules/rai-chat"` — **50/50 PASS**

## Smoke (по DoD)
- После поднятия API: `POST /api/rai/chat` с `"message": "сделай техкарту рапс"` и workspaceContext с `activeEntityRefs` (field) и `filters.seasonId` — ответ должен содержать в `text` строку `explain` из AgronomAgent (например «Черновик создан детерминированно»).

## Следующий шаг
Ревью TECHLEAD (Antigravity). Статус в INDEX: READY_FOR_REVIEW.
