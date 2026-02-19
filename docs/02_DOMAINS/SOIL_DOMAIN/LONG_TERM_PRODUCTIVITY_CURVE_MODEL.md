---
id: DOC-DOM-SOIL-003
type: Model Specification
layer: Domain Logic
status: Approved
version: 1.4.0
owners: [@techlead, @economist]
last_updated: 2026-02-19
---

# LONG-TERM PRODUCTIVITY CURVE MODEL (LPC)

## 1. Введение
Модель прогнозирования производственного потенциала ($P$) с учетом динамики почвы ($S$), деградации ($D$) и климатических рисков.
**Grade**: Institutional (Granular Operation Mapping).

## 2. Математическая Формализация

### 2.1. Уравнение Продуктивности
$$
P(t) = P_{base} \cdot f(S_t) \cdot (1 - D_t)
$$

### 2.2. Функция Состояния ($f(S)$ - Sigmoid with Floor)
$$
f(S) = 0.4 + \frac{0.8}{1 + e^{-5(S - 0.5)}}
$$
*   **Range**: [0.4, 1.2].
*   **Floor**: Деградированная почва сохраняет минимум 40% потенциала.

### 2.3. Композиция Состояния ($S(t)$)
$$
S(t) = w_{sri}SRI + w_{om}\text{Norm}(OM) + w_{bio}\text{Norm}(Bio)
$$
*   **Invariant**: $\sum w_i = 1.0$.

### 2.4. Динамика Деградации (Climate-Aware)
Деградация ускоряется при плохом состоянии почвы и климатических шоках.
$$
D_{t+1} = \text{clamp}(D_t + \underbrace{\Delta D_{op} \cdot (1 + \gamma D_t) \cdot K_{climate}}_{\text{Impact}} - \Delta D_{rec}, 0, 1)
$$
*   $\gamma = 0.5$: Structural Acceleration.
*   $K_{climate}$: Climate Shock Multiplier (1.0 = Normal, 1.5 = Severe Drought, 2.0 = Heatwave).

## 3. Операционный Маппинг (Granular Logic)

Вместо статической таблицы используются непрерывные функции от входных параметров ($x$).

| Factor | Input Variable ($x$) | $\Delta S$ Function | $\Delta D$ Function |
| :--- | :--- | :--- | :--- |
| **Manure** | `manure_tons_ha` | $+0.002 \cdot x$ | $0$ |
| **Tillage** | `depth_cm` | $-0.0005 \cdot x$ | $+0.001 \cdot x$ |
| **Cover Crops** | `biomass_tons` | $+0.005 \cdot x$ | $-0.005 \cdot x$ |
| **Compaction** | `risk_flag` (0/1) | $0$ | $+0.08 \cdot x$ |
| **Monoculture** | `years_continuous` | $-0.02 \cdot x$ | $+0.03 \cdot (x-1)$ |

## 4. Экономическая Модель (Quadratic Risk)

$$
RISK(D) = \text{MaxLoss} \cdot D^2
$$
$$
NPV = \sum \frac{\text{Revenue}_t - \text{Cost}_t - RISK(D_t)}{(1+r)^t}
$$
*   **Soil Capital Depreciation**: $\text{CapLoss} = \max(0, S_0 - S_T) \cdot \$Value$.

## 5. API Контракт

### Input
```typescript
interface ProductivityScenarioInput {
    // ... basic fields ...
    
    region_config: {
        weights: { sri: number, om: number, bio: number }; // Must sum to 1.0
        climate_shock_probability: number; // 0..1
    };
    
    operations_log: Array<{
        year: number;
        manure_tons_ha: number;       // Continuous
        tillage_depth_cm: number;     // Continuous
        cover_crop_biomass: number;   // Continuous
        compaction_event: boolean;    // Discrete
        rotation_years_consecutive: number; // Monoculture tracker
    }>;
}
```

### Output
```typescript
interface YieldTrajectoryOutput {
    // ... trajectories ...
    
    financials: {
        yearly_flow: Array<{ year: number, cashflow: number }>;
        npv_total: number;
        soil_capital_delta: number;
    };
    
    sensitivity_analysis: {
        climate_stress_test: {
            drought_scenario_yield: number[]; // K_climate = 1.5
            norm_scenario_yield: number[];    // K_climate = 1.0
        };
        price_sensitivity: {
            npv_low_price: number;
            npv_high_price: number;
        };
    };
}
```

## 6. Validation Rules
1.  **Weight Sum**: `abs(sum(weights) - 1.0) < 1e-6`.
2.  **Range Checks**: $S, D, P \in [0, \infty)$.
3.  **Physicality**: $P(t) > 0$.
