---
id: DOC-STR-00-STRATEGY-FINANCE-ECONOMY-1D43
layer: Strategy
type: Economics
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
Модуль: Finance & Economy

Назначение: Economic Truth + CFO Control Plane
Уровень: Strategic / Executive (OFS)

1️⃣ Архитектурный принцип (фиксируем сразу)
[ Domain Purity ]
- Нет ручного ввода экономических фактов
- Все факты = события
- Все состояния = проекции
- Economy НЕ знает о Finance
- Finance НЕ мутирует Economy

Economy (facts, cost, value)
        │
        ▼
Finance Management (cash, budgets, obligations, risk)

2️⃣ Общая структура модуля (IDE-ready)
apps/
└── api/
    └── finance-economy/
        ├── economy/
        │   ├── domain/
        │   │   ├── events/
        │   │   │   ├── economic-event.types.ts
        │   │   │   ├── cost-incurred.event.ts
        │   │   │   ├── revenue-recognized.event.ts
        │   │   │   └── liability-created.event.ts
        │   │   │
        │   │   ├── models/
        │   │   │   ├── economic-event.model.ts
        │   │   │   ├── attribution.model.ts
        │   │   │   └── unit-economics.model.ts
        │   │   │
        │   │   ├── rules/
        │   │   │   ├── cost-attribution.rules.ts
        │   │   │   └── allocation.rules.ts
        │   │   │
        │   │   └── economy.domain.ts
        │   │
        │   ├── projections/
        │   │   ├── ledger.projection.ts
        │   │   ├── apl-cost.projection.ts
        │   │   ├── employee-cost.projection.ts
        │   │   └── unit-economics.projection.ts
        │   │
        │   ├── application/
        │   │   ├── economy-event.handler.ts
        │   │   └── economy.service.ts
        │   │
        │   └── economy.module.ts
        │
        ├── finance/
        │   ├── domain/
        │   │   ├── models/
        │   │   │   ├── cash-account.model.ts
        │   │   │   ├── budget.model.ts
        │   │   │   ├── obligation.model.ts
        │   │   │   └── investment-case.model.ts
        │   │   │
        │   │   ├── policies/
        │   │   │   ├── approval.policy.ts
        │   │   │   ├── budget-limit.policy.ts
        │   │   │   └── liquidity.policy.ts
        │   │   │
        │   │   ├── fsm/
        │   │   │   ├── budget.fsm.ts
        │   │   │   └── payment.fsm.ts
        │   │   │
        │   │   └── finance.domain.ts
        │   │
        │   ├── projections/
        │   │   ├── cash-position.projection.ts
        │   │   ├── liquidity-forecast.projection.ts
        │   │   ├── obligation-exposure.projection.ts
        │   │   └── budget-burn.projection.ts
        │   │
        │   ├── application/
        │   │   ├── finance-event.listener.ts
        │   │   ├── budget-control.service.ts
        │   │   └── cash-management.service.ts
        │   │
        │   └── finance.module.ts
        │
        ├── integrations/
        │   ├── hr.listener.ts
        │   ├── cmr.listener.ts
        │   ├── task.listener.ts
        │   └── apl.listener.ts
        │
        ├── ofs/
        │   ├── dto/
        │   │   ├── cfo-liquidity.dto.ts
        │   │   ├── unit-economics.dto.ts
        │   │   └── risk-exposure.dto.ts
        │   │
        │   ├── finance.controller.ts
        │   └── economy.controller.ts
        │
        └── finance-economy.module.ts

3️⃣ Схема потоков (ментальная модель)
[ Task / HR / CMR / APL ]
            │
            ▼
     EconomicEvent
            │
            ▼
   Economy Projections
 (Ledger, Cost, Unit Econ)
            │
            ▼
   Finance Event Listener
            │
            ▼
 Finance Control Logic
 (Cash / Budget / Risk)
            │
            ▼
      CFO OFS Views

4️⃣ Пошаговый план разработки (Sprint B3)
🔹 Phase B3.0 — Economy Core (обязательный фундамент)

Результат: экономическая истина

 EconomicEvent taxonomy

 Immutable Ledger Projection

 Cost Attribution Rules

 Unit Economics Projection

 Интеграция: Task / HR / CMR / APL

📌 DoD:
Любая операция имеет экономический след.

🔹 Phase B3.1 — Finance Core (CFO Plane)

Результат: управляемые деньги

 CashAccount + CashFlow model

 Budget + Limit enforcement

 Financial Obligations registry

 Payment / Budget FSM

📌 DoD:
Расход без разрешения невозможен.

🔹 Phase B3.2 — Forecast & Risk

Результат: управление будущим

 Liquidity Forecast

 Stress-test сценарии

 Risk buffers

 Alerts & Breach events

📌 DoD:
CFO видит проблемы до того, как они случились.

🔹 Phase B3.3 — OFS (Executive UI)

Результат: стратегический контроль

 Liquidity Horizon

 Budget Burn-down

 Obligation Exposure

 Unit Economics by APL / Client

📌 DoD:
Ни одного “операционного” поля.

5️⃣ Ключевые инженерные ограничения (НЕ обсуждаются)

❌ Нет ручных корректировок

❌ Нет прямых CRUD для денег

❌ Нет Excel-логики

✅ Только события

✅ Только проекции

✅ Только стратегии

6️⃣ Результат на выходе

Ты получаешь:

Экономику как систему координат

Финансы как систему управления

CFO как стратегического оператора, а не бухгалтера

Архитектуру, которая масштабируется, а не разваливается
