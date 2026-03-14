---
id: DOC-DOM-ENTERPRISE-DOMAIN-HR-1B6D
layer: Domain
type: Domain Spec
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---
# Domain: HR (Human Capital)

> **Contour:** 1 (Enterprise Back-Office) | **Module:** HR

## 1. Назначение
Управление талантами, мотивацией и организационной структурой.

## 2. Основные Сущности (Entities)

### 2.1 Employee (Сотрудник)
*   **Fields:** `Status` (Active/Onboarding), `Level` (Junior/Senior), `Skills`.
*   **Relations:** `belongsTo Department`, `hasMany OKRs`.

### 2.2 PulseCheck (Пульс-опрос)
*   **Fields:** `Mood` (1-10), `BurnoutIndex`, `Date`.
*   **Frequency:** Weekly / Bi-weekly.

### 2.3 OKR (Objective & Key Results)
*   **Fields:** `Objective`, `KeyResult` (Metric), `Progress` (%).
*   **Linking:** Company -> Department -> Personal.

## 3. Ключевые Процессы
1.  **Recruitment:** Воронка кандидатов (интеграция с HH/LinkedIn).
2.  **Well-being:** Анализ выгорания через AI (Агрегация пульс-опросов).
3.  **Performance Review:** Авто-расчет бонуса на основе полевых метрик (для агрономов).
