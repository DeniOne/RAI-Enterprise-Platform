# Project Master Plan: RAI Enterprise Platform (Full WBS) 🚀

> **Цель:** Создание полной операционной системы агробизнеса (Back Office + Front Office + AI).
> **Охват:** Phase Alpha → Beta → Gamma.

---

## 🏗️ Phase Alpha: Foundation (MVP)
*Цель: Валидация Архитектуры, APL (Рапс) и запуск ядра.*

### 📦 1. Core Architecture
- [x] **[Backend]** **Business Core**: Identity, Auth (JWT), RBAC.
- [ ] **[Backend]** **Task Engine**: Процессинг задач (Jira-like for Agro).
- [ ] **[Backend]** **Audit Service**: Логгирование всех решений.
- [x] **[Infra]** Turborepo Setup, Docker, CI/CD.

### 🎼 2. Agro Process Layer (Contour 2 Start)
- [x] **[Backend]** **Orchestrator**: State Machine (16 Stages).
- [x] **[Backend]** **Rule Engine**: Hard Constraints (Влага, Глубина).
- [ ] **[Backend]** **Digital Agronomist (Bot v1)**: Валидация задач в поле.

### 🏢 3. Enterprise Modules (Contour 1 Start)
- [ ] **[Backend]** **CRM (Basic)**: Реестр клиентов, Структура холдинга.
- [ ] **[Backend]** **HR (Basic)**: Профили сотрудников, Роли.

### 🧠 4. Unified Memory (Infrastructure)
- [ ] **[DB]** Redis (Working Memory).
- [ ] **[DB]** pgvector Setup (Episodic Memory).

---

## 💎 Phase Beta: Operations & Enterprise (Q3-Q4 2026)
*Цель: Полная оцифровка бизнеса и производства.*

### 🏢 5. Contour 1: Enterprise Management (Back-Office)
#### 5.1 CRM & Sales
- [ ] **[Backend]** **Scoring System**: Оценка LTV и потенциала клиента.
- [ ] **[Backend]** **Smart Contracts**: Авто-мониторинг KPI договора.

#### 5.2 HR Ecosystem
- [ ] **[Backend]** **Talent Acquisition**: База кандидатов (узкие спецы).
- [ ] **[Frontend]** **Pulse Surveys**: Модуль эмоционального состояния.
- [ ] **[Backend]** **OKR Engine**: Расчет бонусов за результат.

#### 5.3 Finance & Economy
- [ ] **[Backend]** **Simulation Engine**: What-if анализ (Расчет ROI).
- [ ] **[Backend]** **Treasury**: Бюджетирование и платежный календарь.

#### 5.4 GR & Legal
- [ ] **[Backend]** **Legal AI**: Проверка договоров (Integration GigaLegal).
- [ ] **[Backend]** **Gov Reports**: Авто-генерация отчетов (Статистика, Налоги).

### 🚜 6. Contour 2: Field Execution (Front-Office)
#### 6.1 Operations
- [ ] **[Backend]** **Supply Chain**: Склад, Авто-заказ (Just-in-Time).
- [ ] **[Backend]** **Machinery**: Учет техники, ГСМ, ремонт.

#### 6.2 Advanced Agro
- [ ] **[AI]** **Vision Service**: Диагностика болезней по фото.
- [ ] **[Backend]** **Real-time Economics**: Себестоимость операции в моменте.

---

## 🛰️ Phase Gamma: Intelligence & Ecosystem (2026)
*Цель: Когнитивная Автономность.*

### 🧠 7. Cognitive Brain (Unified Memory Full)
- [ ] **[AI]** **Knowledge Graph**: Построение причинно-следственных связей.
- [ ] **[AI]** **Planner Agent**: Авто-стратегия на сезон.

### 🌐 8. Ecosystem
- [ ] **[Platform]** Marketplace API (Поставщики).
- [ ] **[Platform]** Financial Scoring for Banks.
