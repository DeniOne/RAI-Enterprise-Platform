# PROMPT — A_RAI Фаза 2.2: EconomistAgent & KnowledgeAgent
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (продолжение ФАЗЫ 2 A_RAI)  
Decision-ID: AG-ARAI-F2-002  
Зависит от: AG-ARAI-F2-001 (Parallel Fan-Out)

---

## Цель

Завершить формирование пула специализированных агентов. Необходимо превратить `EconomistAgent` из заглушки (stub) в полноценный модуль, рассчитывающий экономику, а также создать `KnowledgeAgent`, отвечающий за RAG (генерацию ответов на базе институциональной памяти).

**Архитектурные требования:** `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` §3.3 и §3.5.

---

## Задачи (что сделать)

### 1. Реализация EconomistAgent (`economist-agent.service.ts`)
- [ ] Расширить текущий stub. Агент должен обращаться к `FinanceToolsRegistry` (методы `compute_plan_fact`, `simulate_scenario`).
- [ ] **Логика работы:**
  - Принять `intent` (например, `compute_plan_fact`).
  - Вызвать инструмент реестра финансов.
  - На базе полученных детерминированных цифр (ROI, EBITDA) сформировать человекочитаемый вывод `explain` (строка), описывающий разницу (Δ), текущую маржинальность и вознаграждение платформы (если применимо).
  - В этой фазе можно **не подключать саму LLM**, а использовать Rule-Based генерацию строк шаблонов для `explain`, так как главная задача — интеграция с реестром и возврат корректного `AgentExecutionResult`.

### 2. Реализация KnowledgeAgent (`knowledge-agent.service.ts`)
- [ ] Создать новый сервис агента (по аналогии с AgronomAgent/EconomistAgent).
- [ ] Агент должен обращаться к `KnowledgeToolsRegistry` (`query_knowledge`).
- [ ] **Логика работы:**
  - Принимает запрос пользователя, вызывает инструмент поиска в базе знаний.
  - Оборачивает найденный контент в структурированный `explain`.
- [ ] Добавить `KnowledgeAgent` в `AgentRuntime` (в метод `executeToolCalls`, чтобы он мог быть вызван при соответствующем ToolCall: `RaiToolName.QueryKnowledge`).

### 3. Интеграция в AgentRuntime
- [ ] Обновить `tool-call.planner.ts` (или место, где распределяются টুলы): если роутер запросил `QueryKnowledge`, задачу берёт `KnowledgeAgent`, если финансовые — `EconomistAgent`.
- [ ] Проверить, что Fan-Out корректно запускает 3 агентов: Agronom, Economist, Knowledge (если все три потребовались в рамках одного запроса).

### 4. Тестирование
- [ ] Unit-тесты для `EconomistAgent` (проверка логики формирования explain при различных финансовых результатах).
- [ ] Unit-тесты для `KnowledgeAgent` (возврат заглушек RAG).
- [ ] Обновить тесты `AgentRuntime` для учёта нового агента.

---

## Definition of Done (DoD)

- [ ] `EconomistAgent` содержит логику работы с финансами и возвращает форматированный `explain` базирующийся на возврате из `FinanceToolsRegistry`.
- [ ] Создан `KnowledgeAgent`, подключён к `KnowledgeToolsRegistry` и встроен в `AgentRuntime`.
- [ ] `tsc --noEmit` — PASS.
- [ ] Тесты `rai-chat` — PASS.

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `tsc --noEmit`.
2. Выводом тестов (с демонстрацией прохождения `economist-agent.spec.ts` и `knowledge-agent.spec.ts`).
3. Примером выходного JSON (`explain`) от одного из новых агентов.
