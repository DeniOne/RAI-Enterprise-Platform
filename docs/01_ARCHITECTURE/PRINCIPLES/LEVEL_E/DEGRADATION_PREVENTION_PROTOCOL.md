---
id: DOC-ARH-GOV-003
type: Specification
layer: Governance
status: Approved
version: 1.4.0
owners: [@techlead]
last_updated: 2026-02-19
---

# LEVEL E: DEGRADATION PREVENTION PROTOCOL

## 1. Введение
Протокол задает "Soil-First Governance". Это набор **Жестких Ограничений** (Hard Constraints), которые блокируют любые стратегии, ведущие к истощению почвенного капитала.
**Статус**: Mandatory Constitutional Layer (Неотключаемо для всех тенантов).

## 2. Инварианты Результата (Outcome Invariants)

### 2.1. Rule: Non-Negative Trend (Risk-Adjusted)
Стратегия недопустима, если:
1.  **Mean Check**: $\mathbb{E}[SRI(t+3)] \ge SRI(t)$.
2.  **Risk Constraint**: $P(SRI(t+3) < SRI(t)) < 0.2$.

### 2.2. Rule: Cumulative Degradation Budget (Geo-Anchored)
Защита от "ползущей деградации" и "Field Splitting Attacks".

$$
\sum_{i=t-5}^{t} \min(0, \Delta SRI_i) \ge \text{MaxAllowableLoss}_{5y}
$$

*   **Identity Scope**: Бюджет привязан не к `FieldID`, а к `GeospatialHash` (Immutable Polygon Geometry).
    *   При делении поля бюджет наследуется пропорционально площади.
    *   При объединении полей бюджеты суммируются (взвешенно).
*   **Window**: Rolling 5 Seasons.

## 3. Predictive FSM (Early Warning System)

```mermaid
stateDiagram-v2
    [*] --> NORMAL
    state AT_RISK { Note: Prob(Degradation) > 20% }
    state DEGRADED { Note: Hard Block on Econ Optim }

    NORMAL --> AT_RISK: Trend < 0
    AT_RISK --> DEGRADED: SRI < 0.30
    DEGRADED --> NORMAL: Verified Stability
```

### 3.1. SRI Source of Truth (Immutability)
Исторические значения SRI защищены от "Model Drift".
*   **Versioning**: $SRI_{historical}$ фиксируется с версией модели, которая его рассчитала.
*   **Freeze Policy**: Обновление моделей (Retraining) **НЕ** переписывает историю деградации в Ledger.
*   **Re-calibration**: Только новые прогнозы используют новую модель.

## 4. Degradation Ledger (Canonical Hash Standard)

Для обеспечения битовой воспроизводимости хэшей используется стандарт **RFC 8785 (JCS - JSON Canonicalization Scheme)**.

**Structure `SoVI_Hash`:**
$$
H_{SoVI} = \text{SHA-256} \left( \text{JCS}\left( \{
    "model_ver": "v1.2.0",
    "weights_crc": "0xA1B2...",
    "input_hash": "...",
    "tile_id": "..."
\} \right) \right)
$$
*   **Encoding**: UTF-8.
*   **Ordering**: Lexicographical keys (гарантируется JCS).

## 5. Oracle Trust Model
*   **Source**: Certified Labs List.
*   **SLA**: Валидация < 24ч.
*   **Evolution**: В будущем (Level F) планируется переход на `Multi-Sig Quorum` (2/3 Validators) для децентрализации решений о снятии блокировок.

## 6. Tenant Policy (Constitutional Mandate)
Level E является **Фундаментальным (Constitutional)**.
*   **Configurability**: False.
*   **Override**: Impossible.
