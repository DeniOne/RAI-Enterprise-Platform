---
id: DOC-ARH-MOS-001
type: Specification
layer: Level E (Optimization)
status: Constitutional
version: 1.4.0
owners: [@architect, @economist]
dependencies: ["DOC-ARH-SOIL-001", "DOC-ENG-SIM-001"]
last_updated: 2026-02-19
---

# LEVEL E: OBJECTIVE FUNCTION DEFINITION (MOS)

## 1. Введение
Формальное определение "Конституции" решателя (Multi-Objective Solver).
**Standard**: Regenerative Constitution (Dynamic Weights & Tail Risk).
**Algorithm**: NSGA-II (Non-dominated Sorting Genetic Algorithm II).

## 2. Dynamic Constitutional Layer

### 2.1. Dynamic Weighting Policy
Вес устойчивости ($w_S$) зависит от состояния $SRI_t$.
$$
w_S^{min}(t) = \text{PolicyMap}(SRI_t)
$$

### 2.2. Emergency Mode Specification
**Condition**: $SRI < 0.4$ (Critical Degradation).
**Enforcement Profile**:
1.  **Weight**: $w_S = 1.0$ (Sole Objective).
2.  **Yield Cap**: $Yield_{target} \le 0.8 \cdot \text{RegionalAvg}$ (Принудительное снижение нагрузки).
3.  **Governance**: `ManualOverride` **DISABLED**. Разблокировка только через `CrisisCommittee` (Multi-sig).
4.  **Mandate**: Only strategies with $\Delta SRI > +0.02$ are feasible.

## 3. The Objective Function (Vector)
$$
\text{Maximize } \vec{F}(x) = \begin{bmatrix} 
Efficiency(x) \\ 
Regeneration(x) 
\end{bmatrix}
$$

## 4. Hard Constraints (Invariants)
1.  **I34 (Tail-Risk)**: $P_{05}(\Delta SRI) \ge -\epsilon$.
2.  **I36 (Biodiversity)**: $BPS(x) < 0.8$.
3.  **I41 (Regeneration)**: If $SRI < 0.6 \implies E[dSRI/dt] > 0$.

## 5. Solver Complexity Contract

### 5.1. Algorithm: NSGA-II
**Time Complexity**: $O(M \cdot N^2)$
*   $M$ (Objectives) = 2.
*   $N$ (Population) = 500.
*   **Op Count**: $\approx 2 \cdot 500^2 = 500,000$ comparisons per generation.
*   **Total Ops**: $50 \text{ Gens} \times 5 \cdot 10^5 = 2.5 \cdot 10^7$ ops.
*   **Est. Time**: ~800-1200ms on standard vCPU.

### 5.2. SLA & Timeout Protocol
*   **Target SLA**: 3000ms (P99).
*   **Hard Timeout**: 5000ms.
*   **Constraint**: Solver execution must yield control to Main Loop every 100ms (Async).

### 5.3. Fallback Heuristics
Если по истечении 4900ms Парето-фронт пуст или не сошелся:
1.  **Strategy A (Best Effort)**: Return current best Front from Generation $N_{current}$.
2.  **Strategy B (Fail-Safe)**: Если фронт пуст $\to$ Run fast `WeightedSum` ($N=50$) optimization.
3.  **Strategy C (Safe Mode)**: Return `ConservativeBaseline` (Known safe strategy).

## 6. Constraint Implementation
**Constraint Dominance Principle**:
$$
i \prec j \iff 
\begin{cases} 
CV_i < CV_j \\
CV_i = CV_j = 0 \land i \text{ dominates } j \text{ in objectives}
\end{cases}
$$
$CV$ (Constraint Violation) = $\sum \max(0, g_k(x))$.
Это гарантирует, что любое допустимое решение лучше любого недопустимого.
