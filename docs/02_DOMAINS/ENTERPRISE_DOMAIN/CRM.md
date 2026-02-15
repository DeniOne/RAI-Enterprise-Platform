---
id: DOC-DOM-GEN-060
type: Domain Spec
layer: Domain
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

---
id: component-enterprise-crm
type: component
status: review
owners: [sales, architects]
aligned_with: [principle-vision]
---

# Domain: CRM (Customer Relationship Management)

> **Contour:** 1 (Enterprise Back-Office) | **Module:** CRM

## 1. Назначение
Управление взаимоотношениями с клиентами, партнерами и контрагентами. Рассчет потенциала сделки.

## 2. Основные Сущности (Entities)

### 2.1 Account (Контрагент)
*   **Fields:** `INN`, `Name`, `Type` (Farmer, Dealer, Holding), `RiskLevel`.
*   **Relations:** `hasMany Contracts`, `hasMany Fields` (if Farmer).

### 2.2 Deal (Сделка / Заявка)
*   **Fields:** `Stage`, `Amount`, `Probability`, `ExpectedDate`.
*   **Workflow:** `Lead` -> `Qualification` -> `Offer` -> `Contract` -> `Closed`.

### 2.3 ScoreCard (Скоринг)
*   **Metrics:**
    *   `FinancialHealth` (Выручка/Долг).
    *   `AgroPotential` (Зембанк * Урожайность).
    *   `Reliability` (История судов).

## 3. Ключевые Процессы
1.  **Onboarding:** Автоматическая проверка ИНН через API (DaData/Spark).
2.  **Scoring:** Расчет кредитного лимита на удобрения.
3.  **LTV Prediction:** Прогноз выручки на 3 года.
