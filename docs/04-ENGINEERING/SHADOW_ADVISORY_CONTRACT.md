# Shadow Advisory Contract (Sprint 3)

## Статус

- Scope: Sprint 3 (Gamma)
- Режим: shadow-only (без пользовательской публикации)
- Decision: `GAMMA-SPRINT3-001`, `SECURITY-CANON-001`

## 1) Входной контракт (`ShadowAdvisoryRequest`)

Поля:
- `companyId: string` — tenant-изоляция.
- `embedding: number[1536]` — детерминированный вектор сигнала.
- `traceId: string` — сквозная трассировка.
- `signalType: "VISION" | "SATELLITE" | "OPERATION"`.
- `memoryType?: string` — контекст выборки (`CONTEXT`/`PROCESS`).

Источники:
- Vision: `VisionIngestionService`.
- Satellite: `SatelliteIngestionService`.
- Operation: `FieldObservationService`.

## 2) Выходной контракт (`ShadowAdvisoryResponse`)

Поля:
- `traceId: string`
- `companyId: string`
- `signalType: "VISION" | "SATELLITE" | "OPERATION"`
- `recommendation: "ALLOW" | "REVIEW" | "BLOCK"`
- `confidence: number` (`0..1`)
- `rationale: string` (агрегированное объяснение)

## 3) Explainability-поля

Минимальный explainability-набор:
- агрегаты исходов (`positive/negative/unknown`),
- итоговый `score`,
- число исторических кейсов (`totalCases`),
- вычисленный `confidence`,
- итоговый `recommendation`.

## 4) Audit Contract

Событие аудита:
- `action: "SHADOW_ADVISORY_EVALUATED"`

`metadata`:
- `traceId`
- `companyId`
- `signalType`
- `recommendation`
- `confidence`
- `aggregate` (`positive/negative/unknown/score`)
- `totalCases`

## 5) Side-Effect Policy

Гарантии Sprint 3:
- отсутствуют новые user-facing endpoint.
- отсутствует изменение пользовательского ответа ingestion (`{ status: "accepted", traceId }` сохранен).
- advisory-вызов выполняется в фоне и не блокирует основной ingest flow.

## 6) Security Notes

- tenant-изоляция выполняется через `companyId`.
- shadow advisory не принимает решений вместо человека.
- никаких автоматических действий в прод-потоке не выполняется.
