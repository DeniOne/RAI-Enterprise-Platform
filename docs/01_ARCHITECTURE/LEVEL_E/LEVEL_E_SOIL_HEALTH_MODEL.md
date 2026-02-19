---
id: DOC-ARH-SOIL-001
type: Specification
layer: Domain Core
status: Constitutional
version: 1.3.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: SOIL HEALTH MODEL SPECIFICATION

## 1. Введение
Формальная модель Здоровья Почвы (Soil Health) с учетом доверия к данным (Trust Enforced).
**Invariant Guard**: I34, I41.

## 2. Soil Health Index (SHI) with Trust

### 2.1. Trust-Weighted Formula
Индекс не может быть достовернее данных, на которых он основан.
$$
SHI(t) = \left( \prod_{i=1}^{5} (C_i(t))^{w_i} \right) \cdot \text{TrustScore}_{data}
$$
Если данные сомнительны ($Trust < 0.8$), значение $SHI$ пессимизируется (снижается). Это заставляет систему быть осторожнее ("Presumption of Degradation").

### 2.2. Trust Score Calculation
$$
\text{TrustScore} = w_S \cdot S_{source} + w_C \cdot C_{consistency} + w_A \cdot A_{age}
$$
1.  **Source Reliability ($S$)**:
    *   Certified Lab (ISO 17025) = 1.0
    *   Satellite (Sentinel-2) = 0.8
    *   User Estimations = 0.5
2.  **Consistency ($C$)**: Совпадают ли данные со спутником/соседями?
3.  **Data Age ($A$)**: Экспоненциальное затухание доверия (Half-life = 12 months).

## 3. Invariant I34 (Non-Degradation) & I41 (Regeneration)

### 3.1. I34: Non-Degradation (Safety Net)
Для всех почв:
$$
P_{05}(\Delta SHI) \ge -\epsilon(SoilClass)
$$
Мы не допускаем потерь даже в худшем сценарии (P05).

### 3.2. I41: Explicit Regeneration Requirement
Для деградированных почв ($SHI < 0.6$):
$$
E\left[ \frac{d(SHI)}{dt} \right]_{3yr} > 0
$$
Система **обязана** найти стратегию с положительным трендом. Стагнация ($\Delta=0$) запрещена.
Если таких стратегий нет $\to$ **Emergency Alert** (Требуются радикальные меры/инвестиции).

## 4. Epsilon ($\epsilon$) & Buffer Capacity
Определяет допустимую волатильность.
*   **Chernozem**: $\epsilon = 0.02$ (Max Buffer).
*   **Sandy**: $\epsilon = 0.005$ (Zero Tolerance).
*   **Degraded**: $\epsilon = 0.0$ (Strict Locking).

## 5. Model Calibration
Если $SHI_{measure}$ отличается от $SHI_{predict}$ на $> 5\%$:
1.  **Recalibration**: Обновление весов $C_i$.
2.  **Trust Penalty**: Снижение доверия к источнику, давшему ошибку.
