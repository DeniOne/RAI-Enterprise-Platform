# Task: RAI_EP

## Sprint Gamma 1 (Infrastructure) вњ…
- [x] K8s Setup
- [x] Secrets Management
- [x] Trace ID Propagation

## Sprint Gamma 2 (Baseline II) вњ…
- [x] Knowledge Graph MVP
- [x] Vision AI Baseline
- [x] Satellite Ingestion

## Consulting Expansion (Phase Gamma) вњ…

### Track 5: Yield & KPI Engineering вњ…
- [x] **Backend Hardening**: implementation of `YieldOrchestrator` and `HarvestResultRepository`.
- [x] **Deterministic KPI**: added financial snapshotting (actual costs, budget version) to `HarvestResult`.
- [x] **API Integration**: created `ConsultingController` endpoints for yield recording and KPI retrieval.
- [x] **Frontend (Yield)**: developed `yield/page.tsx` with production form and active plan selection.
- [x] **Frontend (KPI)**: integrated `KpiCard` into `plans/page.tsx` for real-time ROI/Yield visualization.
- [x] **Verification**: implemented unit tests for orchestration logic and fixed type stability issues.

## Sprint Gamma 3: Cognitive Memory вњ…
- [x] Episodic Retrieval Service
- [x] Positive/Negative Engrams
- [x] Shadow Advisory Logic

## Sprint Gamma 4: Explainability & UX вњ…
- [x] Explainability v2
- [x] Telegram Recommendation Cards
- [x] Web Recommendation Panel

## Sprint Gamma 5: Pilot & Tuning вњ…
- [x] Incident Runbook
- [x] Pilot Activation (Cohort 1)
- [x] Ranking Tuning

## Sprint Gamma 6: Hardening & Go-Live вњ…
- [x] Canary Rollout Protocol
- [x] Load & Stress Campaign
- [x] Go-Live (S3 50%)

## Level E: Contract-Driven Regenerative Engine вњ… <!-- id: 12 -->
- [x] **Governance (I41)**: Seasonal/Multi-Year/Managed contract mapping <!-- id: 12.1 -->
- [x] **MOS Evolution**: Dynamic weights gated to MANAGED mode <!-- id: 12.2 -->
- [x] **Risk Matrix (R1-R4)**: P05 Tail Risk calculation for Soil/Bio <!-- id: 12.3 -->
- [x] **Escalation (I34)**: Delegated Authority locks + Committee alerts <!-- id: 12.4 -->
- [x] **Audit Trait**: Liability tagging (CONSULTANT_ONLY for Managed) <!-- id: 12.5 -->
- [x] **Safety Audit**: Strictly gated optimization logic <!-- id: 12.6 -->
- [x] **Walkthrough**: Final proof-of-work delivered <!-- id: 12.7 -->

## Sprint Gamma 7: Stabilization & Exit (Complete) рџљЂ
- [x] S7.PLAN1 Sprint 7 checklist created
- [x] S7.PLAN2 Sprint index updated
- [x] **Phase 5 (Cash Flow Engine) Hardening & Integration** вњ…
- [x] S7.WP1 S4 Observability Sweep
- [x] S7.WP6 Gamma Exit Packet Drafting

---
**РРўРћР“:** РћСЃРЅРѕРІРЅС‹Рµ С„СѓРЅРєС†РёРѕРЅР°Р»СЊРЅС‹Рµ С‚СЂРµРєРё Р¤Р°Р· 1-5 СѓСЃРїРµС€РЅРѕ Р·Р°РІРµСЂС€РµРЅС‹ Рё Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕ Р·Р°РєСЂРµРїР»РµРЅС‹.

## Р­РєСЃС‚СЂРµРЅРЅРѕРµ РёСЃРїСЂР°РІР»РµРЅРёРµ: РћС€РёР±РєР° Р·Р°РїСѓСЃРєР° Telegram Bot (P0) вњ… <!-- id: 9 -->
- [x] **РР·РѕР»СЏС†РёСЏ Р±РѕС‚Р° РѕС‚ Prisma**: РџРѕР»РЅРѕРµ СѓРґР°Р»РµРЅРёРµ РїСЂСЏРјРѕР№ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё Р±РѕС‚Р° РѕС‚ Р‘Р” <!-- id: 9.1 -->
  - [x] РСЃРїСЂР°РІР»РµРЅРёРµ backend API (РѕРїС†РёРѕРЅР°Р»СЊРЅС‹Р№ companyId РґР»СЏ СЂР°СЃСЃС‹Р»РѕРє) <!-- id: 9.1.1 -->
  - [x] Р РµС„Р°РєС‚РѕСЂРёРЅРі `BotInternalController` РЅР° РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ `ApiClient` <!-- id: 9.1.2 -->
  - [x] РЈРґР°Р»РµРЅРёРµ `PrismaModule` Рё `PrismaService` РёР· РєРѕРґР° Р±РѕС‚Р° <!-- id: 9.1.3 -->
  - [x] Р’РµСЂРёС„РёРєР°С†РёСЏ СѓСЃРїРµС€РЅРѕРіРѕ Р·Р°РїСѓСЃРєР° Р±РѕС‚Р° РІ watch mode <!-- id: 9.1.4 -->

## Р­РєСЃС‚СЂРµРЅРЅРѕРµ РёСЃРїСЂР°РІР»РµРЅРёРµ: РћС€РёР±РєР° СЃРІРµСЂРєРё Р»РµРґР¶РµСЂР° (MISSING_LEDGER_ENTRIES) вњ… <!-- id: 10 -->
- [x] **Settlement Guard**: Р—Р°РїСЂРµС‚ СЃРѕР·РґР°РЅРёСЏ СЂР°СЃС‡РµС‚РЅС‹С… СЃРѕР±С‹С‚РёР№ Р±РµР· РїСЂРѕРІРѕРґРѕРє <!-- id: 10.1 -->
- [x] **Idempotency Recovery**: РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РїСЂРѕРІРѕРґРѕРє РїСЂРё РїРѕРІС‚РѕСЂРµ СЃРѕР±С‹С‚РёСЏ-С„Р°РЅС‚РѕРјР° <!-- id: 10.2 -->
- [x] **Reconciliation Telemetry**: Р”РѕР±Р°РІР»РµРЅРёРµ РјРµС‚Р°РґР°РЅРЅС‹С… (`replayKey`) РІ Р°Р»РµСЂС‚С‹ СЃРІРµСЂРєРё <!-- id: 10.3 -->
- [x] **Verification**: РџСЂРѕРІРµСЂРєР° РїСЂР°РІРёР» Р°С‚С‚СЂРёР±СѓС†РёРё Рё СЃС‚СЂРµСЃСЃ-С‚РµСЃС‚ РїРѕРґ РЅР°РіСЂСѓР·РєРѕР№ <!-- id: 10.4 -->

## Level C: Industrial-Grade Contradiction Engine вњ… <!-- id: 11 -->
- [x] **Persistence (I31)**: GovernanceConfig, DivergenceRecord, OVERRIDE_ANALYSIS enum <!-- id: 11.1 -->
- [x] **DivergenceTracker (I31)**: SHA256 idempotencyKey, RFC 8785, Prisma.$transaction <!-- id: 11.2 -->
- [x] **OverrideRiskAnalyzer (I29)**: О”Risk, defensive fallback, Hash Pipeline <!-- id: 11.3 -->
- [x] **CounterfactualEngine (I30)**: Deterministic simulation, roundHalfToEven(8) <!-- id: 11.4 -->
- [x] **ConflictMatrix (I29)**: DIS formula, Zero-Denominator Safeguard <!-- id: 11.5 -->
- [x] **Explainability (I32)**: ACCEPT/REVIEW/REJECT recommendations <!-- id: 11.6 -->
- [x] **FSM Governance Guard (I33)**: DivergenceRecord gate + DIS > 0.7 justification <!-- id: 11.7 -->
- [x] **Industrial Guardrails**: 1000-run determinism, policy chaos, drift detection <!-- id: 11.8 -->
- [x] **E2E Override Pipeline**: Full cycle verified (7 С‚РµСЃС‚РѕРІ) <!-- id: 11.9 -->
- [x] **Total: 50 С‚РµСЃС‚РѕРІ PASS** <!-- id: 11.10 -->

## Level F: Industry Cognitive Standard (Trust Infrastructure) рџљЂ <!-- id: 13 -->
- [x] **01_ARCHITECTURE** <!-- id: 13.1 -->
  - [x] `LEVEL_F_CONCEPT.md` (Hardened v2)
  - [x] `LEVEL_F_COMPOSITION.md`
  - [x] `LEVEL_F_INVARIANTS.md` (Hardened v2)
  - [x] `LEVEL_F_DATA_MODEL.md` (Hardened v2)
  - [x] `LEVEL_F_TRUST_MODEL.md`
- [x] **02_DOMAINS** <!-- id: 13.2 -->
  - [x] `F_CERTIFICATION_MODEL.md` (Hardened v2)
  - [x] `F_FARM_RATING_MODEL.md` (Hardened v2)
  - [x] `F_INSURANCE_INTERFACE.md`
  - [x] `F_FINANCIAL_SIGNAL_MODEL.md`
- [x] **03_PRODUCT** <!-- id: 13.3 -->
  - [x] `LEVEL_F_PRODUCT_OVERVIEW.md`
  - [x] `LEVEL_F_API_SPEC.md`
  - [x] `LEVEL_F_EXPLAINABILITY.md`
- [x] **04_ENGINEERING** <!-- id: 13.4 -->
  - [x] `F_SNAPSHOTTER_ARCH.md`
  - [x] `F_RATING_ENGINE_ARCH.md`
  - [x] `F_CERT_ENGINE_ARCH.md`
  - [x] `F_INSURANCE_API_ARCH.md`
  - [x] `F_SECURITY_MODEL.md` (Hardened v2)
- [x] **06_METRICS** <!-- id: 13.5 -->
  - [x] `F_SUCCESS_METRICS.md`
  - [x] `F_RISK_MONITORING.md`
- [x] **07_EXECUTION** <!-- id: 13.6 -->
  - [x] `DELTA_ROADMAP.md`
  - [x] `DELTA_ROLLOUT_PLAN.md`
  - [x] `DELTA_GOVERNANCE_APPROVAL.md`

## Institutional Frontend Phase 4: Deterministic Impact Engine вњ… <!-- id: 14 -->
- [x] **Snapshot Hashing (I30)**: RFC8785 Canonical Serialization + SHA-256 <!-- id: 14.1 -->
- [x] **Deterministic Graph**: Lexicographical BFS for escalation paths (Invariant-4.3) <!-- id: 14.2 -->
- [x] **FSM Hardening**: Mandatory re-analysis cycle after conflict resolution <!-- id: 14.3 -->
- [x] **UI Verification**: Evidence of hardening (hash display) in `GovernanceTestButton` <!-- id: 14.4 -->
- [x] **Replay Integrity**: `InstitutionalReplay.test.ts` verified (10/10 Grade) <!-- id: 14.5 -->

## Frontend Menu Workstream: Управление Урожаем - COMPLETE (MVP)
- [x] Documented button behavior and UX contract in docs/10_FRONTEND_MENU_IMPLEMENTATION/01_MENU_Управление_Урожаем.md
- [x] Implemented live dashboard interactions and deep-link navigation
- [x] Implemented smart routing with entity highlighting on target pages
- [x] Added reusable hook useEntityFocus for cross-page consistency
- [ ] Production-ready debt remains per checklist: real API metrics, text encoding cleanup, E2E route test

## Frontend Menu Workstream: CRM Counterparties Button - COMPLETE (MVP)
- [x] Created and filled doc by template (PROMPT_BUTTON_SCREEN_TEMPLATE)
- [x] Implemented click routes on CRM dashboard and target sub-pages
- [x] Implemented loading/empty/error/permission states
- [x] Implemented smart routing ?entity=... with highlight + auto-scroll
- [x] Added executive block: latest 5 added counterparties
- [ ] Production-ready debt: e2e route scenario, encoding cleanup, full API metrics

## Frontend Menu Workstream: CRM Counterparties Button - PRODUCTION CLOSURE COMPLETE
- [x] Upgraded to full CRM management screen (not informational only)
- [x] Implemented hierarchy actions for `Holding` and `Legal Entity`
- [x] Added backend APIs `GET /crm/accounts/:id/workspace` and `PATCH /crm/accounts/:id`
- [x] Added registry filters (`type`, `status`, `risk`, `responsible`)
- [x] Added card tabs + CRUD for contacts/interactions/obligations
- [x] Added responsible picker from company users directory
- [x] Added backend freeze-guard validation and API test coverage
- [x] Synced production docs/checklists to DONE status

