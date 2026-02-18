---
id: DOC-MET-LD-001
type: Metrics
layer: Monitoring
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — METRICS SPECIFICATION (D6 Industrial)
## Спецификация метрик самообучения и контроля качества

---

## 1. Агрономические метрики (Accuracy & Uncertainty)

**Binding:** Calculated on Validation Set & Backtesting. Versioned with `ModelVersion`.

| Метрика | Формула | Описание | Industrial Robustness |
|---------|---------|----------|-----------------------|
| **MAE** | $\frac{1}{n} \sum |y - \hat{y}|$ | Средняя абсолютная ошибка (ц/га) | Baseline |
| **MAE_CI95** | $MAE \pm 1.96 \cdot SE_{boot}$ | Доверительный интервал (Bootstrap) | **Critical:** Stat Validity |
| **sMAPE** | $\frac{1}{n} \sum \frac{|y - \hat{y}|}{(|y| + |\hat{y}|)/2}$ | Симметричная средняя относительная ошибка | **Critical:** Stable at $y \to 0$ |
| **RMSE** | $\sqrt{\frac{1}{n} \sum (y - \hat{y})^2}$ | Штраф за большие выбросы | Sensitive to outliers |
| **R²** | $1 - \frac{SS_{res}}{SS_{tot}}$ | Объясненная дисперсия | Global fit quality |

**Aggregation Dimensions:**
- By Region (North, South, etc.)
- By Soil Type (Chernozem, Podzol)
- By Crop (Wheat, Corn, Soy)

---

## 2. Метрики дрейфа (Drift & Stability)

**Binding:** Calculated on `PredictionWindow`. Stored in `DriftReport`.

### 2.1. Data Drift ($P(X)$)
| Метрика | Формула | Порог (Warn / Crit) | Stat Test |
|---------|---------|---------------------|-----------|
| **PSI** | $\sum (p_i - q_i) \cdot \ln(p_i / q_i)$ | 0.1 / 0.25 | Heuristic |
| **KS-Test** | $\sup |F_1(x) - F_2(x)|$ | $p < 0.05$ | **Formal:** Rejection of $H_0$ |
| **Feature Shift** | $\Delta SHAP$ rank correlation | $\rho < 0.8$ | Spearman Rank |

### 2.2. Concept Drift ($P(Y|X)$)
| Метрика | Формула | Описание | Порог |
|---------|---------|----------|-------|
| **Prediction Drift** | $\Delta MAE_{sliding}$ | Изменение ошибки на скользящем окне | > 10% degradation |
| **Label Shift** | $\chi^2$ Test on $Y$ features | Изменение распределения урожайности | $p < 0.05$ |

**Window Specification:**
- **Baseline:** Training Set ($N_{train}$).
- **Monitoring:** Last 30 days or Season-to-Date.
- **Min Sample:** $N > 1000$ for StatSig.

---

## 3. Метрики калибровки и стабильности (Reliability)

| Метрика | Формула | Описание | Цель (D6) |
|---------|---------|----------|-----------|
| **ECE** | $\sum \frac{|B_m|}{N} |acc(B_m) - conf(B_m)|$ | Expected Calibration Error | < 0.05 |
| **Stability Index** | $Var(MAE_{t-1}, MAE_t, MAE_{t+1})$ | Дисперсия ошибки во времени | As low as possible |
| **Model Eq. Delta** | $Equity_t - Equity_{t-1}$ | Изменение финансовой ценности | > 0 |

---

## 4. Метрики управления (Governance KPI)

### 4.1. Governance Risk Score (Composite)
Единый индикатор "здоровья" системы для принятия решений.

$$ G_{risk} = 0.4 \cdot Drift_{norm} + 0.3 \cdot Bias_{max} + 0.3 \cdot (1 - Accuracy_{rel}) $$

**Thresholds:**
- $G < 0.2$: **Healthy** (No Action)
- $0.2 \le G < 0.5$: **Warning** (Monitor)
- $G \ge 0.5$: **Critical** (Auto-Retrain / Rollback)

### 4.2. Process KPIs
| Метрика | Описание | Норма (Target) |
|---------|----------|----------------|
| **Retrain Success** | % запросов, приведших к CHAMPION | $40\% \le R \le 80\%$ |
| **Bias Stability** | Max(Bias(t) - Bias(t-1)) | $< 0.01$ (No shocks) |
| **Time to Recover** | Длительность Drift -> Deploy | $< 72$ hours |

---

## 5. Метрики развёртывания (Canary StatSig)

**Protocol:** `A/B Test` (Champion vs Canary).

| Метрика | Статистический критерий | Порог принятия |
|---------|-------------------------|----------------|
| **Accuracy Gain** | **Welch's t-test** ($H_1: \mu_{new} > \mu_{old}$) | $p\text{-value} < 0.05$ |
| **Latency P95** | Quantile Check ($T_{new} \le T_{old} \cdot 1.1$) | $< 250ms$ |
| **Error Rate** | 500/503 Count | 0 errors |

---

## 6. Метрики изоляции (Tenant Isolation)

Специфично для Multi-Tenant SaaS.

| Метрика | Описание | Алерт |
|---------|----------|-------|
| **Cross-Drift** | Корреляция дрейфа между тенантами | $\rho > 0.9$ (Sys failure?) |
| **Resource Hog** | % GPU использования одним тенантом | $> 90\%$ of Quota |
| **Leakage Score** | Попытка доступа к чужому Snapshot | $> 0$ (Security Incident) |

---

## 7. Связанные документы
- [DRIFT_DETECTION_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/DRIFT_DETECTION_ARCHITECTURE.md)
- [LEVEL_D_FORMAL_TEST_MATRIX.md](file:///f:/RAI_EP/docs/05_TESTING/LEVEL_D_FORMAL_TEST_MATRIX.md)
