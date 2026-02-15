---
id: DOC-EXE-GEN-156
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿---
id: component-implementation-tech-plan
type: component
status: review
owners: [techleads]
aligned_with: [principle-axioms]
---

# 🏗️ DETAILED TECHNICAL DEVELOPMENT PLAN (WBS)

> **Статус:** **COMPLETED** | **Завершен:** 08.02.2026 | **Владелец:** TechLead
> **Охват:** Соответствует `FULL_PROJECT_WBS.md` (Enterprise Edition)

Этот документ декомпозирует стратегический Roadmap на конкретные инженерные задачи.
Структура: **Фаза** → **Контур** → **Блок** → **Задача**.

---

## 🏗️ PHASE ALPHA: FOUNDATION (MVP)
*Цель: Валидация Архитектуры, APL (Рапс) и запуск ядра.*

### 📦 BLOCK 1: CORE INFRASTRUCTURE
- [ ] **Section 1.1: Project Setup & Monorepo**
    - [x] Инициализация Turborepo
    - [x] Настройка ESLint/Prettier
    - [x] Настройка Docker Compose (Postgres, Redis)
- [ ] **Section 1.2: Identity & Access (IAM)**
    - [x] Entity: `User`, `Account`, `Company` (Prisma)
    - [x] Service: `AuthService` (JWT, RBAC)
    - [x] Feature: Multi-tenancy (Company Isolation)

### 🎼 BLOCK 2: AGRO PROCESS LAYER (CONTOUR 2 START)
- [x] **Section 2.1: Orchestrator Scaffolding**
    - [x] Module: `agro-orchestrator` (State Machine base)
    - [x] Graph: Porting Rapeseed 16 Stages to Enum/Const
- [x] **Section 2.2: Rule Engine Foundation**
    - [x] Lib: `json-logic-js` integration
    - [x] Rule: Hard Constraint Check Template

### 🏢 BLOCK 3: ENTERPRISE IDENTITY & STRUCTURE LAYER (CONTOUR 1 START)
- [x] **Section 3.1: Client Registry & Holdings**
    - [x] Entity: `Holding`, `Client` (Hierarchy & Ownership)
    - [x] Service: `ClientRegistry` (Passive Registry)
- [x] **Section 3.2: Identity Registry (Profiles)**
    - [x] Entity: `EmployeeProfile`, `RoleDefinition` (Org Positions)
    - [x] Logic: Lifecycle & Multi-tenant Isolation



### 🧠 BLOCK 4: UNIFIED MEMORY (INFRA)
- [x] **Section 4.1: Storage Setup**
    - [x] Redis: Session & Context storage (`ContextService`)
    - [x] pgvector: Custom Dockerfile & Migration
    - [x] Service: `@rai/vector-store` (Abstraction layer)
    - [x] Logic: Policy-driven `MemoryManager`

### 🌐 BLOCK 4.5: FRONTEND (WEB INTERFACE)
- [x] **Section 4.5.1: Next.js 14 Setup**
    - [x] Project: `apps/web` (App Router, TypeScript, Tailwind CSS)
    - [x] Config: next.config.js, tailwind.config.js, tsconfig.json
    - [x] Fonts: Geist integration (UI Design Canon)
- [x] **Section 4.5.2: Authentication**
    - [x] Route Handlers: `/api/auth/login`, `/api/auth/logout` (Server-side)
    - [x] Middleware: Edge Runtime route protection
    - [x] JWT: HttpOnly cookies (secure, sameSite)
- [x] **Section 4.5.3: UI Kit**
    - [x] Component: Button (primary/secondary variants)
    - [x] Component: Card (bg-white, border-black/10, rounded-2xl)
    - [x] Component: Input (with label, error handling)
- [x] **Section 4.5.4: Pages**
    - [x] Page: Login (Client Component, react-hook-form + zod)
    - [x] Page: Dashboard (Server Component, metrics, API integration)
    - [x] Page: Task Creation Form (Client Component, dynamic fields)

---

## 💎 PHASE BETA: OPERATIONS & ENTERPRISE (Scale)
*Цель: Полная оцифровка бизнеса и производства.*

### 🔥 BLOCK B0: TECH DEBT FIXES (BLOCKER)
- [x] **Section B0.1: Unified FSM**
    - [x] Interface: `StateMachine<TState, TEvent>`
    - [x] Migration: Task FSM → Unified
    - [x] Migration: APL FSM → Unified
- [x] **Section B0.2: Redis Sessions**
    - [x] Telegram auth → Redis storage
    - [x] TTL + rotation policy
- [x] **Section B0.3: Bot API Isolation**
    - [x] Remove Prisma from Telegram Bot
    - [x] ApiClient: retry + circuit breaker
    - [x] Idempotency keys

### 🏢 BLOCK 5: CONTOUR 1 - BACK-OFFICE
- [x] **Section 5.1: Consulting Control Plane (CMR)**
    - [x] **Module:** `tech-map-builder` (Detailed ATK Editor)
        - [x] Entity: `TechMap`, `MapOperation` (Hourly slots)
        - [x] UI: Canvas Editor for Agronomists (API Ready)
    - [x] **Module:** `crm-control-plane` (Decision & Risk)
        - [x] Entity: `DeviationReview` (Tripartite Consensus)
        - [x] Logic: Silence = Event (Liability Shift Logic)
        - [x] Feature: Decision Log with Confidence Score
    - [x] **Strategic Amplifiers**:
        - [x] Logic: Risk Architecture (`CmrRisk`, `InsuranceCoverage`)
        - [x] Logic: Client Maturity Calculation
        - [x] Logic: Knowledge Object aggregation
- [x] **Section 5.2: HR Ecosystem (Canon Architecture) 🧬 ✅**
    - [x] **5.2.1 Foundation Layer**: Event-driven Profile Projection, Onboarding Registry, Support.
    - [x] **5.2.2 Incentive Layer**: OKR Alignment, KPI Signals, Recognition, Rewards.
    - [x] **5.2.3 Development Layer**: Pulse Signals, Assessment Snapshots (Burnout), Growth Actions (Strategic).
- [x] **Section 5.3: Finance & Economy ✅**
    - [x] Engine: `EconomicEvent` & `LedgerEntry` (Immutable)
    - [x] Feature: Budgeting FSM & Liquidity Radar
    - [x] Engine: `WhatIfSimulator` (ROI Calculation - B3.5 verification complete)
- [x] **Section 5.4: GR & Legal (Sprint B4) ⚖️**
    - [x] **Module:** `legal-engine` (Compliance Signaling)
        - [x] Entity: `LegalDocument`, `LegalNorm`, `LegalRequirement`, `Obligation`, `Sanction`
        - [x] Logic: Automatic Compliance Status calculation
    - [x] **Module:** `legal-api` (Registry & Monitoring)
        - [x] Feature: Regulatory Body Registry
        - [x] Feature: GR Interaction tracking
        - [x] Feature: External Feeds (GigaLegal client)

### 🚜 BLOCK 6: CONTOUR 2 - FRONT-OFFICE ✅
- [x] **Section 6.1: Operations**
    - [x] Module: Warehouse & Supply Chain (StockItem Registry)
    - [x] Module: Machinery Registry & Fleet Management
- [ ] **Section 6.2: Advanced Agro**
    - [ ] AI: Vision Service Integration (Pest Detection)
    - [ ] Tool: Real-time Field Economics Calculator
- [x] **Section 6.3: Unified Risk Engine (Sprint B6) 🛡️ ✅**
---
id: component-implementation-tech-plan
type: component
status: review
owners: [techleads]
aligned_with: [principle-axioms]
---

# 🏗️ DETAILED TECHNICAL DEVELOPMENT PLAN (WBS)

> **Статус:** **COMPLETED** | **Завершен:** 08.02.2026 | **Владелец:** TechLead
> **Охват:** Соответствует `FULL_PROJECT_WBS.md` (Enterprise Edition)

Этот документ декомпозирует стратегический Roadmap на конкретные инженерные задачи.
Структура: **Фаза** → **Контур** → **Блок** → **Задача**.

---

## 🏗️ PHASE ALPHA: FOUNDATION (MVP)
*Цель: Валидация Архитектуры, APL (Рапс) и запуск ядра.*

### 📦 BLOCK 1: CORE INFRASTRUCTURE
- [ ] **Section 1.1: Project Setup & Monorepo**
    - [x] Инициализация Turborepo
    - [x] Настройка ESLint/Prettier
    - [x] Настройка Docker Compose (Postgres, Redis)
- [ ] **Section 1.2: Identity & Access (IAM)**
    - [x] Entity: `User`, `Account`, `Company` (Prisma)
    - [x] Service: `AuthService` (JWT, RBAC)
    - [x] Feature: Multi-tenancy (Company Isolation)

### 🎼 BLOCK 2: AGRO PROCESS LAYER (CONTOUR 2 START)
- [x] **Section 2.1: Orchestrator Scaffolding**
    - [x] Module: `agro-orchestrator` (State Machine base)
    - [x] Graph: Porting Rapeseed 16 Stages to Enum/Const
- [x] **Section 2.2: Rule Engine Foundation**
    - [x] Lib: `json-logic-js` integration
    - [x] Rule: Hard Constraint Check Template

### 🏢 BLOCK 3: ENTERPRISE IDENTITY & STRUCTURE LAYER (CONTOUR 1 START)
- [x] **Section 3.1: Client Registry & Holdings**
    - [x] Entity: `Holding`, `Client` (Hierarchy & Ownership)
    - [x] Service: `ClientRegistry` (Passive Registry)
- [x] **Section 3.2: Identity Registry (Profiles)**
    - [x] Entity: `EmployeeProfile`, `RoleDefinition` (Org Positions)
    - [x] Logic: Lifecycle & Multi-tenant Isolation



### 🧠 BLOCK 4: UNIFIED MEMORY (INFRA)
- [x] **Section 4.1: Storage Setup**
    - [x] Redis: Session & Context storage (`ContextService`)
    - [x] pgvector: Custom Dockerfile & Migration
    - [x] Service: `@rai/vector-store` (Abstraction layer)
    - [x] Logic: Policy-driven `MemoryManager`

### 🌐 BLOCK 4.5: FRONTEND (WEB INTERFACE)
- [x] **Section 4.5.1: Next.js 14 Setup**
    - [x] Project: `apps/web` (App Router, TypeScript, Tailwind CSS)
    - [x] Config: next.config.js, tailwind.config.js, tsconfig.json
    - [x] Fonts: Geist integration (UI Design Canon)
- [x] **Section 4.5.2: Authentication**
    - [x] Route Handlers: `/api/auth/login`, `/api/auth/logout` (Server-side)
    - [x] Middleware: Edge Runtime route protection
    - [x] JWT: HttpOnly cookies (secure, sameSite)
- [x] **Section 4.5.3: UI Kit**
    - [x] Component: Button (primary/secondary variants)
    - [x] Component: Card (bg-white, border-black/10, rounded-2xl)
    - [x] Component: Input (with label, error handling)
- [x] **Section 4.5.4: Pages**
    - [x] Page: Login (Client Component, react-hook-form + zod)
    - [x] Page: Dashboard (Server Component, metrics, API integration)
    - [x] Page: Task Creation Form (Client Component, dynamic fields)

---

## 💎 PHASE BETA: OPERATIONS & ENTERPRISE (Scale)
*Цель: Полная оцифровка бизнеса и производства.*

### 🔥 BLOCK B0: TECH DEBT FIXES (BLOCKER)
- [x] **Section B0.1: Unified FSM**
    - [x] Interface: `StateMachine<TState, TEvent>`
    - [x] Migration: Task FSM → Unified
    - [x] Migration: APL FSM → Unified
- [x] **Section B0.2: Redis Sessions**
    - [x] Telegram auth → Redis storage
    - [x] TTL + rotation policy
- [x] **Section B0.3: Bot API Isolation**
    - [x] Remove Prisma from Telegram Bot
    - [x] ApiClient: retry + circuit breaker
    - [x] Idempotency keys

### 🏢 BLOCK 5: CONTOUR 1 - BACK-OFFICE
- [x] **Section 5.1: Consulting Control Plane (CMR)**
    - [x] **Module:** `tech-map-builder` (Detailed ATK Editor)
        - [x] Entity: `TechMap`, `MapOperation` (Hourly slots)
        - [x] UI: Canvas Editor for Agronomists (API Ready)
    - [x] **Module:** `crm-control-plane` (Decision & Risk)
        - [x] Entity: `DeviationReview` (Tripartite Consensus)
        - [x] Logic: Silence = Event (Liability Shift Logic)
        - [x] Feature: Decision Log with Confidence Score
    - [x] **Strategic Amplifiers**:
        - [x] Logic: Risk Architecture (`CmrRisk`, `InsuranceCoverage`)
        - [x] Logic: Client Maturity Calculation
        - [x] Logic: Knowledge Object aggregation
- [x] **Section 5.2: HR Ecosystem (Canon Architecture) 🧬 ✅**
    - [x] **5.2.1 Foundation Layer**: Event-driven Profile Projection, Onboarding Registry, Support.
    - [x] **5.2.2 Incentive Layer**: OKR Alignment, KPI Signals, Recognition, Rewards.
    - [x] **5.2.3 Development Layer**: Pulse Signals, Assessment Snapshots (Burnout), Growth Actions (Strategic).
- [x] **Section 5.3: Finance & Economy ✅**
    - [x] Engine: `EconomicEvent` & `LedgerEntry` (Immutable)
    - [x] Feature: Budgeting FSM & Liquidity Radar
    - [x] Engine: `WhatIfSimulator` (ROI Calculation - B3.5 verification complete)
- [x] **Section 5.4: GR & Legal (Sprint B4) ⚖️**
    - [x] **Module:** `legal-engine` (Compliance Signaling)
        - [x] Entity: `LegalDocument`, `LegalNorm`, `LegalRequirement`, `Obligation`, `Sanction`
        - [x] Logic: Automatic Compliance Status calculation
    - [x] **Module:** `legal-api` (Registry & Monitoring)
        - [x] Feature: Regulatory Body Registry
        - [x] Feature: GR Interaction tracking
        - [x] Feature: External Feeds (GigaLegal client)

### 🚜 BLOCK 6: CONTOUR 2 - FRONT-OFFICE ✅
- [x] **Section 6.1: Operations**
    - [x] Module: Warehouse & Supply Chain (StockItem Registry)
    - [x] Module: Machinery Registry & Fleet Management
- [ ] **Section 6.2: Advanced Agro**
    - [ ] AI: Vision Service Integration (Pest Detection)
    - [ ] Tool: Real-time Field Economics Calculator
- [x] **Section 6.3: Unified Risk Engine (Sprint B6) 🛡️ ✅**
    - [x] Engine: `@rai/risk-engine` with Deterministic FSM
    - [x] Feature: Physical Risk Gates in Orchestrators
    - [x] Audit: Decision Traceability & Risk Timeline

---

## 🛰️ PHASE GAMMA: INTELLIGENCE & EXPANSION
*Цель: Когнитивная Автономность и расширение Consulting.*

### 🏢 BLOCK 9: CONSULTING EXPANSION (TRACK 1 - DONE ✅)
- [x] **Section 9.1: TechMap Integration & Integrity**
    - [x] [DB] PostgreSQL Partial Unique Index for `status = 'ACTIVE'`.
    - [x] [DB] Complex Migration Resolution (CASCADE drops, dependency audit).
    - [x] [Schema] Field/Crop/Season/Version cardinality enforcement.

### 🧠 BLOCK 7: COGNITIVE BRAIN
- [ ] **Section 7.1: Semantic Memory**
    - [x] Service: `EpisodicRetrievalService` (Shadow v1, retrieval + confidence ranking)
    - [x] Unit Tests: `episodic-retrieval.service.spec.ts`
    - [x] Rules: `engram-rules` (`POSITIVE/NEGATIVE/UNKNOWN`) + unit tests
    - [x] Service: `ShadowAdvisoryService` (shadow verdict + traceId + audit trail)
    - [x] Unit Tests: `shadow-advisory.service.spec.ts`, `engram-rules.spec.ts`
    - [x] Integration: shadow advisory calls in `VisionIngestionService` and `SatelliteIngestionService`
    - [x] Integration: shadow advisory calls in `FieldObservationService` (operation signals)
    - [x] Reporting: `ShadowAdvisoryMetricsService` (coverage/allow-review-block/avg confidence)
    - [x] Unit Tests: `shadow-advisory-metrics.service.spec.ts`
    - [x] Contract Doc: `docs/04-ENGINEERING/SHADOW_ADVISORY_CONTRACT.md`
    - [x] Explainability v2: `why/factors/confidence/traceId` в `ShadowAdvisoryService`
    - [x] API Module: `AdvisoryModule` (`/api/advisory/recommendations/*`)
    - [x] Human Confirmation Flow: `accept/reject` + audit events `ADVISORY_ACCEPTED`, `ADVISORY_REJECTED`
    - [x] Feedback Loop: endpoint `feedback` + audit event `ADVISORY_FEEDBACK_RECORDED`
    - [x] Telegram UX: карточка рекомендации + действия `Принять/Отклонить` + ввод причины
    - [x] Web UX: Recommendation Panel на dashboard + proxy routes `/api/advisory/*`
    - [x] Unit Tests: `advisory.service.spec.ts` (confirmation/feedback/pending flow)
    - [x] Pilot Activation (Sprint 5): tenant/user feature flags + controlled rollout policy
    - [x] Ranking Tuning (Sprint 5): threshold config for `ALLOW/REVIEW/BLOCK` based on feedback metrics
    - [x] Prompt Fatigue Control (Sprint 5): anti-spam throttling and dedup for repeated recommendations
    - [x] SLO Metrics Pipeline (Sprint 5): `ops/metrics` endpoint (coverage/conversion/decision lag)
    - [x] SLO Dashboard (Sprint 5): latency/error/coverage/conversion operational panel
    - [x] Pilot Eligibility API (Sprint 5): `pilot/status`, `pilot/enable`, `pilot/disable`, `pilot/cohort`, `pilot/cohort/add`, `pilot/cohort/remove`
    - [x] Pilot Enforcement (Sprint 5): Telegram/Web advisory access gated by `pilot/status`
    - [x] Pilot Telemetry (Sprint 5): audit and metrics for flag changes and pilot cohort behavior
    - [x] Incident Runbook Hooks (Sprint 5): kill-switch + rollback endpoints and operational procedures
    - [x] Tests (Sprint 5): >=8 unit/integration tests for pilot flags, tuning loop, anti-spam, incident hooks
    - [x] Canary Rollout Protocol (Sprint 6): staged rollout `10% -> 25% -> 50% -> 100%` with gate criteria and auto-stop
    - [x] Load & Stress Validation (Sprint 6): advisory load baseline executed, capacity metrics documented
    - [x] Reliability Hardening (Sprint 6): state-cache optimizations + stress validation for advisory paths
    - [x] Operational Readiness (Sprint 6): on-call drill executed, escalation path and incident controls verified
    - [x] DR & Rollback Drill (Sprint 6): rehearsal executed, rollback and recovery metrics documented
    - [x] Go/No-Go Package (Sprint 6): decision record completed (`GO WITH CONSTRAINTS`) with evidence links
    - [ ] Tests (Sprint 6): >=10 unit/integration/e2e tests for rollout hooks, resilience and incident paths
    - [x] Policy Doc: `docs/04-ENGINEERING/ADVISORY_PILOT_ROLLOUT_POLICY.md`
    - [x] Policy Doc: `docs/04-ENGINEERING/ADVISORY_TUNING_POLICY.md`
    - [x] Runbook Doc: `docs/04-ENGINEERING/ADVISORY_INCIDENT_RUNBOOK.md`
    - [x] Tabletop Protocol: `docs/04-ENGINEERING/ADVISORY_INCIDENT_TABLETOP_PROTOCOL.md`
    - [x] Canary Protocol Doc (Sprint 6): `docs/04-ENGINEERING/ADVISORY_CANARY_ROLLOUT_PROTOCOL.md`
    - [x] Go/No-Go Decision Record (Sprint 6): `docs/04-ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md`
    - [x] Security Gate Report (Sprint 6): `docs/04-ENGINEERING/ADVISORY_SECURITY_GATE_REPORT_SPRINT6.md`
    - [x] Post-Launch Monitoring Window: `docs/04-ENGINEERING/ADVISORY_S3_MONITORING_WINDOW.md`
    - [x] S4 Gate Packet Template: `docs/04-ENGINEERING/ADVISORY_S4_GATE_PACKET_TEMPLATE.md`
    - [x] S4 Gate Evaluation (DEV_PREPROD): `docs/04-ENGINEERING/ADVISORY_S4_GATE_DECISION_INPUT.md` (`GO`, `>=20 PASS snapshots`)
    - [x] S4 Promotion Smoke Report: `docs/04-ENGINEERING/ADVISORY_S4_PROMOTION_SMOKE_REPORT_2026-02-08.md` (`S4=100%`)
    - [ ] Sprint 7 Stabilization & Gamma Exit Prep: `docs/06-IMPLEMENTATION/PHASE_GAMMA/SPRINT_7_CHECKLIST.md`
    - [x] Contract Doc: `docs/04-ENGINEERING/ADVISORY_EXPLAINABILITY_CONTRACT.md`
    - [ ] Graph DB Integration (Memgraph/Neo4j)
    - [ ] Ontology Construction (Agro + Business domains)
- [ ] **Section 7.2: AI Agents**
    - [ ] Agent: `BusinessPlanner` (Strategy generation)
    - [ ] Agent: `LegalAdvisor` (Contract analysis)

### 🌐 BLOCK 8: ECOSYSTEM
- [ ] Marketplace API
- [ ] Financial Scoring Public API

