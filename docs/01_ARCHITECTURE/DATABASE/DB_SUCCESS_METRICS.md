---
id: DOC-ARC-DATABASE-DB-SUCCESS-METRICS-10YC
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_SUCCESS_METRICS

## Status

`Approved` (`2026-03-13`, DB refactor program).

## Purpose

Без измеримых метрик любой DB-refactor превращается в разговоры про вкус.
Здесь фиксируются показатели, по которым будет видно, архитектура реально улучшается или нет.

## Baseline from current audit

Подтвержденные baseline-показатели:
- `schema.prisma`: `6185` строк;
- current contour: `195` моделей, `149` enum;
- `companyId` есть в `152/195` моделях;
- `tenantId` присутствует в `17` моделях (Phase 1 additive scope);
- `Company` baseline: `140` direct relation fields; current: `87` после Phase 2 wave-2;
- current contour: `379` индексов, `59` compound unique;
- конфликтная runtime-классификация `EventConsumption` устранена;
- hot delegates сосредоточены в `TechMap`, `Season`, `HarvestPlan`, `DeviationReview`, `Task`, `Party`, `OutboxMessage`, `AgentConfiguration`.

## Success metrics

### 1. `Company` de-rooting
- метрика: число прямых relation fields у `Company`;
- baseline: `140`;
- current: `87`;
- target Phase 2: `<=95` (достигнуто).

### 2. Scope clarity
- метрика: mixed-transition backlog (модели с переходной scope-семантикой);
- baseline: `17`;
- current: `3`;
- target Phase 5: `<=6` (достигнуто);
- target Phase 7: `0`.

### 3. Enum governance
- метрика: число enum без taxonomy class;
- baseline: `149`;
- цель Phase 5: `0`.

### 4. Cross-domain discipline
- метрика: число cross-domain relations без ADR;
- baseline: `>0` (legacy backlog);
- цель: все новые cross-domain edges только через ADR.

### 5. Index fitness
- метрика: число hot queries без workload-confirmed indexes;
- baseline: `8` критичных query families;
- цель Phase 6: `<=2`.
- observation status: `14-day` index-removal window открыт, стартовый snapshot зафиксирован.

### 6. Query graph complexity
- метрика: медианная сложность Prisma include-графов в hot services;
- baseline: `4`;
- цель Phase 6: `<=2`.

### 7. Growth safety
- метрика: количество новых моделей, добавленных без cross-domain правок в чужих доменах;
- baseline: `0` (новый KPI, до фиксации policy не измерялся);
- measurement window: открыт (после фиксации owner rules и CODEOWNERS);
- automation: `DB_MODEL_GROWTH_BASELINE.json` + `DB_MODEL_GROWTH_KPI.md` + gate `gate:db:growth-kpi:enforce`;
- current snapshot: новых моделей после baseline нет (`denominator=0`, window active).
- цель: `>=80%` новых моделей в пределах owner-domain без cross-domain rewiring.

## Phase targets

### Phase 0
- есть `MODEL_SCOPE_MANIFEST.md`;
- есть `DOMAIN_OWNERSHIP_MANIFEST.md`;
- есть `READ_MODEL_POLICY.md`;
- есть `DB_SUCCESS_METRICS.md`;
- включены CI-gates на scope/ownership/forbidden relations.

### Phase 1
- добавлены `Tenant` и `TenantCompanyBinding`;
- все control-plane модели первого набора имеют additive `tenantId` plan;
- mismatch logging включён;
- `EventConsumption` больше не имеет conflicting classification.

### Phase 2
- число direct relations у `Company` снижено;
- AI/runtime/integration больше не root-ятся напрямую в `Company`.

### Phase 3
- schema fragments соответствуют ownership manifest;
- top-level domains ограничены agreed set из 8 доменов.

### Phase 4
- у каждого enum есть taxonomy class;
- duplicate enum families разобраны и нормализованы.

### Phase 5
- hot queries покрыты workload-driven indexes;
- зеркальные и слабополезные индексы удаляются только по evidence.

### Phase 6
- принято доказательное решение: одна БД, несколько schemas или selective contours;
- physical split не делается без измеримого bottleneck.

## Measurement rules

Нельзя считать успехом:
- рост числа файлов сам по себе;
- уменьшение строк в `schema.prisma` без снижения связанности;
- добавление `tenantId` без runtime policy и mismatch logging;
- рост количества projections без owner/rebuild contract.

Успех считается только тогда, когда:
- новая модель добавляется без перепрошивки существующего ядра;
- новый use-case не требует очередного god-object;
- новые runtime/AI контуры не ломают tenant semantics.
