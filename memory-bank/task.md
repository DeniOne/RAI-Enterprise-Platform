# Sprint B6: Unified Risk Engine ???

## Database Schema
- [x] Update `schema.prisma` with `RiskSignal` and `RiskAssessment` models <!-- id: 0 -->
- [x] Add Enums: `RiskSource`, `RiskSeverity`, `RiskVerdict`, `RiskTargetType` <!-- id: 1 -->
- [x] Generate Prisma Client and Run Migrations <!-- id: 2 -->

## Core Package: `@rai/risk-engine`
- [x] Initialize package structure (`package.json`, `tsconfig.json`) <!-- id: 3 -->
- [x] Implement `RiskSignalCollector` interface <!-- id: 4 -->
- [x] Implement Domain Collectors (Stubs/Logic):
    - [x] `LegalRiskCollector` <!-- id: 5 -->
    - [x] `RndRiskCollector` <!-- id: 6 -->
    - [x] `OpsRiskCollector` <!-- id: 7 -->
    - [x] `FinanceRiskCollector` <!-- id: 8 -->
- [x] Implement `RiskNormalizer` <!-- id: 9 -->
- [x] Implement `RiskFsm` (Deterministic State Transitions) <!-- id: 20 -->
- [x] Implement `RiskAggregator` (The Brain + FSM context) <!-- id: 10 -->
- [x] Implement `VerdictRules` (Deterministic Logic) <!-- id: 11 -->
- [x] Unit Tests for Core Logic <!-- id: 12 -->

## API Module (`apps/api`)
- [x] Create `RiskModule` and `RiskController` <!-- id: 13 -->
- [x] Implement `GET /risk/assess/:targetType/:targetId` <!-- id: 14 -->
- [x] Integrate `RiskAggregator` into `RiskService` <!-- id: 15 -->

## Integration & Verification
- [x] Verify R&D Integration (Experiment without conclusion -> RiskSignal) <!-- id: 16 -->
- [x] Verify Legal Integration (Compliance Violated -> Critical Risk) <!-- id: 17 -->
- [x] Regression Guard Tests (New signals don't break old verdicts) <!-- id: 18 -->

## Documentation
- [x] Update `activeContext.md` with B6 status <!-- id: 19 -->

### Phase Beta Exit & Beta+ Implementation ??
- [x] **B+.1 AI-Driven Asset Ingestion**
    - [x] Registry: Machinery & StockItem models
    - [x] Agent: `RegistryAgentService` implementation
    - [x] UI: Telegram Photo/Voice sensory planes
- [x] **B+.2 Integrity Gate hardening**
    - [x] Logic: Admission rules for TechMap activation
    - [x] logic: Resource sufficiency checks (Tractors, Chemicals)
- [x] **B+.3 Internal Communication Protocol**
    - [x] Infra: Internal HTTP API in `telegram-bot`
    - [x] Secure: `X-Internal-API-Key` enforcement
    - [x] Decoupling: API -> Bot microservice (`BOT_URL`)
- [x] **B+.4 Progress Automation**
    - [x] Service: File watcher for `progress.md`
    - [x] Logic: Automatic broadcast to all active users via Internal API

## Sprint Gamma 3: Cognitive Memory (Kickoff) ??

### Decision & Scope
- [x] Decision-ID зафиксирован: `GAMMA-SPRINT3-001` (`ACCEPTED`)
- [x] Scope ограничен shadow-логикой без пользовательских side effects

### Implementation Start
- [x] Добавлен `EpisodicRetrievalService` (`apps/api/src/shared/memory/episodic-retrieval.service.ts`)
- [x] Подключение в `MemoryModule` через DI token `MEMORY_MANAGER`
- [x] Добавлены unit-тесты retrieval (`apps/api/src/shared/memory/episodic-retrieval.service.spec.ts`)
- [x] Добавлены правила `engram-rules` для `POSITIVE/NEGATIVE/UNKNOWN`
- [x] Реализован `ShadowAdvisoryService` (теневой verdict + confidence)
- [x] Добавлен audit trail: `SHADOW_ADVISORY_EVALUATED` (`AuditService.log`)
- [x] Traceability: `traceId` проходит через retrieval и advisory
- [x] Интеграция shadow advisory в ingestion:
    - [x] `VisionIngestionService`
    - [x] `SatelliteIngestionService`
    - [x] `FieldObservationService` (operation signals)

### Next
- [x] Добавлен baseline-отчет `precision/coverage` для shadow-рекомендаций (`ShadowAdvisoryMetricsService`)
- [x] Уточнен и зафиксирован Security Canon: `docs/01-ARCHITECTURE/PRINCIPLES/SECURITY_CANON.md` (`SECURITY-CANON-001`)
- [x] Обновлена документация контракта shadow advisory/explainability: `docs/04-ENGINEERING/SHADOW_ADVISORY_CONTRACT.md`

## Sprint Gamma 4: Explainability + Human Confirmation ?

### Scope
- [x] Explainability v2 ? `ShadowAdvisoryService` (`why`, `factors`, `confidence`, `traceId`)
- [x] API-?????? `AdvisoryModule` ? endpoint'??? pending/accept/reject/feedback
- [x] Audit extension: `ADVISORY_ACCEPTED`, `ADVISORY_REJECTED`, `ADVISORY_FEEDBACK_RECORDED`
- [x] Telegram recommendation cards (`???????` / `?????????`) + ???? ??????? ??????????
- [x] Web recommendation panel ?? dashboard + proxy routes `/api/advisory/*`

### Verification
- [x] ?????: `advisory.service.spec.ts` (5 ??????)
- [x] ????????? Sprint 3: `shadow-advisory.service.spec.ts`, `field-observation.service.spec.ts`
- [x] ????? green: 8 tests passed

### Artifacts
- [x] ????????: `docs/04-ENGINEERING/ADVISORY_EXPLAINABILITY_CONTRACT.md`
- [x] ???-???? Sprint 4 ????????: `docs/06-IMPLEMENTATION/PHASE_GAMMA/SPRINT_4_CHECKLIST.md`


## Sprint Gamma 5: Pilot Activation & Tuning (Planned)

### Decomposition Order
- [x] S5.1 Feature Flags Foundation: advisory pilot flags by `companyId` and optional `userId` scope.
- [x] S5.2 Pilot Eligibility API: endpoints to enable/disable pilot cohort with mandatory audit trail.
- [x] S5.3 Telegram/Web Enforcement: advisory visibility/actions only for pilot-enabled actors.
- [x] S5.4 Ranking Tuning Config: externalized thresholds for `ALLOW/REVIEW/BLOCK` + change history.
- [x] S5.5 Prompt Fatigue Guard: dedup + cooldown rules for repetitive recommendations.
- [x] S5.6 SLO Metrics Pipeline: latency, error rate, recommendation coverage, accept/reject conversion.
- [x] S5.7 Advisory Ops Dashboard: operational view + basic alerting thresholds.
- [x] S5.8 Incident Runbook Hooks: kill-switch and rollback procedure validation.

### Validation Plan
- [ ] Add >=8 tests for flags, pilot enforcement, tuning config updates, anti-spam and kill-switch behavior.
- [ ] Ensure no regression in Sprint 4 explainability/confirmation flow.
- [ ] Confirm tenant-safety and traceability for all new write operations (`companyId`, `traceId`).

## Sprint Gamma 6: Hardening & Controlled Go-Live (Planned)

### Decomposition Order
- [x] S6.1 Canary Rollout Protocol: staged enablement `10% -> 25% -> 50% -> 100%` with strict gate criteria.
- [x] S6.2 Rollout Controls: auto-stop + rollback triggers for SLO degradation and incident thresholds.
- [x] S6.3 Load & Stress Campaign: advisory baseline run completed (`10 VU / 30s`, error 0, p95 409ms, p99 726ms).
- [x] S6.4 Reliability Hardening: state caches + invalidation added, stress runs (`25/50 VU`) passed within SLO.
- [x] S6.5 Operational Readiness: on-call drill executed (`drill:advisory:oncall`), escalation and runbook path validated.
- [x] S6.6 DR Drill: executed (`drill:advisory:dr`), rollback to S1 validated, RTO/RPO captured.
- [x] S6.7 Final Go/No-Go: decision recorded (`GO`) with evidence package and staged governance for `S4`.
- [x] S6.4.a Advisory state cache hardening: TTL cache + invalidation for pilot/rollout/kill-switch reads (`advisory.service.ts`).

### Validation Plan
- [ ] Add >=10 tests (unit/integration/e2e) for canary hooks, rollback logic, resilience and incident paths.
- [ ] Validate P95/P99 latency, error rate, coverage/conversion against Sprint 6 SLO targets.
- [ ] Prove rollback and kill-switch behavior during live canary stage.
- [ ] Confirm no regression in explainability, human confirmation and audit-trail chain.

### Artifacts
- [x] S6.POL1 Canary Rollout Protocol: `docs/04-ENGINEERING/ADVISORY_CANARY_ROLLOUT_PROTOCOL.md`
- [x] S6.DEC1 Go/No-Go Decision Record: `docs/04-ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md`
- [x] S6.REP0 Load/Stress Report Template: `docs/04-ENGINEERING/ADVISORY_LOAD_STRESS_REPORT.md`
- [x] S6.REP1 On-call Drill Report: `docs/04-ENGINEERING/ADVISORY_ONCALL_DRILL_REPORT_2026-02-08.md`
- [x] S6.REP2 DR Rehearsal Report: `docs/04-ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md`
- [x] S6.SEC1 Security Gate Report: `docs/04-ENGINEERING/ADVISORY_SECURITY_GATE_REPORT_SPRINT6.md`

## Post-Sprint 6: Controlled Launch Monitoring

- [x] P6.MON1 S3 Monitoring Window Doc: `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_WINDOW.md`
- [x] P6.MON2 S3 Monitoring Snapshot: `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_SNAPSHOT_2026-02-08.md`
- [x] P6.GATE1 S4 Gate Packet Template: `docs/04-ENGINEERING/ADVISORY_S4_GATE_PACKET_TEMPLATE.md`
- [x] P6.MON3 S3 Monitoring Log Pipeline: `monitor:advisory:s3:collect` + `monitor:advisory:s3:summarize`
- [x] P6.MON4 S3 Monitoring Aggregated Report: `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_REPORT.md`
- [x] P6.GATE2 S4 Gate Packet Draft: `docs/04-ENGINEERING/ADVISORY_S4_GATE_PACKET_DRAFT_2026-02-08.md`
- [x] P6.GATE3 S4 Gate Evaluator Input: `docs/04-ENGINEERING/ADVISORY_S4_GATE_DECISION_INPUT.md` (current result: `GO`)
- [x] P6.MON5 S3 Monitoring Full Cycle Command: `pnpm --dir apps/api run monitor:advisory:s3:cycle`
- [x] P6.MON6 S3 Monitoring Checkpoint: cycle updated to `20` PASS snapshots, evaluator result `GO` (DEV gate `>=20` passed)




- [x] S5.RB1 Incident Runbook Doc: `docs/04-ENGINEERING/ADVISORY_INCIDENT_RUNBOOK.md`
- [x] S5.POL1 Pilot Rollout Policy: `docs/04-ENGINEERING/ADVISORY_PILOT_ROLLOUT_POLICY.md`
- [x] S5.POL2 Tuning Policy: `docs/04-ENGINEERING/ADVISORY_TUNING_POLICY.md`
- [x] S5.RB2 Incident Tabletop Protocol: `docs/04-ENGINEERING/ADVISORY_INCIDENT_TABLETOP_PROTOCOL.md`


- [x] P6.GATE4 S4 Promote Executed: rollout promoted S3 -> S4 (100%) via advisory API
- [x] P6.SMOKE1 S4 Post-Promote Smoke: key advisory endpoints returned 200 (docs/04-ENGINEERING/ADVISORY_S4_PROMOTION_SMOKE_REPORT_2026-02-08.md)
