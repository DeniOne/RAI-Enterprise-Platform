---
id: DOC-ARV-ARCHIVE-TRUTH-SYNC-RECOVERY-CHECKLIST-N9W2
layer: Archive
type: Research
status: archived
version: 0.1.0
---
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
- Начиная с `R6` по решению user допускается `dual-role` режим: часть шагов может выполняться без отдельного `interagency` промта/ревью-пака, но только при наличии кода, тестов и явного техлидского вердикта.

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
- [x] Выполнено в режиме `dual-role` без отдельного prompt/report
- [x] Проверено, что панель реально показывает `BS%`
- [x] Проверено, что панель реально показывает `Evidence Coverage`
- [x] Проверено, что панель реально показывает `Acceptance Rate`
- [x] Проверено, что `Correction Rate` не подменяется фейковой цифрой и честно помечается как неинструментированный
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Quality & Evals Panel` улучшен

### R7. Governance From Quality
- [x] Выполнено в режиме `dual-role` без отдельного prompt/report
- [x] Проверено, что incidents feed ловит quality-driven incidents, а не только security
- [x] Проверено, что инциденты имеют `traceId`, тип, severity и lifecycle
- [x] Проверено, что governance page показывает live quality incidents
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Governance counters / incidents feed` улучшен

### R8. Closed-Loop Autonomy
- [x] Выполнено в режиме `dual-role` без отдельного prompt/report
- [x] Проверено, что policy реально читает живые BS%-данные
- [x] Проверено, что runtime/tool gating реально меняется от policy state
- [x] Проверен сценарий `tool-first` или `quarantine`
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Autonomy by BS%` улучшен

### R9. Performance Telemetry Wiring
- [x] Выполнено в режиме `dual-role` без отдельного prompt/report
- [x] Проверено, что latency/error telemetry пишется из runtime
- [x] Проверено, что dashboard/SLO читают непустые данные
- [x] Проверено, что telemetry не декоративная
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `SLO / performance observability` улучшен

### R10. Registry Domain Model
- [x] Создан промт
- [x] Получен ревью-пак
- [x] Появились first-class сущности registry-домена
- [x] Старый `AgentConfiguration` либо мигрирован, либо честно объявлен legacy
- [x] API registry соответствует доменной модели, а не CRUD-иллюзии
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Phase 4.6 registry model` улучшен

### R11. Registry Runtime Enforcement
- [x] Выполнено в режиме `dual-role` без отдельного prompt/report
- [x] Проверено, что registry влияет на runtime, а не только на UI/API
- [x] Проверено, что disable agent реально выключает поведение
- [x] Проверено, что tenant access / capability narrowing реально enforced
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `Registry as runtime source of truth` улучшен

### R12. Prompt Governance Reality
- [x] Выполнен минимальный `dual-role` gate без отдельного prompt/report
- [x] Проверено, что eval/golden tests больше не pure-stub-only
- [x] Проверено, что config change проходит через eval verdict
- [x] Проверено, что canary / rollback gate частично участвует в workflow
- [x] Техлидский вердикт: `APPROVED`
- [x] Claim `PromptChange RFC / EvalRun` улучшен

## Truth-Sync Delta Checklist

### Критичные claims, которые обязаны уйти из `PARTIAL`
- [x] `Evidence Tagging`
- [x] `BS%`
- [x] `Quality & Evals Panel`
- [x] `Autonomy by BS%`
- [x] `Governance counters / incidents feed`
- [x] `PromptChange RFC`

### Критичный claim, который обязан уйти из `MISSING`
- [x] `Phase 4.6 полноценный Agent Registry`

## Техлидский контроль качества

- [x] Ни один `APPROVED` не выдан без producer-side теста на ключевой контракт
- [x] Ни один claim не переведён в лучший статус без code evidence
- [x] Ни один UI-элемент не принят как “готово”, если backend-источник метрики декоративный
- [x] После каждого принятого шага обновлён `TRUTH_SYNC_STAGE_2_CLAIMS.md`
- [x] После каждого принятого шага обновлён `interagency/INDEX.md`
- [x] После каждого принятого шага обновлён `memory-bank/task.md`

## Финишный критерий

- [x] Truth spine `evidence -> audit -> traceSummary -> BS% -> governance` замкнут
- [ ] `Control Tower` перестал быть витриной и стал источником правды
- [x] `Agent Registry` реально влияет на runtime
- [~] Папка `STAGE 2` больше не врёт в ключевых claims
