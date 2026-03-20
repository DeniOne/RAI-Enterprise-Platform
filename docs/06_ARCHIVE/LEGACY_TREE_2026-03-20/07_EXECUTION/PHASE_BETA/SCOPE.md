---
id: DOC-EXE-PHASE-BETA-SCOPE-1CLT
layer: Execution
type: Phase Plan
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# Phase Beta Scope: Operations & Enterprise 💎

> **Версия:** 1.2 | **Статус:** **COMPLETED** | **Завершен:** 08.02.2026

## Цель фазы
Полная оцифровка производства с жестким контролем целостности данных. Трансформация из MVP в операционную систему, где **Integrity Engine** управляет бизнес-логикой, а Telegram — лишь сенсорное поле.

### Ключевой Архитектурный Закон: [BETA_INTEGRITY_LAYER.md](file:///f:/RAI_EP/docs/01-ARCHITECTURE/PRINCIPLES/BETA_INTEGRITY_LAYER.md)
- **Единое Тело:** Бесшовная связь Фронт-офиса и Бэк-офиса.
- **Mandatory Causal Loops:** Каждое действие в поле обязано иметь детерминированную реакцию в CMR.
- **Policy Enforcement Layer:** Решения принимает не пользователь и не бот, а Integrity Gate.

---

## Timeline: 01.10 - 08.02 2026 (Actual)

---

## 🔥 BLOCKER: Sprint B0 — Tech Debt Fixes (до начала B1)

> [!CAUTION]
> **Обязательно до начала Enterprise/Field контуров!**

### Block 0.1: Unified FSM Module
- [x] **Module:** `shared/state-machine/`
- [x] **Interface:** `StateMachine<TState, TEvent>`
- [x] **Migration:** Task FSM → Unified (Complete)
- [x] **Migration:** APL FSM → Unified (Complete)
- [x] **Doc:** FSM Registry

### Block 0.2: Redis Sessions
- [x] **Module:** Redis session storage для Telegram
- [x] **Migration:** `userTokens` Map → Redis
- [x] **Config:** TTL + rotation policy

### Block 0.3: Bot API Isolation
- [x] **HARD RULE:** Telegram Bot ≠ Prisma
- [x] **Feature:** ApiClient + retry + circuit breaker
- [x] **Feature:** Idempotency keys

---

## 🏢 CONTOUR 1: ENTERPRISE (Back-Office)

### Sprint B1 (01.10 - 14.10): Consulting Control Plane (CMR) & Tech Maps ✅
#### Block 5.1: Detailed Agro-Tech Map (АТК)
- [x] **Entity:** `TechMap`, `MapOperation`, `MapStage`, `MapResource`
- [x] **Feature:** "Extreme" Tech Map Builder (почасовая детализация)
- [x] **Logic:** Генерация карты на основе: Soil Analysis + History + Weather
- [x] **UI:** Visual TechMap Constructor (Gannt-like Canvas API)

#### Block 5.1: Consulting CRM (CMR) - Control Plane
- [x] **Entity:** `CmrDecision`, `DeviationReview`, `CmrRisk`
- [x] Logic: **Deviation Review Workflow**:
    - [x] Trigger: Отклонение факта (APL) от АТК
    - [x] Process: Manager -> Agronomist -> Client (Tripartite Consensus)
    - [x] Rule: "Silence as Event" (SLA based liability shift)
- [x] **Integrity Core Implementation:**
    - [x] **Silence Path:** Авто-генерация рисков при просрочке SLA без отчетов.
    - [x] **Traceability:** Привязка всех рисков к TaskId и ResponsibleId.
    - [x] **Dumb Bot:** Полная де-интеллектуализация Telegram-бота (Sensory Plane).

---

### Sprint B2 (15.10 - 28.10): HR Ecosystem 🧬 ✅
#### Block 5.2.1: Foundation Layer (Corporate)
- [x] **Entity:** `EmployeeProfile` (Projection), `HrSupportCase`
- [x] **Feature:** Event-driven Profile Sync & Onboarding Flow
- [x] **API:** `POST /hr/foundation/events/employee-hired`

#### Block 5.2.2: Incentive Layer (Alignment)
- [x] **Entity:** `OkrCycle`, `KPIIndicator`, `RecognitionEvent` (Append-only)
- [x] **Logic:** OKR Progress & Social Reinforcement
- [x] **API:** `/hr/incentive`

#### Block 5.2.3: Development Layer (Strategic)
- **Signal Layer (Listen)**
    - [x] **Entity:** `PulseSurvey`, `SurveyResponse` (Immutable)
- **Assessment Layer (Understand)**
    - [x] **Entity:** `HumanAssessmentSnapshot`, `CompetencyState`
- **Development & Effect (Act)**
    - [x] **Entity:** `DevelopmentPlan`, `DevelopmentAction`
    - [x] **Logic:** Impact Analysis (Target: `HumanAssessmentSnapshot` delta)

---

### Sprint B3 (29.10 - 11.11): Finance & Economy ✅
#### Block 5.3: Economy Core (Facts & Ledger)
- [x] **Entity:** `EconomicEvent`, `LedgerEntry` (Immutable)
- [x] **Logic:** Deterministic Cost Attribution & Fact Projection
- [x] **API:** `EconomyService` (Ingestor)

#### Block 5.3: Treasury & Budgeting (Control Plane)
- [x] **Entity:** `CashAccount`, `Budget`, `BudgetLine`
- [x] **Logic:** Budget FSM, Policy Checks, Liquidity Forecasting
- [x] **API:** `OfsController` (Executive Dashboard)

---

### Sprint B4 (12.11 - 25.11): GR & Legal ✅
#### Block 5.4: Legal AI Integration
- [x] **Integration:** GigaLegal API (Mock Implementation).
- [x] **Logic:** Deep Ontology Chain (Document -> Norm -> Requirement -> Obligation).
- [x] **Feature:** Automatic Compliance Signaling (`ComplianceEngine`).
- [x] **Feature:** Sanction tracking and Impact Mapping.

#### Block 5.4: Gov Reports & GR
- [x] **Module:** `GrController` for Stakeholders & Policy Monitoring.
- [x] **Registry:** Regulatory Body registry with power/sanction tracking.
- [x] **Architecture Audit:** Verified as ARCHITECTURALLY SOUND.

---

## 🚜 CONTOUR 2: FIELD EXECUTION (Front-Office)

---

## 💎 Phase Beta+ : Asset Registries (Active) ✅

### Sprint B5 (Current/Immediate): Asset Integrity Registry
#### Block 6.1: Machinery & Inventory (Prerequisites)
- [x] **Machinery Registry:** Учет флота и техники в карточке хозяйства.
- [x] **Stock Inventory:** Остатки СЗР и Удобрений.
- [x] **Admission Rule:** Запрет активации техкарты без подтвержденных ресурсов (Integrity Gate check).

---

## 📊 Инфраструктура Phase Beta ✅
- [x] **Kubernetes:** Миграция с Docker Compose завершена
- [x] **Monitoring:** Prometheus + Grafana активны
- [x] **Logging:** ELK Stack настроен
- [x] **Load Testing:** k6 тесты пройдены
- [x] **Partitioning:** Оптимизация БД выполнена
- [x] **Read Replicas:** Настроены
- [x] **Backup:** S3-бэкапы активны

---

## 🎯 Критерии завершения Phase Beta — COMPLETED ✅

| Критерий | Метрика | Статус |
|----------|---------|--------|
| API Coverage | 100% endpoints из SCOPE реализованы | ✅ |
| Test Coverage | >70% для новых модулей | ✅ |
| Documentation | Swagger актуализирован | ✅ |
| Performance | p95 < 500ms для основных endpoints | ✅ |
| Пилотирование | Минимум 3 хозяйства в production | ✅ |

---

## ⚠️ Риски и зависимости

> [!WARNING]
> **Риски фазы Beta:**
> - GigaLegal API может потребовать кастомной интеграции
> - Vision AI требует GPU-инфраструктуры или cloud API
> - Kubernetes-миграция может занять больше запланированного

> [!IMPORTANT]
> **Зависимости от Phase Alpha:**
> - APL Foundation должен быть полностью реализован
> - Orchestrator тестирован на реальных данных пилота
> - Telegram Bot v1 стабилен для полевых сотрудников

---

## 📈 Метрики успеха

1. **Adoption:** 50+ активных пользователей в системе
2. **Data Volume:** 1000+ выполненных операций через APL
3. **Retention:** 80% пилотных хозяйств продолжают использование
4. **NPS:** >40 по результатам опроса пользователей
