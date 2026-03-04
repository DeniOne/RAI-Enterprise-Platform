# A_RAI — Чек-лист имплементации (Phase 2-4)

> **Статус:** `ACTIVE` | **Дата:** 2026-03-04
> Этот документ является рабочим чек-листом для реализации архитектуры A_RAI v2.0.


---

## 🏗️ ФАЗА 1: ФУНДАМЕНТ (Скелет системы)

**Цель:** Разделить монолит SupervisorAgent и создать доменные реестры.

### 1.1 Декомпозиция Supervisor
- [x] **IntentRouter** (`intent-router.service.ts`) — классификация запросов (regex, LLM-ready). | **AG-ARAI-F1-001** | DONE
- [ ] **MemoryCoordinator** (`memory-coordinator.service.ts`) — работа с Episodic Memory + Tenant Isolation.
- [ ] **AgentRuntime** (`agent-runtime.service.ts`) — жизненный цикл агента, дедлайны (30с).
- [ ] **ResponseComposer** (`response-composer.service.ts`) — сборка ответа и виджетов.

### 1.2 Доменные реестры (Capability-based)
- [x] **AgroToolsRegistry** — инструменты агрономии и техкарт. | **AG-ARAI-F1-001** | DONE
- [/] **FinanceToolsRegistry** — экономика и ROI (только READ). | **AG-ARAI-F1-002** | IN_PROGRESS
- [/] **RiskToolsRegistry** — алерты и спутники. | **AG-ARAI-F1-002** | IN_PROGRESS
- [/] **KnowledgeToolsRegistry** — база знаний и RAG. | **AG-ARAI-F1-002** | IN_PROGRESS

### 1.3 Детерминированный мост
- [/] **AgroDeterministicEngineFacade** — обёртка над кодом расчётов с выводом формул и объяснений (`ExplainableResult`). | **AG-ARAI-F1-003** | IN_PROGRESS

### 1.4 Трассировка и аудит
- [x] **TraceId Binding** — проброс ID сквозь все вызовы AI в `AuditLog`. | **AG-ARAI-F1-001** | DONE
- [ ] **ExplainabilityPanel Service** — сервис для отображения "почему Рэй так решил".

---

## 🤖 ФАЗА 2: АГЕНТЫ (Интеллект)

**Цель:** Полноценные субагенты и параллельное выполнение задач.

### 2.1 Runtime Evolution
- [ ] **Parallel Fan-out** — одновременный запуск нескольких агентов (напр. Agronom + Economist).
- [ ] **ToolCall Planner** — оптимизация количества вызовов LLM.

### 2.2 Специализированные агенты
- [/] **AgronomAgent** — ТРИАЖ (7 слоёв контекста) + Генерация DRAFT техкарты. | **AG-ARAI-F1-002** | IN_PROGRESS
- [ ] **EconomistAgent** — Расчёт Δ, маржинальности и вознаграждения RAI.
- [ ] **KnowledgeAgent** — Поиск по институциональной памяти и RegionProfile.

### 2.3 Качество и оценка (Eval)
- [ ] **AgentScoreCard** — метрики (acceptance/correction rate) в БД.
- [ ] **GoldenTestSet** — набор эталонных тестов для проверки регрессий.
- [ ] **PromptChange RFC** — процесс изменения промтов через обязательный EvalRun.

---

## 🛡️ ФАЗА 3: БЕЗОПАСНОСТЬ (Надёжность)

**Цель:** Автономный мониторинг и защита данных.

### 3.1 Мониторинг и автономность
- [ ] **MonitoringAgent** — event-driven наблюдатель (подписка на Outbox).
- [ ] **AutonomousExecutionContext** — изоляция для монитора (технический READ-ONLY).

### 3.2 Политики рисков
- [ ] **RiskPolicy Engine** — правила блокировок и подтверждений.
- [ ] **Two-Person Rule** — обязательное второе подтверждение для критических действий.

### 3.3 Конфиденциальность
- [ ] **SensitiveDataFilter** — маскировка PII (ИНН, р/с, данные лиц) на выходе из LLM.
- [ ] **Red-Team Suite** — тесты на инъекции и попытки обхода мультитенантности.

---

## 🏁 С чего начинаем (План на ближайший спринт)
1. **IntentRouter** — классификация "что хочет консультант".
2. **AgroToolsRegistry** — выделение агро-инструментов из общей кучи.
3. **TraceId** в аудите — чтобы видеть весь путь решения.
4. **AgronomAgent (Stub)** — первая версия триажа без сложной логики.
