# PROMPT — A_RAI Фаза 1.2: Доменные реестры (Finance/Risk/Knowledge) + AgronomAgent Stub
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (продолжение ФАЗЫ 1 A_RAI)  
Decision-ID: AG-ARAI-F1-002  
Зависит от: AG-ARAI-F1-001 (IntentRouter + AgroToolsRegistry + TraceId)

---

## Цель

Завершить создание доменных реестров инструментов и реализовать первую заглушку `AgronomAgent` согласно `A_RAI_IMPLEMENTATION_CHECKLIST.md` §1.2 и §2.2.

**Четыре задачи:**
1. **FinanceToolsRegistry** — реестр финансовых инструментов для `EconomistAgent` (только READ).
2. **RiskToolsRegistry** — реестр инструментов мониторинга для `MonitoringAgent` (только READ + `emit_alerts`).
3. **KnowledgeToolsRegistry** — реестр инструментов базы знаний (только READ).
4. **AgronomAgent Stub** — первая версия агента-агронома: принимает задачу, вызывает `AgroToolsRegistry`, возвращает структурированный ответ с `confidence` и `explain`.

По завершении: четыре изолированных реестра (Agro/Finance/Risk/Knowledge) существуют как отдельные сервисы; `AgronomAgent` принимает запрос через `AgentRuntime` и производит ответ по шаблону `ExplainableResult`.

---

## Контекст

- **Архитектура:** `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`:
  - §3.2–3.5 — описание каждого агента и его capabilities
  - §5.2 — таблица доменных реестров (инструменты + risk-level + сервис-источник)
  - §8 — контракт `AgroDeterministicEngine` и `ExplainableResult`
- **Чек-лист:** `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md` — пп. 1.2 (реестры), 2.2 (AgronomAgent)
- **Уже готово (F1-1):** `IntentRouterService`, `AgroToolsRegistry`, `AiAuditEntry`
- **Текущий реестр:** `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` — после F1-1 два инструмента (`compute_plan_fact`, `emit_alerts`) ещё в общем реестре → их нужно переместить в доменные.
- **Security канон:** `memory-bank/SECURITY_CANON.md`

---

## Ограничения (жёстко)

- **Capability isolation:** `FinanceToolsRegistry` → только `EconomistAgent`. `RiskToolsRegistry` → только `MonitoringAgent`. Это АРХИТЕКТУРНОЕ правило, не рекомендация.
- **READ-ONLY для Finance и Knowledge:** Запрещено регистрировать инструменты с `riskLevel: 'WRITE'` или `'CRITICAL'` в этих реестрах.
- **`companyId` только из `actorContext`** — никогда из payload.
- **AgronomAgent — Stub без LLM:** Агент работает детерминированно: получает параметры → вызывает инструменты через `AgroToolsRegistry` → возвращает `AgronomAgentResult`. LLM-вызов будет в следующей задаче.
- **Scope запрещён:** не трогать UI, не трогать схему Prisma (кроме очевидных расширений, если потребуется), не трогать `SupervisorAgent` глубже, чем wire-up нового агента.
- **Нет дублирования:** `compute_plan_fact` и `emit_alerts` после переноса удалить из `RaiToolsRegistry.registerBuiltInTools()`.

---

## Задачи (что сделать)

### 1. FinanceToolsRegistry
- [ ] Создать `apps/api/src/modules/rai-chat/tools/finance-tools.registry.ts`
- [ ] Перенести `compute_plan_fact` из `RaiToolsRegistry` в `FinanceToolsRegistry`
- [ ] Добавить два новых инструмента-заглушки (только типы + схема + stub-handler):
  - `simulate_scenario` — симуляция экономического сценария (`riskLevel: 'READ'`)
  - `compute_risk_assessment` — оценка рисков по плану (`riskLevel: 'READ'`)
- [ ] Зарегистрировать новые инструменты в `RaiToolName` enum и в `RaiToolPayloadMap/RaiToolResultMap`
- [ ] Добавить провайдер в `RaiChatModule`

### 2. RiskToolsRegistry
- [ ] Создать `apps/api/src/modules/rai-chat/tools/risk-tools.registry.ts`
- [ ] Перенести `emit_alerts` из `RaiToolsRegistry` в `RiskToolsRegistry`
- [ ] Добавить заглушку `get_weather_forecast` (`riskLevel: 'READ'`, stub возвращает `{ forecast: 'unavailable', source: 'stub' }`)
- [ ] Добавить провайдер в `RaiChatModule`

### 3. KnowledgeToolsRegistry
- [ ] Создать `apps/api/src/modules/rai-chat/tools/knowledge-tools.registry.ts`
- [ ] Инструмент `query_knowledge` (`riskLevel: 'READ'`, stub: поиск по тексту в `MemoryProfile`)
- [ ] `workspace_snapshot` и `echo_message` — оставить в `RaiToolsRegistry` как утилиты (общие для всех агентов)
- [ ] Добавить провайдер в `RaiChatModule`

### 4. AgronomAgent Stub
- [ ] Создать `apps/api/src/modules/rai-chat/agents/agronom-agent.service.ts`
- [ ] Контракт:
  ```typescript
  interface AgronomAgentInput {
    companyId: string;
    traceId: string;
    intent: 'generate_tech_map_draft' | 'compute_deviations';
    fieldRef?: string;
    seasonRef?: string;
    crop?: string;
    scope?: { seasonId?: string; fieldId?: string };
  }

  interface AgronomAgentResult {
    agentName: 'AgronomAgent';
    status: 'COMPLETED' | 'FAILED' | 'NEEDS_MORE_DATA';
    data: unknown;
    confidence: number;        // 0.0–1.0
    missingContext: string[];  // что не хватает для уверенного ответа
    explain: string;           // '1-2 предложения: что сделал агент и почему'
    toolCallsCount: number;
    traceId: string;
  }
  ```
- [ ] Логика stub:
  - Если `intent === 'generate_tech_map_draft'` и `fieldRef/seasonRef` присутствуют → вызвать `AgroToolsRegistry.execute('generate_tech_map_draft', ...)` → confidence `0.6`, explain `'Черновик создан детерминированно. LLM-агроном не подключён.'`
  - Если `intent === 'compute_deviations'` → вызвать `AgroToolsRegistry.execute('compute_deviations', ...)` → confidence `0.9`
  - Если нет нужных параметров → `status: 'NEEDS_MORE_DATA'`, `missingContext: [...]`
- [ ] В `SupervisorAgent`:
  - После `IntentRouterService.classify()` при `toolName === GenerateTechMapDraft | ComputeDeviations` — делегировать в `AgronomAgent` вместо прямого вызова реестра
  - Результат `AgronomAgentResult` включать в `response.text` с `explain`
- [ ] Добавить провайдер в `RaiChatModule`

---

## Definition of Done (DoD)

- [ ] `tsc --noEmit` в `apps/api` — PASS
- [ ] Все существующие тесты `src/modules/rai-chat/` — PASS (без регрессий)
- [ ] Новые unit-тесты `FinanceToolsRegistry` (минимум 3 сценария)
- [ ] Новые unit-тесты `RiskToolsRegistry` (минимум 2 сценария)
- [ ] Новые unit-тесты `KnowledgeToolsRegistry` (минимум 2 сценария)
- [ ] Новые unit-тесты `AgronomAgent` (минимум 4 сценария: draft с данными, draft без данных, deviations, unknown intent)
- [ ] Smoke: `POST /api/rai/chat` с `"сделай техкарту рапс"` → ответ содержит `explain` из `AgronomAgent`
- [ ] В `RaiToolsRegistry` больше нет `compute_plan_fact` и `emit_alerts`

---

## Тест-план (минимум)

```bash
# 1. TypeScript
cd apps/api && pnpm exec tsc -p tsconfig.json --noEmit

# 2. Все тесты rai-chat модуля
cd apps/api && pnpm test -- --runInBand --testPathPattern="src/modules/rai-chat"

# 3. AgronomAgent
cd apps/api && pnpm test -- --runInBand src/modules/rai-chat/agents/agronom-agent.service.spec.ts

# 4. Smoke — explain в ответе
curl -sS -X POST 'http://localhost:4000/api/rai/chat' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "сделай техкарту рапс",
    "workspaceContext": {
      "route": "/consulting/techmaps",
      "activeEntityRefs": [{"kind":"field","id":"demo-field-kuban-1"}],
      "filters": {"seasonId": "demo-season-2026-kuban-1"}
    }
  }' | jq '.text'
# Ожидаем: текст содержит "Черновик создан" или explain из AgronomAgent
```

---

## Что вернуть на ревью (ревью-пак)

1. Список новых и изменённых файлов
2. Вывод `tsc --noEmit` (без ошибок)
3. Вывод jest для `src/modules/rai-chat/**` (все PASS, с количеством тестов)
4. Вывод smoke curl (текст ответа с `explain`)
5. Статус `READY_FOR_REVIEW` в `interagency/INDEX.md`
