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
    - [x] Engine: `@rai/risk-engine` with Deterministic FSM (RFC8785 & 10/10 Hardening)
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

### 🧠 BLOCK 7: LEVEL B - GENERATIVE ARCHITECT ✅
- [x] **Section 7.1: Semantic Memory & Shadow Advisory**
    - [x] Service: `EpisodicRetrievalService` (Shadow v1, retrieval + confidence ranking)
    - [x] Unit Tests: `episodic-retrieval.service.spec.ts`
    - [x] Rules: `engram-rules` (`POSITIVE/NEGATIVE/UNKNOWN`) + unit tests
    - [x] Service: `ShadowAdvisoryService` (shadow verdict + traceId + audit trail)
    - [x] Integration: shadow advisory calls in `VisionIngestionService`, `SatelliteIngestionService`, `FieldObservationService`
    - [x] Contract Doc: `docs/04-ENGINEERING/SHADOW_ADVISORY_CONTRACT.md`
    - [x] API Module: `AdvisoryModule` (`/api/advisory/recommendations/*`)
    - [x] Explainability & Confirmation: карточка рекомендации + действия `Принять/Отклонить`
    - [x] Pilot Activation & Tuning (Sprint 5) + Anti-Spam (Sprint 5) + SLO Metrics (Sprint 5).
    - [x] Canary Rollout Protocol (Sprint 6): staged rollout `10% -> 25% -> 50% -> 100%`.
- [x] **Section 7.2: Generative Formal Verification**
    - [x] Verification: Agronomic Strategy Library, FSM Alignment, Traceability Matrix.
    - [x] Test: `LEVEL_B_FORMAL_TEST_MATRIX.md` with Adversarial Test Class.

### 🛡️ BLOCK 8: LEVEL C - CONTRADICTION ENGINE ✅
- [x] **Section 8.1: FSM Governance Guard**
    - [x] Logic: Hash-after-rounding policies, Idempotency enforcement.
    - [x] Test: `LEVEL_C_FORMAL_TEST_MATRIX.md`.
- [x] **Section 8.2: Override Pipeline & Regret Metrics**
    - [x] Feature: ConflictExplainabilityBuilder & E2E Override Pipeline.
    - [x] Metric: Bounded Regret, Risk Calibration Score (RCS).
    - [x] Gate: Industrial Guardrails for override limits.

### 🤖 BLOCK 9: LEVEL D - ADAPTIVE SELF-LEARNING ✅
- [x] **Section 9.1: Hardening Phase C**
    - [x] Redis: Atomic Concurrency Cap (Incr/Decr)
    - [x] Service: `CanaryService` statistical gating (Sample Size >= 100)
    - [x] Schema: `ModelStatus` enhancement (`QUARANTINED`)
    - [x] Security: `Genesis Guard` (Deterministic Anchor Hash)
    - [x] Test: `verify-chaos-c.ts` validation
- [ ] **Section 9.2: AI Agents**
    - [ ] Graph DB Integration (Memgraph/Neo4j)
    - [ ] Ontology Construction (Agro + Business domains)
    - [ ] Agent: `BusinessPlanner` (Strategy generation)
    - [ ] Agent: `LegalAdvisor` (Contract analysis)

### 🏢 BLOCK 10: CONSULTING EXPANSION (TRACK 1, 2, 3, 5 - DONE ✅)
- [x] **Section 10.1: TechMap Integration & Integrity**
    - [x] [DB] PostgreSQL Partial Unique Index for `status = 'ACTIVE'`.
    - [x] [DB] Complex Migration Resolution (CASCADE drops, dependency audit).
    - [x] [Schema] Field/Crop/Season/Version cardinality enforcement.
- [x] **Track 2: Budget Vertical Slice (Financial Control)** ✅
    - [x] Entity: `BudgetPlan`, `BudgetItem` (versioning, categories)
    - [x] Logic: Financial Gate (blocking HarvestPlan without LOCKED budget)
    - [x] FSM: `DRAFT -> APPROVED -> LOCKED -> CLOSED`
- [x] **Track 3: Advisory Engine (Analytics)** ✅
    - [x] Service: `AdvisoryService` (Health Index, Volatility Index)
    - [x] Logic: Trend Analysis (30-day window) & Confidence Scoring
- [x] **Track 5: Yield & KPI Engineering** ✅
    - [x] Entity: `HarvestResult` with financial snapshotting
    - [x] Service: `YieldOrchestrator` & `KPIService` (ROI calculation)

### 🌱 BLOCK 11: LEVEL E - REGENERATIVE OPTIMIZATION (CONTRACT-DRIVEN) ✅
- [x] **Section 11.1: Contract Governance Layer**
    - [x] Entity: `ContractType` (`SEASONAL`, `ADVISORY`, `MANAGED_REGENERATIVE`)
    - [x] Feature: Delegated Authority enforcement
- [x] **Section 11.2: Regeneration Guard (I41)**
    - [x] Analytics: $\Delta$ SRI tracking & Monte Carlo Tail Risk (P05)
    - [x] Logic: Escalate vs Hard Lock based on `ContractType`

### 🏛️ BLOCK 12: LEVEL F - INSTITUTIONAL COGNITIVE STANDARD ✅
- [x] **Section 12.1: Cryptographic Integrity Engine**
    - [x] Logic: `Idempotency & Replay Cache` (Redis)
    - [x] Service: `HsmService` (Vault Enclave signing) & `MultisigService` (5-of-7 Governance)
    - [x] Storage: AWS S3 WORM Compliance mapping
- [x] **Section 12.2: Certification & Rating Engine**
    - [x] Engine: `Float-Math Sandbox` (Strict IEEE-754)
    - [x] Logic: `Assertion Fences` (5 Rules) and `JwtMinterService` (Ed25519)
- [x] **Section 12.3: Institutional Gateway & Dispute Infra**
    - [x] Firewall: `mTLS Guard` + Token Bucket Limiting
    - [x] Dispute: `Deterministic Replay API`, `CRL Bloom Filter`
    - [x] Blockchain: `SnapshotAnchor.sol` (L1 Anchoring + Node-Watcher)

### 🏢 BLOCK 14: RAI CHAT & AGENT OS (P0.1) ✅
- [x] **Section 14.1: Canonical Chat API**
    - [x] Module: `RaiChatModule` in `apps/api`
    - [x] Controller: `RaiChatController` (`POST /api/rai/chat`)
    - [x] Logic: Tenant-isolated (via `TenantContextService`), deterministic response, widgets support
    - [x] Security: `JwtAuthGuard` enforced, no payload-based `companyId`
- [x] **Section 14.2: Web Integration**
    - [x] Store: `AiChatStore` switched to `/api/rai/chat`
    - [x] Proxy: `apps/web/app/api/ai-chat/route.ts` turned into thin legacy proxy
- [x] **Section 14.3: Verification**
    - [x] Test: `rai-chat.controller.spec.ts` (4/4 PASS)

### 🖼️ BLOCK 14.2: RAI WIDGETS & ARCHITECTURE (P1.x) ✅
- [x] **Section 14.2.1: Canonical Widgets Schema (v1.0)**
    - [x] Model: Typed `RaiChatWidget` and payloads (DeviationList, TaskBacklog)
    - [x] Logic: `buildWidgets` integration in `RaiChatService`
- [x] **Section 14.2.2: Web Widgets Renderer**
    - [x] Component: `AiChatWidgetsRail` (right sidebar)
    - [x] Logic: `AiChatPanel` layout update with responsive rail
- [x] **Section 14.2.3: Verification**
    - [x] Test: `rai-chat.service.spec.ts` (API schema)
    - [x] Test: `ai-chat-widgets-rail.spec.tsx` (Web renderer)

### 🌾 BLOCK 14.1: AGRO TELEGRAM DRAFT→COMMIT (P0.3) ✅
- [x] **Module:** `apps/api/src/modules/agro-events/*` (draft/fix/link/confirm/commit).
- [x] **Security:** tenant isolation — `companyId` only from trusted context, never from payload.
- [x] **Verification:** MUST-gate unit-test via isolated jest config (`jest.agro-events.config.js`) — PASS (4/4).

### 🌐 BLOCK 15: ECOSYSTEM

