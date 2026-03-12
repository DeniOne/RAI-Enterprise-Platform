---
id: DOC-EXE-07-EXECUTION-AI-COPILOT-AND-DECISION-INTEL-KSO0
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-11
---
# AI Copilot and Decision Intelligence: Implementation Plan

Status: READY FOR PLANNING / NOT READY FOR FEATURE RUSH

## 0. Executive Rule

Документ объединяет план по:
- упрощению AI Dock
- выводу памяти в интерфейс без информационного шума
- контекстному вызову `chief_agronomist`
- развитию `Agent Registry` и `Control Tower`
- запуску `Стратегия -> Прогнозы`
- введению полноценного Decision Intelligence слоя для `data_scientist`

Ключевой организационный вывод:
- новые UX/AI функции нельзя разворачивать как "feature factory"
- их нужно внедрять после foundation gates из системного аудита

## 1. Source of Truth

План опирается на:
- `RAI_EP_SYSTEM_AUDIT.md`
- `docs/07_EXECUTION/MEMORY_SYSTEM/MEMORY_IMPLEMENTATION_CHECKLIST.md`
- `docs/01_ARCHITECTURE/HLD/DECISION_INTELLIGENCE_AND_DATA_SCIENTIST_HLD.md`
- `docs/03_PRODUCT/UI_UX/AI_COPILOT_AND_DECISION_INTELLIGENCE_UI_SPEC.md`

## 2. Delivery Doctrine

### 2.1. Сначала гарантии, потом новые умные поверхности

Обязательные условия до выхода user-facing high-impact прогнозов:
- tenant isolation hardening
- idempotency for critical writes
- approval path for high-impact agent actions
- traceability for recommendations and memory usage
- pruning and hygiene for engram memory

### 2.2. Minimal User Noise

Первый релиз не должен:
- показывать raw memory internals
- создавать второй постоянный чат для expert-agent
- выносить Ops-поверхности обычным пользователям

## 3. Workstreams

### WS0. Foundation Gates

Цель:
- убрать blockers, которые делают новый decision layer опасным

Обязательные задачи:
- Prisma middleware для `companyId`
- PostgreSQL RLS для tenant isolation
- idempotency key для critical paths
- outbox hardening (`SKIP LOCKED` как минимум)
- rate limiting for public/API surfaces
- mandatory human review для high-impact agent actions
- memory pruning / archival policy

Gate to exit:
- нет fail-open tenant reads на critical domains
- high-impact actions не могут пройти без trace и approval
- memory store имеет контролируемую retention/purge policy

### WS1. Memory Contract and Explainability Contract

Цель:
- выровнять backend и frontend контракт памяти

Задачи:
- расширить `memoryUsed` до типов:
  - `episode`
  - `profile`
  - `engram`
  - `active_alert`
  - `hot_engram`
- вернуть в response не только "top episode", а нормализованный summary
- зафиксировать display rules для обычного и privileged режима
- привязать memory summary к `traceId`

Acceptance:
- UI может безопасно показать "почему этот ответ" без раскрытия raw prompt internals

### WS2. AI Dock as Copilot

Цель:
- превратить AI Dock в легкий assistive layer

Задачи:
- сократить default answer chrome
- добавить one-line memory hint
- добавить suggested actions
- поднять escalation CTA при low confidence / high risk
- убрать лишний debug/info noise из обычного режима

Acceptance:
- пользователь понимает, что делать дальше, не уходя в отдельный workflow

### WS3. Contextual `chief_agronomist`

Цель:
- сделать экспертную эскалацию частью доменного потока, а не отдельным "chat universe"

Задачи:
- добавить CTA в техкарты
- добавить CTA в отклонения/алерты
- добавить вызов из AI Dock как escalation
- реализовать drawer/takeover panel
- добавить outcomes:
  - accept
  - escalate to human
  - create task

Acceptance:
- экспертный review запускается из контекста сущности
- у кейса есть trace, evidence и финальное действие

### WS4. Strategy -> Forecasts MVP

Цель:
- запустить единый экран принятия решений под неопределенностью

MVP scope:
- режимы:
  - `Прогноз`
  - `Факторы`
  - `Сценарии`
  - `Риски`
- первые домены:
  - урожайность
  - экономика
  - cash flow
  - ключевые риски

MVP не включает:
- полный OR-оптимизатор по всем ограничениям
- автопринятие решений
- open-ended analyst IDE

Acceptance:
- пользователь видит baseline, range, drivers, scenario delta и recommended action

### WS5. `data_scientist` Decision Layer

Цель:
- превратить `data_scientist` из "умного собеседника" в управляемый decision engine

Задачи:
- выделить forecasting core
- выделить causal core
- выделить optimization core
- выделить risk simulation core
- ввести model registry / champion-challenger
- ввести calibration and backtesting reports
- ввести realized outcome feedback loop

Acceptance:
- каждый результат имеет lineage, confidence/range и post-factum evaluation path

### WS6. Ops Surfaces

Цель:
- сделать memory/agent runtime наблюдаемыми

Задачи:
- `Memory Fabric` в Control Tower
- `Agent Registry` как runtime contract inspector
- `Memory Lane` в trace forensics

Acceptance:
- ops/admin может понять:
  - что recalled
  - что использовалось
  - почему ответ escalated
  - какой policy был применен

## 4. Phase Plan

### Phase 0. Foundation Hardening

Срок:
- немедленно

Результат:
- security/integrity blockers сняты до развития новых AI decision surfaces

### Phase 1. Contract Alignment

Содержимое:
- WS1
- часть WS2

Результат:
- AI Dock и backend говорят на одном explainability/memory contract

### Phase 2. Copilot UX

Содержимое:
- завершение WS2
- WS3

Результат:
- AI встраивается в доменные экраны и не конкурирует с ними

### Phase 3. Forecasts MVP

Содержимое:
- WS4
- первая часть WS5

Результат:
- `Стратегия -> Прогнозы` запускается в управляемом MVP

### Phase 4. Decision Governance

Содержимое:
- завершение WS5
- WS6

Результат:
- decision layer становится операционно наблюдаемым и управляемым

## 5. Priority Order

P0:
- WS0

P1:
- WS1
- WS2
- WS3

P2:
- WS4

P3:
- WS5
- WS6

## 6. Detailed Backlog

### Backend

- нормализовать memory response contract
- вернуть profile/engram/alert usage summary
- расширить trace schema для decision outputs
- добавить governance metadata для expert escalation
- ввести scenario result contract для `data_scientist`

### Frontend

- обновить AI Dock rendering
- добавить `Почему этот ответ?`
- добавить suggested actions row
- встроить CTA expert escalation в техкарты и отклонения
- создать страницу `Стратегия -> Прогнозы`
- добавить admin-only блоки `Memory Fabric` и `Agent Registry` details

### ML / Analytics / Decision Engineering

- определить domain-specific targets and horizons
- выбрать baseline models per domain
- внедрить probabilistic outputs
- внедрить causal evaluation for interventions
- внедрить scenario simulation
- внедрить optimization phase after MVP

### Governance / QA

- golden tests for explanations
- benchmark suite for forecasts
- calibration reports
- scenario correctness review
- policy tests for approval enforcement

## 7. Risks

### Product Risks

- перегрузить пользователей техническими деталями памяти
- снова скатиться в chat-first для задач, где нужен structured UI

### Engineering Risks

- развивать feature layer поверх fail-open tenancy
- допустить divergence между UI contract и runtime truth
- получить noisy engram recall без pruning

### AI Risks

- single-model bias
- hallucinated rationale
- recommendation without valid constraints

## 8. Exit Criteria by Surface

### AI Dock

- память видна только как краткая полезная подсказка
- нет debug noise в standard mode
- есть next-best-action

### Mega-Agronomist

- вызывается только контекстно
- имеет clear verdict and action surface
- фиксирует outcome

### Strategy -> Forecasts

- не менее одного cross-domain сценария проходит end-to-end
- есть confidence/range
- есть evidence and trace

### Ops Surfaces

- memory and agent runtime наблюдаемы без чтения кода

## 9. Recommended Sequencing for Real Execution

1. Закрыть WS0 до user-facing rollout.
2. Сделать WS1 и WS2 как самый быстрый и безопасный UX выигрыш.
3. После этого внедрить WS3, потому что `chief_agronomist` нужен как escalation path.
4. Только затем делать `Стратегия -> Прогнозы` как MVP.
5. После стабилизации MVP разворачивать полный decision layer и ops surfaces.

## 10. Non-goals of This Plan

- миграция всей продуктовой навигации
- полный redesign всех экранов
- мгновенный запуск full-scale optimization across all domains
- removal of existing dashboards before MVP proves value
