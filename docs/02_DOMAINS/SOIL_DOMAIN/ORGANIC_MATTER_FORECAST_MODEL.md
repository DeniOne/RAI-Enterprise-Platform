---
id: DOC-DOM-SOIL-002
type: Model Specification
layer: Domain Logic
status: Approved
version: 1.3.0
owners: [@techlead, @agronomist]
last_updated: 2026-02-19
---

# ORGANIC MATTER FORECAST MODEL (OMFM)

## 1. Введение
Модель прогнозирования динамики гумуса (Organic Matter) на горизонте 5 лет.
**Resolution**: Annual Steps (Шаг = 1 год).
**Architecture**: Henin-Dupuis (Modified) with $Q_{10}$ scaling.

## 2. Математическая Модель

### 2.1. Базовое Уравнение
$$
OM_{t+1} = OM_t - (k_2(T) \cdot OM_t) + (k_1 \cdot A_t)
$$

### 2.2. Температурная Зависимость (Fail-Safe)
Минерализация корректируется по среднегодовой температуре ($T_{avg}$).
$$
k_2(T) = \min \left( k_{2,base} \cdot 2.2^{(T_{avg} - 10)/10}, \ 0.15 \right)
$$
*   **Constraint**: $k_2 \le 0.15$. При превышении происходит `clamping` (почва не может "гореть" быстрее физического предела).

## 3. Domain Constraints & Units

### 3.1. Единицы Измерения (Strict Definition)
*   **Внутренний стандарт**: $OM$ в **т/га**.
*   **Ввод**:
    *   $OM_{\%}$: Проценты (например, **4.2**, а не 0.042).
    *   $\rho_{bulk}$: Плотность сложения (**г/см³**).
    *   $h_{layer}$: Глубина слоя (**м**).
*   **Конвертация**:
    $$
    OM_{t/ha} = OM_{\%} \cdot \rho_{bulk} \cdot h_{layer} \cdot 100
    $$
    *(Множитель 100 включает перевод г/см³ в т/м³ и %)*.

### 3.2. Physical Sanity Checks
*   **Max Rate of Change**: Если $|\Delta OM_{year}| > 1.5$ т/га $\to$ `SustainabilityWarning`.
    *   *Rationale*: Гумус — инерционная субстанция. Скачки > 1.5 т/га в год указывают либо на ошибку ввода, либо на экстремальное воздействие (снос почвы / внесение огромных доз компоста).

## 4. Financial Integration
$$
ROI_{adjusted} = ROI_{finance} - (|\Delta OM_{neg}| \cdot \text{Cost}_{restoration}) + (\Delta OM_{pos} \cdot \text{V}_{carbon})
$$

## 5. Формальный API Контракт

### Input (Scenario)
```typescript
interface SoilScenarioInput {
    mode: 'deterministic' | 'sensitivity'; // Strategy Mode
    
    initial_om_percent: number; // e.g. 4.2
    bulk_density: number;       // e.g. 1.25 (g/cm3)
    soil_layer_depth: number;   // e.g. 0.3 (m)
    
    climate: {
        avg_soil_temp: number;  // degrees C (Annual Average)
    };
    
    management_plan: Array<{
        year: number; // 1..5
        residue_mass_dry: number; // t/ha (A)
        k1_coefficient: number;    // From Crop/Tillage Matrix
        k2_base: number;           // From Soil/Tillage Matrix
    }>;
}
```

### Output (Forecast)
```typescript
interface SoilForecastOutput {
    om_trajectory_tha: number[]; // [t_0, ... t_5]
    delta_om_total: number;
    
    // Carbon Accounting (Annual Granularity)
    carbon_balance_co2e_per_year: number[]; 
    total_carbon_credit_co2e: number;

    // Safety Flags
    risk_flags: {
        rate_of_change_warning: boolean; // |dOM| > 1.5
        critical_threshold_breach: boolean; // OM < 2.0%
    };
    
    // Sensitivity Analysis (if mode='sensitivity')
    sensitivity?: {
        om_trajectory_worst_case: number[]; // k2 + 10%, k1 - 10%
        om_trajectory_best_case: number[];  // k2 - 10%, k1 + 10%
    };
}
```

## 6. Future Roadmap (Level F)
*   **Multi-Pool Model**: Разделение на Active (POM) и Passive (MAOM) фракции.
*   **N-interaction**: Учет C:N ratio в скорости минерализации.
