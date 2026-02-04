# Phase Beta Scope: Operations & Enterprise 💎

> **Версия:** 1.0 | **Статус:** Draft | **Начало:** Q3 2026

## Цель фазы
Полная оцифровка бизнеса и производства. Трансформация платформы из MVP в полноценную операционную систему агробизнеса с двумя контурами: **Enterprise (Back-Office)** и **Field (Front-Office)**.

---

## Timeline: 01.10 - 31.12 2026 (Предварительный)

---

## 🔥 BLOCKER: Sprint B0 — Tech Debt Fixes (до начала B1)

> [!CAUTION]
> **Обязательно до начала Enterprise/Field контуров!**

### Block 0.1: Unified FSM Module
- [x] **Module:** `shared/state-machine/`
- [x] **Interface:** `StateMachine<TState, TEvent>`
- [x] **Migration:** Task FSM → Unified
- [x] **Migration:** APL FSM → Unified
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

### Sprint B1 (01.10 - 14.10): Smart CRM Foundation
#### Block 5.1: Client Intelligence
- [ ] **Entity:** `ClientScore` (LTV, потенциал, риск)
- [ ] **API:** POST `/crm/clients/{id}/score` — расчёт скоринга
- [ ] **API:** GET `/crm/clients/{id}/analytics` — аналитика по клиенту
- [ ] **Logic:** Алгоритм LTV Calculation (история заказов × частота × маржа)

#### Block 5.1: Smart Contracts
- [ ] **Entity:** `Contract`, `ContractKPI`, `ContractMilestone`
- [ ] **API:** POST `/contracts` — создание договора с KPI
- [ ] **API:** GET `/contracts/{id}/kpi-status` — мониторинг KPI
- [ ] **Logic:** Авто-уведомления при нарушении пороговых значений

---

### Sprint B2 (15.10 - 28.10): HR Ecosystem
#### Block 5.2: Pulse & Engagement
- [ ] **Entity:** `Survey`, `SurveyQuestion`, `SurveyResponse`
- [ ] **API:** POST `/hr/surveys` — создание опроса
- [ ] **API:** POST `/hr/surveys/{id}/responses` — ответ на опрос
- [ ] **Frontend:** Pulse Survey Widget (Dashboard integration)
- [ ] **Logic:** Sentiment Analysis (базовый NLP или правила)

#### Block 5.2: OKR Engine
- [ ] **Entity:** `Objective`, `KeyResult`, `OKRCycle`
- [ ] **API:** POST `/hr/okr/objectives` — создание цели
- [ ] **API:** PUT `/hr/okr/key-results/{id}/progress` — обновление прогресса
- [ ] **API:** GET `/hr/okr/cycles/{id}/summary` — сводка по циклу
- [ ] **Logic:** Авто-расчёт бонусов (% выполнения × коэффициент роли)

---

### Sprint B3 (29.10 - 11.11): Finance & Economy
#### Block 5.3: What-If Simulator
- [ ] **Engine:** `WhatIfSimulator` (scenario-based calculations)
- [ ] **API:** POST `/finance/simulations` — создание сценария
- [ ] **API:** GET `/finance/simulations/{id}/results` — результаты ROI
- [ ] **Logic:** Параметры: цена продажи, урожайность, затраты на гектар

#### Block 5.3: Treasury & Budgeting
- [ ] **Entity:** `Budget`, `BudgetLine`, `PaymentSchedule`
- [ ] **API:** POST `/finance/budgets` — создание бюджета
- [ ] **API:** GET `/finance/budgets/{id}/calendar` — платёжный календарь
- [ ] **Logic:** Cash-flow прогноз на 3/6/12 месяцев

---

### Sprint B4 (12.11 - 25.11): GR & Legal
#### Block 5.4: Legal AI Integration
- [ ] **Integration:** GigaLegal API (или аналог)
- [ ] **API:** POST `/legal/contracts/analyze` — проверка договора
- [ ] **Feature:** Подсветка рисковых пунктов в UI
- [ ] **Logic:** Шаблоны типовых договоров (аренда, поставка, услуги)

#### Block 5.4: Gov Reports Automation
- [ ] **Module:** `ReportGenerator` (Статистика, Налоговая)
- [ ] **API:** POST `/legal/reports/generate` — генерация отчёта
- [ ] **Formats:** PDF, XLSX, XML (для ФНС)
- [ ] **Templates:** 1-КФХ, 2-Фермер, Земельный налог

---

## 🚜 CONTOUR 2: FIELD EXECUTION (Front-Office)

### Sprint B5 (26.11 - 09.12): Supply Chain & Warehouse
#### Block 6.1: Warehouse Management
- [ ] **Entity:** `Warehouse`, `WarehouseItem`, `StockMovement`
- [ ] **API:** POST `/supply/warehouses` — создание склада
- [ ] **API:** POST `/supply/movements` — приход/расход
- [ ] **API:** GET `/supply/warehouses/{id}/stock` — остатки
- [ ] **Logic:** Партионный учёт (FIFO/LIFO)

#### Block 6.1: Just-in-Time Auto-Order
- [ ] **Entity:** `OrderRequest`, `Supplier`
- [ ] **API:** POST `/supply/auto-orders/calculate` — расчёт потребности
- [ ] **Logic:** Триггер заказа при stock < min_level
- [ ] **Integration:** Email/Telegram уведомление снабженцу

---

### Sprint B6 (10.12 - 23.12): Machinery & Fleet
#### Block 6.1: Machinery Registry
- [ ] **Entity:** `Machine`, `MachineType`, `Attachment` (агрегат)
- [ ] **API:** CRUD `/machinery/machines`
- [ ] **API:** GET `/machinery/machines/{id}/status` — текущий статус
- [ ] **Logic:** Связь техника ↔ поле ↔ операция

#### Block 6.1: Fuel & Maintenance
- [ ] **Entity:** `FuelRecord`, `MaintenanceLog`, `Repair`
- [ ] **API:** POST `/machinery/fuel` — заправка
- [ ] **API:** POST `/machinery/maintenance` — ТО/ремонт
- [ ] **Logic:** Авто-напоминание о ТО (по моточасам / пробегу)

---

### Sprint B7 (23.12 - 31.12): Advanced Agro AI
#### Block 6.2: Vision Service
- [ ] **AI Module:** `VisionService` (Pest/Disease Detection)
- [ ] **API:** POST `/agro/vision/analyze` — загрузка фото
- [ ] **Response:** Detected issues, confidence %, recommendations
- [ ] **Integration:** Telegram Bot — отправка фото для анализа

#### Block 6.2: Real-time Economics
- [ ] **Calculator:** `FieldEconomicsCalculator`
- [ ] **API:** GET `/agro/fields/{id}/economics` — экономика поля
- [ ] **Metrics:** Себестоимость/га, затраты по категориям, прогноз прибыли
- [ ] **Logic:** Live-расчёт при каждой операции

---

## 📊 Инфраструктура Phase Beta

### DevOps & Scale
- [ ] **Kubernetes:** Миграция с Docker Compose
- [ ] **Monitoring:** Prometheus + Grafana
- [ ] **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- [ ] **Load Testing:** k6 для критических endpoints

### Database Evolution
- [ ] **Partitioning:** Партиционирование таблицы операций по годам
- [ ] **Read Replicas:** Для аналитических запросов
- [ ] **Backup:** Авто-бэкапы в S3-совместимое хранилище

---

## 🎯 Критерии завершения Phase Beta

| Критерий | Метрика |
|----------|---------|
| API Coverage | 100% endpoints из SCOPE реализованы |
| Test Coverage | >70% для новых модулей |
| Documentation | Swagger актуализирован |
| Performance | p95 < 500ms для основных endpoints |
| Пилотирование | Минимум 3 хозяйства в production |

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
