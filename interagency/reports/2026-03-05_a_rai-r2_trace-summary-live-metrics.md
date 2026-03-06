# Ревью-пак — R2 TraceSummary Live Metrics [v4]
Дата: 2026-03-05  
Статус: READY_FOR_REVIEW

## Изменённые файлы

| Файл | Что изменилось |
|------|----------------|
| `packages/prisma-client/schema.prisma` | `Float @default(0)` → `Float?` для quality-полей |
| `apps/api/src/modules/rai-chat/trace-summary.service.ts` | `record()` не передаёт quality-поля → БД пишет NULL; `updateQuality(bsScorePct, evidenceCoveragePct)` — второй шаг |
| `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` | 2-шаговая запись; initial record с live `durationMs`; `updateQuality` через chain после TruthfulnessEngine |
| `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts` | `calculateTraceTruthfulness → Promise<number>` |
| `apps/api/src/modules/explainability/dto/trace-forensics.dto.ts` | `bsScorePct / evidenceCoveragePct / invalidClaimsPct: number \| null` |
| `apps/api/src/modules/explainability/dto/trace-summary.dto.ts` | `z.number().nullable()` для quality-полей |
| `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts` | Quality-поля в `TruthfulnessWorstTraceDto`: `number \| null` + `@IsOptional()` |
| `apps/api/src/modules/explainability/explainability-panel.service.ts` | avg только по non-null трейсам; forensics summary отдаёт null напрямую (без `?? 0`) |

## Семантика quality-полей (сквозная)

| Слой | До | После |
|------|----|-------|
| Prisma schema | `Float @default(0)` | `Float?` — NULL = не посчитано |
| `record()` | явно писал 0 | не передаёт поля → NULL в БД |
| `updateQuality()` | записывал `invalidClaimsPct: 0` | только `bsScorePct` + `evidenceCoveragePct` |
| ExplainabilityPanel avg | `?? 0` на всех | avg только по non-null записям |
| Forensics response | `?? 0` → фейк | null передаётся честно |
| DTO-контракты | `number` (обязательно) | `number \| null` |

## Execution-поля (live, всегда ненулевые)
- `durationMs` — реальный замер
- `modelId` = `"deterministic"`, `toolsVersion` = `"v1"`, `policyId` = `"default"` — честные константы текущего runtime

## Тесты
```
tsc: PASS
prisma db push: 🚀 In sync
```

| Suite | Tests | Status |
|-------|-------|--------|
| `trace-summary.service.spec` | 4/4 | ✅ |
| `truthfulness-engine.service.spec` | 5/5 | ✅ |
| `supervisor-agent.service.spec` | 6/6 | ✅ |
| `explainability-panel.service.spec` | 8+/pass | ✅ |
| `trace-summary.dto.spec` | pass | ✅ |

