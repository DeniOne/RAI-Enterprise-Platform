---
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

### 🧠 7. Cognitive Brain (Unified Memory Full)
- [ ] **[AI]** **Knowledge Graph**: Построение причинно-следственных связей.
- [ ] **[AI]** **Planner Agent**: Авто-стратегия на сезон.

### 🌐 8. Ecosystem
- [ ] **[Platform]** Marketplace API (Поставщики).
- [ ] **[Platform]** Financial Scoring for Banks.
