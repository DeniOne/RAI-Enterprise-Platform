---
id: DOC-SPEC-AGRO-001
type: Domain Specification
layer: Agro Domain
status: Draft
version: 1.4.0
owners: [@techlead]
last_updated: 2026-02-18
---

# COUNTERFACTUAL ENGINE — AGRO DOMAIN
## Агрономическая реализация контрфактуального моделирования (Level C)

---

## 0. Статус документа

**Уровень зрелости:** D4++ (Mathematical Perfection)  
**Привязка к Level:** C (Contradiction-Resilient Intelligence)  
**Архитектурный родитель:** [CONFLICT_ENGINE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/CORE_SUBSYSTEMS/CONFLICT_ENGINE.md) (v1.3.0)
**API Alignment:** v1.3.0 (Zero-Drift Contract)

---

## 1. Назначение

**Counterfactual Engine (Agro)** является конкретной реализацией компонента `CounterfactualEngine`, описанного в архитектуре Conflict Engine. Он наполняет абстрактные траектории агрономической логикой.

---

## 2. Математическая модель траекторий

### 2.1. Coupled Symmetric Modeling (Variance Reduction)
Для обеспечения идеальной симметрии используется **Variant A (Coupled Simulation)**. На каждой итерации $i \in [1..N]$ генерируется единый вектор внешних воздействий $\mathbf{E}_i$, который применяется одновременно к обеим траекториям.

### 2.2. Weather Risk Modeling (v1/v2 Roadmap)
- **v1 (Baseline):** Принимается допущение о независимости событий $E_j$.
- **v2 (Formal):** Внедрение **Gaussian Copula** с корреляционной матрицей $\Sigma$. 
  > **Determinism Constraint:** Матрица $\Sigma$ должна быть версионирована и входить в `StateHash`.

### 2.3. Growth Model Dynamics
Динамика биомассы моделируется дискретно с шагом $dt = 1 \text{ day}$:
$$ B(t+1) = \text{clamp}(B(t) + \min(f_i) \cdot \mu \cdot (1 - B/B_{max}), B(t), B_{max}) $$
- **Clamping:** Гарантирует монотонное неубывание и отсутствие осцилляций при $B \to B_{max}$.

### 2.4. Financial & Compliance Context
- **OPEX/Price Data:** Все финансовые параметры должны быть **snapshot-versioned**.
- **MRL Limits:** Snapshots регуляторных лимитов фиксируются в метаданных сессии.

---

## 3. Детерминизм (Agro-Context)

### 3.1. Monte Carlo Params
- **Sample Size ($N$):** 10,000.
- **Tolerance Threshold ($\epsilon$):** $\epsilon = 0.015$.
- **PRNG Chaining:** Один глобальный инстанс PRNG на весь вызов `compute()`. Непрерывный поток бит во всех итерациях предотвращает дрейф из-за вариативного потребления энтропии в разных ветвях симуляции.

### 3.2. PRNG & Feature Ordering
- **PRNG:** Xoshiro256** (64-bit).
- **Dimension ordering:** Обход измерений строго по `canonical feature index`.

---

## 4. Invariants

- **I-AGRO-001 (Coupling):** Траектории $T_{AI}$ и $T_{Human}$ внутри итерации $i$ получают идентичный вектор $\mathbf{E}_i$.
- **I-AGRO-002 (Epsilon-Zeroing):** 
  - Если $| \Delta R_i | < \epsilon$, то компонент $R_i$ приравнивается к $0$.
  - Если $\forall i: | \Delta R_i | < \epsilon \implies \Delta \mathbf{R} = \vec{0}$ (нулевой вектор).
- **I-AGRO-003 (Monotonicity):** $B(t+1) \geq B(t)$ во всех сценариях (физическое ограничение).

---

[Changelog]
- v1.0.0: Initial domain narrative.
- v1.3.0: Coupled Simulation & Statistical Rigor.
- v1.4.0: Mathematical Perfection. Уточнена непрерывность PRNG stream, введено правило Clamping для биомассы, определено зануление вектора по $\epsilon$ и фиксация $\Sigma$/OPEX Snapshots. (D4++)
