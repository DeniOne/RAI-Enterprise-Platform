---
id: DOC-STR-STAGE-2-RAI-SWARM-CONTROL-TOWER-ARCHITECTU-1ALP
layer: Strategy
type: Vision
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-09
---
# RAI SWARM CONTROL TOWER ARCHITECTURE

## 1. Назначение документа

Этот документ фиксирует верхнюю операторскую архитектуру `Swarm Control Tower` как панели управления всей армией агентов `RAI_EP`.

Документ определяет:

- `agent dashboard`;
- `agent ranking`;
- `agent reliability heatmap`;
- `bs% monitoring`;
- `agent telemetry`;
- `runtime queue health`;
- incidents, overrides, quarantine, drilldowns и operator actions.

Нормативный вывод документа:

- `Agent OS` = execution layer;
- `Runtime Governance` = policy and control layer;
- `Swarm Control Tower` = operator plane.

Именно эта связка должна превращать систему в:

- `Agent OS + Control Tower`.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- проектируется или расширяется `Control Tower`;
- добавляется новый canonical agent;
- вводится новая operator метрика или governance surface;
- обсуждается ranking, reliability, heatmap или unhealthy-first представление агентов;
- проектируются override, quarantine, review-required и related operator actions;
- нужно проверить, достаточно ли текущего UI для управления агентным флотом, а не только для чтения логов.

---

## 3. Канонические источники

Этот документ должен читаться вместе с:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)
- [RAI_CONTROL_TOWER_LIFECYCLE_BOARD_GAP_ANALYSIS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_CONTROL_TOWER_LIFECYCLE_BOARD_GAP_ANALYSIS.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)

Фактическое состояние подтверждается кодом:

- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [runtime-governance-read-model.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-read-model.service.ts)
- [runtime-governance-drilldown.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-drilldown.service.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [agent-reliability.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime-governance/agent-reliability.service.ts)
- [runtime-governance-recommendation.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-recommendation.service.ts)

---

## 4. Базовый принцип

`Swarm Control Tower` не является отдельной игрушечной аналитической страницей. Это нормативный operator plane над:

- ownership map;
- runtime governance;
- incidents;
- quality and BS drift;
- queue pressure;
- autonomy overrides;
- reliability signals по агентам.

Нормативная модель выглядит так:

```text
Agent OS
  -> Runtime Governance
    -> Explainability Read Models
      -> Swarm Control Tower
        -> Operator Actions
          -> Overrides / Review / Quarantine / Recovery
```

Если `Runtime Governance` отвечает на вопрос `что происходит и по каким правилам`, то `Swarm Control Tower` отвечает на вопрос `как оператор управляет всей системой в одном месте`.

---

## 5. Что Control Tower обязан показывать

### 5.1 Agent Dashboard

Панель обязана показывать состояние флота агентов как единой системы:

- сколько canonical agents активно;
- какие агенты unhealthy;
- где активны fallback;
- где активны overrides;
- где есть incidents;
- какие домены испытывают давление.

### 5.2 Agent Ranking

Панель обязана ранжировать агентов не по vanity metrics, а по operator значимости:

- highest fallback rate;
- highest BS drift;
- highest incident pressure;
- highest queue impact;
- lowest success rate;
- highest policy block rate.

Нормативное правило:

- unhealthy agents должны показываться первыми;
- ranking не должен прятать проблемы за усреднением всего флота.

### 5.3 Agent Reliability Heatmap

Панель обязана показывать heatmap над canonical agents минимум по осям:

- `success`;
- `fallback`;
- `policy blocks`;
- `budget denied`;
- `tool failures`;
- `p95 latency`;
- `incident pressure`;
- `quality / BS`;
- `evidence coverage`.

### 5.4 BS% Monitoring

Панель обязана показывать:

- средний `BS%`;
- rising drift;
- agents above review threshold;
- agents above quarantine threshold;
- связь между `BS%`, evidence coverage и fallback.

### 5.5 Agent Telemetry

Панель обязана давать сводку:

- top fallback reasons;
- recent governance events;
- recommendation stream;
- autonomy status;
- manual overrides;
- correlation `fallback -> incident -> override`.

### 5.6 Runtime Queue Health

Панель обязана показывать:

- queue pressure;
- hottest roles;
- saturation hotspots;
- degraded groups;
- queue impact on agent reliability.

---

## 6. Операторские зоны панели

### 6.1 Overview Zone

Должна отвечать на вопрос:

- система в норме или нет.

Минимум:

- queue pressure;
- active recommendations;
- recent incidents;
- hottest agents;
- autonomy flags.

### 6.2 Reliability Zone

Должна отвечать на вопрос:

- какие агенты деградируют.

Минимум:

- reliability table;
- unhealthy-first sorting;
- ranking by fallback / incidents / BS drift.

### 6.3 Governance Zone

Должна отвечать на вопрос:

- какие управленческие меры сейчас действуют.

Минимум:

- current overrides;
- review-required;
- quarantine state;
- tool-first state;
- recommendations pending operator attention.

### 6.4 Drilldown Zone

Должна отвечать на вопрос:

- почему агент unhealthy.

Минимум:

- fallback history;
- quality drift history;
- budget deny hotspots;
- queue saturation by role/group;
- correlation timeline.

### 6.5 Action Zone

Должна отвечать на вопрос:

- что оператор может сделать прямо сейчас.

Минимум:

- apply `TOOL_FIRST`;
- apply `QUARANTINE`;
- clear override;
- open trace / investigation context;
- перейти к governance detail.

---

## 7. Что подтверждено кодом сейчас

По текущему коду уже подтверждено:

- страница `Control Tower` существует и подключена к runtime governance;
- есть summary:
  - queue pressure;
  - top fallback reasons;
  - recent incidents;
  - active recommendations;
  - quality averages;
  - autonomy status;
  - hottest agents;
- есть `Agent Reliability Table`;
- есть drilldowns;
- есть manual actions:
  - `TOOL_FIRST`;
  - `QUARANTINE`;
  - `clear override`;
- есть backend read-model и governance control services.

Это означает:

- `Swarm Control Tower` уже частично реализован;
- но его архитектура до этого не была оформлена как отдельный Stage 2 canon.

---

## 8. Целевая архитектура Swarm Control Tower

Целевая схема должна выглядеть так:

```text
Runtime / Agents / Tools
  -> Governance Events
  -> Reliability Aggregates
  -> Quality / BS Signals
  -> Queue Metrics
  -> Incident Ops
  -> Explainability Read Models
  -> Swarm Control Tower
  -> Operator Actions
  -> Overrides / Review / Quarantine / Recovery
```

Нормативный смысл:

- `Swarm Control Tower` не собирает данные сам;
- он потребляет read-models и governance surfaces;
- он не заменяет ownership map;
- он делает ownership, governance и runtime состояния операционно управляемыми.

---

## 9. Что архитектурно запрещено

Запрещено считать `Swarm Control Tower` завершённым, если:

- это только визуализация красивых графиков без operator actions;
- unhealthy agents не выделяются явно;
- нет ranking и heatmap;
- queue pressure скрыт или размазан;
- incidents не коррелируются с fallback и BS drift;
- override surfaces отсутствуют;
- UI позволяет raw-edit произвольных runtime policies без governance request;
- canonical agents не появляются в панели автоматически.

---

## 10. Разрывы между текущим состоянием и целевым

На текущий момент остаются разрывы:

- heatmap пока в основном представлена таблицами и drilldowns, а не отдельной fleet heatmap surface;
- ranking можно усилить до first-class operator board;
- нет верхнего fleet board по owner-domains и handoff health;
- нет явной swarm-map поверхности по доменам, ownership и перегрузке handoff paths;
- нет полного release / freeze / recovery board по rollout состояниям агентов;
- часть operator surfaces уже реализована, но ещё не описана как единый зрелый product module.

---

## 11. Практическое следствие для новых агентов

Каждый новый canonical agent обязан автоматически попадать в:

- reliability table;
- fallback monitoring;
- BS drift monitoring;
- incident correlation;
- queue impact tracking;
- governance recommendation stream;
- override and autonomy surfaces.

Если новый canonical agent не появляется в `Swarm Control Tower`, он не считается полностью production-integrated.

---

## 12. Связь с ownership map

`Swarm Control Tower` не заменяет [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md).

Правильная связь такая:

- ownership map отвечает на вопрос `кто владелец`;
- runtime governance отвечает на вопрос `как контролируется исполнение`;
- `Swarm Control Tower` отвечает на вопрос `как оператор видит и управляет всей армией`.

---

## 13. Критерий зрелости

Система может считаться зрелой `Agent OS + Control Tower`, только если одновременно выполнено всё ниже:

- есть canonical owner-agents;
- есть ownership map;
- есть runtime governance canon;
- есть runtime governance code contour;
- есть explainability read models;
- есть operator plane;
- есть manual governed actions;
- unhealthy agents показываются первыми;
- queue health, BS drift, incidents и overrides связаны в одной панели.

---

## 14. Связанные файлы и точки кода

- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [runtime-governance-read-model.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-read-model.service.ts)
- [runtime-governance-drilldown.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-drilldown.service.ts)
- [runtime-governance-control.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/runtime-governance-control.service.ts)
- [explainability-panel.controller.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.controller.ts)
- [agent-reliability.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime-governance/agent-reliability.service.ts)
- [runtime-governance-recommendation.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-recommendation.service.ts)
- [RAI_AGENT_RUNTIME_GOVERNANCE.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_RUNTIME_GOVERNANCE.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
