---
id: DOC-STR-00-STRATEGY-RAI-ENTERPRISE-PLATFORM-V2
layer: Strategy
type: Vision
status: active
version: 2.0.0
owners: [@techlead]
last_updated: 2026-03-24
claim_id: CLAIM-STR-RAI-ENTERPRISE-PLATFORM-V2
claim_status: asserted
verified_by: manual
last_verified: 2026-03-24
evidence_refs: docs/00_STRATEGY/BUSINESS/RAI BUSINESS ARCHITECTURE v2.0.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md;apps/api/src/modules
---

# ГЕНЕРАЛЬНОЕ ОПИСАНИЕ RAI ENTERPRISE PLATFORM (v2.0)

## CLAIM
id: CLAIM-STR-RAI-ENTERPRISE-PLATFORM-V2
status: asserted
verified_by: manual
last_verified: 2026-03-24

> [!IMPORTANT]
> **СТАТУС ДОКУМЕНТА:** ACTIVE / CANONICAL 
> Этот документ обновлён с концептуальной версии (v1.0) и теперь отражает **фактическую институциональную архитектуру и кодовую базу (Stage 2)**. 

---

## 1. СТРАТЕГИЧЕСКОЕ ВИДЕНИЕ

### 1.1 Новая миссия платформы
RAI EP — это **институциональный оператор управляемой причинно-следственной целостности агрорезультата** с финансовым отражением (целевая модель v3.0, реализуемая на базе фундамента v2.0).
Мы не просто "даём умные советы" и "автоматизируем ферму". Мы встраиваем **Этику Доказательности** в каждый шаг, превращая агроконсалтинг в доказуемый, масштабируемый и финансово строгий процесс.

### 1.2 Ключевая инновация (Stage 2)
Отказ от простой модели "Контекст -> План -> Δ -> Монетизация".
Переход к архитектуре: `План -> Технологическая модель -> Операционное исполнение -> Доказанное событие -> Экономическое признание`.
Система опирается на строгий `Ledger`, `Idempotency`, `RiskGate` и `IntegrityGate`.

---

## 2. АРХИТЕКТУРНАЯ ФИЛОСОФИЯ И ФАКТИЧЕСКИЕ КОНТУРЫ

Система больше не делится просто на Back-Office и Front-Office. Фактическая кодовая база (на базе NestJS `apps/api/src/modules` и Prisma FSM) реализует 6 взаимосвязанных контуров:

1. **Производственный контур (Agro Orchestrator & Season):** `Season/APL`, `TechMap`, `Task`, `Execution`. Управление стадиями выращивания через строгие конечные автоматы (FSM).
2. **Контур доказательств (Integrity & Observation):** `FieldObservation`, `IntegrityGate`, `Trust/Verification`, `Deviation`. Фиксация фактов с поля с проверкой консистентности.
3. **Контур рисков и решений (Risk & CMR):** `RiskEngine`, `CMR (Consulting)`, `ManagementDecision`, `Quorum`. Выявление отклонений и коллегиальное утверждение.
4. **Финансовый контур (Finance Economy):** `EconomyEvent`, `Ledger`, `Budget`, `Liquidity`. Событийный учёт, инвариантные проводки, баланс.
5. **AI-Контур и Агентная Платформа (RAI Chat & AI System):** `ShadowAdvisory`, `Pilot`, `Rollout`, `Human Feedback`. ИИ предлагает и объясняет, но детерминированная система требует человеческого утверждения для критических действий.
6. **Институциональный контур безопасности (Identity & Governance):** `Tenant isolation`, `Audit`, `Outbox`, `Invariant metrics`, `Kill-switch`, `Panic mode`.

---

## 3. КАНОНИЧЕСКИЙ ОПЕРАЦИОННЫЙ ЦИКЛ

Любое физическое изменение или финансовая транзакция проходят жёсткий Pipeline (FSM Lifecycle):

1. **Harvest Plan:** Создание плана (`DRAFT`), утверждение и переход в `ACTIVE`.
2. **Tech Map:** Генерация технологической карты на основе плана. Для её активации требуется прохождение `Integrity Admission` (наличие техники, ТМЦ, инварианты).
3. **Task & Execution:** Генерация атомарных задач из Tech Map. Каждая задача проходит свой FSM.
4. **Observation & IntegrityGate:** Полевые данные загружаются через Telegram-бота / фронтенд и проходят `IntegrityGate`. Отклонения запускают `deviation review`. Спорные моменты -> `RiskGate`.
5. **Economy / Ledger:** По успешному завершению задач данные падают в интеграционный слой. Формируются `EconomyEvent`, создаются неизменяемые проводки (Idempotency and Anti-replay). Учитывается себестоимость в реальном времени.

---

## 4. AGENT PLATFORM & AI (STAGE 2)

**RAI EP использует не "голый LLM", а гибридный Agent-First Governed Runtime.**

### 4.1 Архитектура платформы
Выполнение идёт по строгому графу: `Supervisor -> Runtime -> Agent -> Tools/Memory/Connectors -> Evidence/Validation -> Response -> Audit`. Платформа управляет бюджетами токенов, памятью в рамках `tenant/domain-scope` и защитой инвариантов.

### 4.2 MVP-4 Reference Agents (Уже в коде)
- 🚜 **AgronomAgent (Domain Advisor):** Эксперт по генерации технологических карт (Draft, Review), агрономическим рекомендациям и оценке здоровья культур.
- 📉 **EconomistAgent (Domain Advisor):** Эксперт по экономике, "what-if" симуляциям, анализу план-факт и расчётам ROI.
- 📚 **KnowledgeAgent (RAG / Synthesis):** Извлечение релевантных знаний из корпоративных баз, агрономических протоколов и прецедентов (Engram Memory).
- 👁️ **MonitoringAgent (Worker / Hybrid):** Анализатор входящих событий (Telemetry, NDWI/NDVI, Observations), категоризация инцидентов и поднятие алертов без права финального изменения планов.

*Дальнейшее масштабирование:* Marketer, Strategist, Finance Advisor, Legal Advisor, CRM Agent и Controller.

---

## 5. ЭКОНОМИКА И РОСТ (МОНЕТИЗАЦИЯ v2.0)

Формула успеха: 
`Монетизация = f(Производственный результат, Доказанная исполнимость, Риск-профиль, Финансовая дисциплина)`

Мы продаём доверие. Экономический результат признаётся системой (и оплачивается) только при подтверждённом событии через `IntegrityGate` и инвариантные проводки. Бизнес консалтинга масштабируется с помощью AI, позволяя одному эксперту-агроному вести десятки хозяйств с поддержкой ИИ-ассистентов.

---

## 6. ДОРОЖНАЯ КАРТА: EXPANSION & INTERNATIONAL

- **Текущее:** Закрытие Stage 2 (Agent Platform mostly done, Functional AI).
- **Горизонт 6-12 месяцев:** Автоматизация онбординга новых агентных ролей. 100% покрытие MVP-4 сценариев. Внедрение CRM-агентов.
- **Горизонт 1-3 года:** Институциональная зрелость оператора. Подключение до 500 хозяйств. Формирование федерации данных с учетом разных юрисдикций.
- **Горизонт 2-5 лет:** Международный агроконсалтинговый fintech/agritech-вещатель. Платформенный масштаб с жесткой этикой доказательности.
