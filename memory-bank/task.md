# Sprint B6: Unified Risk Engine 🛡️

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

### Phase Beta Exit & Beta+ Implementation 🏁
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
