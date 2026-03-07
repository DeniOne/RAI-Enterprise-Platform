# RAI Agent Platform & AI — Master Plan

> Версия: 1.0  
> Дата: 2026-03-07  
> Статус: Active Canon  
> Назначение: единый стратегический и исполнимый документ Stage 2 по Agent Platform & AI, основанный на реальном коде, truth-sync и принятых результатах `S13-S23`.

---

## 1. Что это за документ и зачем он заменяет Stage 2

Этот документ становится **главным активным каноном Stage 2**.

Его задача:
- заменить россыпь параллельных архитектурных описаний, исследований и чеклистов как основной source of truth;
- не уничтожить историю, а перевести старые документы в режим `archive / reference / canon input`;
- зафиксировать, что уже реально работает в коде;
- зафиксировать, какой именно продукт строится дальше;
- дать один сквозной roadmap до логической функциональности Agent Platform & AI.

Жёсткое правило этого документа:
- truth определяется не старой формулировкой из markdown, а связкой:
  - реальный код,
  - принятые review-паки,
  - `truth-sync`,
  - runtime/smoke evidence.

Stage 2 больше нельзя читать как набор равноправных “главных” документов.  
После появления этого master-файла старые документы используются:
- как исторический контекст;
- как архитектурный input;
- как reference на отдельные идеи;
- но не как автоматическая истина о текущем состоянии платформы.

---

## 2. Контекст бизнеса RAI

Источник верхнего уровня: [RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md).

Дополнительные данные:
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)

Ключевой контекст:
- RAI_EP — это **не система управления фермой**.
- RAI_EP — это **операционная система результатного агроконсалтингового бизнеса**.
- A_RAI нужен не ради “ещё одного AI-чата”, а ради **масштабирования экспертной консалтинговой команды**.

Отсюда следуют 3 главных последствия:

1. AI-агенты должны поддерживать реальные операционные и экспертные процессы бизнеса.
2. AI-агенты должны быть встроены в governed runtime, а не жить как свободные LLM-боты.
3. Цель Stage 2 — не “красиво описать swarm”, а довести Agent Platform & AI до состояния, где:
   - MVP-агенты реально работают на AI;
   - новые фокусные агенты потом добавляются быстро и без тяжёлой ручной переделки платформы.

---

## 3. Текущее состояние по реальному коду

Ниже не маркетинговая картина, а текущая truth baseline по коду и принятым шагам.

### 3.1 Что реально подтверждено

| Контур | Реальное состояние |
|---|---|
| Agent OS shell | Подтверждён: чат живёт в оболочке, не размонтируется при навигации. |
| WorkspaceContext | Подтверждён: есть канонический structured context, а не только route. |
| Chat API | Подтверждён: `POST /api/rai/chat` работает как канонический backend endpoint. |
| MemoryAdapter | Подтверждён: memory layer введён и реально подключён через adapter. |
| Supervisor decomposition | Подтверждён: `IntentRouter`, `MemoryCoordinator`, `AgentRuntime`, `ResponseComposer` реально существуют и wired. |
| Runtime spine | Подтверждён: есть integration proof на канонический runtime path `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`. |
| Tool registries | Подтверждены: domain-gated registry path существует и enforced. |
| Budget control | Подтверждён: `ALLOW / DEGRADE / DENY` встроены в runtime до fan-out. |
| Incidents / runbooks | Подтверждены: lifecycle, autonomy/policy incidents, runbook path и feed/counters живые. |
| Prompt governance | Подтверждён: `change request -> eval -> canary -> promote/rollback` существует как governed process. |
| Eval / evidence / BS% | Подтверждены: `EvalRun`, evidence tagging, trace truthfulness, BS%, correction/acceptance/coverage живые. |
| Control Tower honesty | Подтверждён: synthetic fallback в ключевых quality/observability путях снят. |
| Queue / backpressure visibility | Подтверждена: live source и multi-instance-safe aggregation есть. |
| Live API smoke | Подтверждён: ключевой Stage 2 API slice проходит через поднятое приложение и реальный feature-module graph. |

### 3.2 Что закрыто по Stage 2 build-out

После серии `S13-S23` инфраструктурный и governance-контур Agent OS в основном доведён:
- registry как runtime authority;
- prompt governance;
- incidents/runbooks;
- eval/evidence/BS%;
- control tower / governance feed;
- budget runtime;
- queue/backpressure observability;
- live API smoke;
- runtime spine integration.

Итог: **Stage 2 build-out платформы в основном завершён**.

### 3.3 Что ещё не является целевым продуктовым состоянием

Несмотря на закрытый infrastructure/governance контур, Stage 2 ещё не равен целевой Agent Platform & AI.

Незакрытые продуктовые разрывы:

1. `AgentRuntime` по факту всё ещё в значительной степени **tool-first**.
   - runtime группирует tool calls;
   - реальные agent classes существуют, но не являются полноценным AI operating layer.

2. `llmModel` и `systemPrompt` уже живут в registry/config, но:
   - это пока в основном governance/config truth;
   - а не полностью доведённый runtime AI path.

3. `AgronomAgent`, `EconomistAgent`, `KnowledgeAgent`, `MonitoringAgent` существуют как важные элементы системы, но пока не являются завершёнными reference implementations полнофункциональной AI-agent платформы.

4. Stage 2 readiness ≠ full product agent functionality.
   - Инфраструктура и governed execution уже есть.
   - Но “агенты как реальные работающие AI-модули бэкофиса” ещё нужно довести.

### 3.4 Сухой вывод по текущему этапу

Сейчас RAI_EP находится не в фазе “строим ли вообще мультиагентность”, а в фазе:

**`platform mostly done -> functional agentization next`**

То есть:
- build-out платформы почти done;
- следующий этап — **functional agentization + AI wiring + scalable agent platform**.

---

## 4. Карта старых документов и их статус

Этот раздел нужен, чтобы Stage 2 больше не читался как 15 параллельных “главных” документов.

### 4.1 Статусы

- `ACTIVE CANON` — текущий главный документ.
- `CANON INPUT` — важный входной документ, который остаётся значимым, но больше не является главным.
- `REFERENCE ONLY` — полезный справочный документ.
- `STALE` — исторически полезен, но не соответствует текущему коду как truth source.
- `ARCHIVE` — сохранить как историю/след мысли, но не использовать как активный план.

### 4.2 Инвентарь Stage 2

| Документ | Статус | Роль после master-plan |
|---|---|---|
| `RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md` | `ACTIVE CANON` | Главный активный документ Stage 2. |
| `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` | `CANON INPUT` | Главный бизнесовый и системный манифест верхнего уровня. |
| `RAI_AI_SYSTEM_ARCHITECTURE.md` | `CANON INPUT` | Базовый архитектурный input по swarm/runtime/governance принципам. |
| `RAI_AI_SWARM_RUNTIME_ARCHITECTURE.md` | `REFERENCE ONLY` | Историческая runtime-спека; использовать как reference, не как главный plan. |
| `RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md` | `CANON INPUT` | Важный input по evidence/validation/human review принципам. |
| `RAI_AI_EVOLUTION_ARCHITECTURE.md` | `REFERENCE ONLY` | Reference по score/reputation/evolution ideas. |
| `RAI_AI_SYSTEM_RESEARCH.md` | `REFERENCE ONLY` | Исследовательская база и кодовый инвентарь. |
| `A_RAI_IMPLEMENTATION_CHECKLIST.md` | `STALE` | Полезен как история закрытых фаз, но не как текущий основной roadmap. |
| `A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` | `CANON INPUT` | Верхний readiness gate; использовать как контрольный финальный фильтр, не как master-plan. |
| `TRUTH_SYNC_STAGE_2_CLAIMS.md` | `CANON INPUT` | Текущая truth baseline по claims. |
| `TRUTH_SYNC_RECOVERY_CHECKLIST.md` | `REFERENCE ONLY` | Исторический recovery-checklist для серии R1-R12 и dual-role шагов. |
| `PROJECT_REALITY_MAP.md` | `STALE` | Исторически полезен, но часть выводов уже устарела после truth-sync и S13-S23. |
| `RAI_AGENT_OS_IMPLEMENTATION_PLAN.md` | `STALE` | Важная база для Agent OS shell, но не покрывает текущую целевую Agent Platform phase. |
| `SPEC_AGENT_FIRST_RAI_EP.md` | `REFERENCE ONLY` | Источник product-law и interaction-law. |
| `RAI_EP — Agent-First Sprint 1 Spec (v1).md` | `ARCHIVE` | Исторический sprint law. |
| `AI_SWARM_ARCHITECTURE_ECONOMICS.md` | `ARCHIVE` | История исследования economics/model landscape. |
| `A_RAI_AGENT_REGISTRY_PROMPT.md` | `ARCHIVE` | Исторический prompt по registry/UI. |
| `PROMPT_CHANGE_RFC.md` | `REFERENCE ONLY` | Нормативный reference по prompt-change process. |
| `PROJECT_EXECUTION_CHECKLIST.md` | `REFERENCE ONLY` | Исторический execution tracker. |
| `ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md` | `ARCHIVE` | Оркестрационный process-doc. |
| `CURSOR SOFTWARE FACTORY — STARTER PROMPT.md` | `ARCHIVE` | Process/role-separation doc. |

### 4.3 Решение о замене Stage 2

С этого момента действует правило:

- **этот master-document заменяет Stage 2 как главный active canon;**
- остальные файлы больше не считаются равноправными источниками истины;
- старые документы сохраняются как:
  - `canon input`
  - `reference`
  - `archive`
  - `stale history`

---

## 5. Целевая модель: Agent Platform & AI

Строится не “система из 4 агентов навсегда”, а **Agent Platform Kernel**, на который:
- сажаются 4 MVP reference agents;
- затем быстро добавляются новые domain / worker / personal agents.

### 5.1 Главная цель

Конечное целевое состояние:

1. MVP-4 реально работают на AI и дают полезный governed output.
2. Новый агент добавляется с оптимальной лёгкостью:
   - без переписывания runtime;
   - без размазывания permissions вручную по системе;
   - без тяжёлой кастомной backend-сборки на каждый случай.

### 5.2 Что такое Agent Platform Kernel

Это минимальный, но канонический набор first-class сущностей и политик:

- `AgentDefinition`
- `AgentRuntimeProfile`
- `AgentAutonomyMode`
- `AgentMemoryPolicy`
- `AgentCapabilityPolicy`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `AgentOutputContract`
- `AgentGovernancePolicy`

### 5.3 Зачем нужен kernel

Без kernel новые агенты будут добавляться как:
- ad hoc backend service;
- отдельная ручная логика;
- кастомные исключения на память/доступ/модели;
- постепенный распад архитектуры.

С kernel новый агент становится:
- определением,
- конфигурацией,
- политикой доступа,
- wiring на стандартный runtime contract.

---

## 6. Типы агентов и режимы автономности

### 6.1 Канонические классы агентов

#### Domain Advisor
Примеры:
- агроном
- экономист
- юрист
- стратег
- финансист

Роль:
- анализ
- draft
- review
- recommendation
- explainability

#### Worker / Hybrid Agent
Примеры:
- маркетолог
- CRM-агент
- контролёр
- часть ops/finance agents

Роль:
- мониторинг
- task execution
- workflow assistance
- review / alerts / controlled actions

#### Personal / Delegated Agent
Примеры:
- личный ассистент сотрудника

Роль:
- персональный контекст
- ограниченный memory scope
- исполнение в границах конкретных user permissions

### 6.2 Канонические режимы автономности

- `advisory`
- `hybrid`
- `autonomous`

Жёсткое правило:
- default для нового агента = `advisory`;
- повышение до `hybrid` или `autonomous` требует отдельного governed elevation;
- критичные домены не могут сразу стартовать как autonomous by default.

### 6.3 Каноническая memory policy model

Память не может быть общей “для всех”.

Минимальные memory scopes:
- `tenant`
- `domain`
- `user`
- `team`
- `task/workflow`
- `sensitive/compliance`

Каждый новый агент должен получать не “доступ к памяти вообще”, а:
- разрешённые scopes;
- правила retrieval;
- правила append/update;
- ограничения по чувствительным данным.

---

## 7. MVP-4 как reference agents

Эти 4 агента не являются “конечным списком агентов платформы”.

Они являются:
- первой обязательной functional batch;
- эталонными реализациями Agent Platform Kernel;
- шаблоном для следующих агентов.

### 7.1 AgronomAgent

Целевая роль:
- expert agronomic draft / review / recommendation agent;
- AI + deterministic validation;
- governed генерация и объяснение agronomic outputs.

### 7.2 EconomistAgent

Целевая роль:
- economics / plan-fact / scenario / risk interpretation;
- AI + deterministic finance tools;
- governed business explanation, not uncontrolled finance bot.

### 7.3 KnowledgeAgent

Целевая роль:
- RAG + institutional knowledge synthesis;
- retrieval-aware answer generation;
- evidence-grounded response.

### 7.4 MonitoringAgent

Целевая роль:
- safe monitoring / alerts / review / escalation support;
- read-only или governed-only autonomy;
- наблюдение, summarization, triage, но не свободная мутация системного состояния.

### 7.5 Жёсткая формулировка по MVP-4

MVP-4 = **reference implementations of the platform**.

Их задача:
- закрыть first real AI functionality;
- зацементировать runtime contract;
- стать шаблоном для следующих агентов.

---

## 8. Портфель будущих агентов

Этот раздел фиксирует не фантазию “что угодно AI сможет”, а ближайший реальный target portfolio.

### 8.1 Маркетолог
- Purpose: мониторинг конкурентов, клиентинг, продуктовый маркетинг, market review, alerting.
- Likely mode: `hybrid`.
- Memory scopes: `tenant`, `domain(marketing)`, `team`, `task/workflow`.
- Likely connectors: CRM, tasks, внешние marketing sources, почта/коммуникации.
- Sensitivity: средняя, но с риском утечек коммерческого контекста.

### 8.2 Стратег
- Purpose: анализ совокупной информации, стратегические сессии, сценарное планирование.
- Likely mode: `advisory`.
- Memory scopes: `tenant`, `domain(strategy)`, `team`, `sensitive/compliance`.
- Likely connectors: финансы, CRM, производственные показатели, knowledge layer.
- Sensitivity: высокая из-за влияния на стратегические решения.

### 8.3 Финансист
- Purpose: ликвидность, volatility, инвестиционные рекомендации, сценарии финансового управления.
- Likely mode: `advisory` -> возможно `hybrid` для безопасных routine workflows.
- Memory scopes: `tenant`, `domain(finance)`, `task/workflow`, `sensitive/compliance`.
- Likely connectors: ledger, budget, economy, scenario tools, risk data.
- Sensitivity: очень высокая.

### 8.4 Юрист
- Purpose: валидация документов, контрагенты, legal checks, подготовка draft legal docs, внешние legal базы.
- Likely mode: `advisory`.
- Memory scopes: `tenant`, `domain(legal)`, `sensitive/compliance`, `task/workflow`.
- Likely connectors: contract/docflow, counterparty verification, external legal registries.
- Sensitivity: очень высокая.

### 8.5 CRM Agent
- Purpose: pipeline, follow-ups, сегментация клиентов, task automation, deal support.
- Likely mode: `hybrid`.
- Memory scopes: `tenant`, `domain(crm)`, `team`, `user`, `task/workflow`.
- Likely connectors: CRM, tasks, communications, reminders.
- Sensitivity: средняя.

### 8.6 Controller
- Purpose: execution monitoring, deviations, operational control, escalation support.
- Likely mode: `hybrid`.
- Memory scopes: `tenant`, `domain(operations)`, `task/workflow`.
- Likely connectors: events, tasks, plan/fact, deviations, alerts.
- Sensitivity: средняя, но runtime-sensitive.

### 8.7 Personal Assistant
- Purpose: персональный рабочий ассистент сотрудника с ограниченными допусками.
- Likely mode: `hybrid`.
- Memory scopes: `user`, `team`, `task/workflow`, ограниченный `tenant`.
- Likely connectors: personal tasks, calendar, communication, role-limited business context.
- Sensitivity: высокая из-за персональных и ролевых границ доступа.

---

## 9. Каноническая runtime-архитектура дальше

### 9.1 Что сохраняется

Сохраняются базовые законы Stage 2:
- single orchestrator;
- governed runtime;
- tool-gated access;
- deterministic validation;
- human-in-the-loop для критичного;
- audit / trace / evidence / governance.

### 9.2 Что должно измениться

Целевой runtime не должен остаться pure tool-first.

Нужен режим:

**`hybrid agent-first governed runtime`**

Это означает:
- runtime остаётся platform-level;
- но сами агенты становятся real execution units;
- tools, memory и connectors остаются governed sublayers внутри agent execution.

### 9.3 Канонический flow

`Supervisor -> Runtime -> Agent -> Tools/Memory/Connectors -> Evidence/Validation -> Response -> Audit`

### 9.4 Что нельзя делать

Нельзя скатиться ни в один из двух перекосов:

1. `pure tool-first forever`
   - тогда агенты остаются “красивой оболочкой вокруг tool calls”;
   - это не Agent Platform.

2. `freeform LLM swarm`
   - тогда ломаются Stage 2 каноны:
     - deterministic core
     - governance
     - tool-gating
     - auditability

---

## 10. AI strategy через OpenRouter

### 10.1 Provider baseline

Правильный baseline:
- не `OpenAI-first`;
- **OpenRouter-first**.

Следствия:
- модель агента задаётся строкой OpenRouter-compatible формата;
- provider wiring строится как generic gateway;
- runtime не должен зависеть от одного vendor-specific SDK.

### 10.2 Policy по моделям

Нельзя фиксироваться на одной “самой умной” модели в коде.

Нужна policy-модель:
- `cheap`
- `fast`
- `strong`

Routing идёт по:
- agent profile
- task type
- cost/risk envelope

### 10.3 Роль AI в системе

Каноническая роль AI:
- AI explains
- AI drafts
- AI reasons within governed boundary
- deterministic system validates
- critical actions require human/governed gate

AI не должен подменять:
- deterministic calculations
- factual source of truth
- policy/governance enforcement

---

## 11. Что значит “логическая функциональность”

Этот этап считается доведённым не тогда, когда “красиво описан swarm”, а когда выполнены оба условия.

### Goal A — MVP-4 реально работают на AI

MVP-агенты должны:
- выдавать полезный ответ;
- опираться на evidence/tool/memory path;
- работать в governed runtime;
- быть traceable;
- иметь predictable fallback;
- не ломать deterministic and human-gated laws.

### Goal B — новый агент добавляется с оптимальной лёгкостью

Это не означает:
- no-code magic;
- одна кнопка “создать агента”.

Это означает:
- новый агент не требует переписывать runtime;
- permissions не размазываются вручную по всей системе;
- новый агент собирается из:
  - manifest / definition,
  - bindings,
  - prompt/model profile,
  - memory policy,
  - малого adapter слоя, если нужен новый домен.

---

## 12. Consolidated Roadmap / Checklist

Это главный Stage 2+ roadmap по доведению Agent Platform & AI.

### Phase A — Truth Baseline Locked
- [x] Зафиксировать, что Stage 2 truth baseline уже пройдена.
- [x] Зафиксировать, что governance/runtime/observability контур в основном доведён.
- [x] Перевести старые Stage 2 документы из режима “все главные сразу” в `canon input / reference / archive`.

### Phase B — Agent Platform Kernel
- [ ] Ввести каноническую `AgentDefinition`.
- [ ] Ввести `AgentRuntimeProfile`.
- [ ] Ввести `AgentAutonomyMode`.
- [ ] Ввести `AgentMemoryPolicy`.
- [ ] Ввести `AgentCapabilityPolicy`.
- [ ] Ввести `AgentConnectorBinding`.
- [ ] Ввести канонический `AgentOutputContract`.
- [ ] Зафиксировать audit contract для agent execution.
- [ ] Зафиксировать memory scope matrix.
- [ ] Ввести generic LLM gateway через OpenRouter.

### Phase C — MVP-4 Functional AI
- [ ] Довести `AgronomAgent` до реального AI-backed expert agent.
- [ ] Довести `EconomistAgent` до реального AI-backed economics agent.
- [ ] Довести `KnowledgeAgent` до реального RAG synthesis agent.
- [ ] Довести `MonitoringAgent` до governed AI-backed monitoring agent.
- [ ] Перевести runtime к каноническому `hybrid agent-first` режиму.
- [ ] Зафиксировать backend-first contract, по которому можно проектировать бэкофис.

### Phase D — Expansion Layer
- [ ] Описать manifest-путь для новых агентов.
- [ ] Описать connector policy для новых доменов.
- [ ] Описать low-friction onboarding path для новых агентов.
- [ ] Подготовить platform contract для будущих:
  - marketer
  - strategist
  - finance advisor
  - legal advisor
  - CRM agent
  - controller
  - personal assistant

### Phase E — Scaffolder / Constructor
- [ ] Делать CLI/scaffolder только после стабилизации platform kernel.
- [ ] Зафиксировать template structure для новых агентов.
- [ ] Зафиксировать registration path.
- [ ] Зафиксировать standard skeleton tests.

---

## 13. Acceptance Gates

### Gate 1 — Infrastructure truth locked
- инфраструктурная Stage 2 baseline закрыта;
- truth baseline подтверждена кодом;
- old docs больше не конкурируют как параллельная истина.

### Gate 2 — MVP-4 are functionally AI-backed
- все 4 агента реально работают как governed AI agents;
- не только существуют как stub/config entries.

### Gate 3 — Agent Platform Kernel exists
- есть канонический platform contract;
- новые агенты больше не требуют тяжёлого ad hoc backend-дизайна с нуля.

### Gate 4 — Future agent onboarding path exists
- хотя бы один будущий агент может быть честно описан как low-friction onboarding case на существующий kernel.

### Gate 5 — Scaffolder becomes justified
- generator/CLI допустим только после того, как platform contract стабилен;
- иначе он будет штамповать архитектурный шум.

---

## 14. Что не входит в текущий этап

Жёсткие non-goals:
- full autonomous enterprise swarm by default;
- instant no-code agent creation;
- замена deterministic systems на LLM;
- первичный фокус на UI/front complexity вместо agent functionality;
- launch governance как главный следующий шаг до доведения функциональности агентов.

Отдельно:
- rollout governance / kill-switch / owners / P0 launch blockers остаются важны;
- но они не являются следующим главным продуктовым шагом;
- следующий главный шаг — **functional Agent Platform & AI**.

---

## 15. Архив и legacy references

Старые документы сохраняются не потому, что они все одинаково актуальны, а потому что они:
- содержат архитектурный контекст;
- фиксируют эволюцию мысли;
- помогают объяснить, откуда выросло текущее решение.

Но активная работа Stage 2 и следующего этапа должна идти уже от этого master-document.

Правило чтения папки Stage 2 теперь такое:

1. Сначала читать этот master-plan.
2. Затем читать `RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md` как верхний бизнесовый и системный контекст.
3. Затем при необходимости точечно читать legacy/reference документы.
4. Нельзя больше собирать “истину Stage 2” вручную из 10 разных markdown-файлов без приоритета.

---

## 16. Итоговая позиция

Коротко:

- Stage 2 platform build-out в основном завершён.
- Governance, observability, registry, runtime discipline и truth infrastructure уже в рабочем состоянии.
- Но текущая система ещё не является завершённой **Agent Platform & AI**.

Следующий продуктовый этап:

**довести Agent Platform Kernel + 4 MVP reference agents до состояния реальной AI-функциональности, а затем обеспечить быстрое добавление новых фокусных агентов.**

Это и есть логическое продолжение Stage 2.
