# PROMPT — A_RAI Фаза 2.1: AgentRuntime Fan-Out & ToolCall Planner
Дата: 2026-03-04  
Статус: active  
Приоритет: P0 (старт ФАЗЫ 2 A_RAI)  
Decision-ID: AG-ARAI-F2-001  
Зависит от: AG-ARAI-F1-004 (Декомпозиция Supervisor)

---

## Цель

Реализовать механизм **параллельного запуска агентов (Fan-Out)** и базовый **ToolCall Planner** внутри `AgentRuntime`, выделенного на предыдущем этапе. Это ядро Фазы 2, позволяющее A_RAI выполнять несколько задач одновременно, снижая общую latency системы.

**Архитектурные требования:** `docs/RAI_AI_SYSTEM_ARCHITECTURE.md` §2.2 и §2.3.

---

## Контекст и Ограничения (Жёстко)

1. **Только AgentRuntime:** Изменения касаются **исключительно** сервиса `AgentRuntime` (или связанных с ним планировщиков), который кодер должен был создать в задаче F1-4.
2. **Нулевое делегирование между агентами:** Агенты (Agronom, Economist) НЕ вызывают друг друга напрямую. Роутер даёт набор интентов, Runtime запускает их параллельно через `Promise.allSettled`.
3. **Hard Deadline:** Жёсткий таймаут на весь цикл выполнения внутри Runtime — 30 секунд. Если один агент не успел, возвращаем `partial response` от тех, кто успел.
4. **Multi-tenancy:** Во все вызовы агентов (стэбы) должен пробрасываться `companyId` и `traceId`.

---

## Задачи (что сделать)

### 1. ToolCall Planner
- [ ] Создать `apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts`.
- [ ] Реализовать метод `plan(intents: IntentClassification[]): AgentExecutionPlan`.
- [ ] Логика: если `IntentRouter` вернул несколько интентов (например, `GenerateTechMapDraft` и `ComputePlanFact`), планер должен сгруппировать их по целевым агентам (AgronomAgent, EconomistAgent) для параллельного запуска.

### 2. Parallel Fan-Out в AgentRuntime
- [ ] Обновить метод `run(...)` в `AgentRuntime`.
- [ ] Принимать `AgentExecutionPlan`.
- [ ] Использовать `Promise.allSettled` для параллельного вызова `AgronomAgent.run()` и `EconomistAgent.run()` (вызывать их стабы).
- [ ] Обернуть `Promise.allSettled` в `Promise.race` с таймаутом `30000ms`.
- [ ] Если случился таймаут — собрать результаты тех агентов, которые успели завершиться (статус `COMPLETED` или `FAILED`), и пометить таймаутнувших как `FAILED (timeout)`.

### 3. Интеграция EconomistAgent (Stub)
- [ ] Создать базовую заглушку `apps/api/src/modules/rai-chat/agents/economist-agent.service.ts` (по аналогии с `AgronomAgent`).
- [ ] Контракт: принимает `intent`, вызывает `FinanceToolsRegistry`, возвращает результат с `explain`.
- [ ] Добавить в провайдеры модуля.

### 4. Тестирование
- [ ] Юнит-тесты для `ToolCallPlanner` (проверка правильной группировки интентов).
- [ ] Юнит-тесты для `AgentRuntime` (проверка `Promise.allSettled` спавна агентов).
- [ ] Специфичный тест на **Timeout**: замокать одного из агентов так, чтобы он выполнялся 31 секунду, и убедиться, что `AgentRuntime` прерывает ожидание на 30с и возвращает partial_result.

---

## Definition of Done (DoD)

- [ ] Созданы `ToolCallPlanner` и `EconomistAgent` (stub).
- [ ] В `AgentRuntime` реализован Fan-Out (`Promise.allSettled`) + Timeout (30s).
- [ ] `tsc --noEmit` — PASS.
- [ ] Изолированные тесты (`jest` по `rai-chat/runtime/` и `rai-chat/agents/`) — PASS.

---

## Что вернуть на ревью

Отчёт с:
1. Выводом `tsc --noEmit`.
2. Выводом тестов (с демонстрацией прохождения теста на Timeout).
3. Фрагментом кода `Promise.allSettled` + `timeout` из `AgentRuntime`.
