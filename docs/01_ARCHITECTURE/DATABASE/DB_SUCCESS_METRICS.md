# DB_SUCCESS_METRICS

## Purpose

Без измеримых метрик любой DB-refactor превращается в разговоры про вкус.
Здесь фиксируются показатели, по которым будет видно, архитектура реально улучшается или нет.

## Baseline from current audit

Подтвержденные baseline-показатели:
- `schema.prisma`: `6185` строк;
- current contour: `195` моделей, `149` enum;
- `companyId` есть в `152/195` моделях;
- `tenantId` присутствует в `17` моделях (Phase 1 additive scope);
- `Company` держит примерно `139` relation fields и является god-root;
- current contour: `368` индексов, `59` compound unique;
- конфликтная runtime-классификация `EventConsumption` устранена;
- hot delegates сосредоточены в `TechMap`, `Season`, `HarvestPlan`, `DeviationReview`, `Task`, `Party`, `OutboxMessage`, `AgentConfiguration`.

## Success metrics

### 1. `Company` de-rooting
- метрика: число прямых relation fields у `Company`;
- baseline: `~139`;
- цель: последовательное снижение по фазам без потери business/legal semantics.

### 2. Scope clarity
- метрика: число моделей с неясным scope;
- baseline: все модели без manifest считаются неясными;
- цель Phase 0: все high-risk модели покрыты manifest;
- цель Phase 2: полный manifest для current contour.

### 3. Enum governance
- метрика: число enum без taxonomy class;
- baseline: все enum до classification;
- цель Phase 4: `0` enum без taxonomy.

### 4. Cross-domain discipline
- метрика: число cross-domain relations без ADR;
- baseline: считать все неописанные cross-domain edges нарушениями;
- цель: все новые cross-domain edges только через ADR.

### 5. Index fitness
- метрика: число hot queries без workload-confirmed indexes;
- baseline: критичные долги есть в `HarvestPlan`, `Task`, `DeviationReview`, `CmrRisk`, `EconomicEvent`, `LedgerEntry`, `Party`;
- цель Phase 5: hot paths покрыты подтверждёнными composite indexes.

### 6. Query graph complexity
- метрика: медианная сложность Prisma include-графов в hot services;
- baseline: измерить через CI heuristic;
- цель: снижение количества deep include chains в пользу bounded reads и approved projections.

### 7. Growth safety
- метрика: количество новых моделей, добавленных без cross-domain правок в чужих доменах;
- baseline: не зафиксирован;
- цель: рост новых сущностей без каскадных изменений по всей схеме.

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
