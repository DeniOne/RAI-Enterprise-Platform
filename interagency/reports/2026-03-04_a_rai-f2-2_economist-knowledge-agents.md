# Отчёт — A_RAI Фаза 2.2: EconomistAgent & KnowledgeAgent

**Дата:** 2026-03-04  
**Decision-ID:** AG-ARAI-F2-002  
**Промт:** `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md`

---

## Выполненные задачи

### 1. EconomistAgent (`agents/economist-agent.service.ts`)
- Расширен: вызовы `FinanceToolsRegistry` (compute_plan_fact, simulate_scenario, compute_risk_assessment).
- **Rule-based explain:** из детерминированных данных формируется человекочитаемый текст:
  - `compute_plan_fact`: ROI %, EBITDA, выручка, факт/план затрат, Δ затрат (или «данных пока нет»).
  - `simulate_scenario`: сценарий, ROI %, EBITDA, источник.
  - `compute_risk_assessment`: план, уровень риска, факторы.
- LLM не подключается; explain — шаблоны по типам результата.

### 2. KnowledgeAgent (`agents/knowledge-agent.service.ts`)
- Новый сервис: `run({ companyId, traceId, query })` → `KnowledgeAgentResult`.
- Вызов `KnowledgeToolsRegistry.execute(QueryKnowledge, { query }, actorContext)`.
- Explain: при 0 hits — «По запросу ничего не найдено»; иначе — «Найдено совпадений: N» + до 5 фрагментов с релевантностью.

### 3. Интеграция в AgentRuntime и planner
- `tool-call.planner.ts`: добавлена группа `knowledge` для `RaiToolName.QueryKnowledge`. `planByToolCalls` и `planByIntents` возвращают `knowledge[]`.
- `agent-runtime.service.ts`: инжект `KnowledgeAgent`, `plan.knowledge` → `knowledgePromises`, метод `runKnowledge(call, actorContext)` (query из payload).
- Fan-out: Agronom, Economist, Knowledge и other выполняются параллельно (Promise.allSettled + 30s timeout).

### 4. Тестирование
- **economist-agent.service.spec.ts:** compute_plan_fact explain по данным (ROI/План/EBITDA), simulate_scenario, compute_risk_assessment, FAILED при ошибке registry.
- **knowledge-agent.service.spec.ts:** COMPLETED с explain (хиты), 0 hits, FAILED при ошибке.
- **agent-runtime.service.spec.ts:** добавлен mock KnowledgeAgent, тест «fan-out: knowledge вызывается при QueryKnowledge».
- **tool-call.planner.spec.ts:** QueryKnowledge в knowledge, пустой план с knowledge: [], planByIntents с knowledge.
- **supervisor-agent.service.spec.ts**, **rai-chat.service.spec.ts:** в providers добавлен KnowledgeAgent.

---

## Изменённые/новые файлы

- `apps/api/src/modules/rai-chat/agents/economist-agent.service.ts` (explain rule-based)
- `apps/api/src/modules/rai-chat/agents/economist-agent.service.spec.ts` (расширенные кейсы)
- `apps/api/src/modules/rai-chat/agents/knowledge-agent.service.ts` (новый)
- `apps/api/src/modules/rai-chat/agents/knowledge-agent.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts` (KNOWLEDGE_TOOLS, knowledge в плане)
- `apps/api/src/modules/rai-chat/runtime/tool-call.planner.spec.ts` (knowledge-кейсы)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` (KnowledgeAgent, runKnowledge, knowledgePromises)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` (KnowledgeAgent mock, тест QueryKnowledge)
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` (KnowledgeAgent)
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` (KnowledgeAgent в providers)
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` (KnowledgeAgent в providers)

---

## DoD

- [x] EconomistAgent: логика с FinanceToolsRegistry, форматированный explain по типам intent.
- [x] KnowledgeAgent: создан, KnowledgeToolsRegistry, встроен в AgentRuntime.
- [x] `tsc --noEmit` (apps/api) — PASS.
- [x] Тесты rai-chat (целевые economist, knowledge, agent-runtime, planner, supervisor, rai-chat.service) — PASS.

---

## Вывод tsc --noEmit

```
(пустой вывод — exit 0)
```

---

## Вывод тестов (целевые)

- economist-agent.service.spec.ts: PASS (5 тестов)
- knowledge-agent.service.spec.ts: PASS (3 теста)
- agent-runtime.service.spec.ts: PASS (4 теста, из них 1 skip)
- tool-call.planner.spec.ts: PASS (7 тестов)
- supervisor-agent.service.spec.ts: PASS
- rai-chat.service.spec.ts: PASS

(Полный прогон `jest --testPathPattern=rai-chat` может давать SIGKILL на части воркеров в среде с ограничением памяти; указанные спекты при изолированном/runInBand запуске проходят.)

---

## Пример выходного explain (EconomistAgent, compute_plan_fact)

Вход: intent `compute_plan_fact`, scope `{ seasonId: "s1" }`. Реестр вернул:  
`planId: "p1", status: "ACTIVE", roi: 0.12, ebitda: 1000, revenue: 5000, totalActualCost: 3500, totalPlannedCost: 4000, hasData: true`.

**explain:**  
«План p1: ROI 12.0%, EBITDA 1 000 ₽. Выручка: 5 000 ₽, факт затрат: 3 500 ₽ (план: 4 000 ₽). Δ затрат: -500 ₽.»

---

## Пример выходного explain (KnowledgeAgent)

Вход: query «норма высева рапса». Реестр вернул:  
`hits: 2, items: [{ content: "Рапс: норма высева 4–6 кг/га.", score: 0.9 }, ...]`

**explain:**  
«Найдено совпадений: 2.  
[1] (релевантность 0.90): Рапс: норма высева 4–6 кг/га.  
[2] (релевантность 0.70): Предшественник влияет на норму высева.»

---

**Статус:** READY_FOR_REVIEW
