# LEVEL E: Model Lineage & Governance Traceability

## 1. Введение
Спецификация трассировки решений и эволюции моделей для Level E.
**Цель**: Обеспечить полную аудируемость (Auditability) цепочки "Данные $\to$ Модель $\to$ Симуляция $\to$ Решение".

## 2. Lineage Architecture

### 2.1. The "Governance Trace" Object
Каждое принятое решение (`AgronomicStrategy`) в Level E должно иметь прослеживаемый объект происхождения:

```json
{
  "strategy_id": "uuid-v4",
  "generated_at": "2026-05-20T10:00:00Z",
  "trace": {
    "soil_model_version": "v3.1.4-beta",
    "yield_model_version": "v2.0.1-stable",
    "climate_scenario": "RCP_4.5_Regional_v2",
    "input_data_snapshot": "hash(soil_samples + weather_history)",
    "simulation_id": "counterfactual-uuid-ref"
  },
  "governance": {
    "sri_prediction": 0.85,
    "delta_gap_viewed": true,
    "override_hash": "sha256(user_rationale + admin_approval)"
  }
}
```

## 3. Immutable Baselines (I37)

### 3.1. Genesis Anchor
При создании `SustainabilityBaseline` для поля генерируется `GenesisHash`:
$$
H_{genesis} = \text{SHA256}(FieldID + SRI_{t0} + Salt_{global})
$$
Этот хеш фиксируется в неизменяемом логе (Ledger). Любая попытка изменить исторический базис приведет к несовпадению хеша.

## 4. Hash Chains for Overrides

### 4.1. The Logic
Переопределения (Overrides) не удаляют рекомендации ИИ, а создают "ответвление" в графе решений.
Ценность этого в том, что мы можем (post-factum) обучать модель на этих отклонениях.

### 4.2. Chain Structure
`Override(N)` ссылается на `Strategy(N-1)` и `Justification`.
Если пользователь делает Override три года подряд:
$$
H_1 = \text{Hash}(Start + Reasoning_1) \\
H_2 = \text{Hash}(H_1 + Reasoning_2) \\
H_3 = \text{Hash}(H_2 + Reasoning_3)
$$
Это создает **Fatigue Chain**. Если длина цепи растет, включается `LOCKDOWN` (система видит систематическое игнорирование).

## 5. Model bias & Sustainability Audit (I38)

### 5.1. Sustainability Bias Metadata
Каждая версия ML-модели маркируется тегом `BiasVector`:
*   `ShortTermBias`: 0.2 (склонность к урожаю)
*   `LongTermBias`: 0.8 (склонность к почве)

Если обновление модели меняет этот вектор более чем на 10%, требуется ручное утверждение `ChiefAgronomist` перед деплоем.

## 6. Integration with MLflow / Registry
*   **Tags**: `soil_impact_factor`, `drought_resilience_score`.
*   **Artifacts**: Сохранять `ParetoFrontier` json вместе с весами модели.
