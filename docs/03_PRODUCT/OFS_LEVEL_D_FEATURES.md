---
id: DOC-PRD-LD-001
type: Product
layer: Product
status: Accepted
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-18
---

# OFS — LEVEL D FEATURES (D6+ Hardened)
## Функции продукта OFS: Стратегия, Капитализация и Управление

---

## 1. Обзор (Managed Evolution)

Level D трансформирует OFS из системы мониторинга в систему **Управляемой Эволюции**.
Ключевая ценность: **Превращение опыта (данных) в капитал (точность моделей)** с полным контролем рисков.

---

## 2. Фичи для Руководителя (Executive Control)

### 2.1. Capitalization Dashboard (New)
*Оценка накопленного интеллектуального капитала.*

| Метрика | Описание | Бизнес-смысл |
|---------|----------|--------------|
| **Model Equity Index** | Накопленная ценность модели | Стоимость интеллектуального актива (IP) |
| **Knowledge Capital Growth** | Динамика точности YoY | Скорость обучения организации |
| **Accumulated Risk Reduction** | Предотвращенные убытки | "Страховая" ценность системы |

### 2.2. Business Impact Panel
*Связь точности с деньгами.*

- **Yield Prediction Delta:** Насколько точнее стал прогноз (ц/га) + Trend.
- **Economic Value Add (EVA):** Прямой финансовый эффект от внедрения новой версии.
- **Forecast Stability:** Снижение волатильности прогнозов во времени.

### 2.3. Governance Workflow (Risk-Based)
*Управление на основе классификации рисков.*

#### Risk Classification Framework

| Risk Tier | Condition | Action Workflow |
|-----------|-----------|-----------------|
| **LOW** | MAPE improvement > 0% AND Drift < 5% | **Auto-Rollout** (Silent) |
| **MEDIUM** | Metric degradation < 1% OR Drift > 5% | **Manual Approval** required |
| **HIGH** | Concept Drift Detected OR Bias Shift | **Escalation** (Chief Agronomist Review) |

---

## 3. Фичи для Агронома (Field Intelligence)

### 3.1. Explainability Panel (XAI)
*Почему модель дала такой прогноз?*

- **Top 5 Factors:** "Влажность почвы (+20%)", "История поля (-5%)".
- **Weight Shift:** Визуализация изменений весов факторов после переобучения.
- **Confidence Interval:** Прогноз 45 ц/га (±3.2 ц/га).

### 3.2. Override Feedback (Closing the Loop)
- **"My Impact":** Как ручные корректировки агронома повлияли на обучение модели.
- **Corrective Action:** Система подсвечивает, где агроном оказался прав.

---

## 4. Фичи для Администратора (Enterprise Control)

### 4.1. Tenant Segmentation Strategy
*Политика изоляции и обмена знаниями.*

| Mode | Data Isolation | Learning Policy | Target Segment |
|------|----------------|-----------------|----------------|
| **ISOLATED** | Strict (Zero-Trust) | Trained ONLY on Tenant Data | Enterprise / Strategic |
| **SHARED** | Pooled (Anonymized) | Federated Learning / Global Model | SME / Mass Market |

*Invariant: Cross-Tenant Learning запрещен для режима ISOLATED.*

### 4.2. SLA / SLO Monitoring
*Гарантии уровня сервиса.*

- **Drift Detection Latency:** < 4 hours (Time to Detect).
- **Retraining Cycle Time:** < 24 hours (Time to Adapt).
- **Availability:** 99.9% uptime for Inference API (High Availability).

### 4.3. Champion / Challenger Control
*Мульти-модельное тестирование.*

| Role | Traffic % | Deployment | Status |
|------|-----------|------------|--------|
| **Champion** | 90-100% | Kubernetes Pods (High) | Live |
| **Challenger** | 0-10% | Kubernetes Pods (Low) | Evaluation |
| **Shadow** | 0% (Async) | Serverless | Validation |

---

## 5. UX-принципы (Cognitive Load Control)

1.  **Dual Mode:**
    - **Executive View:** Capitalization, ROI, Risk Tiers.
    - **Technical View:** PSI, KL-div, Confusion Matrix.
2.  **Actionable Alerts:** "High Risk Drift -> Approve Retrain".
3.  **Auditability:** Полная история изменений (Time Machine).

---

## 6. Связанные документы
- [LEVEL_D_SERVICE_TOPOLOGY.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/TOPOLOGY/LEVEL_D_SERVICE_TOPOLOGY.md)
- [LEVEL_D_METRICS.md](file:///f:/RAI_EP/docs/06_METRICS/LEVEL_D_METRICS.md)
