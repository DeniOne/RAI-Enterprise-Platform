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
Truth-sync: `VERIFIED`
Evidence: `apps/api/src/modules/rai-chat/rai-chat.controller.ts`, `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts`, `apps/web/lib/stores/ai-chat-store.ts`, `interagency/reports/2026-03-01_p0-1_api-rai-chat.md`
How to verify: `cd apps/api && npx jest --runInBand test/modules/rai-chat/rai-chat.controller.spec.ts`

### 🌾 14.1 Agro Telegram Draft→Commit (P0.3) ✅
- [x] **[Backend]** **AgroEventsModule**: `apps/api/src/modules/agro-events/*` (draft/fix/link/confirm/commit).
- [x] **[Security]** Tenant isolation: `companyId` только из доверенного контекста, не из payload.
- [x] **[Test]** MUST-gate unit-test: изолированный jest config (agro-events).
Truth-sync: `VERIFIED`
Evidence: `apps/api/src/modules/agro-events/*`, `apps/api/jest.agro-events.config.js`, `interagency/reports/2026-03-01_p0-3_agro-telegram-draft-commit.md`
How to verify: `cd apps/api && node ./node_modules/jest/bin/jest.js --config ./jest.agro-events.config.js --runInBand`

### 🛰️ 14.2 Agent OS Reinforcements (P0.5 / P1.1 / P1.2 / P1.3)
- [x] **[Backend]** **AgroEscalation Loop (P0.5)**: escalation на `S3/S4` после commit Agro event.
Evidence: `apps/api/src/modules/agro-events/agro-escalation-loop.service.ts`, `apps/api/src/modules/agro-events/agro-escalation-loop.service.spec.ts`, `interagency/reports/2026-03-01_p0-5_agro-escalation-controller-loop.md`
- [x] **[Backend]** **Typed Tools Registry (P1.1)**: `RaiToolsRegistry`, whitelist tools, schema validation, structured logging.
Evidence: `apps/api/src/modules/rai-chat/tools/*`, `interagency/reports/2026-03-01_p1-1_typed-tools-registry.md`
- [x] **[Backend/Web]** **Widgets Rail (P1.2)**: канонический `widgets[]` schema + renderer для `DeviationList` и `TaskBacklog`.
Evidence: `apps/api/src/modules/rai-chat/widgets/*`, `apps/web/components/ai-chat/AiChatWidgetsRail.tsx`, `interagency/reports/2026-03-01_p1-2_widgets-schema-renderer.md`
- [x] **[Backend]** **Chat Memory (P1.3)**: recall + append в `RaiChatService` с tenant-scope и лимитами.
Evidence: `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`, `interagency/reports/2026-03-02_p1-3_agent-chat-memory.md`
- [x] **[Backend]** **Memory Adapter Write Routing (S5.4)**: `appendInteraction` переведен на `MemoryInteraction`, `userId` прокинут сквозь RAI Chat, embedding пишется транзакционно, JSON attrs санитизируется рекурсивно.
Evidence: `apps/api/src/shared/memory/default-memory-adapter.service.ts`, `apps/api/src/shared/memory/memory-adapter.spec.ts`, `interagency/reports/2026-03-03_s5-4_adapter-write-routing.md`
- [ ] **[Docs]** **Status Truth Sync (P1.4)**: execution docs and checklists aligned with code evidence.
Truth-sync: `IN_PROGRESS`, admission `AG-STATUS-TRUTH-001 = ACCEPTED`

### 🌐 14.3 WorkspaceContext Expand (P2.1)
- [x] **[Web]** **WorkspaceContext Expand (P2.1)**: Commerce contracts + consulting/execution/manager публикуют contract/operation refs, summaries, filters.
Truth-sync: `VERIFIED`
Evidence: `apps/web/app/(app)/commerce/contracts/page.tsx`, `apps/web/app/consulting/execution/manager/page.tsx`, `interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md`
How to verify: `cd apps/web && npx jest --runInBand shared/contracts/commerce-contracts-page.spec.tsx shared/contracts/execution-manager-workspace-context.spec.tsx`

### 🌐 14.4 External Signals Advisory (P2.2)
- [x] **[Backend]** **External Signals Advisory (P2.2)**: тонкий срез `signals -> advisory -> feedback -> memory append` в RAI Chat.
Truth-sync: `VERIFIED`
Evidence: `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`, `apps/api/src/modules/rai-chat/external-signals.service.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `interagency/reports/2026-03-02_p2-2_external-signals-advisory.md`
How to verify: `cd apps/api && pnpm test -- --runInBand src/modules/rai-chat/rai-chat.service.spec.ts src/modules/rai-chat/external-signals.service.spec.ts`

### 🌐 14.5 AppShell (S1.1)
- [x] **[Web]** **AppShell + LeftRaiChatDock**: чат живёт в shell, не размонтируется при навигации; история и Dock/Focus сохраняются.
Truth-sync: `VERIFIED`
Evidence: `apps/web/components/layouts/AppShell.tsx`, `apps/web/components/ai-chat/LeftRaiChatDock.tsx`, `apps/web/lib/stores/ai-chat-store.ts`, `interagency/reports/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`
How to verify: `cd apps/web && pnpm exec tsc -p tsconfig.json --noEmit && pnpm test -- --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-chat-widgets-rail.spec.tsx`
Ограничение: manual smoke не выполнен.

### 🌐 14.6 Chat Widget Logic (S4.1)
- [x] **[Backend]** **Modular Widget Builder**: логика формирования виджетов вынесена в `RaiChatWidgetBuilder`.
- [x] **[Backend]** **Context-Aware Widgets**: виджеты (`DeviationList`, `TaskBacklog`) зависят от `route` и `companyId`.
Truth-sync: `VERIFIED`
Evidence: `apps/api/src/modules/rai-chat/rai-chat-widget-builder.ts`, `apps/api/src/modules/rai-chat/rai-chat.service.ts`, `interagency/reports/2026-03-03_s4-1_chat-widget-logic.md`
How to verify: `cd apps/api && npx jest --runInBand src/modules/rai-chat/rai-chat.service.spec.ts`

### 🌐 14.7 Memory Adapter Contract (S5.1)
- [x] **[Backend]** **Memory Abstraction Layer**: `MemoryAdapter` interface and `DefaultMemoryAdapter` implementation.
- [x] **[Backend]** **Service Refactoring**: `RaiChatService` и `ExternalSignalsService` используют адаптер.
Truth-sync: `VERIFIED`
Evidence: `apps/api/src/shared/memory/memory-adapter.interface.ts`, `apps/api/src/shared/memory/default-memory-adapter.service.ts`, `interagency/reports/2026-03-03_s5-1_memory-adapter-contract.md`
How to verify: `cd apps/api && npx jest --runInBand src/shared/memory/memory-adapter.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts`

### 🌐 14.8 Memory Storage Canon (S5.2)
- [x] **[Architecture]** **Tiered Storage**: Описание уровней хранения S/M/L Tiers.
- [x] **[Architecture]** **Carcass+Flex**: Правила расширения памяти агента через JSONB.
Truth-sync: `VERIFIED`
Evidence: `docs/01_ARCHITECTURE/PRINCIPLES/MEMORY_CANON.md`, `DECISIONS.log` (AG-MEMORY-CANON-001)

### 🌐 14.9 Memory Schema Implementation (S5.3)
- [x] **[Database]** **Memory DB Schema**: Добавлены Prisma-модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile`.
- [x] **[Types]** **Memory DTOs**: Zod/TS типы определены в `shared/memory`.
Truth-sync: `VERIFIED`
Evidence: `packages/prisma-client/schema.prisma`, `interagency/reports/2026-03-03_s5-3_memory-schema-implementation.md`

### 🌐 15. Ecosystem
