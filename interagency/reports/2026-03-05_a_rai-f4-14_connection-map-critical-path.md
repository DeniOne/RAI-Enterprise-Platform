# Отчёт — Agent Connection Map & Critical Path (F4.14)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-14_connection-map-critical-path.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `apps/api/src/modules/explainability/dto/trace-topology.dto.ts` — новый (TraceTopologyNodeDto, TraceTopologyResponseDto)
- `apps/api/src/modules/explainability/trace-topology.service.ts` — новый (TraceTopologyService)
- `apps/api/src/modules/explainability/trace-topology.service.spec.ts` — новый (unit-тесты)
- `apps/api/src/modules/explainability/explainability-panel.controller.ts` — эндпоинт `GET trace/:traceId/topology`
- `apps/api/src/modules/explainability/explainability-panel.module.ts` — провайдер TraceTopologyService

## Реализовано

- **TraceTopologyService:** по `traceId` и `companyId` загружает все `AiAuditEntry` и `TraceSummary`, строит граф узлов (корень `request` + узлы по записям аудита). Для каждого узла: `durationMs` из `metadata.phases` или из дельты времени. Признак `hasError` из `metadata.error`. Критический путь — рекурсивный выбор потомка с максимальной суммарной длительностью от корня до листа.
- **API:** `GET /rai/explainability/trace/:traceId/topology` — tenant isolation (Forbidden при чужом companyId), ответ: nodes[], criticalPathNodeIds[], totalDurationMs.
- **DoD:** алгоритм топологии и критического пути, API с изоляцией, tsc PASS, jest 4/4 по trace-topology + все explainability 38 PASS.

## Результаты проверок

### tsc — noEmit (apps/api)
```
PASS
```

### jest (целевые тесты)
```
PASS  trace-topology.service.spec.ts  4 tests
PASS  explainability (9 suites, 38 tests)
```

## DoD

- [x] Алгоритм построения топологии и критического пути реализован
- [x] API эндпоинт отдаёт DTO, изоляция по companyId
- [x] Unit: критический путь выбирает самую медленную ветвь при параллельном исполнении
- [x] Unit: Forbidden для чужих traceId (tenant isolation)
