# RAI Farm Operating System — Архитектурный манифест

> **Версия:** 1.0 | **Дата:** 2026-03-04  
> **Статус:** System Manifesto — Top-Level Architecture Document  
> **Кодовое имя:** **A_RAI** (Agent RAI) | в разговоре: _Рэй, Рая, А-РАЙ_

---

## Что такое RAI Farm OS

**RAI Farm OS** — это операционная система агропредприятия.

Не программа. Не модуль. Не чат-бот.

**Операционная система** — как macOS для компьютера или Android для телефона. Только для фермы.

Она управляет:
- **данными** (поля, почва, погода, спутники, склад, техника)
- **знаниями** (агрономические правила, нормативы, история урожаев)
- **решениями** (рекомендации, черновики, алерты)
- **исполнением** (техкарты, задачи, бюджеты, контроль)
- **обучением** (система становится умнее с каждым сезоном)

В центре всего — **A_RAI**.

---

## A_RAI — центральный интеллект

**A_RAI** (читается: _Эй-Рай_, _Рэй_, в разговоре — _Рая_) — это главный мозг Farm OS.

Аналогия: **Джарвис у Тони Старка**.

Джарвис не является просто голосовым помощником. Он:
- знает состояние всего Старк-тауэра в реальном времени
- управляет системами брони, безопасности, лабораторий
- инициирует действия при угрозах
- объясняет свои решения
- учится на поведении Старка
- **никогда не принимает финальное решение за хозяина**

Так же работает A_RAI:

```
A_RAI знает → всё о предприятии (поля, бюджеты, погода, риски)
A_RAI реагирует → на аномалии, события, запросы
A_RAI объясняет → почему такая рекомендация, какие данные использованы
A_RAI учится → из принятых и отклонённых решений каждый сезон
A_RAI ограничен → финальное решение всегда за агрономом / директором
```

---

## Архитектура Farm OS

```
╔══════════════════════════════════════════════════════════════════╗
║                        A _ R A I                                 ║
║                  Farm Operating System                           ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  INTELLIGENCE LAYER                                              ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │  SupervisorAgent (Декомпозирован)                       │    ║
║  │  IntentRouter | BudgetController | AgentRuntime         │    ║
║  │  MemoryCoordinator | ResponseComposer                   │    ║
║  └───────────────────────────┬─────────────────────────────┘    ║
║                              │                                   ║
║  ┌───────────────────────────┼───────────────────────────┐      ║
║  ▼           ▼              ▼             ▼              ▼       ║
║ A_RAI_      A_RAI_        A_RAI_        A_RAI_          A_RAI_  ║
║ Agronom     Economist     Controller    Knowledge       Verifier ║
║ (Агроном)   (Экономист)   (Дежурный)    (Энциклопед.)  (Анти-   ║
║                                                         галл.)  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  PERCEPTION LAYER (Нервная система / Agronomic Nervous System)  ║
║                                                                  ║
║  Satellite NDVI/NDRE  Weather Alerts  Field Observations        ║
║  Budget Deviations    Risk Signals    IoT / Telemetry           ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  DIGITAL TWIN LAYER (Цифровой двойник / Agronomic Digital Twin) ║
║                                                                  ║
║  Field Model  Season State  Crop Phenology  Economic Model      ║
║  Soil Profile  Weather Forecast  Risk Forecast                  ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  MEMORY / LEARNING LAYER (Эволюция / Evolution Engine)          ║
║                                                                  ║
║  Working Memory (Redis)  Episodic Memory (pgvector)             ║
║  Institutional Memory (Knowledge Graph)                         ║
║  AgentScoreCard  RewardPolicy  PromptVersioning  EvalRun        ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  EXECUTION LAYER (Детерминированное ядро)                       ║
║                                                                  ║
║  AgroDeterministicEngine  TechMapService  RiskEngine            ║
║  ConsultingOrchestrator  BudgetPlanService  FSM Controllers     ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  DATA LAYER                                                      ║
║                                                                  ║
║  PostgreSQL + pgvector  Redis  MinIO  Satellite APIs            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Пять измерений Farm OS

### 1. Восприятие (Agronomic Nervous System)

Платформа постоянно слушает:
- спутниковые данные (NDVI/NDRE)
- погодные сигналы
- полевые наблюдения скаутов
- отклонения бюджета и план-факта
- сигналы от техники

Это **нервная система** — сигналы → событийная шина → агенты реагируют.

→ *[Подробно: RAI_AGRONOMIC_NERVOUS_SYSTEM_ARCHITECTURE.md]*

### 2. Понимание (Agronomic Digital Twin)

На каждое поле, каждый сезон, каждую культуру — **цифровой двойник**.

Двойник содержит всё: геометрию поля, состояние почвы, фенологию культуры, историю операций, экономические показатели, прогноз урожайности.

A_RAI думает не о "поле №7", а о **полной цифровой модели поля №7** — со всей историей и прогнозом.

→ *[Подробно: RAI_AGRONOMIC_DIGITAL_TWIN_ARCHITECTURE.md]*

### 3. Интеллект (AI Swarm)

Пять специализированных агентов:

| Агент | Имя | Специализация |
|-------|-----|---------------|
| `A_RAI_Agronom` | Агроном | Техкарты, защита растений, севооборот, фенология |
| `A_RAI_Economist` | Экономист | ROI, бюджеты, what-if сценарии, маржинальность |
| `A_RAI_Controller` | Дежурный | Мониторинг, алерты, отклонения, план-факт |
| `A_RAI_Knowledge` | Энциклопедист | БЗ, нормативы, агрономические справочники |
| `A_RAI_Verifier` | Верификатор | Антигаллюцинационная проверка, evidence protocol |

Все управляются **SupervisorAgent** (декомпозирован на 5 компонентов).

→ *[Подробно: RAI_AI_SYSTEM_ARCHITECTURE.md, RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md]*

### 4. Надёжность (Anti-Hallucination)

A_RAI не врёт, потому что:
- **RAG**: каждый ответ основан на реальных данных из системы
- **Deterministic Core**: числа считает код, не LLM
- **Evidence Protocol**: каждая рекомендация содержит источники и confidence
- **Cross-Model Validation**: критические рекомендации проверяет вторая модель
- **Confidence Scoring**: ответы с низкой уверенностью → эскалация к человеку
- **Human-in-the-Loop**: финальное решение всегда за человеком

Целевой `hallucination_rate < 3%`.

→ *[Подробно: RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md]*

### 5. Эволюция (Evolution Engine)

A_RAI **становится лучше** с каждым сезоном:

```
Агент принял решение
      ↓
Агроном принял / отклонил / изменил
      ↓
Результат записывается (Memory + AgentScoreCard)
      ↓
Pattern Detection — что работает, что нет
      ↓
PromptOptimizer + ModelRouter — корректировка
      ↓
EvalRun против GoldenTestSet — проверка регрессии
      ↓
Canary rollout → Production
```

Система агентского репутации **L1 → L4**:
- `L1 Experimental` — новый агент, строгий human review
- `L2 Stable` — проверен, стандартный контроль
- `L3 Trusted` — высокое acceptance rate, расширенный budget
- `L4 Autonomous` — только для MonitoringAgent READ-ONLY режима

→ *[Подробно: RAI_AI_EVOLUTION_ARCHITECTURE.md]*

---

## Ключевые инварианты Farm OS

```
I-01 TENANT ISOLATION    Каждый запрос фильтруется по companyId. Нет исключений.
I-02 FSM INTEGRITY       Переходы состояний — только через FSM. AI не обходит FSM.
I-03 AUDIT TRAIL         Все AI-действия логируются. traceId сквозной от запроса до AuditLog.
I-04 HUMAN AUTHORITY     AI — советник. Финальное решение — человек. Всегда.
I-05 DETERMINISTIC CORE  Числа считает код. Формулы, а не LLM.
I-06 EVIDENCE REQUIRED   Рекомендация без источников не выдаётся пользователю.
I-07 EVOLUTIONARY SAFETY Изменения промтов — только через PromptChange RFC + EvalRun.
```

---

## Отличие от стандартных AI-чат-ботов

| Характеристика | Обычный AI-чатбот | A_RAI / Farm OS |
|---------------|-------------------|-----------------|
| **Источник знаний** | Обучающая выборка (hallucinations risk) | Реальные данные через RAG + tool calls |
| **Расчёты** | LLM генерирует числа | Детерминированный движок, LLM только предлагает параметры |
| **Решения** | Ответ в свободной форме | Структурированный JSON + evidence + confidence |
| **Память** | Нет (или только в рамках контекста) | 3-слойная: рабочая, эпизодическая, институциональная |
| **Обучение** | Нет (статическая модель) | Evolution Loop — агент улучшается из обратной связи |
| **Безопасность** | Базовые guardrails | RiskPolicy Engine, Two-Person Rule, AutonomousExecutionContext |
| **Репутация** | Нет | AgentScoreCard L1-L4, Reward/Penalty Engine |
| **Аудит** | Нет | Forensic-grade: trace → GenerationRecord → ExplainabilityPanel → AuditLog |

---

## Карта документов STAGE 2

*Каждый документ описывает одно измерение Farm OS:*

| Документ | Измерение | Описывает |
|----------|-----------|-----------|
| **RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md** ← *ты здесь* | **ВЕСЬ Farm OS** | Манифест, связывающий все измерения |
| [RAI_AI_SYSTEM_ARCHITECTURE.md](./RAI_AI_SYSTEM_ARCHITECTURE.md) | Интеллект (v2) | Декомпозиция Supervisor, 10 архитектурных решений, Roadmap |
| [RAI_AI_SYSTEM_RESEARCH.md](./RAI_AI_SYSTEM_RESEARCH.md) | Исследование (v2) | Анализ текущей кодовой базы, gap-анализ |
| [RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md](./RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md) | Интеллект (Runtime) | Правила оркестрации, Agent FSM, бюджеты, TechCouncil |
| [RAI_AI_EVOLUTION_ARCHITECTURE.md](./RAI_AI_EVOLUTION_ARCHITECTURE.md) | Эволюция | AgentScore, Reputation L1-L4, Reward Engine, PromptVersioning |
| [RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md](./RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md) | Надёжность | RAG, Evidence Protocol, CrossModel, Confidence Scoring |
| [RAI_AGRONOMIC_DIGITAL_TWIN_ARCHITECTURE.md](./RAI_AGRONOMIC_DIGITAL_TWIN_ARCHITECTURE.md) | Понимание | Цифровой двойник поля: геометрия, почва, климат, экономика |
| [RAI_AGRONOMIC_NERVOUS_SYSTEM_ARCHITECTURE.md](./RAI_AGRONOMIC_NERVOUS_SYSTEM_ARCHITECTURE.md) | Восприятие | Событийная система, signal → event → agent, Alert Levels S1-S4 |
| [AI_SWARM_ARCHITECTURE_ECONOMICS.md](./AI_SWARM_ARCHITECTURE_ECONOMICS.md) | Экономика | Стоимость, Model Tiering T0-T4, ROI |
| [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](./RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) | Реализация | Детальный план имплементации |
| [SPEC_AGENT_FIRST_RAI_EP.md](./SPEC_AGENT_FIRST_RAI_EP.md) | Спецификация | Agent-First подход для RAI_EP |

---

## Vision

К концу 2026 года A_RAI знает о каждом поле предприятия больше, чем любой отдельный специалист.

Не потому что он умнее — а потому что он **помнит всё** (институциональная память), **видит всё** (нервная система, спутники, IoT), **считает точно** (детерминированное ядро) и **учится** (evolution loop).

Агроном при этом **не теряет контроль** — он получает суперспособности.

> *A_RAI is not replacing the agronomist. A_RAI is making the agronomist Iron Man.*
