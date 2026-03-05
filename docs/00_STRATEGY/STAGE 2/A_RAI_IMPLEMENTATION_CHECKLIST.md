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
- [x] **ExplainabilityPanel Service** — сервис для отображения "почему Рэй так решил" (Приоритет №1 в Фазе 4). | **AG-ARAI-F4-001** | DONE

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

### 4.1 Телеметрия и Сбор Данных (TraceSummary)
- [x] **TraceSummary Data Contract** — расширение базового `traceId` полями: токены, время, версии промпта/модели/инструментов. | **AG-ARAI-F4-002** | DONE
- [x] **Evidence Tagging** — привязка каждого утверждения агента (claim) к источнику (DB row, tool result). | **AG-ARAI-F4-003** | DONE

### 4.2 Алгоритмы Качества и Честности (Truthfulness Engine)
- [x] **Claim Taxonomy & Weights v1** — типы утверждений (general/agro/finance/legal/safety) и веса (1/2/3), плюс критерии Verified/Unverified/Invalid. | **AG-ARAI-F4-004** | DONE
- [x] **Метрика "BS%" (Bullshit Percent)** — расчёт процента неподтверждённых (Unverified) или противоречивых (Invalid) утверждений по `traceId` с учётом весов (агрономия/риски весят больше). | **AG-ARAI-F4-004** | DONE
- [x] **Drift / Regression Alerts** — автоматические алерты при деградации BS% или Acceptance Rate после обновлений. | **AG-ARAI-F4-006** | DONE

### 4.3 Swarm Dashboard & Control UI (Визуализация)
- [ ] **SLO / Error Budget** — мониторинг latency, error rate по агентам и клиентам (`companyId`). | **AG-ARAI-F4-012** | IN_PROGRESS
- [ ] **Cost Decomposition & Workload Hotspots** — отслеживание расхода бюджета (LLM vs DB) и самых "дорогих/долгих" сессий.
- [x] **Quality & Evals Panel** — визуализация Acceptance Rate, Correction Rate, BS% и Evidence Coverage. | **AG-ARAI-F4-005** | DONE
- [x] **Explainability Explorer (Forensics)** — Decision Timeline разбора инцидентов (Router → fan-out → tools → composer + evidence refs). | **AG-ARAI-F4-010** | DONE
- [ ] **Agent Connection Map** — топология падений (Retry/Failure topology) и подсветка критического пути по `traceId`.
- [ ] **Queues & Backpressure Panel** — очереди, ретраи, timeouts, cancellations, deadline misses. | **AG-ARAI-F4-012** | IN_PROGRESS
- [ ] **Critical Path Analyzer** — вычисление и визуализация, где реально ушло время внутри trace (router/агенты/tools/compose).
- [ ] **Safe Replay Trace** — повтор прогона по traceId в READ-ONLY/mocked tools режиме, без сайд-эффектов.

### 4.4 Управление Автономностью и Рейтинги
- [x] **Политики автономности по BS%** — автоматический переход в режимы "tool-first" или "quarantine" при превышении порогов (<5% = автономность, >30% = карантин). | **AG-ARAI-F4-007** | DONE
- [x] **Agent Points** — начисление баллов агенту за accept и штрафов за BS% / invalid claims. | **AG-ARAI-F4-008** | DONE
- [x] **Reputation Levels (L1-L4)** — автоматический перевод агентов по уровням автономности (Stable, Trusted, Autonomous) на базе окна `N` дней. | **AG-ARAI-F4-008** | DONE
- [x] **Feedback Credibility Score** — вес пользовательского фидбэка в рейтингах зависит от корреляции с фактическими outcome'ами. | **AG-ARAI-F4-009** | DONE

### 4.5 Security & Incident Ops
- [ ] **Governance Counters** — счетчики Tenant Isolation Sentinel (кросс-тенант попытки) и SensitiveDataFilter. | **AG-ARAI-F4-011** | IN_PROGRESS
- [ ] **Incidents Feed & Auto-Runbooks** — лента инцидентов с привязкой к `traceId` и автоматические скрипты реагирования (напр. fallback или quarantine). | **AG-ARAI-F4-011** | IN_PROGRESS

### 4.6 Agent Registry & Management UI (Frontend)
- [ ] **Agent Configurator** — интерфейс для создания, настройки и включения/выключения агентов (задание System Prompt, моделей, лимитов).
- [ ] **Capabilities Mapping** — динамическое подключение доступных `ToolsRegistry` к агентам через UI.
- [ ] **Tenant Agent Access** — управление доступом конкретных клиентов (tenant) к специфическим/новым агентам.

---

## 🏁 С чего начинаем (План на ближайший спринт — Phase 4)
1. **ExplainabilityPanel Service** — поднять сервис и API для Forensics/Explorer (Decision Timeline + provenance).
   **Эффект:** любой инцидент разбирается по `traceId` в UI, а не через логи.

2. **TraceSummary Data Contract v1** — зафиксировать поля: tokens/time, prompt/model/tool versions, policyId, plus quality поля (evidenceCoverage, invalid%, BS% placeholder).
   **Эффект:** появляется единый источник правды для дашбордов и политик.

3. **Evidence Tagging (MVP)** — привязка claim → evidenceRef (tool result / DB row / doc chunk).
   **Эффект:** начинается измерение честности (BS%) на реальной опоре.

4. **BS% Calculator v1 + Claim Taxonomy/Weights** — Verified/Unverified/Invalid + веса (1/2/3), расчёт BS% по `traceId`.
   **Эффект:** честность становится числом, управляет автономностью.

5. **Truthfulness/Quality Panel** — BS% avg/p95, EvidenceCoverage, Invalid%, top worst traces (deep-link в Explorer).
   **Эффект:** виден “радар честности” по агентам и тенантам.

6. **SLO + Queues/Backpressure** — error budget + очереди/ретраи/timeouts/cancel.
   **Эффект:** контроль продовой надёжности и узких мест, MTTR снижается.