# Отчёт — Cost Decomposition & Workload Hotspots (F4.13)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-13_cost-workload-hotspots.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `apps/api/src/modules/explainability/cost-analytics.service.ts` — новый
- `apps/api/src/modules/explainability/cost-analytics.service.spec.ts` — новый
- `apps/api/src/modules/explainability/dto/cost-hotspots.dto.ts` — новый
- `apps/api/src/modules/explainability/explainability-panel.controller.ts` — эндпоинт `GET cost-hotspots`
- `apps/api/src/modules/explainability/explainability-panel.module.ts` — провайдер `CostAnalyticsService`

## Реализовано

- **CostAnalyticsService:** расчёт стоимости по рейтам $2.5/1M input, $10/1M output.
  - `getTenantCost(companyId, timeWindowMs)` → totalCostUsd, totalPromptTokens, totalCompletionTokens, byModel[] (разбивка по modelId, т.к. в TraceSummary нет agentRole).
  - `getHotspots(companyId, timeWindowMs, limit)` → topByCost[], topByDuration[] (топ по стоимости и по durationMs).
  - `getCostHotspots(companyId, timeWindowMs, limit)` — объединённый ответ для API.
- **API:** `GET /rai/explainability/cost-hotspots` — query `timeWindowMs` (default 24h), `limit` (default 10, max 100). companyId из TenantContext, изоляция тенантов.
- **DTO:** CostHotspotsQueryDto (валидация), CostHotspotsResponseDto (tenantCost, topByCost, topByDuration).

## Результаты проверок

### tsc — noEmit (apps/api)
```
PASS
```

### jest (целевые тесты)
```
PASS  cost-analytics.service.spec.ts  3 tests
PASS  explainability-panel.service.spec.ts
```

## DoD

- [x] Сервис расчёта стоимости и хотспотов реализован
- [x] API эндпоинт отдаёт DTO, изоляция по companyId
- [x] Тесты PASS (tsc, jest)
- [x] Unit: getTenantCost суммирует токены и перемножает на рейты
- [x] Unit: изоляция арендаторов в getHotspots
- [x] Unit: сортировка getHotspots (топ по cost и по duration)
