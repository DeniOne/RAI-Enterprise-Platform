---
id: DOC-EXE-AGENT-MODULE-RACI-AND-REPORTING-LINES-20260325
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-25
claim_id: CLAIM-EXE-AGENT-MODULE-RACI-AND-REPORTING-LINES-20260325
claim_status: asserted
verified_by: manual
last_verified: 2026-03-25
evidence_refs: docs/07_EXECUTION/AGENT_MODULE_ORG_STRUCTURE.md;docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/07_EXECUTION/BRANCH_TRUST_GATE_IMPLEMENTATION_SPRINT_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md;docs/00_STRATEGY/STAGE 2/RAI_FRONT_OFFICE_AGENT_CANON.md;docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md;apps/api/src/modules/rai-chat/supervisor-agent.service.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.ts
---
# Agent Module RACI And Reporting Lines

## CLAIM
id: CLAIM-EXE-AGENT-MODULE-RACI-AND-REPORTING-LINES-20260325
status: asserted
verified_by: manual
last_verified: 2026-03-25

## 0. Назначение

Этот документ переводит оргструктуру агентского модуля в рабочую матрицу ответственности.

Цель:

- показать, кто является `owner`, а кто только `supporting branch`;
- зафиксировать, кто отвечает за `approve`, `evidence`, `execution`, `trust`;
- убрать неявные ожидания, что любой агент может стать owner только потому, что у него есть подходящий tool;
- дать основу для routing, agent profiles и governance rules.

Эффект:

- у команды появляется конкретная матрица ответственности по типам запросов;
- routing можно проверять не по интуиции, а по зафиксированным ролям;
- multi-source и composite сценарии получают ясный `lead owner-agent`.

## 1. Роли матрицы

- `R` (`Responsible`): главный владелец результата по сценарию.
- `A` (`Accountable`): слой, который отвечает за управляемое доведение сценария до финального ответа.
- `C` (`Consulted`): домен или эксперт, который даёт branch-result, review или advisory input.
- `I` (`Informed`): слой, который получает trace, audit или управленческий сигнал, но не владеет решением.
- `E` (`Execution basis`): нижний слой фактов, инструментов и детерминированных операций.
- `T` (`Trust gate`): слой проверки достоверности, provenance, consistency и disclosure.

## 2. Reporting Lines

### 2.1 Каноническая линия подчинения

```text
Front-office communication
  -> front_office_agent
  -> SupervisorAgent
  -> owner-agent

Back-office business message
  -> semantic ingress
  -> SupervisorAgent
  -> owner-agent
```

### 2.2 Что означает reporting line

- `front_office_agent` подаёт нормализованный коммуникационный ingress в `SupervisorAgent`, но не становится business owner.
- `SupervisorAgent` назначает `lead owner-agent`, управляет сценарием и держит accountability за orchestration path.
- `owner-agent` владеет доменным результатом, но не обходит `SupervisorAgent`.
- `expert`, `knowledge`, `monitoring` и другие supporting branches подключаются только через governed path.
- `TruthfulnessEngine` и `Branch Trust Gate` не подчиняются owner-agent и не становятся advisory owner; они проверяют trust boundary.

## 3. RACI По Типам Сценариев

### 3.1 Коммуникационный ingress

| Сценарий | R | A | C | I | E | T |
|---|---|---|---|---|---|---|
| Front-office сообщение, thread, эскалация | `front_office_agent` | `SupervisorAgent` | `crm_agent`, `contracts_agent`, `knowledge` по handoff | runtime governance | message transport, thread store | `TruthfulnessEngine`, `Branch Trust Gate` только при доменном handoff |
| Back-office business message в `rai-chat` | `lead owner-agent` по intent | `SupervisorAgent` | `knowledge`, `monitoring`, expert-layer по policy | runtime governance | semantic ingress, tools, DB | `TruthfulnessEngine`, `Branch Trust Gate` |

### 3.2 Primary Owner Domains

| Сценарий | R | A | C | I | E | T |
|---|---|---|---|---|---|---|
| CRM: контрагент, карточка, workspace review | `crm_agent` | `SupervisorAgent` | `knowledge`, `contracts_agent` при cross-domain зависимости | runtime governance | CRM tools, DB, registries | `Branch Trust Gate` |
| Агро: техкарты, операции, отклонения, field facts | `agronomist` | `SupervisorAgent` | `chief_agronomist`, `monitoring`, `knowledge` | runtime governance | agro tools, field data, journals | `Branch Trust Gate` |
| Финансы: plan/fact, cost, scenario, monetization | `economist` | `SupervisorAgent` | `agronomist`, `contracts_agent`, `knowledge` | runtime governance | finance calculators, ledgers, DB | `Branch Trust Gate` |
| Договоры: registry review, AR, contract path | `contracts_agent` | `SupervisorAgent` | `crm_agent`, `economist`, `knowledge` | runtime governance | contract tools, registry, DB | `Branch Trust Gate` |

### 3.3 Supporting Branches

| Сценарий | R | A | C | I | E | T |
|---|---|---|---|---|---|---|
| Knowledge evidence / retrieval support | `lead owner-agent` | `SupervisorAgent` | `knowledge` | runtime governance | retrieval, KB, DB | `Branch Trust Gate` |
| Monitoring signal / anomaly / alert context | `lead owner-agent` | `SupervisorAgent` | `monitoring` | runtime governance | signal feeds, monitoring services | `Branch Trust Gate` |
| Expert review / high-risk advisory | `lead owner-agent` | `SupervisorAgent` | `chief_agronomist`, `data_scientist`, future expert roles | runtime governance | expert packet, review artifacts | `Branch Trust Gate`, `TruthfulnessEngine` |

### 3.4 Multi-source И Composite Scenarios

| Сценарий | R | A | C | I | E | T |
|---|---|---|---|---|---|---|
| Multi-source read с одним доменным центром тяжести | `lead owner-agent` по финальному business effect | `SupervisorAgent` | secondary domain agents, `knowledge`, `monitoring` | runtime governance | domain tools, DB, deterministic services | `Branch Trust Gate` |
| Composite workflow с зависимыми шагами | `lead owner-agent` по workflow stage | `SupervisorAgent` | secondary owner-agents, expert-layer | runtime governance | workflow tools, DB, state store | `Branch Trust Gate`, `TruthfulnessEngine` |
| Несколько write-доменов в одном запросе | `lead owner-agent` только для текущего stage | `SupervisorAgent` | следующий owner-agent только после confirm boundary | runtime governance, audit | write tools, DB, policy layer | `Branch Trust Gate`, runtime governance |

## 4. Lead Owner Правило

### 4.1 Как выбирается `lead owner-agent`

- по домену финального бизнес-эффекта, а не по первому упомянутому слову;
- по сценарию, который определяет итоговый ответ пользователю;
- по write-boundary текущего stage, если запрос staged и multi-domain.

### 4.2 Что `lead owner-agent` не означает

- не означает право захватывать все branch-results;
- не означает право обходить `SupervisorAgent`;
- не означает право публиковать неподтверждённые данные без trust gate;
- не означает, что `knowledge` или `front_office_agent` могут автоматически стать owner “по умолчанию”.

## 5. Особые Правила

### 5.1 `front_office_agent`

- владеет только `front-office` коммуникационным ingress;
- не является owner для `rai-chat` business scenarios;
- не является общим коммуникатором платформы;
- не владеет CRM, агро, финансами, договорами или multi-source analysis.

### 5.2 `SupervisorAgent`

- accountable за orchestration path;
- не responsible за доменный факт;
- не должен превращаться в universal reasoner, который сам решает доменную задачу вместо owner-agent.

### 5.3 `TruthfulnessEngine` и `Branch Trust Gate`

- это не owner и не advisor;
- они не дают бизнес-ответ вместо owner-agent;
- они либо подтверждают branch-result, либо понижают trust verdict, либо блокируют финальную подачу как установившийся факт.

## 6. Минимальная Матрица Для Routing

При добавлении нового сценария нужно зафиксировать:

1. кто `R` как primary owner;
2. кто `A` как orchestration accountability;
3. какие `C`-ветки допускаются;
4. какой `E`-слой подтверждает факт или write;
5. какой `T`-контур обязателен до финального ответа.

Без этого новый routing case считается неоформленным.

## 7. Первое Практическое Применение

Эта матрица должна использоваться как каноническая опора для:

- routing rules в `semantic ingress`;
- `lead owner-agent` для multi-source questions;
- branch contract design;
- `Branch Trust Gate`;
- agent profile hardening;
- instruction-layer по routing и handoff.
