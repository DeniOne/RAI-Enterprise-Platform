# Блок 4: Unified Memory Infrastructure (Implementation)

- [x] **Section 4.1: Infrastructure & Schema**
    - [x] Create custom PostgreSQL Dockerfile (PostGIS/pgvector)
    - [x] Update `docker-compose.yml` with build context
    - [x] Add `MemoryEntry` to Prisma Schema
    - [x] Create manual SQL migration for vector constraints
- [x] **Section 4.2: Core Packages**
    - [x] Initialize `@rai/vector-store` package
    - [x] Implement `PgVectorStore` with raw SQL
- [x] **Section 4.3: Business Core Integration**
    - [x] Implement `ContextService` (Redis integration)
    - [x] Define `MemoryPolicy` strategy
    - [x] Implement `MemoryManager` orchestrator
- [x] **Section 4.4: Documentation & Security**
    - [x] Create `infra/SECURITY.md`
    - [x] Audit `SCOPE.md`

- [x] **Milestone 11: Telegram Microservice & Auth Stability**
    - [x] Выделение бота в микросервис `apps/telegram-bot`
    - [x] Исправление JWT инвалидности (sub payload, registerAsync)
    - [x] Рефакторинг UI страницы входа по канону дизайна
    - [x] Обновление документации и Memory Bank

> [!NOTE]
> **Status**: Completed. Infrastructure is ready for hybrid memory operations.

# Блок 5: Sprint B1 - Consulting Control Plane & Risk

- [x] **Section 5.1: Database Schema (Prisma)**
    - [x] Update `schema.prisma` with Tech Map Domain (`TechMap`, `MapStage`, `MapOperation`)
    - [x] Update `schema.prisma` with CMR Domain (`DeviationReview`, `CmrDecision`)
    - [x] Update `schema.prisma` with Risk & Insurance Domain (`CmrRisk`, `InsuranceCoverage`)
    - [x] Add Enums: `ResponsibilityMode`, `RiskType`, `Controllability`, `LiabilityMode`, `ConfidenceLevel`
- [x] **Section 5.2: Backend Modules (NestJS)**
    - [x] Create `tech-map` module (Service, Controller)
    - [x] Create `cmr` module (DeviationService, RiskService, DecisionService)
- [x] **Section 5.3: Strategic Logic & Verification**
    - [x] Implement Liability Matrix logic
    - [x] Implement SLA logic (Silence as Event)
    - [x] Verify Tripartite Flow

# Блок 5.2: Sprint B2 - HR Ecosystem (3-Contour Model) — DONE ✅

- [x] **Section 5.2.1: Domain Schema & Tech Debt**
    - [x] Implement HR Schema v2 (Foundation, Incentive, Development)
    - [x] Refactor `EmployeeProfile` to Event-driven Projection model (No PII)
    - [x] Restore Management Context via `orgUnitId`
- [x] **Section 5.2.2: Incentive & Development Modules**
    - [x] Implement `OkrService` & `KpiService`
    - [x] Implement `RecognitionService` & `RewardService`
    - [x] Implement `PulseService` & `AssessmentService`
- [x] **Section 5.2.3: Strategic Integration**
    - [x] Integrate `RiskService` (CMR) with Human Assessment Snapshots
    - [x] Implement confidence-based probabilistic state projections

# Phase Beta: Future Sprints
- [ ] **Sprint B3: Smart CRM & Agro AI**
- [ ] **Блок 6: Finance & Economy**
- [ ] **Блок 7: Supply Chain & Logistics**
- [ ] **Блок 8: Machinery, Fleet & IoT**
