---
id: DOC-DOM-CORE-TECHMAP-SERVICES-API-TM4-TM5-174K
layer: Domain
type: Domain Spec
status: draft
version: 0.1.0
---
# TechMap API Surface (TM-4 + TM-5)

## TM-4 Adaptive Rules

### TriggerEvaluationService
- `evaluateTriggers(techMapId, companyId, context)` — вычисляет сработавшие правила и создаёт `ChangeOrder`.
- `applyTriggeredRule(ruleId, companyId, context)` — применяет конкретное правило и отправляет изменение на согласование.
- `evaluateCondition(condition, context)` — pure-проверка условия триггера.

### HybridPhenologyService
- `predictBBCH(hybridName, gddAccumulated, companyId)` — прогноз BBCH стадии по GDD.
- `getOrCreateModel(hybridName, cropType, companyId)` — возвращает или создаёт модель фенологии гибрида.

## TM-5 Economics + Contract Core

### TechMapBudgetService
- `upsertBudgetLine(dto, techMapId, companyId)` — создание/обновление бюджетной строки.
- `calculateBudget(techMapId, companyId)` — агрегированный бюджет и контроль cap.
- `checkOverspend(techMapId, companyId)` — выявление перерасхода и выпуск `ChangeOrder`.

### TechMapKPIService
- `calculateKPIs(techMapId, companyId, marketPriceRubT, lossRiskFactor?)` — расчёт KPI техкарты по бюджету и урожайности.
- `computeKPIs(input)` — pure-функция расчёта KPI.
- `recalculate(techMapId, companyId, marketPriceRubT, lossRiskFactor?)` — пересчёт KPI-слоя.

### ContractCoreService
- `generateContractCore(techMapId, companyId)` — построение contract-core payload.
- `hashContractCore(core)` — детерминированный SHA-256 хэш канонического payload.
- `sealContractCore(techMapId, companyId)` — запись `basePlanHash`.
- `verifyIntegrity(techMapId, companyId)` — сверка сохранённого и текущего хэшей.
