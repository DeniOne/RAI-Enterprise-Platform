# A_RAI — Чек-лист имплементации (Phase 2-4)

> **Статус:** `ACTIVE` | **Дата:** 2026-03-04
> Этот документ является рабочим чек-листом для реализации архитектуры A_RAI v2.0.


---

## 🏗️ ФАЗА 1: ФУНДАМЕНТ (Скелет системы)

**Цель:** Разделить монолит SupervisorAgent и создать доменные реестры.

### 1.1 Декомпозиция Supervisor
- [x] **IntentRouter** (`intent-router.service.ts`) — классификация запросов (regex, LLM-ready). | **AG-ARAI-F1-001** | DONE
- [x] **MemoryCoordinator** (`memory-coordinator.service.ts`) — работа с Episodic Memory + Tenant Isolation. | **AG-ARAI-F1-004** | DONE
- [x] **AgentRuntime** (`agent-runtime.service.ts`) — жизненный цикл агента, дедлайны (30с). | **AG-ARAI-F1-004** | DONE
- [x] **ResponseComposer** (`response-composer.service.ts`) — сборка ответа и виджетов. | **AG-ARAI-F1-004** | DONE

### 1.2 Доменные реестры (Capability-based)
- [x] **AgroToolsRegistry** — инструменты агрономии и техкарт. | **AG-ARAI-F1-001** | DONE
- [x] **FinanceToolsRegistry** — экономика и ROI (только READ). | **AG-ARAI-F1-002** | DONE
- [x] **RiskToolsRegistry** — алерты и спутники. | **AG-ARAI-F1-002** | DONE
- [x] **KnowledgeToolsRegistry** — база знаний и RAG. | **AG-ARAI-F1-002** | DONE

### 1.3 Детерминированный мост
- [x] **AgroDeterministicEngineFacade** — обёртка над кодом расчётов с выводом формул и объяснений (`ExplainableResult`). | **AG-ARAI-F1-003** | DONE

### 1.4 Трассировка и аудит
- [x] **TraceId Binding** — проброс ID сквозь все вызовы AI в `AuditLog`. | **AG-ARAI-F1-001** | DONE
- [ ] **ExplainabilityPanel Service** — сервис для отображения "почему Рэй так решил".

---

## 🤖 ФАЗА 2: АГЕНТЫ (Интеллект)

**Цель:** Полноценные субагенты и параллельное выполнение задач.

### 2.1 Runtime Evolution
- [x] **Parallel Fan-out** — одновременный запуск нескольких агентов (напр. Agronom + Economist). | **AG-ARAI-F2-001** | DONE
- [x] **ToolCall Planner** — оптимизация количества вызовов LLM. | **AG-ARAI-F2-001** | DONE

### 2.2 Специализированные агенты
- [x] **AgronomAgent** — ТРИАЖ (stub без LLM) + Ответ с explain. | **AG-ARAI-F1-002** | DONE
- [x] **EconomistAgent** — Расчёт Δ, маржинальности и вознаграждения RAI. | **AG-ARAI-F2-001**, **AG-ARAI-F2-002** | DONE
- [x] **KnowledgeAgent** — Поиск по институциональной памяти и RegionProfile. | **AG-ARAI-F2-002** | DONE

### 2.3 Качество и оценка (Eval)
- [x] **AgentScoreCard** — метрики (acceptance/correction rate) в БД. | **AG-ARAI-F2-003** | DONE
- [x] **GoldenTestSet** — набор эталонных тестов для проверки регрессий. | **AG-ARAI-F2-003** | DONE
- [x] **PromptChange RFC** — процесс изменения промтов через обязательный EvalRun. | **AG-ARAI-F2-003** | DONE

---

## 🛡️ ФАЗА 3: БЕЗОПАСНОСТЬ (Надёжность)

**Цель:** Автономный мониторинг и защита данных.

### 3.1 Мониторинг и автономность
- [x] **MonitoringAgent** — event-driven наблюдатель (подписка на Outbox). | **AG-ARAI-F3-001** | DONE
- [x] **AutonomousExecutionContext** — изоляция для монитора (технический READ-ONLY). | **AG-ARAI-F3-001** | DONE

### 3.2 Политики рисков
- [x] **RiskPolicy Engine** — правила блокировок и подтверждений. | **AG-ARAI-F3-002** | DONE
- [x] **Two-Person Rule** — обязательное второе подтверждение для критических действий. | **AG-ARAI-F3-002** | DONE

### 3.3 Конфиденциальность
- [x] **SensitiveDataFilter** — маскировка PII (ИНН, р/с, данные лиц) на выходе из LLM. | **AG-ARAI-F3-003** | DONE
- [x] **Red-Team Suite** — тесты на инъекции и попытки обхода мультитенантности. | **AG-ARAI-F3-003** | DONE

---

## 👁️ ФАЗА 4: OBSERVABILITY & CONTROL TOWER (Качество, BS%, Рейтинги)

**Цель:** Контроль инфраструктуры роя агентов, измерение честности ответов (BS%), управление автономностью (L1-L4) и обработка инцидентов.

### 4.1 Swarm Dashboard & Control UI
- [ ] **SLO / Error Budget** — мониторинг latency, error rate по агентам и клиентам (`companyId`).
- [ ] **Queues / Backpressure** — мониторинг таймаутов, дедлайнов и ретраев.
- [ ] **Cost Decomposition & Workload Hotspots** — отслеживание расхода бюджета (LLM vs DB) и самых "дорогих/долгих" сессий.

### 4.2 Связь, Взаимодействие и Explainability
- [ ] **Agent Connection Map** — топология падений (Retry/Failure topology) и подсветка критического пути по `traceId`.
- [ ] **Explainability Explorer (Forensics)** — Decision Timeline разбора инцидентов (Router → fan-out → tools → composer + evidence refs). 

### 4.3 Качество и Честность (Truthfulness)
- [ ] **Метрика "BS%" (Bullshit Percent)** — расчёт процента неподтверждённых (Unverified) или противоречивых (Invalid) утверждений по `traceId` с учётом весов (агрономия/риски весят больше).
- [ ] **Quality & Evals Panel** — визуализация Acceptance Rate, Correction Rate, BS% и Evidence Coverage.
- [ ] **Drift / Regression Alerts** — автоматические алерты при деградации BS% или Acceptance Rate после обновлений (prompt/model version).
- [ ] **Политики автономности по BS%** — автоматический переход в режимы "tool-first" или "quarantine" при превышении порогов (<5% = автономность, >30% = карантин).

### 4.4 Рейтинги, Баллы и Награды (Rewards)
- [ ] **Agent Points** — начисление баллов агенту за accept и штрафов за BS% / invalid claims.
- [ ] **Reputation Levels (L1-L4)** — автоматический перевод агентов по уровням автономности (Stable, Trusted, Autonomous) на базе окна `N` дней.
- [ ] **Feedback Credibility Score** — вес пользовательского фидбэка в рейтингах зависит от корреляции с фактическими outcome'ами.

### 4.5 Security & Incident Ops
- [ ] **Governance Counters** — счетчики Tenant Isolation Sentinel (кросс-тенант попытки) и SensitiveDataFilter.
- [ ] **Incidents Feed & Auto-Runbooks** — лента инцидентов с привязкой к `traceId` и автоматические скрипты реагирования (напр. fallback или quarantine).

---

## 🏁 С чего начинаем (План на ближайший спринт)
1. **IntentRouter** — классификация "что хочет консультант".
2. **AgroToolsRegistry** — выделение агро-инструментов из общей кучи.
3. **TraceId** в аудите — чтобы видеть весь путь решения.
4. **AgronomAgent (Stub)** — первая версия триажа без сложной логики.
