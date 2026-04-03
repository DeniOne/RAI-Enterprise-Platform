# RAI_EP — Target Implementation Blueprint целевой агентной системы

## Статус документа

**Роль документа:** execution blueprint / implementation reference  
**Назначение:** перевести каноническую идеальную картину агентной системы RAI_EP в последовательную программу инженерного внедрения.  
**Статус истины:** документ фиксирует **целевой порядок внедрения**, **обязательные runtime-компоненты**, **волны реализации**, **definition of done** и **критерии перехода**, а не утверждает, что все элементы уже существуют в runtime.

---

# 1. Назначение blueprint

Этот документ нужен для того, чтобы команда внедряла агентную систему не как набор разрозненных задач, а как управляемую программу перехода:

- от текущего orchestration spine;
- к LLM-governed, policy-bounded, JSON-contract-based мультиагентной платформе;
- с контролируемым переходом по волнам;
- без разрушения текущего рабочего контура.

Документ отвечает на вопросы:
- что строить сначала;
- что не строить раньше времени;
- какие модули обязательны;
- какие контракты должны появиться;
- по каким признакам считать систему действительно продвинувшейся к целевому состоянию.

---

# 2. Каноническая цель внедрения

Целевой результат внедрения состоит в следующем:

1. Пользователь пишет свободный запрос в естественном языке.
2. Оркестратор понимает смысл и строит `sub-intent graph`.
3. Оркестратор превращает graph в `ExecutionPlan`.
4. Ветки исполняются в режимах `parallel / sequential / blocking / mixed`.
5. Доменные агенты работают как bounded executors.
6. Все межсистемные обмены идут через JSON-контракты.
7. Все write-действия идут только через governed write-path.
8. Все критичные действия проходят через policy, risk classification и confirmation logic.
9. Пользователь получает единый развёрнутый ответ от оркестратора.
10. UI получает execution-state, mutation feedback и управляемые подтверждения.
11. Вся система остаётся наблюдаемой, проверяемой и воспроизводимой.

---

# 3. Принципы внедрения

## 3.1 Не ломать существующий spine без необходимости

Текущий orchestration spine не должен быть переписан с нуля.  
Правильная стратегия — поэтапное наращивание управляемости, а не разрушительная замена работающих элементов.

## 3.2 Сначала контракты, потом интеллект

Сначала должны появиться:
- канонические JSON-схемы;
- planner contracts;
- policy gates;
- telemetry contracts;
- state persistence.

Только после этого можно усиливать orchestration intelligence и менять модельный слой.

## 3.3 Сначала управляемость, потом расширение зоопарка агентов

Нельзя начинать с множества новых agent personas.  
Сначала должна появиться система управления ветками, контекстом, политиками, audit и mutations.

## 3.4 Сначала production safety, потом автономность

High-risk autonomy не должна внедряться раньше, чем:
- заработает governed write-path;
- появится confirmation routing;
- заработает replay/recovery;
- появятся evals и observability.

## 3.5 Каждая волна должна давать реальный runtime-эффект

Каждая реализационная волна должна завершаться наблюдаемым системным улучшением, а не только новым документом или контрактом.

---

# 4. Каноническая структура программы внедрения

Программа внедрения разбивается на 8 волн:

- **Wave 0 — Canonical Contracts and Baseline**
- **Wave 1 — Semantic Decomposition Foundation**
- **Wave 2 — Planner-Driven Orchestration Runtime**
- **Wave 3 — Governed Write Path and Confirmation System**
- **Wave 4 — UI Execution Surface and Work Windows Upgrade**
- **Wave 5 — Trust, Explainability, State and Evidence Plane**
- **Wave 6 — Eval, Observability and Production Governance**
- **Wave 7 — Model Specialization and Performance Optimization**

---

# 5. Wave 0 — Canonical Contracts and Baseline

## 5.1 Цель волны

Создать единый контрактный язык целевой системы, на который дальше будет опираться весь orchestration runtime.

## 5.2 Что должно быть создано

### A. Канонические типы и схемы

Обязательные сущности:
- `IntentNode`
- `SubIntentGraph`
- `ExecutionPlan`
- `ExecutionStage`
- `ExecutionBranchResult`
- `TaskEnvelope`
- `MutationPacket`
- `ExecutionSurfaceState`
- `FinalResponsePacket`
- `BranchVerdict`
- `ConfirmationRequest`
- `PolicyDecision`

### B. Единые enum / taxonomy contracts

Минимально:
- `intentType`
- `interactionMode`
- `mutationRisk`
- `branchStatus`
- `executionMode`
- `policyOutcome`
- `confirmationState`
- `trustVerdict`
- `toolClass`

### C. Validation layer

Все контракты должны иметь:
- runtime validation;
- versioning;
- backward compatibility strategy для переходного периода.

## 5.3 Что должно быть зафиксировано как baseline

- текущие working agents;
- текущие working composites;
- текущие write paths;
- текущие policy boundaries;
- текущие gaps по sub-intent orchestration;
- текущая latency и current behavior baseline.

## 5.4 Definition of Done

Wave 0 считается завершённой, когда:
- все канонические контракты описаны в коде;
- все критические enum/typing слои унифицированы;
- новые контракты проходят runtime validation;
- текущие компоненты могут ссылаться на новые типы без ломки runtime.

## 5.5 Ожидаемый эффект

У команды появляется единый язык агентной системы.  
Новые модули перестают развиваться как разрозненные эвристики.

---

# 6. Wave 1 — Semantic Decomposition Foundation

## 6.1 Цель волны

Научить ingress и orchestration layer выделять из свободного запроса не одну плоскую команду, а осмысленный `sub-intent graph`.

## 6.2 Что внедряется

### A. Meaning extraction layer

Оркестратор должен уметь выделять:
- главный пользовательский goal;
- действия;
- сущности;
- домены;
- конфликтующие требования;
- недостающий контекст;
- признак mixed-intent запроса.

### B. Graph builder

Появляется компонент, строящий `SubIntentGraph` с:
- owner-agent assignment;
- dependencies;
- mutation risk;
- confirmation flags;
- expected outputs.

### C. Поддерживаемые классы сценариев первой итерации

Минимально система должна научиться корректно разбирать:
- информационный запрос;
- аналитический запрос;
- mixed read + action запрос;
- multi-step action запрос;
- cross-domain запрос;
- запрос с явным удалением/подтверждением.

## 6.3 Что пока не делается

На этой волне не строится:
- универсальный fully autonomous planner;
- свободный peer-to-peer agent mesh;
- сложная автономная проактивность.

## 6.4 Definition of Done

Wave 1 считается завершённой, когда:
- `SubIntentGraph` строится минимум для канонического набора сценариев;
- mixed-intent запросы перестают искусственно туннелироваться в одну ветку;
- graph сохраняется в state-plane;
- оператор/разработчик может увидеть, как именно запрос был декомпозирован.

## 6.5 Ожидаемый эффект

Система начинает понимать сложный пользовательский запрос как несколько управляемых веток, а не как одну плоскую команду.

---

# 7. Wave 2 — Planner-Driven Orchestration Runtime

## 7.1 Цель волны

Превратить оркестратор из стадийного диспетчера в полноценный execution planner.

## 7.2 Что внедряется

### A. Execution planner

Planner получает `SubIntentGraph` и строит `ExecutionPlan`.

### B. Execution strategies

Поддерживаются стратегии:
- `SEQUENTIAL`
- `PARALLEL`
- `BLOCKING_ON_CONFIRMATION`
- `MIXED`

### C. Branch scheduler

Появляется runtime-компонент, который:
- запускает независимые ветки параллельно;
- ждёт зависимые ветки;
- останавливает ветки до подтверждения;
- управляет переходами статусов.

### D. Orchestrator branch control

Оркестратор удерживает:
- branch state;
- owner-agent selection;
- escalation rules;
- retry boundaries;
- failure routing.

## 7.3 Definition of Done

Wave 2 считается завершённой, когда:
- execution plan строится из graph автоматически;
- хотя бы часть read-only mixed-запросов реально исполняется параллельно;
- blocking-ветки корректно останавливаются и ждут подтверждения;
- sequential dependencies корректно отрабатываются;
- orchestration decisions фиксируются в telemetry.

## 7.4 Ожидаемый эффект

Мультиагентность становится реальным runtime-поведением, а не только архитектурной декларацией.

---

# 8. Wave 3 — Governed Write Path and Confirmation System

## 8.1 Цель волны

Сделать любые изменения данных управляемыми, объяснимыми и безопасными.

## 8.2 Что внедряется

### A. Mutation pipeline

Любой агент может только предложить `MutationPacket`.  
Прямое изменение данных агентом запрещается.

### B. Risk classification

Каждая мутация должна быть классифицирована как:
- `LOW_AUTOCOMMIT`
- `LOW_WITH_NOTICE`
- `CONFIRM_REQUIRED`
- `DESTRUCTIVE_CONFIRM_REQUIRED`

### C. Policy gate

Для каждой мутации определяется:
- допустимость;
- scope;
- требование подтверждения;
- применимость rollback;
- audit requirements.

### D. Confirmation system

Появляется единый механизм:
- формирования `ConfirmationRequest`;
- ожидания ответа пользователя;
- продолжения ветки после подтверждения;
- отмены неподтверждённой операции.

### E. Write execution adapter

Backend-компонент применяет только одобренные мутации и возвращает execution result.

## 8.3 Что обязательно покрывается

- заполнение полей в UI;
- изменение карточек;
- обновление значений;
- удаление/очистка;
- любые high-impact business mutations.

## 8.4 Definition of Done

Wave 3 считается завершённой, когда:
- ни одна write-ветка не проходит в обход governed path;
- удаление всегда требует подтверждения;
- audit trail есть для каждой мутации;
- rollback metadata создаётся для обратимых операций;
- UI получает прозрачный mutation feedback.

## 8.5 Ожидаемый эффект

Агентная система становится способной не только анализировать, но и безопасно действовать в продукте.

---

# 9. Wave 4 — UI Execution Surface and Work Windows Upgrade

## 9.1 Цель волны

Сделать UI не витриной чата, а управляемой рабочей поверхностью agent runtime.

## 9.2 Что внедряется

### A. Execution Surface State

UI получает структурированное состояние исполнения:
- активные ветки;
- завершённые ветки;
- заблокированные ветки;
- pending confirmations;
- применённые мутации;
- disclosures.

### B. Work window upgrade

Work windows становятся не просто explainability-объектами, а полноценной execution surface моделью.

### C. UI confirmation UX

Появляются управляемые подтверждения для:
- удаления;
- high-risk mutation;
- ambiguous write operations;
- potentially destructive flows.

### D. Branch status visualization

Пользователь видит:
- что система поняла;
- какие ветки выполняются;
- какие ветки заблокированы;
- какие действия уже применены.

## 9.3 Definition of Done

Wave 4 считается завершённой, когда:
- UI способен визуализировать execution state;
- пользователь видит mutation result и pending confirmation внятно и не через произвольный prose;
- work windows отражают реальные branch states;
- чат и UI больше не живут раздельно.

## 9.4 Ожидаемый эффект

Управление системой смещается из хаотичного текста в контролируемую интерфейсную рабочую поверхность.

---

# 10. Wave 5 — Trust, Explainability, State and Evidence Plane

## 10.1 Цель волны

Сделать систему проверяемой, честной и устойчивой к прерыванию выполнения.

## 10.2 Что внедряется

### A. Branch verdict pipeline

Каждая ветка получает один из verdict:
- `VERIFIED`
- `PARTIAL`
- `BLOCKED`
- `FAILED`

### B. Explainability packet

Для каждого запроса система собирает:
- interpreted intent summary;
- branch list;
- branch outcomes;
- applied actions;
- pending actions;
- uncertainty disclosure;
- evidence references;
- policy disclosures.

### C. Persistent execution state

Сохраняются:
- execution graph;
- branch statuses;
- confirmation state;
- mutation objects;
- evidence objects;
- trust artifacts;
- rollback references.

### D. Resume / replay support

Система должна уметь:
- продолжить ветку после подтверждения;
- пережить рестарт runtime;
- переоткрыть execution surface;
- воспроизвести критичный execution path для аудита.

## 10.3 Definition of Done

Wave 5 считается завершённой, когда:
- каждый ответ можно разложить назад на ветки и verdicts;
- незавершённые ветки сохраняются между событиями;
- explainability перестаёт быть текстовым украшением и становится structured artifact;
- branch recovery работает для подтверждаемых и многошаговых сценариев.

## 10.4 Ожидаемый эффект

Система становится воспроизводимой, честной и пригодной для институционального использования.

---

# 11. Wave 6 — Eval, Observability and Production Governance

## 11.1 Цель волны

Сделать развитие агентной системы измеримым и production-управляемым.

## 11.2 Что внедряется

### A. Eval suite

Создаются канонические eval-наборы для:
- intent classification;
- decomposition quality;
- anti-tunneling behavior;
- planner correctness;
- tool selection;
- mutation governance;
- truthfulness compliance;
- response completeness.

### B. Full telemetry

Появляются сквозные telemetry traces по:
- request;
- graph;
- plan;
- agent branch;
- tool call;
- mutation;
- trust verdict;
- final response.

### C. Production dashboards

Должны быть доступны:
- latency metrics;
- branch failure rates;
- confirmation rates;
- mutation outcomes;
- policy blocks;
- tunneling indicators;
- retry rates;
- error clusters.

### D. Regression gate

Критические изменения orchestration logic не допускаются без:
- eval evidence;
- regression check;
- telemetry review.

## 11.3 Definition of Done

Wave 6 считается завершённой, когда:
- система имеет минимально достаточный eval suite;
- критические runtime-решения трассируются end-to-end;
- архитектурные изменения перестают вноситься вслепую;
- команда может доказуемо сравнивать версии оркестрации.

## 11.4 Ожидаемый эффект

Агентная система становится управляемой как продукт, а не как набор магических эффектов.

---

# 12. Wave 7 — Model Specialization and Performance Optimization

## 12.1 Цель волны

Оптимизировать модельный слой и производительность только после того, как основная архитектура уже управляется и измеряется.

## 12.2 Что внедряется

### A. Orchestrator model strategy

Рассматривается:
- выделенная сильная LLM для оркестратора;
- специализированная routing/decomposition модель;
- fallback strategy для model failure;
- cost-aware routing.

### B. Domain model specialization

При необходимости отдельные domain agents могут использовать разные модели под разные классы задач.

### C. Cost/latency optimization

Оптимизируются:
- orchestration latency;
- branch parallelization efficiency;
- token cost;
- heavy-context scenarios;
- response streaming and pacing.

### D. Model governance

Любая замена модели оценивается не по ощущению, а по:
- routing quality;
- decomposition quality;
- anti-tunneling quality;
- truthfulness stability;
- latency;
- cost.

## 12.3 Definition of Done

Wave 7 считается завершённой, когда:
- оркестратор работает на осознанно выбранной модельной стратегии;
- стоимость и задержка измеряются и управляются;
- оптимизация не ломает correctness и governance.

## 12.4 Ожидаемый эффект

Система становится не только правильной по архитектуре, но и эффективной по эксплуатационным параметрам.

---

# 13. Обязательные runtime-модули целевой системы

К моменту зрелого target-state в системе должны существовать следующие обязательные модули:

## 13.1 Control Plane
- Orchestrator Core
- Meaning Extraction Module
- Semantic Decomposition Module
- Sub-Intent Graph Builder
- Execution Planner
- Branch Scheduler
- Capability Gate
- Policy Gate
- Confirmation Router

## 13.2 Execution Plane
- Domain Agents
- Service Agents
- Agent Runtime
- Tool Registry
- Tool Execution Adapters
- Governed Write Adapter
- Backend Mutation Executor

## 13.3 State and Evidence Plane
- Execution State Store
- Confirmation State Store
- Mutation Store
- Evidence Store
- Trust Artifact Store
- Audit Trail Store
- Replay / Recovery Module
- Explainability Artifact Builder
- Telemetry and Trace Store
- Eval Dataset and Result Store

## 13.4 User-facing Layer
- Response Composer
- Execution Surface State Builder
- Work Window Projection Layer
- Confirmation UX Layer
- Mutation Feedback Layer

---

# 14. Что не должно делаться раньше времени

До завершения Wave 3–5 не следует:
- строить много новых агентных персон;
- давать агентам широкую автономию;
- внедрять сложный peer-to-peer inter-agent runtime;
- делать ставку на тонкую настройку модели вместо системных контрактов;
- пытаться “скрыть” системную сложность красивым prose;
- обходить policy ради скорости внедрения.

---

# 15. Критические риски внедрения

## 15.1 Pseudo-multi-agent trap

Внешне система выглядит как мультиагентная, но фактически остаётся stitched sequence без реального graph/planner runtime.

## 15.2 Prompt-first trap

Команда пытается решить архитектурные проблемы всё более длинными системными инструкциями вместо модулей, контрактов и gates.

## 15.3 Hidden writes trap

Mutation logic начинает просачиваться в обход governed write-path.

## 15.4 Observability gap

Система становится сложнее, но её поведение невозможно прозрачно объяснить или воспроизвести.

## 15.5 Model worship trap

Команда начинает воспринимать сильную LLM как замену planner, state, policy и tool governance.

---

# 16. Канонические критерии готовности целевой системы

Система может считаться близкой к целевому состоянию только если одновременно выполняются следующие условия:

1. Смешанный свободный запрос корректно декомпозируется на несколько веток.
2. Ветки могут исполняться параллельно, последовательно или с блокировкой на подтверждении.
3. Оркестратор удерживает общий смысл и не теряет контроль над ветками.
4. Агенты взаимодействуют только через структурированные контракты.
5. Write-path полностью governed и не имеет скрытых bypass.
6. UI показывает execution state, а не только prose.
7. Каждый результат сопровождается truthfulness/verdict/disclosure.
8. Execution state устойчив к confirmation waits и сбоям.
9. Поведение системы измеряется eval-наборами и telemetry.
10. Стоимость и latency управляются без разрушения качества.

---

# 17. Первая практическая реализационная пачка

Если переходить к внедрению немедленно, первая пачка должна включать именно следующие блоки:

## Package A — Contracts
- ввести канонические типы и JSON-схемы;
- унифицировать enum-слои;
- ввести runtime validation.

## Package B — Decomposition
- встроить graph builder в semantic ingress path;
- научить систему распознавать mixed-intent сценарии;
- начать сохранять graph как объект исполнения.

## Package C — Planner
- внедрить planner и branch scheduler;
- поддержать `parallel / sequential / blocking`;
- сделать telemetry на orchestration decisions.

## Package D — Governed Mutations
- внедрить mutation packet;
- risk classification;
- confirmation routing;
- audit/rollback metadata.

Эта первая пачка даёт максимальный эффект на единицу инженерного усилия.

---

# 18. Финальное управленческое утверждение

Правильное внедрение агентной системы RAI_EP — это не создание большого количества “умных агентов”, а поэтапная сборка управляемой orchestration-платформы, где:
- смысл удерживается оркестратором;
- исполнение декомпозировано на ветки;
- агенты действуют в bounded-режиме;
- записи в данные проходят только через governed write-path;
- UI отражает реальное состояние исполнения;
- trust, evidence, state, audit и evals встроены в runtime;
- развитие системы идёт по волнам, а не через хаотичное наращивание сложности.

Именно этот blueprint должен использоваться как документ перехода от идеального канона к реальной инженерной сборке системы.

