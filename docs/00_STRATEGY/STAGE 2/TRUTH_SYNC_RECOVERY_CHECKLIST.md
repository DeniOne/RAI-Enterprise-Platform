# STAGE 2 — Truth Sync Recovery Checklist

Дата: 2026-03-05  
Назначение: рабочий чеклист техлида для доводки `truthfulness / evidence / observability / registry` без самообмана.

## Как пользоваться

- Один пункт = одна законченная единица контроля.
- Галка ставится только если есть:
  - промт;
  - код;
  - ревью-пак;
  - техлидский вердикт `APPROVED`.
- Если промт написан, но код не принят, галку не ставить.
- Если claim в `TRUTH_SYNC_STAGE_2_CLAIMS.md` не улучшился, галку не ставить.

## Статусы

- `[ ]` не начато
- `[~]` в работе / на ревью
- `[x]` принято и закрыто

## R1-R12 Master Checklist

### R1. Evidence Backbone
- [x] Создан промт `interagency/prompts/2026-03-05_a_rai-r1_evidence-audit-backbone.md`
- [x] Получен ревью-пак `interagency/reports/2026-03-05_a_rai-r1_evidence-audit-backbone_report.md`
- [x] Producer-side тестами подтверждена запись `metadata.replayInput`
- [x] Producer-side тестами подтверждена запись `metadata.evidence`
- [x] Подтверждён backward-compatible кейс `replayMode -> metadata: undefined`
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Evidence Tagging` перестал быть “голой декларацией” и получил audit backbone

### R2. TraceSummary Live Metrics
- [x] Создан промт `interagency/prompts/2026-03-05_a_rai-r2_trace-summary-live-metrics.md`
- [x] Получен ревью-пак `interagency/reports/2026-03-05_a_rai-r2_trace-summary-live-metrics.md`
- [x] Проверено, что `TraceSummary` больше не пишется как бессмысленная нулевая заглушка
- [x] Проверено, что writer не теряет уже записанные поля при update/upsert
- [x] Проверено, что explainability/dashboard читают новый nullable-контракт без регрессий
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `TraceSummary / BS% source of truth` улучшен

### R3. Truthfulness Runtime Trigger
- [x] Создан промт `interagency/prompts/2026-03-05_a_rai-r3_truthfulness-runtime-trigger.md`
- [x] Получен ревью-пак `interagency/reports/2026-03-05_a_rai-r3_truthfulness-runtime-trigger.md`
- [x] Проверено, что `TruthfulnessEngine` вызывается из боевого runtime-контура
- [x] Проверен кейс `evidence exists -> BS% recalculated`
- [x] Проверен кейс `no evidence -> controlled fallback`
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `BS% считается по trace` улучшен

### R4. Claim Accounting and Coverage
- [x] Создан промт `interagency/prompts/2026-03-05_a_rai-r4_claim-accounting-and-coverage.md`
- [x] Получен ревью-пак `interagency/reports/2026-03-06_a_rai-r4_claim-accounting-and-coverage_report.md`
- [x] Зафиксирован канонический расчёт `claims total / evidenced / invalid / unverified`
- [x] Проверено, что `Evidence Coverage` считается из прозрачной модели
- [x] Проверено, что `invalidClaimsPct` не декоративный
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Evidence Coverage / invalid claims` улучшен

### R5. Forensics Timeline Depth
- [x] Создан промт `interagency/prompts/2026-03-06_a_rai-r5_trace-forensics-depth.md`
- [x] Получен ревью-пак `interagency/reports/2026-03-06_a_rai-r5_trace-forensics-depth_report.md`
- [x] Проверено, что trace timeline показывает реальные фазы исполнения
- [x] Проверено, что evidence refs видны в forensic timeline
- [x] Проверено, что topology/forensics не расходятся по данным
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Explainability Explorer / Forensics` улучшен

### R6. Quality Panel Honesty
- [ ] Создан промт `interagency/prompts/2026-03-06_a_rai-r6_quality-panel-honesty.md`
- [ ] Получен ревью-пак
- [ ] Проверено, что панель реально показывает `BS%`
- [ ] Проверено, что панель реально показывает `Evidence Coverage`
- [ ] Проверено, что панель реально показывает `Acceptance Rate`
- [ ] Проверено, что панель реально показывает `Correction Rate`
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `Quality & Evals Panel` улучшен

### R7. Governance From Quality
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Проверено, что incidents feed ловит quality-driven incidents, а не только security
- [ ] Проверено, что инциденты имеют `traceId`, тип, severity и lifecycle
- [ ] Проверено, что governance page показывает live quality incidents
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `Governance counters / incidents feed` улучшен

### R8. Closed-Loop Autonomy
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Проверено, что policy реально читает живые BS%-данные
- [ ] Проверено, что runtime/tool gating реально меняется от policy state
- [ ] Проверен сценарий `tool-first` или `quarantine`
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `Autonomy by BS%` улучшен

### R9. Performance Telemetry Wiring
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Проверено, что latency/error telemetry пишется из runtime
- [ ] Проверено, что dashboard/SLO читают непустые данные
- [ ] Проверено, что telemetry не декоративная
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `SLO / performance observability` улучшен

### R10. Registry Domain Model
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Появились first-class сущности registry-домена
- [ ] Старый `AgentConfiguration` либо мигрирован, либо честно объявлен legacy
- [ ] API registry соответствует доменной модели, а не CRUD-иллюзии
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `Phase 4.6 registry model` улучшен

### R11. Registry Runtime Enforcement
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Проверено, что registry влияет на runtime, а не только на UI/API
- [ ] Проверено, что disable agent реально выключает поведение
- [ ] Проверено, что tenant access / capability narrowing реально enforced
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `Registry as runtime source of truth` улучшен

### R12. Prompt Governance Reality
- [ ] Создан промт
- [ ] Получен ревью-пак
- [ ] Проверено, что eval/golden tests не stub-only
- [ ] Проверено, что config change проходит через eval verdict
- [ ] Проверено, что canary / rollback gate реально участвует в workflow
- [ ] Техлидский вердикт: `APPROVED`
- [ ] Claim `PromptChange RFC / EvalRun` улучшен

## Truth-Sync Delta Checklist

### Критичные claims, которые обязаны уйти из `PARTIAL`
- [x] `Evidence Tagging`
- [x] `BS%`
- [ ] `Quality & Evals Panel`
- [ ] `Autonomy by BS%`
- [ ] `Governance counters / incidents feed`
- [ ] `PromptChange RFC`

### Критичный claim, который обязан уйти из `MISSING`
- [ ] `Phase 4.6 полноценный Agent Registry`

## Техлидский контроль качества

- [x] Ни один `APPROVED` не выдан без producer-side теста на ключевой контракт
- [x] Ни один claim не переведён в лучший статус без code evidence
- [x] Ни один UI-элемент не принят как “готово”, если backend-источник метрики декоративный
- [ ] После каждого принятого шага обновлён `TRUTH_SYNC_STAGE_2_CLAIMS.md`
- [ ] После каждого принятого шага обновлён `interagency/INDEX.md`
- [ ] После каждого принятого шага обновлён `memory-bank/task.md`

## Финишный критерий

- [ ] Truth spine `evidence -> audit -> traceSummary -> BS% -> governance` замкнут
- [ ] `Control Tower` перестал быть витриной и стал источником правды
- [ ] `Agent Registry` реально влияет на runtime
- [ ] Папка `STAGE 2` больше не врёт в ключевых claims
