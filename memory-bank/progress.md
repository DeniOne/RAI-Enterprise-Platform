## Milestone 39: Institutional Commerce Core - DONE
**Date:** 2026-02-25
- [x] Added isolated commerce data model with `Commerce*` prefix and strict tenant composite constraints.
- [x] Implemented domain services: `IntercompanyService`, `CommerceContractService`, `FulfillmentService`, `BillingService`.
- [x] Added DTO validation layer and HTTP workflow endpoints in `CommerceController`.
- [x] Added E2E runtime test covering: Contract -> Obligation -> Fulfillment -> Invoice POST -> Payment CONFIRM -> Allocation -> AR Balance.
- [x] Synchronized DB migrations and applied `commerce_core` migration chain on dev database.
# Progress: RAI_EP

## Milestone 26: Dev Runtime Acceleration & S3 Recovery - DONE
**Р”Р°С‚Р°:** 2026-02-23
- [x] Frontend dev runtime accelerated (`next dev --turbo`) with reduced heavy transpilation in dev mode.
- [x] UX loading visibility improved (route loading state + sidebar transition indicator).
- [x] Backend startup stabilized (Prisma generate lock resolved; tsbuildinfo reset guidance validated).
- [x] Local MinIO/S3 auth aligned (`MINIO_ACCESS_KEY`/`MINIO_SECRET_KEY`) and S3 connection error removed.
- [x] Root launch scripts updated (`run_web.bat`, `run_api.bat`, `start_all.bat`) for consistent local startup.

## Milestone 25: Phase 1-7 Institutional Closure - DONE
**Р”Р°С‚Р°:** 2026-02-23
- [x] РЎРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹ С‡РµРєР»РёСЃС‚С‹ roadmap Рё hardening audit.
- [x] Memory bank РѕР±РЅРѕРІР»РµРЅ РїРѕРґ С„Р°РєС‚РёС‡РµСЃРєРёР№ СЃС‚Р°С‚СѓСЃ Р·Р°РІРµСЂС€РµРЅРёСЏ РґРѕ Phase 7.
- [x] РђРєС‚СѓР°Р»РёР·РёСЂРѕРІР°РЅ verification snapshot: web lint/test, api build/test, replay determinism.

## Milestone 1-8: Completed (Review activeContext.md for details)

## Milestone 9: Task Engine & Telegram Integration - DONE
- [x] Schema: `Task` and `TaskResourceActual` models implemented.
- [x] Logic: Task generation from season stage transitions.
- [x] Telegram: Auth by `telegramId` (fixed admin ID typo).
- [x] Telegram: Commands `/start` and `/mytasks` with interactive buttons.
- [x] Bot Fixes: Corrected async return types and `ctx.reply` handling.
- [x] Sprint 5a: Architecture Debt (Multi-tenancy + Auth Repository)
- [x] Infrastructure: Port 5432 DB unification (Docker).
- [x] Orchestration: Created `run_bot.bat` for project root.

## Milestone 10: Web Interface (Sprint 4) - DONE вњ…
**Р”Р°С‚Р°:** 2026-02-03  
**Sprint:** 4 (05.08 - 19.08)  
**Commit:** [ca9fa7e4](https://github.com/DeniOne/RAI-Enterprise-Platform/commit/ca9fa7e4)

- [x] **Next.js 14 App Router:** РЎРѕР·РґР°РЅР° СЃС‚СЂСѓРєС‚СѓСЂР° `apps/web` СЃ TypeScript, Tailwind CSS, ESLint
- [x] **Auth Module РІ NestJS API:** JWT Strategy, Auth Service, Auth Controller, Users Controller
- [x] **JWT Authentication:** HttpOnly cookies, Route Handlers, Edge Middleware
- [x] **UI Kit:** Button, Card, Input РєРѕРјРїРѕРЅРµРЅС‚С‹ РїРѕ UI Design Canon (font-medium, rounded-2xl, bg-white)
- [x] **Dashboard:** Server Component СЃ РјРµС‚СЂРёРєР°РјРё (Р·Р°РґР°С‡Рё, РїРѕР»СЏ, СЃРµР·РѕРЅС‹), fetch СЃ Authorization header
- [x] **Task Creation Form:** Client Component СЃ react-hook-form + zod, РІР°Р»РёРґР°С†РёСЏ РЅР° СЂСѓСЃСЃРєРѕРј
- [x] **Build & Lint:** РЈСЃРїРµС€РЅРѕ (0 errors, 0 warnings)
- [x] **Manual Verification:** E2E Flow РїСЂРѕРІРµСЂРµРЅ (Login в†’ Dashboard в†’ СЂР°Р±РѕС‚Р°РµС‚ вњ…)
- [x] **Documentation:** UI_DESIGN_CANON.md v0.1, DECISIONS.log (SPRINT4-WEB-001, UI-CANON-001), walkthrough.md
- [x] **Language Policy:** Р’СЃРµ С‚РµРєСЃС‚С‹ РёРЅС‚РµСЂС„РµР№СЃР° РЅР° СЂСѓСЃСЃРєРѕРј СЏР·С‹РєРµ



## Milestone 11: Telegram Microservice & Auth Stability - DONE вњ…
**Р”Р°С‚Р°:** 2026-02-04  
- [x] **Microservice Separation**: Р‘РѕС‚ РІС‹РґРµР»РµРЅ РІ РѕС‚РґРµР»СЊРЅРѕРµ РїСЂРёР»РѕР¶РµРЅРёРµ `apps/telegram-bot`.
- [x] **JWT Stability**: РСЃРїСЂР°РІР»РµРЅ Payload (РїРѕР»Рµ `sub`), РІРЅРµРґСЂРµРЅ `registerAsync` РґР»СЏ СЃРµРєСЂРµС‚РѕРІ.
- [x] **2FA Auth Flow**: РСЃРїСЂР°РІР»РµРЅС‹ РѕС€РёР±РєРё 404/401 РїСЂРё РїРѕР»Р»РёРЅРіРµ СЃРµСЃСЃРёР№.
- [x] **Design Canon Adherence**: UI СЃС‚СЂР°РЅРёС†С‹ РІС…РѕРґР° РІ РўРµР»РµРіСЂР°Рј РїРµСЂРµРїРёСЃР°РЅ РїРѕРґ Р»Р°Р№С‚-РјРёРЅРёРјР°Р»РёР·Рј (Geist, #FAFAFA).
- [x] **Walkthrough & Memory**: Р’СЃРµ С‚РµС…РЅРёС‡РµСЃРєРёРµ СѓСЂРѕРєРё Р·Р°РїРёСЃР°РЅС‹ РІ Memory Bank.
- [x] CRM Integration в†’ Phase Beta
- [x] HR Ecosystem в†’ Phase Beta
- [x] Supply Chain в†’ Phase Beta

## Milestone 15: Unified Frontend & Auth Fix вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-09
- [x] **Unified Architecture**: Р РµР°Р»РёР·РѕРІР°РЅ `AuthenticatedLayout` РєР°Рє РµРґРёРЅС‹Р№ РєРѕРЅС‚РµР№РЅРµСЂ РґР»СЏ РІСЃРµС… РјРѕРґСѓР»РµР№.
- [x] **Sidebar Logic**: РЎР°Р№РґР±Р°СЂ РїРµСЂРµРЅРµСЃРµРЅ РІ `navigation`, РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅ СЃ `role-config.ts` Рё РєРѕСЂСЂРµРєС‚РЅРѕ РѕС‚РѕР±СЂР°Р¶Р°РµС‚ РјРѕРґСѓР»Рё РґР»СЏ РІСЃРµС… СЂРѕР»РµР№ (РґРѕР±Р°РІР»РµРЅР° СЂРѕР»СЊ РІ РїСЂРѕС„РёР»СЊ Р±СЌРєРµРЅРґР°).
- [x] **Module Skeletons**: РЎРѕР·РґР°РЅС‹ Р»РµР№Р°СѓС‚С‹ Рё СЃС‚СЂР°РЅРёС†С‹-Р·Р°РіР»СѓС€РєРё РґР»СЏ РІСЃРµС… 7 Р±РёР·РЅРµСЃ-РјРѕРґСѓР»РµР№ (HR, РћР¤РЎ, Р­РєРѕРЅРѕРјРёРєР°, Р¤РёРЅР°РЅСЃС‹, GR, РџСЂРѕРёР·РІРѕРґСЃС‚РІРѕ, Front-office).
- [x] **Auth Stability**: РЈСЃС‚СЂР°РЅРµРЅР° РїСЂРѕР±Р»РµРјР° Redirect Loop. РСЃРїСЂР°РІР»РµРЅС‹ СЌРЅРґРїРѕРёРЅС‚С‹ (`/users/me`), РїРѕСЂС‚С‹ (4000) Рё Р»РѕРіРёРєР° С„РѕСЂРјРёСЂРѕРІР°РЅРёСЏ URL РІ `auth-server.ts`.
- [x] **Light Theme**: Р—Р°РІРµСЂС€С‘РЅ СЂРµРґРёР·Р°Р№РЅ Dashboard Рё Strategic РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРё СЃ UI Design Canon (Geist 400/500, #FAFAFA).
- [x] **Consulting Navigation**: РџРѕР»РЅС‹Р№ СЂРµС„Р°РєС‚РѕСЂРёРЅРі `Sidebar.tsx` Рё `navigation-policy.ts` РїРѕРґ РєР°РЅРѕРЅРёС‡РµСЃРєСѓСЋ РјРѕРґРµР»СЊ.

## Milestone 12: Phase Alpha Closure вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-04  
**РЎС‚Р°С‚СѓСЃ:** PHASE ALPHA COMPLETE

- [x] **Task Engine REST API**: 5 endpoints (`/tasks/my`, `/tasks/:id`, start/complete/cancel)
- [x] **Audit API**: `findAll`, `findById`, pagination, filtering
- [x] **Telegram Bot v1**: Task handlers Р°РєС‚РёРІРёСЂРѕРІР°РЅС‹ (Р±РµР· С„РѕС‚Рѕ-С„РёРєСЃР°С†РёРё)
- [x] **APL Orchestrator**: 16-stage FSM РґР»СЏ СЃРµР·РѕРЅРѕРІ СЂР°РїСЃР°
- [x] **Documentation**: SCOPE, WBS, Technical Plan РѕР±РЅРѕРІР»РµРЅС‹

### РђСЂС…РёС‚РµРєС‚СѓСЂРЅС‹Р№ Р°СѓРґРёС‚:
- вњ… Service = IO (СЃРѕР±Р»СЋРґР°РµС‚СЃСЏ)
- вњ… Orchestrator = Brain (AgroOrchestratorService)
- вљ пёЏ Tech Debt: Prisma РІ Р±РѕС‚Рµ, in-memory tokens в†’ Sprint B0

---

## Phase Beta: Implementation & Scale

### Sprint B0: Tech Debt & Resilience вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-04  
- [x] **Unified FSM**: Р РµР°Р»РёР·РѕРІР°РЅ С‡РёСЃС‚С‹Р№ event-driven РїР°С‚С‚РµСЂРЅ РґР»СЏ Task Рё Season. РџРµСЂРµРІРµРґРµРЅРѕ 29 С‚РµСЃС‚РѕРІ.
- [x] **Redis Sessions**: РҐСЂР°РЅРµРЅРёРµ СЃРµСЃСЃРёР№ Р±РѕС‚Р° РїРµСЂРµРЅРµСЃРµРЅРѕ РёР· РїР°РјСЏС‚Рё РІ Redis.
- [x] **Bot Isolation**: Р‘РѕС‚ РїРѕР»РЅРѕСЃС‚СЊСЋ РѕС‚СЂРµР·Р°РЅ РѕС‚ Prisma. Р’СЃРµ РґР°РЅРЅС‹Рµ С‡РµСЂРµР· ApiClient.
- [x] **Resilience**: РЈРјРЅС‹Рµ СЂРµС‚СЂР°Рё, Circuit Breaker Рё РёРґРµРјРїРѕС‚РµРЅС‚РЅРѕСЃС‚СЊ РІ ApiClient.

### Sprint B1: Consulting Control Plane & Risk вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-04
- [x] **Tech Map Orchestration**: Р РµР°Р»РёР·РѕРІР°РЅ `TechMapService` (canvas logic) Рё РґРѕРјРµРЅРЅР°СЏ РјРѕРґРµР»СЊ (РЅРµ JSON).
- [x] **CMR Domain**: Р’РЅРµРґСЂРµРЅ С‚СЂРµС…СЃС‚РѕСЂРѕРЅРЅРёР№ РјРµС…Р°РЅРёР·Рј СЃРѕРіР»Р°СЃРѕРІР°РЅРёСЏ (`DeviationReview`) СЃ FSM.
- [x] **Strategic Risk**: Р РµР°Р»РёР·РѕРІР°РЅР° РјРѕРґРµР»СЊ Р›РёРґРµСЂСЃС‚РІР° Р РёСЃРєРѕРІ (`CmrRisk`) Рё СЃРІСЏР·РєР° СЃ `InsuranceCoverage`.
- [x] **SLA Automation**: Р РµР°Р»РёР·РѕРІР°РЅ РїР°С‚С‚РµСЂРЅ "Silence as Event" (Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ СЃРґРІРёРі РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё РЅР° РєР»РёРµРЅС‚Р° С‡РµСЂРµР· 48С‡).
- [x] **Architecture**: РњРѕРґСѓР»Рё `CmrModule` Рё `TechMapModule` РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹ РІ API.

### Sprint B2: HR Ecosystem & Strategic Alignment вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-05
- [x] **3-Contour HR Model**: Р РµР°Р»РёР·РѕРІР°РЅС‹ Foundation (Lifecycle), Incentive (OKR, KPI, Recognition, Reward) Рё Development (Pulse, Assessment).
- [x] **Event-driven Projection**: `EmployeeProfile` РїРµСЂРµРІРµРґРµРЅ РЅР° РјРѕРґРµР»СЊ РїСЂРѕРµРєС†РёРё РІРЅРµС€РЅРёС… С„Р°РєС‚РѕРІ. РСЃРєР»СЋС‡РµРЅС‹ PII (РёРјРµРЅР°), РІРЅРµРґСЂРµРЅ `orgUnitId` РґР»СЏ СѓРїСЂР°РІР»РµРЅС‡РµСЃРєРѕРіРѕ РєРѕРЅС‚РµРєСЃС‚Р°.
- [x] **Probabilistic Assessments**: Р’РЅРµРґСЂРµРЅ `HumanAssessmentSnapshot` СЃ СѓСЂРѕРІРЅРµРј СѓРІРµСЂРµРЅРЅРѕСЃС‚Рё (confidence level) РєР°Рє РѕРЅС‚РѕР»РѕРіРёС‡РµСЃРєР°СЏ Р±Р°Р·Р°.
- [x] **Strategic CMR Integration**: `RiskService` (CMR) РЅР°РїСЂСЏРјСѓСЋ РїРѕС‚СЂРµР±Р»СЏРµС‚ HR-СЃРёРіРЅР°Р»С‹ С‡РµСЂРµР· СЂРµРїРѕР·РёС‚РѕСЂРёР№ СЃРЅРµРїС€РѕС‚РѕРІ (РґРµРєР°РїР»РёРЅРі).
- [x] **Schema**: Prisma schema РѕР±РЅРѕРІР»РµРЅР°, РїРѕС‡РёС‰РµРЅС‹ СЃРёСЂРѕС‚СЃРєРёРµ СЃРІСЏР·Рё, РєР»РёРµРЅС‚ СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅ.

### Sprint B3: Finance & Economy (CFO Control Plane) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-05
- [x] **Economy Core**: Р’РЅРµРґСЂРµРЅР° РјРѕРґРµР»СЊ `EconomicEvent` Рё РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅР°СЏ Р°С‚СЂРёР±СѓС†РёСЏ Р·Р°С‚СЂР°С‚ (`CostAttributionRules`).
- [x] **Immutable Ledger**: Р РµР°Р»РёР·РѕРІР°РЅС‹ `LedgerEntry` РєР°Рє РЅРµРёР·РјРµРЅСЏРµРјС‹Рµ РїСЂРѕРµРєС†РёРё С„Р°РєС‚РѕРІ. РњСѓС‚Р°С†РёРё Р·Р°РїСЂРµС‰РµРЅС‹ РЅР° СѓСЂРѕРІРЅРµ РґРѕРјРµРЅР°.
- [x] **Finance Core**: Р‘СЋРґР¶РµС‚РЅРѕРµ СѓРїСЂР°РІР»РµРЅРёРµ С‡РµСЂРµР· FSM (`BudgetStatus`) Рё С‡РёСЃС‚С‹Рµ РїРѕР»РёС‚РёРєРё Р»РёРјРёС‚РѕРІ.
- [x] **Liquidity Radar**: Р РµР°Р»РёР·РѕРІР°РЅ СЃРµСЂРІРёСЃ РїСЂРѕРіРЅРѕР·РёСЂРѕРІР°РЅРёСЏ Р»РёРєРІРёРґРЅРѕСЃС‚Рё (Cash Balance + Obligations).
- [x] **CFO Quality Gate**: РџСЂРѕР№РґРµРЅС‹ State-С‚РµСЃС‚С‹ РґР»СЏ FSM Рё Unit-С‚РµСЃС‚С‹ РґР»СЏ РїСЂР°РІРёР» Р°С‚СЂРёР±СѓС†РёРё. Р¤РѕСЂРјР°Р»РёР·РѕРІР°РЅ СЃС‚СЂРµСЃСЃ-СЃС†РµРЅР°СЂРёР№ (P&L+ / Cash-).
- [x] **Integrations**: РЎРєРІРѕР·РЅР°СЏ СЃРІСЏР·РєР° `Task` -> `EconomicEvent` С‡РµСЂРµР· `IntegrationService`.

- [x] **Integrations**: РЎРєРІРѕР·РЅР°СЏ СЃРІСЏР·РєР° `Task` -> `EconomicEvent` С‡РµСЂРµР· `IntegrationService`.

### Sprint B3.5: Vertical Integrity Check (Core Slices) вЂ” IN PROGRESS рџљЂ
**Р¦РµР»СЊ:** РџСЂРѕР±СЂРѕСЃРёС‚СЊ С„РёР·РёС‡РµСЃРєРёРµ РёРЅС‚РµСЂС„РµР№СЃС‹ (Web + Telegram) РґР»СЏ РјРѕРґСѓР»РµР№ B1, B2, B3.
- [x] **B1 (TechMap)**: Read-only РІРёР·СѓР°Р»РёР·Р°С‚РѕСЂ С‚РµС…РєР°СЂС‚С‹ РІ РІРµР±-РґР°С€Р±РѕСЂРґРµ Рё Telegram-Р±РѕС‚Рµ. **AUDIT PASSED** (2026-02-05).
    - *Р¤РёРєСЃР°С†РёСЏ:* РљРѕРЅС‚СѓСЂ "Р—Р°РґР°С‡Р° -> РўРµС…РєР°СЂС‚Р° -> Р§РµР»РѕРІРµРє" Р·Р°РјРєРЅСѓС‚ С„РёР·РёС‡РµСЃРєРё.
    - *Р РёСЃРєРё:* РћС‚СЃСѓС‚СЃС‚РІРёРµ С„РѕСЂРјР°Р»СЊРЅРѕРіРѕ FSM РґР»СЏ РѕРїРµСЂР°С†РёР№ (UI-driven), СЂРёСЃРє РІРЅРµРґСЂРµРЅРёСЏ РґРѕРјРµРЅРЅРѕР№ Р»РѕРіРёРєРё РІ Р±РѕС‚.
- [x] **B2 (HR)**: РҐРµРЅРґР»РµСЂ Pulse-РѕРїСЂРѕСЃР° РІ РўРµР»РµРіСЂР°Рј-Р±РѕС‚Рµ РґР»СЏ РіРµРЅРµСЂР°С†РёРё СЂРµР°Р»СЊРЅС‹С… СЃРЅРµРїС€РѕС‚РѕРІ. **AUDIT PASSED** (2026-02-05).
- [x] **B3 (Finance)**: Р’РёРґР¶РµС‚С‹ CFO РЅР° РіР»Р°РІРЅРѕРј СЌРєСЂР°РЅРµ (Balance, Burn Rate, Budget Left). **AUDIT PASSED** (2026-02-06).
- [x] **Vertical Integrity Check**: All core slices (B1, B2, B3) are physically integrated via Web & Telegram.

### Sprint B4: Legal AI & GR Automation вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-06
- [x] **Legal Domain Model**: Р“Р»СѓР±РѕРєР°СЏ РѕРЅС‚РѕР»РѕРіРёСЏ (Р”РѕРєСѓРјРµРЅС‚ -> РќРѕСЂРјР° -> РўСЂРµР±РѕРІР°РЅРёРµ -> РћР±СЏР·Р°С‚РµР»СЊСЃС‚РІРѕ -> РЎР°РЅРєС†РёСЏ).
- [x] **Compliance Signaling**: Р”РІРёР¶РѕРє `ComplianceEngine` РґР»СЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ СЂР°СЃС‡РµС‚Р° СЃС‚Р°С‚СѓСЃР° (Р±РµР· Р±Р»РѕРєРёСЂРѕРІРєРё).
- [x] **GR Controller**: Р РµРµСЃС‚СЂ СЂРµРіСѓР»СЏС‚РѕСЂРѕРІ, СЃС‚РµР№РєС…РѕР»РґРµСЂРѕРІ Рё РјРѕРЅРёС‚РѕСЂРёРЅРі СЃРёРіРЅР°Р»РѕРІ РїРѕР»РёС‚РёРєРё.
- [x] **AI Interpretation**: РРЅС‚РµРіСЂР°С†РёСЏ СЃ GigaLegal (РјРѕРє) РґР»СЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРіРѕ РґСЂР°С„С‚Р° РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёР№ РЅРѕСЂРј.
- [x] **Multi-tenancy**: РџРѕР»РЅР°СЏ РёР·РѕР»СЏС†РёСЏ РґР°РЅРЅС‹С… РЅР° СѓСЂРѕРІРЅРµ `companyId`.
- [x] **Architecture Audit**: РџСЂРѕР№РґРµРЅ (Р’РµСЂРґРёРєС‚: ARCHITECTURALLY SOUND).
- [x] **Polishing**: РСЃРїСЂР°РІР»РµРЅС‹ РѕРїРµС‡Р°С‚РєРё РІ СЃС…РµРјРµ, РЅР°Р»Р°Р¶РµРЅР° С‚РёРїРёР·Р°С†РёСЏ Рё РёРјРїРѕСЂС‚С‹ (NodeNext).

### Sprint B5: R&D Engine рџ”¬ вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-06
- [x] **Protocol-first Enforcement**: Р РµР°Р»РёР·РѕРІР°РЅ РёРЅРІР°СЂРёР°РЅС‚ "No Protocol -> No Experiment".
- [x] **Hard-locked FSM**: `ExperimentOrchestrator` РєРѕРЅС‚СЂРѕР»РёСЂСѓРµС‚ РІСЃРµ РїРµСЂРµС…РѕРґС‹ СЃРѕСЃС‚РѕСЏРЅРёР№ Рё Р±Р»РѕРєРёСЂРѕРІРєРё.
- [x] **Post-Analysis Immutability**: РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ Р±Р»РѕРєРёСЂРѕРІРєР° `Measurement` РїРѕСЃР»Рµ РЅР°С‡Р°Р»Р° Р°РЅР°Р»РёР·Р°.
- [x] **Core Logic**: Р’Р°Р»РёРґР°С†РёСЏ РїСЂРѕС‚РѕРєРѕР»РѕРІ Рё Р±Р°Р·РѕРІС‹Р№ СЃС‚Р°С‚РёСЃС‚РёС‡РµСЃРєРёР№ СЃРµСЂРІРёСЃ (STD DEV, Median).
- [x] **API Module**: РџРѕР»РЅС‹Р№ РЅР°Р±РѕСЂ СЌРЅРґРїРѕРёРЅС‚РѕРІ РґР»СЏ РїСЂРѕРіСЂР°РјРј, СЌРєСЃРїРµСЂРёРјРµРЅС‚РѕРІ Рё С‚СЂРёР°Р»РѕРІ.
- [x] **Isolation**: РњРѕРґСѓР»СЊ РїРѕР»РЅРѕСЃС‚СЊСЋ РѕС‚РІСЏР·Р°РЅ РѕС‚ РѕРїРµСЂР°С†РёРѕРЅРЅРѕРіРѕ РєРѕРЅС‚СѓСЂР° (`Task`).

### Sprint B6: Unified Risk Engine рџ›ЎпёЏ вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-07
- [x] **Core Engine**: `@rai/risk-engine` СЃ РґРµС‚РµСЂРјРёРЅРёСЂРѕРІР°РЅРЅРѕР№ FSM.
- [x] **Risk Gates**: Р¤РёР·РёС‡РµСЃРєР°СЏ Р±Р»РѕРєРёСЂРѕРІРєР° РѕРїРµСЂР°С†РёР№ РІ `AgroOrchestrator` Рё `SeasonService`.
- [x] **Decision Traceability**: Р’РЅРµРґСЂРµРЅ `DecisionRecord` РґР»СЏ Р°СѓРґРёС‚Р° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёС… СЂРµС€РµРЅРёР№.
- [x] **Risk Timeline**: РСЃС‚РѕСЂРёСЏ РїРµСЂРµС…РѕРґРѕРІ FSM РІ `RiskStateHistory`.
- [x] **Strategic API**: РРЅС‚РµРіСЂР°С†РёСЏ РІ `StrategicService` СЃ РѕР±СЉСЏСЃРЅРёС‚РµР»СЊРЅС‹Рј СЃР»РѕРµРј (WHY > WHAT).

## Phase Beta: Implementation & Scale вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-08
**РЎС‚Р°С‚СѓСЃ:** PHASE BETA COMPLETE

### Audit Correction & Beta Extension вЂ” DONE вњ…
- [x] РђСѓРґРёС‚ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё vs Р РµР°Р»РёР·Р°С†РёСЏ (Р’С‹СЏРІР»РµРЅРѕ СЂР°СЃС…РѕР¶РґРµРЅРёРµ)
- [x] РЎРѕСЃС‚Р°РІР»РµРЅРёРµ РїР»Р°РЅР° Р·Р°РІРµСЂС€РµРЅРёСЏ С„Р°Р·С‹ Beta
- [x] РСЃРїСЂР°РІР»РµРЅРёРµ РґРѕРєСѓРјРµРЅС‚Р°С†РёРё (SCOPE, WBS, Tech Plan, Progress)
- [x] Р РµР°Р»РёР·Р°С†РёСЏ Field Control (Geo/Photo С„РёРєСЃР°С†РёСЏ С‡РµСЂРµР· AI-Ingestion)
- [x] Р РµР°Р»РёР·Р°С†РёСЏ Supply Chain (РЎРєР»Р°РґС‹ Рё РўРњР¦ РІ Registry)
- [x] Р РµР°Р»РёР·Р°С†РёСЏ Machinery (РўРµС…РЅРёРєР° Рё Р¤Р»РѕС‚ РІ Registry)
- [x] Р РµР°Р»РёР·Р°С†РёСЏ Basic Economics (РЎРІСЏР·РєР° Р°СЃСЃРµС‚РѕРІ СЃ С‚РµС…РєР°СЂС‚РѕР№ Рё Р°РєС‚РёРІР°С†РёРµР№)

## Milestone 13: Knowledge Fabric & UI Polish вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-06
- [x] **Graph Data Pipeline**: Р РµР°Р»РёР·РѕРІР°РЅ `generate-graph.js` РґР»СЏ РїР°СЂСЃРёРЅРіР° СЃРІСЏР·РµР№ РјРµР¶РґСѓ РґРѕРєСѓРјРµРЅС‚Р°РјРё. `pnpm generate:graph` РІРєР»СЋС‡РµРЅ РІ РїР°Р№РїР»Р°Р№РЅ.
- [x] **Knowledge Interface**: UI Р°РґР°РїС‚РёСЂРѕРІР°РЅ РїРѕРґ Contour 1 (Geist Sans, Light Theme). Р СѓСЃРёС„РёРєР°С†РёСЏ 100%.
- [x] **Interactive Graph**: Р РµР°Р»РёР·РѕРІР°РЅ Force Graph СЃ РґРёРЅР°РјРёС‡РµСЃРєРёРј РёРјРїРѕСЂС‚РѕРј (SSR fix) Рё Р»РѕРіРёРєРѕР№ С„РѕРєСѓСЃРёСЂРѕРІРєРё РЅР° "СЃРѕСЃРµРґСЏС…".
- [x] **Database Fixes**: РЈСЃС‚СЂР°РЅРµРЅС‹ СЂР°СЃС…РѕР¶РґРµРЅРёСЏ СЃС…РµРјС‹ Prisma (`cmr_deviation_reviews`).

## Milestone 14: Strategic Frontend (Phase Beta) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-06
- [x] **Strategic Layout**: Р РµР°Р»РёР·РѕРІР°РЅ РјР°РєРµС‚ `(strategic)` Р±РµР· СЃР°Р№РґР±Р°СЂР° СЃ РіР»РѕР±Р°Р»СЊРЅРѕР№ Р±Р»РѕРєРёСЂРѕРІРєРѕР№ Pointer Events.
- [x] **Global State View (GSV-01)**: РђРіСЂРµРіРёСЂРѕРІР°РЅРЅР°СЏ РїР°РЅРµР»СЊ РѕСЃРѕР·РЅР°РЅРЅРѕСЃС‚Рё (Health, Constraints, Escalations).
- [x] **R&D Context View (CTX-RD-01)**: Р’РёР·СѓР°Р»РёР·Р°С†РёСЏ РЅР°СѓС‡РЅРѕРіРѕ РєРѕРЅС‚СѓСЂР° СЃ FSM СЃС‚РµР№С‚Р°РјРё Рё Р·Р°С‰РёС‚РѕР№ РґР°РЅРЅС‹С….
- [x] **Legal Context View (CTX-LGL-01)**: РњРѕРЅРёС‚РѕСЂРёРЅРі РєРѕРјРїР»Р°РµРЅСЃР°, РІРµСЂСЃРёРѕРЅРЅРѕСЃС‚Рё РЅРѕСЂРј Рё РїРѕС‚РµРЅС†РёР°Р»СЊРЅС‹С… СЃР°РЅРєС†РёР№.
- [x] **Explanation Layer**: РЎР»РѕР№ "РџРћР§Р•РњРЈ" РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅ РІРѕ РІСЃРµ РІСЊСЋ РґР»СЏ РёРЅС‚РµСЂРїСЂРµС‚Р°С†РёРё СЃРѕСЃС‚РѕСЏРЅРёР№.
- [x] **Architectural Guards**: РљР»РёРµРЅС‚СЃРєРёР№ `ReadOnlyGuard` Рё СЃС‚СЂРѕРіРёР№ "Read Models Only" РїР°С‚С‚РµСЂРЅ.
- [x] **UX Canon**: 100% СЂСѓСЃРёС„РёРєР°С†РёСЏ РёРЅС‚РµСЂС„РµР№СЃР°, РЅР°РІРёРіР°С†РёСЏ С‡РµСЂРµР· Drill-down, РіР»СѓР±РёРЅР° < 3.

## Milestone 16: Consulting Vertical Slice вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-11
- [x] **Vertical Integrity**: Р РµР°Р»РёР·РѕРІР°РЅ РїРѕР»РЅС‹Р№ С†РёРєР» "Draft Plan -> Active Plan -> Deviation -> Decision -> Archive".
- [x] **Hardening (Optimistic Locking)**: Р’РЅРµРґСЂРµРЅР° Р·Р°С‰РёС‚Р° РѕС‚ race conditions С‡РµСЂРµР· `status: current` РІ `ConsultingService` Рё `DeviationService`.
- [x] **FSM Guards**: РЎС‚СЂРѕРіРёРµ РїСЂР°РІРёР»Р° РїРµСЂРµС…РѕРґРѕРІ СЃС‚Р°С‚СѓСЃРѕРІ СЃ РїСЂРѕРІРµСЂРєРѕР№ СЂРѕР»РµР№ (RBAC) Рё Р±РёР·РЅРµСЃ-РїСЂР°РІРёР» (`ConsultingDomainRules`).
- [x] **Ledger-First Cash Flow**: РљР°СЃСЃР° вЂ” СЌС‚Рѕ РїСЂРѕРµРєС†РёСЏ, Р° РЅРµ С…СЂР°РЅРёР»РёС‰Рµ.
- [x] **Settlement Guard**: Р›СЋР±РѕРµ СЂР°СЃС‡РµС‚РЅРѕРµ СЃРѕР±С‹С‚РёРµ РѕР±СЏР·Р°РЅРѕ РёРјРµС‚СЊ Р»РµРґР¶РµСЂ-РїСЂРѕРµРєС†РёСЋ (Р°С‚РѕРјР°СЂРЅРѕ).
- [x] **10/10 Ledger Hardening**: Р‘Р°Р»Р°РЅСЃРѕРІС‹Р№ СЃР»РѕР№ Рё Р°РІС‚РѕРЅРѕРјРЅР°СЏ РїР°РЅРёРєР° РѕР±СЏР·Р°С‚РµР»СЊРЅС‹.
- [x] **Russian Language Guard**: Р’СЃРµ СЃРёСЃС‚РµРјРЅС‹Рµ СЃРѕРѕР±С‰РµРЅРёСЏ - СЃС‚СЂРѕРіРѕ РЅР° СЂСѓСЃСЃРєРѕРј.
- [x] **Audit Trail**: РљР°Р¶РґРѕРµ РёР·РјРµРЅРµРЅРёРµ СЃС‚Р°С‚СѓСЃР° Рё СЂРµС€РµРЅРёСЏ С„РёРєСЃРёСЂСѓРµС‚СЃСЏ РІ `cmr_decisions` (Immutable).
- [x] **Isolation**: Р”РѕРєР°Р·Р°РЅРЅР°СЏ РёР·РѕР»СЏС†РёСЏ РґР°РЅРЅС‹С… РїРѕ `companyId` Рё `seasonId` (season-isolation.spec.ts).
- [x] **Test Coverage**: 31 Unit Рё Integration С‚РµСЃС‚ passed.
- [x] **Fixes**: РЈСЃС‚СЂР°РЅРµРЅР° РєСЂРёС‚РёС‡РµСЃРєР°СЏ РїСЂРѕР±Р»РµРјР° СЃ РєРѕРґРёСЂРѕРІРєРѕР№ `package.json` (BOM/Invisible chars).

## Milestone 17: Track 1 - TechMap Integration & Production Gate вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-12
- [x] **Production Gate**: Р’РЅРµРґСЂРµРЅ С‡Р°СЃС‚РёС‡РЅС‹Р№ СѓРЅРёРєР°Р»СЊРЅС‹Р№ РёРЅРґРµРєСЃ PostgreSQL РІ С‚Р°Р±Р»РёС†Сѓ `tech_maps` РґР»СЏ РєРѕРЅС‚СЂРѕР»СЏ РµРґРёРЅСЃС‚РІРµРЅРЅРѕСЃС‚Рё `ACTIVE` С‚РµС…РєР°СЂС‚С‹.
- [x] **Migration Stability**: Р Р°Р·СЂРµС€РµРЅ РєРѕРЅС„Р»РёРєС‚ `2BP01` (С‚РёРїС‹ ReviewStatus/InteractionType) С‡РµСЂРµР· CASCADE-СѓРґР°Р»РµРЅРёРµ Рё Р°СѓРґРёС‚ Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№.
- [x] **Drift Resolution**: Р‘Р°Р·Р° РґР°РЅРЅС‹С… СЃР±СЂРѕС€РµРЅР° Рё РїРµСЂРµРІРµРґРµРЅР° РІ С‡РёСЃС‚РѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ.
- [x] **Prisma Client**: Р РµРіРµРЅРµСЂР°С†РёСЏ РєР»РёРµРЅС‚Р° СЃ СѓС‡РµС‚РѕРј РёР·РјРµРЅРµРЅРёР№ СЃС…РµРј РґР»СЏ РљРѕРЅС‚СѓСЂР° 1.
## Milestone 18: Track 2 - Budget Vertical Slice (Financial Control) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-12
- [x] **Budget Data Model**: Р РµР°Р»РёР·РѕРІР°РЅС‹ `BudgetPlan` Рё `BudgetItem` СЃ РїРѕРґРґРµСЂР¶РєРѕР№ РІРµСЂСЃРёРѕРЅРЅРѕСЃС‚Рё Рё РєР°С‚РµРіРѕСЂРёР№.
- [x] **Financial Gate**: Р’РЅРµРґСЂРµРЅР° Р±Р»РѕРєРёСЂРѕРІРєР° Р°РєС‚РёРІР°С†РёРё `HarvestPlan` Р±РµР· Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅРЅРѕРіРѕ (`LOCKED`) Р±СЋРґР¶РµС‚Р° РІ `ConsultingDomainRules`.
- [x] **Budget FSM**: РџРµСЂРµС…РѕРґС‹ `DRAFT` -> `APPROVED` -> `LOCKED` -> `CLOSED` СЃ СЃР°Р№Рґ-СЌС„С„РµРєС‚Р°РјРё СЃРІСЏР·РєРё СЃ РїР»Р°РЅРѕРј.
- [x] **Auto-Deviations**: Р РµР°Р»РёР·РѕРІР°РЅ `syncActuals` СЃ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРј СЃРѕР·РґР°РЅРёРµРј `FINANCIAL` РґРµРІРёР°С†РёР№ РїСЂРё РїСЂРµРІС‹С€РµРЅРёРё Р»РёРјРёС‚РѕРІ.
- [x] **Threshold Protection**: Р—Р°С‰РёС‚Р° РѕС‚ СЃРїР°РјР° РґРµРІРёР°С†РёСЏРјРё (РѕРґРЅРѕ РѕС‚РєСЂС‹С‚РѕРµ С„РёРЅР°РЅСЃРѕРІРѕРµ РѕС‚РєР»РѕРЅРµРЅРёРµ РЅР° РІРµСЂСЃРёСЋ Р±СЋРґР¶РµС‚Р°).
- [x] **API**: Р­РЅРґРїРѕРёРЅС‚С‹ СѓРїСЂР°РІР»РµРЅРёСЏ Р±СЋРґР¶РµС‚РѕРј РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹ РІ `ConsultingController`.
## Milestone 21: Phase 5 - Cash Flow Engine & Financial Stability вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-15
- [x] **Data Strategy**: Р РµР°Р»РёР·РѕРІР°РЅР° РїСЂРѕРµРєС†РёРѕРЅРЅР°СЏ РјРѕРґРµР»СЊ РєР°СЃСЃС‹ Р±РµР· С…СЂР°РЅРµРЅРёСЏ РѕСЃС‚Р°С‚РєРѕРІ. Р’РЅРµРґСЂРµРЅ `BOOTSTRAP` РґР»СЏ Ledger.
- [x] **DB Guard Enforcement**: РђС‚РѕРјР°СЂРЅР°СЏ РІР°Р»РёРґР°С†РёСЏ РјРµС‚Р°РґР°РЅРЅС‹С… С‚СЂР°РЅР·Р°РєС†РёР№ Рё РєРѕРЅС‚СЂРѕР»СЊ РїР»Р°С‚РµР¶РµСЃРїРѕСЃРѕР±РЅРѕСЃС‚Рё (no negative cash).
- [x] **FSM Integrity**: Р’СЃРµ РїРµСЂРµС…РѕРґС‹ С‡РµСЂРµР· `DecisionLog` Рё RBAC.
- [x] **Autonomous Isolation**: РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ РїРµСЂРµС…РѕРґ РІ `READ_ONLY` РїСЂРё СЃР±РѕРµ С†РµР»РѕСЃС‚РЅРѕСЃС‚Рё.
- [x] **Burn Rate Logic**: Р¤РѕСЂРјР°Р»РёР·Р°С†РёСЏ СЂР°СЃС‡РµС‚Р° РѕРїРµСЂР°С†РёРѕРЅРЅРѕРіРѕ СЂР°СЃС…РѕРґР° (Operating avg).
- [x] **Risk Integration**: Р’РЅРµРґСЂРµРЅР° РєР°С‚РµРіРѕСЂРёСЏ `FINANCIAL_STABILITY` РІ СЃС‚СЂР°С‚РµРіРёС‡РµСЃРєРёР№ Advisory.
- [x] **API & RBAC**: Р­РЅРґРїРѕРёРЅС‚С‹ `/cashflow/*` РґРѕСЃС‚СѓРїРЅС‹ CEO/CFO РІ `ConsultingController`.
- [x] **Verification**: РџСЂРѕР№РґРµРЅС‹ С‚РµСЃС‚С‹ РЅР° РёСЃС‚РѕСЂРёС‡РµСЃРєСѓСЋ РєРѕРЅСЃРёСЃС‚РµРЅС‚РЅРѕСЃС‚СЊ РїСЂРѕРµРєС†РёР№.

---
**РРўРћР“:** Р¤Р°Р·Р° 5 Р·Р°РІРµСЂС€РµРЅР°. Р’СЃРµ 5 С„Р°Р· Р°СЂС…РёС‚РµРєС‚СѓСЂРЅРѕР№ Р·Р°РєР°Р»РєРё (Hardening) РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹. РЎРёСЃС‚РµРјР° РіРѕС‚РѕРІР° Рє РєРѕРіРЅРёС‚РёРІРЅРѕРјСѓ СЂР°СЃС€РёСЂРµРЅРёСЋ.
### Milestone 19: Track 3 - Advisory Engine (Executive Intelligence) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-12
- [x] **Strategic Positioning**: РњРѕРґСѓР»СЊ РІС‹РЅРµСЃРµРЅ РІ `strategic/` РєР°Рє С‡РёСЃС‚С‹Р№ Read-Model.
- [x] **Analytical Engine**: Р РµР°Р»РёР·РѕРІР°РЅ `AdvisoryService` СЃ С„РѕСЂРјСѓР»Р°РјРё Health Index (0-100) Рё Volatility Index.
- [x] **Normalisation & DTO**: Р’РЅРµРґСЂРµРЅР° РЅРѕСЂРјР°Р»РёР·Р°С†РёСЏ РјРµС‚СЂРёРє Рё Р±РѕРіР°С‚С‹Р№ `AdvisorySignalDto` СЃ С‚СЂР°СЃСЃРёСЂРѕРІРєРѕР№ РёСЃС‚РѕС‡РЅРёРєРѕРІ (`sources`).
- [x] **Trend Analysis**: Р РµР°Р»РёР·РѕРІР°РЅРѕ 30-РґРЅРµРІРЅРѕРµ СЃРєРѕР»СЊР·СЏС‰РµРµ РѕРєРЅРѕ РґР»СЏ РѕР±РЅР°СЂСѓР¶РµРЅРёСЏ РґРёРЅР°РјРёРєРё РёР·РјРµРЅРµРЅРёР№.
- [x] **Confidence Scoring**: Р’РЅРµРґСЂРµРЅ РјРµС…Р°РЅРёР·Рј С„РёР»СЊС‚СЂР°С†РёРё "РјР°Р»С‹С… РґР°РЅРЅС‹С…" РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ Р±Р°Р№Р°СЃРѕРІ.
- [x] **Integration**: Р­РЅРґРїРѕРёРЅС‚С‹ Р°РіСЂРµРіР°С†РёРё РґРѕСЃС‚СѓРїРЅС‹ РІ `StrategicController`.
### Milestone 20: Execution Engine Hardening & Track 5 (Yield & KPI) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-12
- [x] **Hardening**: Р’РЅРµРґСЂРµРЅ `ExecutionOrchestrationLog` РґР»СЏ Audit Trail РѕСЂРєРµСЃС‚СЂР°С†РёРё.
- [x] **Transactional Integrity**: Р“Р°СЂР°РЅС‚РёСЂРѕРІР°РЅ `emitAfterCommit` РґР»СЏ СЃРёСЃС‚РµРјРЅС‹С… СЃРѕР±С‹С‚РёР№.
- [x] **Yield Domain**: Р РµР°Р»РёР·РѕРІР°РЅР° РјРѕРґРµР»СЊ `HarvestResult` Рё `YieldService` РґР»СЏ С„РёРєСЃР°С†РёРё СѓСЂРѕР¶Р°СЏ.
- [x] **KPI Read-Model**: `KpiService` СЃ СЂР°СЃС‡РµС‚РѕРј ROI, Delta Рё СЃРµР±РµСЃС‚РѕРёРјРѕСЃС‚Рё.
- [x] **UI Integration**: Р¤РѕСЂРјР° РІРІРѕРґР° СѓСЂРѕР¶Р°СЏ Рё РІРёР·СѓР°Р»РёР·Р°С†РёСЏ KPI РІ Cockpit.
- [x] **Hardening (Deterministic KPI)**: Р’РЅРµРґСЂРµРЅС‹ СЃРЅР°РїС€РѕС‚С‹ СЃС‚РѕРёРјРѕСЃС‚Рё Рё С†РµРЅС‹, Р°С‚РѕРјР°СЂРЅС‹Рµ С‚СЂР°РЅР·Р°РєС†РёРё Рё РёР·РѕР»СЏС†РёСЏ С‚РµРЅР°РЅС‚РѕРІ.
- [x] **Type Stability**: РСЃРїСЂР°РІР»РµРЅС‹ 23 РѕС€РёР±РєРё РєРѕРјРїРёР»СЏС†РёРё, РѕР±РЅРѕРІР»РµРЅ Prisma Client.
## Milestone 22: Foundation Stabilization & Load Testing вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-16
- [x] **Security Hardening**: Р РµР»РёР·РѕРІР°РЅ СЃС‚СЂРѕРіРёР№ RBAC, РіР»РѕР±Р°Р»СЊРЅС‹Р№ Throttler Рё Р°СѓРґРёС‚ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё.
- [x] **Tenant Isolation**: Р’РЅРµРґСЂРµРЅ `PrismaTenantMiddleware` СЃ РїРѕР»РЅРѕР№ РёР·РѕР»СЏС†РёРµР№ РґР°РЅРЅС‹С… РїРѕ `companyId`.
- [x] **Stability Fixes**: РЈСЃС‚СЂР°РЅРµРЅС‹ РѕС€РёР±РєРё Р·Р°РїСѓСЃРєР° (`PrismaService` middleware, `OutboxModule` dependencies).
- [x] **Database Fixes**: Р Р°Р·СЂРµС€РµРЅС‹ РєРѕРЅС„Р»РёРєС‚С‹ СЃС…РµРјС‹ Prisma, РІСЂСѓС‡РЅСѓСЋ РґРѕР±Р°РІР»РµРЅС‹ РЅРµРґРѕСЃС‚Р°СЋС‰РёРµ РєРѕР»РѕРЅРєРё (`budgetItemId`, `budgetPlanId`).
- [x] **API Protection**: Р’РєР»СЋС‡РµРЅ РїСЂРёРЅСѓРґРёС‚РµР»СЊРЅС‹Р№ `transform: true` РґР»СЏ РІР°Р»РёРґР°С†РёРё РїР°РіРёРЅР°С†РёРё.
- [x] **Load Testing (k6)**: РЎРёСЃС‚РµРјР° РІС‹РґРµСЂР¶Р°Р»Р° РЅР°РіСЂСѓР·РєСѓ 5 VU СЃ **100% СѓСЃРїРµС…РѕРј** (713 Р·Р°РїСЂРѕСЃРѕРІ, p95 < 350ms).
- [x] **Documentation**: РћР±РЅРѕРІР»РµРЅ `FOUNDATION_STABILIZATION_CHECKLIST_RU.md`, СЃРѕР·РґР°РЅС‹ РѕС‚С‡РµС‚С‹ РїРѕ Р±РµР·РѕРїР°СЃРЅРѕСЃС‚Рё Рё Р±РµРєР°РїР°Рј.

---
**РРўРћР“:** Р¤Р°Р·Р° СЃС‚Р°Р±РёР»РёР·Р°С†РёРё С„СѓРЅРґР°РјРµРЅС‚Р° Р·Р°РІРµСЂС€РµРЅР°. РЎРёСЃС‚РµРјР° РїРѕР»РЅРѕСЃС‚СЊСЋ Р·Р°С‰РёС‰РµРЅР°, РјР°СЃС€С‚Р°Р±РёСЂСѓРµРјР° Рё РіРѕС‚РѕРІР° Рє РїСЂРѕРјС‹С€Р»РµРЅРЅРѕР№ СЌРєСЃРїР»СѓР°С‚Р°С†РёРё Рё Р°РєС‚РёРІРЅРѕР№ СЂР°Р·СЂР°Р±РѕС‚РєРµ С„СѓРЅРєС†РёРѕРЅР°Р»Р° Phase Gamma.

## Milestone 23: Ledger Kernel - 10/10 Production Hardening вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-17
- [x] **Solvency Layer**: РўР°Р±Р»РёС†Р° `account_balances` Рё С‚СЂРёРіРіРµСЂС‹ РґР»СЏ Р°С‚РѕРјР°СЂРЅРѕРіРѕ РєРѕРЅС‚СЂРѕР»СЏ Р±Р°Р»Р°РЅСЃРѕРІ CoA.
- [x] **Negative Cash Protection**: DB-level constraint `no_negative_cash` Р±Р»РѕРєРёСЂСѓРµС‚ Р»СЋР±С‹Рµ РЅРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РІС‹РІРѕРґС‹ СЃСЂРµРґСЃС‚РІ.
- [x] **Autonomous Panic (V6)**: РўСЂРёРіРіРµСЂ СЏРґСЂР° Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РёР·РѕР»РёСЂСѓРµС‚ С‚РµРЅР°РЅС‚ (`READ_ONLY`) РїСЂРё РЅР°СЂСѓС€РµРЅРёРё РјР°С‚РµРјР°С‚РёС‡РµСЃРєРёС… РёРЅРІР°СЂРёР°РЅС‚РѕРІ.
- [x] **Strict Serializability**: РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ 64-Р±РёС‚РЅС‹С… advisory locks РґР»СЏ РїСЂРµРґРѕС‚РІСЂР°С‰РµРЅРёСЏ РґСЂРµР№С„Р° РїРѕСЃР»РµРґРѕРІР°С‚РµР»СЊРЅРѕСЃС‚РµР№.
- [x] **Localized Integrity**: Р’СЃРµ СЃРёСЃС‚РµРјРЅС‹Рµ Р»РѕРіРё, РёСЃРєР»СЋС‡РµРЅРёСЏ Рё СЃРѕРѕР±С‰РµРЅРёСЏ С‚СЂРёРіРіРµСЂРѕРІ СЂСѓСЃРёС„РёС†РёСЂРѕРІР°РЅС‹ (Language Policy).
- [x] **Schema Sync**: `schema.prisma` РїСЂРёРІРµРґРµРЅР° РІ РїРѕР»РЅРѕРµ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ СЃ С„РёР·РёС‡РµСЃРєРёРј СЃРѕСЃС‚РѕСЏРЅРёРµРј Р‘Р”.
- [x] **Verification**: Р’СЃРµ СЃС‚СЂРµСЃСЃ-СЃС†РµРЅР°СЂРёРё (A-D) РїСЂРѕР№РґРµРЅС‹ СЃРѕ 100% СѓСЃРїРµС…РѕРј.

## Milestone 24: Financial Reconciliation & Ledger Hardening вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-17
- [x] **Bug Fix**: РЈСЃС‚СЂР°РЅРµРЅР° РѕС€РёР±РєР° `MISSING_LEDGER_ENTRIES` РґР»СЏ СЃРѕР±С‹С‚РёР№ `OBLIGATION_SETTLED`.
- [x] **Settlement Guard**: Р’РЅРµРґСЂРµРЅ Р±Р»РѕРєРёСЂСѓСЋС‰РёР№ РёРЅРІР°СЂРёР°РЅС‚: СЂР°СЃС‡РµС‚РЅС‹Рµ СЃРѕР±С‹С‚РёСЏ (`SETTLEMENT`) РѕР±СЏР·Р°РЅС‹ РїРѕСЂРѕР¶РґР°С‚СЊ РїСЂРѕРІРѕРґРєРё.
- [x] **Idempotency Recovery**: Р РµР°Р»РёР·РѕРІР°РЅРѕ СЃР°РјРѕРІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ "СЃРѕР±С‹С‚РёР№-С„Р°РЅС‚РѕРјРѕРІ" (СЂРµРїР»РµР№ СЃРѕР±С‹С‚РёСЏ Р±РµР· РїСЂРѕРµРєС†РёР№ С‚РµРїРµСЂСЊ С‚СЂРёРіРіРµСЂРёС‚ РёС… РіРµРЅРµСЂР°С†РёСЋ).
- [x] **Observability**: РЈР»СѓС‡С€РµРЅР° С‚РµР»РµРјРµС‚СЂРёСЏ `ReconciliationJob` (РґРѕР±Р°РІР»РµРЅС‹ `companyId` Рё `replayKey` РІ Р°Р»РµСЂС‚С‹).
- [x] **Defense**: Р”РѕР±Р°РІР»РµРЅС‹ РїСЂРѕРІРµСЂРєРё С‚РёРїРѕРІ РІ `CostAttributionRules` РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ РЅРµРєРѕСЂСЂРµРєС‚РЅС‹С… РёРЅР¶РµРєС‚РѕРІ.

## Milestone 25: Level C вЂ” Industrial-Grade Contradiction Engine вњ…
**Р”Р°С‚Р°:** 2026-02-18
**РЎС‚Р°С‚СѓСЃ:** VERIFIED (50 С‚РµСЃС‚РѕРІ PASS)
- [x] **Persistence & Schema (I31)**: GovernanceConfig, DivergenceRecord, Append-Only triggers, OVERRIDE_ANALYSIS enum.
- [x] **DivergenceTracker (I31)**: РўСЂР°РЅР·Р°РєС†РёРѕРЅРЅР°СЏ Р°С‚РѕРјР°СЂРЅРѕСЃС‚СЊ, SHA256 idempotencyKey, RFC 8785 РєР°РЅРѕРЅРёР·Р°С†РёСЏ.
- [x] **OverrideRiskAnalyzer (I29)**: О”Risk в€€ [-1, 1], defensive fallback (>200ms), policyVersion РІ hash.
- [x] **CounterfactualEngine (I30)**: roundHalfToEven(8), deterministic PRNG, Hash Pipeline вЂ” SHA256(UTF8(RFC8785)).
- [x] **ConflictMatrix & DIS (I29)**: `DIS = clamp(ОЈ w_i * f_i, 0, 1)`, Zero-Denominator Safeguard.
- [x] **ConflictExplainabilityBuilder (I32)**: Human-readable explanation, ACCEPT/REVIEW/REJECT recommendations.
- [x] **FSM Governance Guard (I33)**: GovernanceContext, DivergenceRecord gate, High Risk justification (DIS > 0.7).
- [x] **Industrial Guardrails**: 1000-run determinism Г— 2, governance drift, policy chaos (1000 random), extreme clamp.
- [x] **E2E Override Pipeline**: Full pipeline, hash determinism/sensitivity, governance block, idempotency, high risk flow.
- [x] **РўРµСЃС‚С‹**: FSM (25), ConflictExplainability (10), Industrial Guardrails (8), E2E Pipeline (7) = **50 PASS**.

## Milestone 26: Level D вЂ” Industrial-Grade Hardening (Phase C) вњ…
**Р”Р°С‚Р°:** 2026-02-19
**РЎС‚Р°С‚СѓСЃ:** PILOT READY (10/10)
- [x] **Atomic Concurrency (Redis)**: Р’РЅРµРґСЂРµРЅС‹ `incr`/`decr` РґР»СЏ `rai:total_active_jobs`. РЈСЃС‚СЂР°РЅРµРЅС‹ race conditions РїСЂРё Р·Р°РїСѓСЃРєРµ РґР¶РѕР±.
- [x] **Statistical Gating (Canary)**: Р’РЅРµРґСЂРµРЅ РїРѕСЂРѕРі РІС‹Р±РѕСЂРєРё `sampleSize >= 100` РґР»СЏ РїСЂРµРґРѕС‚РІСЂР°С‰РµРЅРёСЏ Р»РѕР¶РЅС‹С… РѕС‚РєР°С‚РѕРІ.
- [x] **Schema Expansion (Prisma)**: РЎС‚Р°С‚СѓСЃ `QUARANTINED` РґРѕР±Р°РІР»РµРЅ РІ `ModelStatus`. РџСЂРѕРµРєС†РёРё Рё FSM СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅС‹.
- [x] **Genesis Guard (Anchor Trust)**: Р РµР°Р»РёР·РѕРІР°РЅР° Р·Р°С‰РёС‚Р° "СЏРєРѕСЂРЅРѕРіРѕ С…РµС€Р°" Р±Р°Р·РѕРІРѕР№ РјРѕРґРµР»Рё. Lineage Р·Р°С‰РёС‰РµРЅ РѕС‚ РїРѕРґРјРµРЅС‹ РєРѕСЂРЅСЏ.
- [x] **K8s Reconciliation**: РСЃРїСЂР°РІР»РµРЅС‹ РѕС€РёР±РєРё СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё Рё РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ Р»РёРјРёС‚РѕРІ РїСЂРё РїРѕС‚РµСЂРµ РґР¶РѕР±.
- [x] **Chaos Verification**: РўРµСЃС‚С‹ Double Callback Рё MAE Degradation РїСЂРѕР№РґРµРЅС‹ СЃРѕ 100% СѓСЃРїРµС…РѕРј.

## Milestone 27: Level E вЂ” Contract-Driven Regenerative Engine вњ…
**Р”Р°С‚Р°:** 2026-02-19  
**РЎС‚Р°С‚СѓСЃ:** INDUSTRIAL GRADE (10/10)
- [x] **Contract-Driven Governance (I41)**: Р’РЅРµРґСЂРµРЅС‹ СЂРµР¶РёРјС‹ `SEASONAL`, `MULTI_YEAR`, `MANAGED`.
- [x] **Dynamic MOS Weights**: Р РµР°Р»РёР·РѕРІР°РЅ РїСЂРѕРїРѕСЂС†РёРѕРЅР°Р»СЊРЅС‹Р№ Overdrive РґР»СЏ SRI (С‚РѕР»СЊРєРѕ РІ Managed СЂРµР¶РёРјРµ).
- [x] **Severity Matrix (R1-R4)**: Р’РЅРµРґСЂРµРЅР° С„РѕСЂРјР°Р»СЊРЅР°СЏ РјР°С‚СЂРёС†Р° С‚СЏР¶РµСЃС‚Рё РґР»СЏ СЂРµРіРµРЅРµСЂР°С‚РёРІРЅС‹С… СЂРёСЃРєРѕРІ.
- [x] **Tail Risk (P05)**: Р РµР°Р»РёР·РѕРІР°РЅ С„РѕСЂРјР°Р»СЊРЅС‹Р№ СЂР°СЃС‡РµС‚ P05 (Probability of Collapse) РґР»СЏ R3 СЂРёСЃРєРѕРІ.
- [x] **Audit & Liability**: Р’РЅРµРґСЂРµРЅРѕ С‚РµРіРёСЂРѕРІР°РЅРёРµ РѕС‚РІРµС‚СЃС‚РІРµРЅРЅРѕСЃС‚Рё (`LiabilityTag`) Рё РЅРµРёР·РјРµРЅСЏРµРјС‹Р№ Р°СѓРґРёС‚ РІСЃРµС… Р±Р»РѕРєРёСЂРѕРІРѕРє.
- [x] **Safety Hardening**: РЎС‚СЂРѕРіРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ СЂРµР¶РёРјРѕРІ СЂРµРіСѓР»РёСЂРѕРІР°РЅРёСЏ, РёСЃРєР»СЋС‡Р°СЋС‰РµРµ "С‚РёС…РёР№" Р·Р°РІР°С‚ РєРѕРЅС‚СЂРѕР»СЏ СЃРёСЃС‚РµРјРѕР№.

## Milestone 28: Backend Stability & Runtime Hardening вњ…
**Р”Р°С‚Р°:** 2026-02-19
**РЎС‚Р°С‚СѓСЃ:** STABLE RUNTIME (10/10)
- [x] **CJS/ESM Compatibility**: РЈСЃС‚СЂР°РЅРµРЅС‹ РѕС€РёР±РєРё `ERR_REQUIRE_ESM` РґР»СЏ `@kubernetes/client-node` С‡РµСЂРµР· РґРёРЅР°РјРёС‡РµСЃРєРёР№ РёРјРїРѕСЂС‚. РџР°РєРµС‚ `@rai/regenerative-engine` РїРµСЂРµРІРµРґРµРЅ РЅР° CommonJS.
- [x] **Type Corrections**: РСЃРїСЂР°РІР»РµРЅС‹ РІСЃРµ РѕС€РёР±РєРё С‚РёРїРёР·Р°С†РёРё (`DISWeights`, `ConflictVector`) РІ РєРѕРЅС‚СЂРѕР»Р»РµСЂР°С….
- [x] **Import Fixes**: РЈСЃС‚СЂР°РЅРµРЅС‹ `MODULE_NOT_FOUND` РѕС€РёР±РєРё РІ РјРѕРґСѓР»Рµ `rapeseed`, РІС‹Р·РІР°РЅРЅС‹Рµ СЂРµРіРёСЃС‚СЂРѕР·Р°РІРёСЃРёРјС‹РјРё РёРјРїРѕСЂС‚Р°РјРё.
- [x] **Audit Service Compliance**: Р’СЃРµ РІС‹Р·РѕРІС‹ `auditService.log` РѕР±РЅРѕРІР»РµРЅС‹ СЃ РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рј `companyId` РґР»СЏ РёР·РѕР»СЏС†РёРё С‚РµРЅР°РЅС‚РѕРІ.
- [x] **Server Status**: Р‘СЌРєРµРЅРґ СѓСЃРїРµС€РЅРѕ Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ РЅР° РїРѕСЂС‚Сѓ 4000.

## Milestone 29: Level F вЂ” Institutional API Gateway & Dispute (Р¤Р°Р·Р° 4, 5, 6) + Crypto (Р¤Р°Р·Р° 1) вњ…
**Р”Р°С‚Р°:** 2026-02-20
**РЎС‚Р°С‚СѓСЃ:** INSTITUTIONAL READY (10/10)
- [x] **HSM Integration (Р¤Р°Р·Р° 1 РћСЃС‚Р°С‚РєРё)**: РћРєРѕРЅС‡Р°С‚РµР»СЊРЅС‹Р№ РѕС‚СЂС‹РІ РєР»СЋС‡РµР№ РѕС‚ RAM. РЎРѕР·РґР°РЅ РјРѕСЃС‚ Рє HashiCorp Vault.
- [x] **M-of-N Governance (Р¤Р°Р·Р° 1 РћСЃС‚Р°С‚РєРё)**: Р’РЅРµРґСЂРµРЅ РјСѓР»СЊС‚РёСЃРёРі-РїСЂРѕС†РµСЃСЃРѕСЂ (5-of-7) РґР»СЏ Р·Р°С‰РёС‚С‹ Panic Halt Рё Update Formula.
- [x] **mTLS Firewall**: NGINX + NestJS `MtlsGuard` РґР»СЏ Tier-2/Tier-3 РїСѓС‚РµР№.
- [x] **Rate-Limiting (Token Bucket)**: $1000$ req/min (Tenant), $10000$ req/min (Subnet /24) С‡РµСЂРµР· Redis.
- [x] **SLA/SLO Layer**: `SloInterceptor` РґР»СЏ РѕС‚СЃР»РµР¶РёРІР°РЅРёСЏ Р·Р°РґРµСЂР¶РµРє (< 250ms).
- [x] **Dispute Resolution**: `Deterministic Replay API` РґР»СЏ Р°СѓРґРёС‚Р°.
- [x] **Smart Contract Anchoring**: `SnapshotAnchor.sol` РґР»СЏ РїСЂРёРІСЏР·РєРё Merkle Roots РІ L1, `AnchorService`.
- [x] **Fallback Node-Watcher**: РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРѕРµ РїРµСЂРµРєР»СЋС‡РµРЅРёРµ RPC (L1 -> Consortium) РїСЂРё РґР°СѓРЅС‚Р°Р№РјРµ.
- [x] **CRL Lifecycle**: `Redis Bloom Filter` РґР»СЏ РїСЂРѕРІРµСЂРєРё РѕС‚РѕР·РІР°РЅРЅС‹С… СЃРµСЂС‚РёС„РёРєР°С‚РѕРІ ($O(1)$).
- [x] **Hardcore Simulations (Р¤Р°Р·Р° 6)**: РќР°РїРёСЃР°РЅС‹ E2E СЃС†РµРЅР°СЂРёРё (BFT Attack, Zip Bomb, Replay Cache, Panic Halt).
- [x] **UI Policy**: Р’РЅРµРґСЂРµРЅР° СЃРёСЃС‚РµРјР° `ui-policy.ts` РґР»СЏ СѓРїСЂР°РІР»РµРЅРёСЏ РІРёРґРёРјРѕСЃС‚СЊСЋ СЌР»РµРјРµРЅС‚РѕРІ РЅР° РѕСЃРЅРѕРІРµ РїРѕР»РЅРѕРјРѕС‡РёР№.

## Milestone 30: Institutional Frontend Phase 2 вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-21
**РЎС‚Р°С‚СѓСЃ:** ZERO-ERROR VERIFIED (10/10)
- [x] **FSM Core**: Р РµР°Р»РёР·РѕРІР°РЅ `governanceMachine` (XState) СЃ РїРѕРґРґРµСЂР¶РєРѕР№ `traceId` Рё СЃС‚СЂР°С‚РёС„РёРєР°С†РёРµР№ СЂРёСЃРєРѕРІ.
- [x] **Authority Binding**: РҐСѓРє `useGovernanceAction` РїРѕС‚СЂРµР±Р»СЏРµС‚ `AuthorityContext` РґР»СЏ Р±Р»РѕРєРёСЂРѕРІРєРё РЅРµСЃР°РЅРєС†РёРѕРЅРёСЂРѕРІР°РЅРЅС‹С… РґРµР№СЃС‚РІРёР№.
- [x] **UI Persistence**: Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅ Premium UI (Geist Fonts), РёСЃРїСЂР°РІР»РµРЅС‹ 404 РЅР° СЃС‚Р°С‚РёРєРµ С‡РµСЂРµР· Р·Р°С‡РёСЃС‚РєСѓ РєСЌС€Р° `.next`.
- [x] **Database Sync**: РСЃРїСЂР°РІР»РµРЅРѕ РѕС‚СЃСѓС‚СЃС‚РІРёРµ `companyId` РІ `AuditLog` С‡РµСЂРµР· РЅР°С‚РёРІРЅСѓСЋ РјРёРіСЂР°С†РёСЋ.
- [x] **Zero-Error Build**: РЈСЃС‚СЂР°РЅРµРЅС‹ РІСЃРµ РѕС€РёР±РєРё С‚РёРїРѕРІ (`tsc`) РІ РєРѕРјРїРѕРЅРµРЅС‚Р°С… Knowledge Рё UI-Policy.

## Milestone 31: Institutional Frontend Phase 3 вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-21
**РЎС‚Р°С‚СѓСЃ:** INSTITUTIONAL CORE 10/10 (Phase 3 Complete)

- [x] **Redesigned Governance UI**: РџСЂРµРјРёР°Р»СЊРЅС‹Р№ РґРёР·Р°Р№РЅ РєРЅРѕРїРѕРє (START R3/R4) СЃ РіСЂР°РґРёРµРЅС‚Р°РјРё, С‚РµРЅСЏРјРё Рё СЃРѕСЃС‚РѕСЏРЅРёСЏРјРё (Scale, Verification badges).
- [x] **Enhanced FSM**: РРЅС‚РµРіСЂРёСЂРѕРІР°РЅРѕ СЃРѕСЃС‚РѕСЏРЅРёe `escalated`, `collecting_signatures` Рё `quorum_met`. Р§РµС‚РєРѕРµ СЂР°Р·РґРµР»РµРЅРёРµ С„Р°Р· РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ.
- [x] **Layout Repair**: РСЃРїСЂР°РІР»РµРЅРѕ "Р·Р°Р»Р°Р·Р°РЅРёРµ" РєРѕРЅС‚РµРЅС‚Р° РїРѕРґ СЃР°Р№РґР±Р°СЂ С‡РµСЂРµР· РїРµСЂРµС…РѕРґ РЅР° С‡РёСЃС‚С‹Р№ Flexbox (СѓРґР°Р»РµРЅРѕ `fixed`, `ml-350`).
- [x] **Ledger Binding 10/10**: РџРѕРґРїРёСЃРё РєРѕРјРёС‚РµС‚Р° РїСЂРёРІСЏР·Р°РЅС‹ Рє РєРѕРЅС‚РµРєСЃС‚Сѓ С‚СЂР°РЅР·Р°РєС†РёРё Рё СЂРёСЃРєСѓ.
- [x] **Simulation SUCCESS**: РџСЂРѕР№РґРµРЅ РїРѕР»РЅС‹Р№ С†РёРєР» СЌСЃРєР°Р»Р°С†РёРё R4 (Hard Lock) СЃ СЂР°Р·Р±Р»РѕРєРёСЂРѕРІРєРѕР№ С‡РµСЂРµР· РєРІРѕСЂСѓРј.

---
**РРўРћР“:** Р¤Р°Р·Р° 3 Р·Р°РІРµСЂС€РµРЅР°. РЎРёСЃС‚РµРјР° СѓРїСЂР°РІР»РµРЅРёСЏ (Control Plane) РіРѕС‚РѕРІР° Рє РёРЅС‚РµРіСЂР°С†РёРё СЂРёСЃРє-Р°РЅР°Р»РёС‚РёРєРё Рё РР-РѕР±СЉСЏСЃРЅРёРјРѕСЃС‚Рё.

## Milestone 32: Institutional Frontend Phase 4 вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-21
**РЎС‚Р°С‚СѓСЃ:** DETERMINISTIC IMPACT ENGINE 10/10 (Institutional Grade)

- [x] **Snapshot Hashing (RFC8785)**: Р’РЅРµРґСЂРµРЅР° РєР°РЅРѕРЅРёР·Р°С†РёСЏ Рё SHA-256 С…РµС€РёСЂРѕРІР°РЅРёРµ СЌС„С„РµРєС‚РѕРІ. UI РѕС‚РѕР±СЂР°Р¶Р°РµС‚ РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІР°.
- [x] **Deterministic Graph Traversal**: Р РµР°Р»РёР·РѕРІР°РЅ Р»РµРєСЃРёРєРѕРіСЂР°С„РёС‡РµСЃРєРёР№ BFS РІ `InstitutionalGraph`. РџСѓС‚Рё СЌСЃРєР°Р»Р°С†РёРё РЅРµРёР·РјРµРЅРЅС‹.
- [x] **FSM Re-analysis Cycle**: РџСЂРёРЅСѓРґРёС‚РµР»СЊРЅС‹Р№ СЃР±СЂРѕСЃ СЃС‚РµР№С‚Р° РїРѕСЃР»Рµ СЂРµР·РѕР»РІРёРЅРіР° РєРѕРЅС„Р»РёРєС‚РѕРІ РґР»СЏ РёСЃРєР»СЋС‡РµРЅРёСЏ "СЃР»РµРїС‹С… Р·РѕРЅ".
- [x] **Evidence of Hardening**: UI `GovernanceTestButton` РІРёР·СѓР°Р»РёР·РёСЂСѓРµС‚ РєСЂРёРїС‚РѕРіСЂР°С„РёС‡РµСЃРєРёРµ РїРѕРґРїРёСЃРё Рё РёРЅРІР°СЂРёР°РЅС‚С‹.
- [x] **Replay Integrity**: РЎРѕР·РґР°РЅ `InstitutionalReplay.test.ts` РґР»СЏ РІРµСЂРёС„РёРєР°С†РёРё РІРѕСЃРїСЂРѕРёР·РІРµРґРµРЅРёСЏ 100% РёРґРµРЅС‚РёС‡РЅС‹С… СЃРѕСЃС‚РѕСЏРЅРёР№.

## Milestone 33: Institutional Frontend Phase 4 (Layout Hardening) вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-22
**РЎС‚Р°С‚СѓСЃ:** INSTITUTIONAL LAYOUT 10/10 (Global Sidebar Complete)
- [x] **Canonical Layouts**: Р’РЅРµРґСЂРµРЅ `ConsultingLayout` СЃ РїРµСЂСЃРёСЃС‚РµРЅС‚РЅС‹Рј СЃР°Р№РґР±Р°СЂРѕРј Рё С…РµРґРµСЂРѕРј С‡РµСЂРµР· Route Groups.
- [x] **Ad-hoc Purge**: РЈРґР°Р»РµРЅС‹ РІСЃРµ РґСѓР±Р»РёСЂСѓСЋС‰РёРµ `AuthenticatedLayout` Рё `Sidebar` СЃРѕ СЃС‚СЂР°РЅРёС† РґРѕРјРµРЅРѕРІ.
- [x] **JSX Hardening**: РЈСЃС‚СЂР°РЅРµРЅС‹ РєСЂРёС‚РёС‡РµСЃРєРёРµ СЃРёРЅС‚Р°РєСЃРёС‡РµСЃРєРёРµ РѕС€РёР±РєРё РІ РјРѕРґСѓР»СЏС… РёСЃРїРѕР»РЅРµРЅРёСЏ.
- [x] **Zero-Overlap Implementation**: Р§РёСЃС‚Р°СЏ Flexbox-Р°СЂС…РёС‚РµРєС‚СѓСЂР°, РёСЃРєР»СЋС‡Р°СЋС‰Р°СЏ РЅР°Р»РѕР¶РµРЅРёРµ СЌР»РµРјРµРЅС‚РѕРІ СѓРїСЂР°РІР»РµРЅРёСЏ.
 
## Milestone 34: Zero Trust Tenant Isolation 10/10 вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-22
**РЎС‚Р°С‚СѓСЃ:** MAXIMUM SECURITY (10/10)
- [x] **Global RLS**: Row-Level Security Р°РєС‚РёРІРёСЂРѕРІР°РЅР° РґР»СЏ 74 С‚Р°Р±Р»РёС† С‡РµСЂРµР· РЅР°С‚РёРІРЅСѓСЋ РјРёРіСЂР°С†РёСЋ PostgreSQL.
- [x] **Prisma Hardening**: РРЅС‚РµРіСЂРёСЂРѕРІР°РЅС‹ `$extends` Рё `STRICT` СЂРµР¶РёРј. РђРІС‚РѕРјР°С‚РёС‡РµСЃРєР°СЏ РёРЅСЉРµРєС†РёСЏ `companyId` Рё Р±Р»РѕРєРёСЂРѕРІРєР° Р±РµР·РєРѕРЅС‚РµРєСЃС‚РЅС‹С… Р·Р°РїСЂРѕСЃРѕРІ.
- [x] **Static Guardrails**: РЎРѕР·РґР°РЅ Рё РІРЅРµРґСЂРµРЅ `eslint-plugin-tenant-security` РґР»СЏ Р±Р»РѕРєРёСЂРѕРІРєРё РЅРµР±РµР·РѕРїР°СЃРЅРѕРіРѕ СЃС‹СЂРѕРіРѕ SQL РЅР° СЌС‚Р°РїРµ CI.
- [x] **Immutable Context**: Р РµС„Р°РєС‚РѕСЂРёРЅРі `TenantContextService` РЅР° РёСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ `TenantScope` (Value Object) Рё `AsyncLocalStorage`.
- [x] **System Bypass**: Р‘РµР·РѕРїР°СЃРЅС‹Р№ СЂРµР¶РёРј `@SystemWideOperation()` РґР»СЏ Р»РµРіРёС‚РёРјРЅС‹С… С„РѕРЅРѕРІС‹С… Р·Р°РґР°С‡ СЃ РїРѕР»РЅС‹Рј Р°СѓРґРёС‚РѕРј.

## Milestone 35: Phase 5 (AI Explainability) & Infrastructure Hardening вЂ” DONE вњ…
**Р”Р°С‚Р°:** 2026-02-22  
**РЎС‚Р°С‚СѓСЃ:** ZERO-ERROR PRODUCTION GRADE (10/10)
- [x] **AI Explainability**: Р РµР°Р»РёР·РѕРІР°РЅ 3-СѓСЂРѕРІРЅРµРІС‹Р№ РїСЂРѕС‚РѕРєРѕР» (Surface / Analytical / Forensic) РґР»СЏ РїСЂРѕР·СЂР°С‡РЅРѕСЃС‚Рё РїСЂРёРЅСЏС‚РёСЏ СЂРµС€РµРЅРёР№.
- [x] **Infrastructure Fix (70+ Errors)**: РџРѕР»РЅС‹Р№ СЂРµС„Р°РєС‚РѕСЂРёРЅРі С‚РёРїРёР·Р°С†РёРё `PrismaService` ($extends), `TenantContextService` Рё РїРµСЂРµС…РІР°С‚С‡РёРєРѕРІ.
- [x] **Integrity Gate Fix**: РСЃРїСЂР°РІР»РµРЅС‹ РѕС€РёР±РєРё С‚РёРїРёР·Р°С†РёРё (TS2365) РІ `IntegrityGateService`.
- [x] **Runtime Stability**: РЈСЃС‚СЂР°РЅРµРЅР° РѕС€РёР±РєР° `MODULE_NOT_FOUND` РІ API С‡РµСЂРµР· РєРѕСЂСЂРµРєС‚РёСЂРѕРІРєСѓ `package.json` Рё РїСѓС‚РµР№ `dist`.
- [x] **Navigation Re-org**: РСЃРїСЂР°РІР»РµРЅС‹ 404 РѕС€РёР±РєРё РЅР° С„СЂРѕРЅС‚РµРЅРґРµ РїСѓС‚РµРј РїСЂРёРІРµРґРµРЅРёСЏ РёРµСЂР°СЂС…РёРё СЃС‚СЂР°РЅРёС† РІ СЃРѕРѕС‚РІРµС‚СЃС‚РІРёРµ СЃ `navigation-policy.ts`.
- [x] **Verification**: РЎР±РѕСЂРєР° `npm run build` РїСЂРѕС…РѕРґРёС‚ СЃ 0 РѕС€РёР±РѕРє. NestJS СЃРµСЂРІРµСЂ СѓСЃРїРµС€РЅРѕ СЃС‚Р°СЂС‚СѓРµС‚.

## Milestone 36: Frontend Menu - Управление Урожаем (MVP) - DONE
**Дата:** 2026-02-23
- [x] Dashboard '/consulting/dashboard' redesigned in RAI style with live KPI widgets.
- [x] Added clickable KPI/alerts/status blocks with direct navigation to entities.
- [x] Implemented smart-routing contract (?entity/?severity) with highlight + auto-scroll on target screens.
- [x] Added reusable hook 'useEntityFocus' for unified entity focus behavior.
- [x] Added production-ready checklist pattern to menu docs/template.
- [x] Fixed API dev-watch startup race (dist path + watcher stability).

## Milestone 37: Frontend Menu - CRM Counterparties Button (MVP) - DONE
**Date:** 2026-02-23
- [x] Added dedicated doc for the button: docs/10_FRONTEND_MENU_IMPLEMENTATION/09_BUTTON_Хозяйства_и_контрагенты.md
- [x] Added explicit click-path mapping (lock -> route) for all clickable elements
- [x] Implemented loading/empty/error/permission on /consulting/crm, /consulting/crm/farms, /consulting/crm/counterparties
- [x] Implemented smart routing ?entity=... with highlight + auto-scroll
- [x] Added executive block Latest counterparties (top-5: name, date, status)
- [x] Updated master map for CRM group in docs/10_FRONTEND_MENU_IMPLEMENTATION/00_MASTER_MENU_MAP.md
- [ ] Production-ready debt: e2e route scenario, encoding cleanup, replacing demo metrics with target API metrics

## Milestone 38: Frontend Menu - CRM Counterparties Button (Production Closure) - DONE
**Date:** 2026-02-24
- [x] CRM counterparties upgraded from informational list to full management workspace.
- [x] Implemented hierarchy model `Holding -> Legal Entity -> Farm` in UI actions and flow.
- [x] Added server-side workspace/profile APIs:
  - `GET /crm/accounts/:id/workspace`
  - `PATCH /crm/accounts/:id`
- [x] Added registry filters: `type`, `status`, `risk`, `responsible`.
- [x] Added card-level operational tabs and CRUD flows for contacts/interactions/obligations.
- [x] Added responsible selection from company users directory (`GET /users/company/:companyId`).
- [x] Enforced backend hierarchy validation: `FROZEN` is blocked when no linked farms/fields.
- [x] Added API test coverage for freeze-guard invariant (`crm.service.spec.ts`).
- [x] Updated docs/checklists: `11_BUTTON_Контрагенты.md`, `99_TECH_DEBT_CHECKLIST.md`, `00_MASTER_MENU_MAP.md`.


