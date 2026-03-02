---
id: DOC-EXE-GEN-136
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿---
id: component-implementation-wbs
type: component
status: review
owners: [techleads, architects]
aligned_with: [principle-vision]
---

# Project Master Plan: RAI Enterprise Platform (Full WBS) 🚀

> **Цель:** Создание полной операционной системы агробизнеса (Back Office + Front Office + AI).
> **Охват:** Phase Alpha → Beta → Gamma.

---

## 🏗️ Phase Alpha: Foundation (MVP)
*Цель: Валидация Архитектуры, APL (Рапс) и запуск ядра.*

### 📦 1. Core Architecture ✅
- [x] **[Backend]** **Business Core**: Identity, Auth (JWT), RBAC.
- [x] **[Backend]** **Task Engine**: REST API + FSM.
- [x] **[Backend]** **Audit Service**: Логгирование + REST API.
- [x] **[Infra]** Turborepo Setup, Docker, CI/CD.

### 🎼 2. Agro Process Layer (Contour 2 Start) ✅
- [x] **[Backend]** **Orchestrator**: State Machine (16 Stages).
- [x] **[Backend]** **Rule Engine**: Hard Constraints (Влага, Глубина).
- [x] **[Backend]** **Digital Agronomist (Bot v1)**: Task handlers (без фото).

### 🏢 3. Enterprise Identity & Structure Layer (Contour 1 Start)
- [x] **[Backend]** **Holdings Registry**: Реестр холдингов, иерархия клиентов.
- [x] **[Backend]** **Identity Registry**: Профили сотрудников, организационные роли.



### 🧠 4. Unified Memory (Infrastructure)
- [x] **[DB]** Redis (Working Memory).
- [x] **[DB]** pgvector Setup (Episodic Memory).


---

## 💎 Phase Beta: Operations & Enterprise — DONE ✅
*Цель: Полная оцифровка бизнеса и производства.*

### 🔥 B0. Tech Debt Fixes (BLOCKER) ✅
- [x] **[Backend]** **Unified FSM**: `shared/state-machine/` interface.
- [x] **[Infra]** **Redis Sessions**: Telegram auth migration.
- [x] **[Backend]** **Bot API Isolation**: Remove Prisma, add retry/circuit breaker.

### 🏢 5. Contour 1: Enterprise Management (Back-Office)
#### 5.1 Consulting Control Plane (CMR) & Sales ✅
- [x] **[Backend]** **Tech Map Orchestrator**: Canvas Logic & Model.
- [x] **[Backend]** **CMR Engine**: Deviation Reviews & SLA Logic.
- [x] **[Backend]** **Risk Architecture**: Liability Matrix & Insurance.
- [x] **[Backend]** **Scoring System**: Оценка LTV и потенциала клиента.
- [x] **[Backend]** **Smart Contracts**: Авто-мониторинг KPI договора.

#### 5.2 HR Ecosystem (3-Contour Canon) 🧬 ✅
- [x] **[Backend]** **Foundation**: Event-driven Profiles, Onboarding Registry, Support.
- [x] **[Backend]** **Incentive**: OKR Engine, KPI Signals, Recognition, Rewards.
- [x] **[Backend]** **Development**: Pulse Signals, Assessment Snapshots, Growth Actions.

#### 5.3 Finance & Economy ✅
- [x] **[Backend]** **Simulation Engine**: What-if анализ (Расчет ROI).
- [x] **[Backend]** **Treasury**: Бюджетирование и платежный календарь.

#### 5.4 GR & Legal ✅
- [x] **[Backend]** **Legal AI**: Deep Domain Model & Compliance Engine.
- [x] **[Backend]** **GR Control**: Stakeholders & Policy Signals.
- [x] **[Integration]** **Feeds**: GigaLegal API integration (Drafting).

#### 6.1 Operations ✅
- [x] **[Backend]** **Supply Chain**: Склад, ТМЦ в Registry (Active).
- [x] **[Backend]** **Machinery**: Реестр техники в Registry (Active).

#### 6.2 Advanced Agro
﻿---
id: component-implementation-wbs
type: component
status: review
owners: [techleads, architects]
aligned_with: [principle-vision]
---

# Project Master Plan: RAI Enterprise Platform (Full WBS) 🚀

> **Цель:** Создание полной операционной системы агробизнеса (Back Office + Front Office + AI).
> **Охват:** Phase Alpha → Beta → Gamma.

---

## 🏗️ Phase Alpha: Foundation (MVP)
*Цель: Валидация Архитектуры, APL (Рапс) и запуск ядра.*

### 📦 1. Core Architecture ✅
- [x] **[Backend]** **Business Core**: Identity, Auth (JWT), RBAC.
- [x] **[Backend]** **Task Engine**: REST API + FSM.
- [x] **[Backend]** **Audit Service**: Логгирование + REST API.
- [x] **[Infra]** Turborepo Setup, Docker, CI/CD.

### 🎼 2. Agro Process Layer (Contour 2 Start) ✅
- [x] **[Backend]** **Orchestrator**: State Machine (16 Stages).
- [x] **[Backend]** **Rule Engine**: Hard Constraints (Влага, Глубина).
- [x] **[Backend]** **Digital Agronomist (Bot v1)**: Task handlers (без фото).

### 🏢 3. Enterprise Identity & Structure Layer (Contour 1 Start)
- [x] **[Backend]** **Holdings Registry**: Реестр холдингов, иерархия клиентов.
- [x] **[Backend]** **Identity Registry**: Профили сотрудников, организационные роли.



### 🧠 4. Unified Memory (Infrastructure)
- [x] **[DB]** Redis (Working Memory).
- [x] **[DB]** pgvector Setup (Episodic Memory).


---

## 💎 Phase Beta: Operations & Enterprise — DONE ✅
*Цель: Полная оцифровка бизнеса и производства.*

### 🔥 B0. Tech Debt Fixes (BLOCKER) ✅
- [x] **[Backend]** **Unified FSM**: `shared/state-machine/` interface.
- [x] **[Infra]** **Redis Sessions**: Telegram auth migration.
- [x] **[Backend]** **Bot API Isolation**: Remove Prisma, add retry/circuit breaker.

### 🏢 5. Contour 1: Enterprise Management (Back-Office)
#### 5.1 Consulting Control Plane (CMR) & Sales ✅
- [x] **[Backend]** **Tech Map Orchestrator**: Canvas Logic & Model.
- [x] **[Backend]** **CMR Engine**: Deviation Reviews & SLA Logic.
- [x] **[Backend]** **Risk Architecture**: Liability Matrix & Insurance.
- [x] **[Backend]** **Scoring System**: Оценка LTV и потенциала клиента.
- [x] **[Backend]** **Smart Contracts**: Авто-мониторинг KPI договора.

#### 5.2 HR Ecosystem (3-Contour Canon) 🧬 ✅
- [x] **[Backend]** **Foundation**: Event-driven Profiles, Onboarding Registry, Support.
- [x] **[Backend]** **Incentive**: OKR Engine, KPI Signals, Recognition, Rewards.
- [x] **[Backend]** **Development**: Pulse Signals, Assessment Snapshots, Growth Actions.

#### 5.3 Finance & Economy ✅
- [x] **[Backend]** **Simulation Engine**: What-if анализ (Расчет ROI).
- [x] **[Backend]** **Treasury**: Бюджетирование и платежный календарь.

#### 5.4 GR & Legal ✅
- [x] **[Backend]** **Legal AI**: Deep Domain Model & Compliance Engine.
- [x] **[Backend]** **GR Control**: Stakeholders & Policy Signals.
- [x] **[Integration]** **Feeds**: GigaLegal API integration (Drafting).

#### 6.1 Operations ✅
- [x] **[Backend]** **Supply Chain**: Склад, ТМЦ в Registry (Active).
- [x] **[Backend]** **Machinery**: Реестр техники в Registry (Active).

#### 6.2 Advanced Agro
- [ ] **[AI]** **Vision Service**: Диагностика болезней по фото.
- [ ] **[Backend]** **Real-time Economics**: Себестоимость операции в моменте.

#### 6.3 Unified Risk Engine (B6) 🛡️ ✅
- [x] **[Backend]** **Core Engine**: `@rai/risk-engine`
- [x] **[Backend]** **Gates**: Physical blocking.

---

## 🛰️ Phase Gamma: Intelligence & Ecosystem (2026)
*Цель: Когнитивная Автономность.*

### 🧠 7. Level B: Generative Architect ✅
- [x] **[AI]** **Generative Optimization**: Формальная верификация, Agronomic Strategy Library, FSM Alignment, Traceability Matrix.
- [x] **[AI]** **Episodic Retrieval (Shadow v1):** базовый retrieval-сервис + unit tests.
- [x] **[AI]** **Shadow Advisory (v1):** теневой ранкер `ALLOW/REVIEW/BLOCK` + audit trail.
- [x] **[AI]** **Shadow Baseline Metrics:** coverage/precision proxy и confidence baseline.
- [x] **[AI]** **Explainability & Confirmation (Sprint 4):** explainability-контракт `why/factors/confidence/traceId`, Telegram/Web recommendation cards, human confirmation + feedback audit flow.
- [x] **[AI]** **Pilot & Tuning (Sprint 5):** feature-flag rollout для фокус-группы, anti-spam control, SLO dashboard, incident runbook.
  - [x] Feature-flag rollout (`pilot/status|enable|disable|cohort`) + Telegram/Web enforcement
  - [x] Tuning thresholds + anti-spam noise control + ops metrics dashboard block
  - [x] Incident runbook tabletop validation
- [x] **[AI]** **Hardening & Controlled Go-Live (Sprint 6):** canary rollout, resilience hardening, load readiness, final go/no-go.
  - [ ] Canary rollout protocol (`10% -> 25% -> 50% -> 100%`) with stop/rollback gates
  - [x] Load/stress baseline report for advisory paths (`docs/04-ENGINEERING/ADVISORY_LOAD_STRESS_REPORT.md`)
  - [x] Reliability hardening and graceful degradation verification (state-cache + stress profiles)
  - [x] On-call readiness + alerting + escalation matrix validation (`docs/04-ENGINEERING/ADVISORY_ONCALL_DRILL_REPORT_2026-02-08.md`)
  - [x] DR/rollback drill with RTO/RPO evidence (`docs/04-ENGINEERING/ADVISORY_DR_REHEARSAL_REPORT_2026-02-08.md`)
  - [x] Formal go/no-go record prepared (`docs/04-ENGINEERING/ADVISORY_GO_NO_GO_DECISION_RECORD.md`)
  - [x] Security/governance gate completed (`docs/04-ENGINEERING/ADVISORY_SECURITY_GATE_REPORT_SPRINT6.md`)

### 🛡️ 8. Level C: Contradiction-Resilient Intelligence ✅
- [x] **[Backend]** **FSM Governance Guard**: Инвариантное блокирование противоречий, детерминизм, hash-after-rounding.
- [x] **[Backend]** **Conflict Logic**: ConflictExplainabilityBuilder, E2E Override Pipeline.
- [x] **[Backend]** **Regret Metrics**: Формализация Bounded Regret, Risk Calibration Score (RCS).
- [x] **[Backend]** **Industrial Guardrails**: Хардкорные замки для защиты бизнес-логики.

### 🤖 9. Level D: Adaptive Self-Learning Domain ✅
- [x] **[Backend]** **Hardening & Pilot Readiness (Phase C):** 
  - [x] Атомарные Redis-счетчики (Global Concurrency Cap).
  - [x] Статистическая защита Canary (Sample Size Gate >= 100).
  - [x] Расширение Model Registry (статус QUARANTINED).
  - [x] Genesis Guard (Anchor Trust Mechanism).
- [ ] **[AI]** **Knowledge Graph**: Построение причинно-следственных связей.
- [ ] **[AI]** **Planner Agent**: Авто-стратегия на сезон.

### 🏢 10. Consulting Expansion (2026)
- [x] **Track 1: TechMap Integration (Production Gate)** ✅
  - [x] [DB] Enforced PostgreSQL Partial Unique Index for ACTIVE TechMaps.
  - [x] [DB] Resolved complex migration dependencies (2BP01 errors).
  - [x] [DB] Database reset and drift elimination.
- [x] **Track 2: Budget Vertical Slice (Financial Control)** ✅
- [x] **Track 3: Advisory Engine (Analytics)** ✅
- [x] **Track 5: Yield & KPI Engineering** ✅

### 🌱 11. Level E: Regenerative Optimization ✅
- [x] **[Backend]** **Contract Governance**: Типы контрактов (`SEASONAL`, `MANAGED_REGENERATIVE`).
- [x] **[Backend]** **Regeneration Guard**: Запрет структурных просадок (P05 Tail Risk).
- [x] **[Backend]** **Liability Matrix Tracking**: Отражение ответственности (AI vs Human) в Audit.

### 🏛️ 12. Level F: Institutional Cognitive Standard ✅
- [x] **[Backend]** **Cryptographic Core**: Пул HSM, 5-of-7 Governance, Replay Caching, Snapshot Hashing (RFC 8785 • 10/10 Grade • Lexicographical DFS).
- [x] **[Backend]** **Certification Data-Pipeline**: Merkle DAG сшивание, Temporal Consistency.
- [x] **[Backend]** **Certification Engine**: Soft-float Rated grading, Assertion Fences, Ed25519 JWT Minter.
- [x] **[Infra]** **Gateway & Dispute**: mTLS Firewall, L1 Anchoring, Node-Watchers, Replay API, Bloom Filter CRL.

### 🏢 14. RAI Chat & Agent OS (P0.1) ✅
- [x] **[Backend]** **Canonical Chat API**: `POST /api/rai/chat`, Tenant isolation enforced, deterministic logic.
- [x] **[Frontend]** **Web Chat Integration**: Switch to backend API, remove mock routes.
- [x] **[Backend]** **Modular Architecture**: `RaiChatModule` integrated in apps/api.

### 🖼️ 14.2 RAI Widgets & Architecture (P1.x) ✅
- [x] **[Backend]** **Canonical Widgets Schema**: v1.0, typed payloads, `RaiChatService` integration.
- [x] **[Frontend]** **Widgets Renderer**: Right rail panel, `AiChatWidgetsRail`, support for `DeviationList`/`TaskBacklog`.
- [x] **[Test]** **Verification**: API/Web unit tests passing.

### 🌾 14.1 Agro Telegram Draft→Commit (P0.3) ✅
- [x] **[Backend]** **AgroEventsModule**: `apps/api/src/modules/agro-events/*` (draft/fix/link/confirm/commit).
- [x] **[Security]** Tenant isolation: `companyId` только из доверенного контекста, не из payload.
- [x] **[Test]** MUST-gate unit-test: изолированный jest config (agro-events).

### 🌐 15. Ecosystem
