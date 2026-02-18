---
id: DOC-ARC-ADR-LD-004
layer: Architecture
type: ADR
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ADR-LD-004: Drift Detection — Mandatory Enforcement

## Контекст

Drift detection может быть реализован как опция. Однако в регулируемой среде (Level D) это создает риски silent degradation и невыполнения governance-политик.

## Решение

Зафиксировать: **Drift detection — обязательный и непрерывный процесс. Отключение невозможно.**

---

### 1. Monitored Drift Types (Типы дрифта)

Система обязана отслеживать три уровня дрифта:
1.  **Input Drift (Feature Distribution):** Изменение во входных данных (PSI, KL).
2.  **Output Drift (Prediction Distribution):** Изменение в распределении предсказаний (PSI).
3.  **Concept Drift (Error Rate):** Изменение связи $X \to Y$ (требует ground truth/labels).

### 2. Formal SLA (Service Level Agreement)

Гарантии мониторинга:
*   **Max Detection Latency:** 7 дней (максимальная задержка между событием и обнаружением).
*   **Max Report Gap:** 14 дней (максимальный интервал без отчета).
*   **Trigger:** Еженедельно (Cron) + По событию (Season Close).

### 3. Formal Invariant

Математическое правило, проверяемое автоматически системой мониторинга здоровья (HealthCheck):

$$
\forall m \in \text{ActiveModels}, \exists r \in \text{DriftReports}: \\
(r.modelVersionId = m.id) \land (CurrentDate - r.createdAt \le 14 \text{ days})
$$

Если инвариант нарушен $\to$ **System Alert (SEV-1)**.

### 4. Drift Severity & Reaction Protocol

| Severity | Definition | Mandatory Reaction | Auto-Block? |
|----------|------------|--------------------|-------------|
| **WARNING** | PSI > 0.1 OR AccDrop > 2% | Alert Data Scientist | NO |
| **CRITICAL** | PSI > 0.25 OR AccDrop > 5% | Trigger Retraining + Notify | **YES** (Degraded Mode) |
| **FATAL** | Schema Mismatch / Leakage | **IMMEDIATE ROLLBACK** | **YES** (Service Stop) |

### 5. Tenant Isolation Clause

Drift Detection выполняется строго **Per-Tenant**:
*   Drift в данных Тенанта А никак не влияет на Тенанта Б.
*   "Global Model Drift" (если используется) отслеживается отдельно и требует ручного вмешательства.
*   Каждый тенант имеет свой `BaselineProfile`.

---

## Обоснование

1.  **Silent degradation:** Модель может деградировать незаметно. Без мониторинга — убытки обнаруживаются только по итогам сезона.
2.  **Governance integrity:** D3 требует drift score для принятия решения.
3.  **Safety:** Автоматическая блокировка (CRITICAL) предотвращает финансовые потери клиентов при резком изменении рынка.
4.  **Regulatory:** Аудит требует доказательства непрерывного мониторинга.

## Последствия

**Плюсы:**
*   Гарантия обнаружения деградации в рамках SLA.
*   Четкий протокол действий (Warning -> Critical -> Fatal).
*   Изоляция рисков между тенантами.

**Минусы:**
*   Вычислительные расходы на еженедельный пересчет метрик.
*   Риск "Alert Fatigue" (решается настройкой порогов).
