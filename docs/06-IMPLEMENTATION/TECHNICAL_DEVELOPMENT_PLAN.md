# 🏗️ DETAILED TECHNICAL DEVELOPMENT PLAN (WBS)

> **Статус:** Живой документ | **Обновлено:** 2026-02-03 | **Владелец:** TechLead
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
        - [ ] Logic: Client Maturity Calculation
        - [ ] Logic: Knowledge Object aggregation
- [ ] **Section 5.2: HR Ecosystem**
    - [ ] Feature: Pulse Surveys (Form Builder + Analytics)
    - [ ] Feature: OKR Evaluation Engine
- [ ] **Section 5.3: Finance & Economy**
    - [ ] Engine: `WhatIfSimulator` (ROI Calculation)
    - [ ] Feature: Treasury & Budgeting

### 🚜 BLOCK 6: CONTOUR 2 - FRONT-OFFICE
- [ ] **Section 6.1: Operations**
    - [ ] Module: Warehouse & Supply Chain (Just-in-Time logic)
    - [ ] Module: Machinery Registry & Fleet Management
- [ ] **Section 6.2: Advanced Agro**
    - [ ] AI: Vision Service Integration (Pest Detection)
    - [ ] Tool: Real-time Field Economics Calculator

---

## 🛰️ PHASE GAMMA: INTELLIGENCE (Future)
*Цель: Когнитивная Автономность.*

### 🧠 BLOCK 7: COGNITIVE BRAIN
- [ ] **Section 7.1: Semantic Memory**
    - [ ] Graph DB Integration (Memgraph/Neo4j)
    - [ ] Ontology Construction (Agro + Business domains)
- [ ] **Section 7.2: AI Agents**
    - [ ] Agent: `BusinessPlanner` (Strategy generation)
    - [ ] Agent: `LegalAdvisor` (Contract analysis)

### 🌐 BLOCK 8: ECOSYSTEM
- [ ] Marketplace API
- [ ] Financial Scoring Public API
