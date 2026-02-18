---
id: DOC-ARH-CORE-LC-001
type: Architecture
layer: Core
status: Draft
version: 1.2.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL C — CONTRADICTION-RESILIENT INTELLIGENCE
## Архитектурная спецификация

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Привязка к инвариантам:** I29–I33  
**Зависимости:** Level B (I15–I28), FSM Core, Generative Engine  
**Changelog:** v1.1.0 — Upgrade Regret formula, Risk-Adjusted Objective, EscalationPolicy, Economic DivergenceScore, Monte-Carlo mode, I33  
**Changelog:** v1.2.0 — Canonical Regret via ΔObjective, CVaR_α per-tenant, adaptive Monte-Carlo N, Regret_short/long split, Anti-Gaming baseline, I33 FSM clarification

---

## 1. Архитектурный сдвиг Level A → B → C

### Level A: Controlled Intelligence
- AI = Advisor
- Human = Primary Architect
- **Конфликт:** не поддерживается

### Level B: Generative Architect
- AI = Draft Generator
- Human = Approval Authority
- **Конфликт:** разрешается через отклонение Draft

### Level C: Contradiction-Resilient Intelligence
- AI = Predictive Analyst + Conflict Resolver
- Human = Decision Maker with Risk Awareness
- **Конфликт:** становится **первоклассной сущностью системы**

---

## 2. Концептуальная модель

### 2.1. Противоречие как архитектурная примитива

В Level C **противоречие (divergence)** — это не ошибка, а **нормальное состояние системы**.

```
AI Recommendation → Human Override → ΔRisk Calculation → Counterfactual Model → Divergence Record
```

### 2.2. Целевая функция Level C

$$
f_{Level C} = \text{Minimize Regret under Decision Conflict}
$$

### 2.3. Risk-Adjusted Objective

Level C оперирует **risk-adjusted objective**, а не raw yield:

$$
\text{Objective}(A) = E[\text{Profit}(A)] - \lambda \cdot \text{CVaR}_{\alpha}(A)
$$

Где:
- $E[\text{Profit}(A)]$ — ожидаемая прибыль при действии $A$
- $\text{CVaR}_{\alpha}(A)$ — Conditional Value at Risk (хвостовой риск), $\alpha \in [0.9, 0.99]$, per-tenant
- $\lambda$ — коэффициент неприятия риска (per-tenant, default = 0.5)

> **Ключевое отличие от Level B:** оптимизируется **прибыль**, а не урожай. Yield ≠ Profit.

### 2.4. Каноническая формула Regret

**Canonical определение** (используется в коде и тестах):

$$
\boxed{\text{Regret}(A') = \text{Objective}(A_{AI}) - \text{Objective}(A_{Human})}
$$

**Декомпозиция** (для аналитики и UI):

$$
\text{Regret}(A') = \underbrace{\Delta\text{ExpectedProfit}}_{\text{yield/price effect}} + \lambda_1 \cdot \underbrace{\Delta\text{CVaR}_{\alpha}}_{\text{tail risk}} + \lambda_2 \cdot \underbrace{\Delta\sigma_{\text{Profit}}}_{\text{volatility}}
$$

> **Правило консистентности:** в коде всегда используется `Objective(A_AI) - Objective(A_Human)`. Декомпозиция — только для объяснений.

### 2.5. Дисконтированный горизонт (3 года)

Level C разделяет Regret на два аналитически различных компонента:

$$
\text{Regret}_{\text{short}} = \text{Objective}(A_{AI})_0 - \text{Objective}(A_{Human})_0 \quad (t=0, \text{текущий сезон})
$$

$$
\text{Regret}_{\text{long}} = \sum_{t=1}^{3} \frac{\text{Objective}(A_{AI})_t - \text{Objective}(A_{Human})_t}{(1 + r)^t} \quad (t=1..3)
$$

$$
\text{Regret}_{\text{total}} = \text{Regret}_{\text{short}} + \text{Regret}_{\text{long}}
$$

Где:
- $r$ — ставка дисконтирования (per-tenant, default = 0.1)
- $\text{Regret}_{\text{short}}$ — виден в UI как "риск сезона"
- $\text{Regret}_{\text{long}}$ — виден в UI как "долгосрочный эффект"

**Обоснование:** Разделение повышает аналитическую прозрачность: агроном видит не только итоговый Regret, но и его временную структуру.

---

## 3. Компонентная архитектура

### 3.1. Новые подсистемы Level C

```
/generative-engine
  /contradiction
    - CounterfactualEngine
    - ConflictMatrix
    - DivergenceTracker
  /risk
    - OverrideRiskAnalyzer
    - RiskMetricCalculator
```

### 3.2. CounterfactualEngine

**Назначение:** Симуляция альтернативных траекторий при выборе $A'$ вместо $A$.

**Два режима работы:**

#### Deterministic Mode (default)
- Использование `DeterministicGenerator` с фиксированным seed
- Воспроизводимость: $\text{counterfactual}(S, A')_0 = \text{counterfactual}(S, A')_n$ (I30)
- Применяется для: малых отклонений ($\Delta\text{ExpectedProfit} \leq 5\%$ и $\Delta\text{Risk} \leq 10\%$)

#### Stochastic Mode (Monte-Carlo)
- Запускается при превышении порогов значимости
- **N = f(planComplexity, tenantTier)** — адаптивное число симуляций
- Возвращает распределение, а не точечную оценку
- Применяется для: крупных отклонений

**Адаптивное N:**
```typescript
const MONTE_CARLO_N: Record<TenantTier, Record<PlanComplexity, number>> = {
  BASIC:      { LOW: 1_000,  MEDIUM: 2_000,  HIGH: 5_000  },
  STANDARD:   { LOW: 2_000,  MEDIUM: 5_000,  HIGH: 10_000 },
  ENTERPRISE: { LOW: 5_000,  MEDIUM: 10_000, HIGH: 50_000 },
};

const N = MONTE_CARLO_N[tenant.tier][plan.complexity];
```

**Логика активации Monte-Carlo:**
```typescript
if (deltaExpectedProfit > 0.05 || deltaRisk > 0.10) {
  return this.runMonteCarloSimulation(state, humanAction, N = 10_000);
} else {
  return this.runDeterministicSimulation(state, humanAction);
}
```

**Входные данные:**
- `currentState: PlanState`
- `aiDraft: GeneratedDraft`
- `humanAction: HumanOverride`

**Выходные данные:**
- `alternativeScenario: Scenario`
- `profitForecast: ProfitForecast` (не только yield!)
- `riskDelta: RiskDelta`
- `simulationMode: 'DETERMINISTIC' | 'MONTE_CARLO'`
- `confidenceInterval?: [number, number]` (только для Monte-Carlo)

### 3.3. OverrideRiskAnalyzer

**Назначение:** Расчет $\Delta Risk$ при Human Override.

**Формула:**
$$
\Delta Risk = \text{Risk}(A') - \text{Risk}(A)
$$

Где `Risk` включает:
1. **Yield Risk:** вероятность недобора урожая
2. **Financial Risk:** вероятность убытков
3. **Compliance Risk:** нарушение регламентов (опционально для Level C)

**Политика блокировки:** 
- $\Delta\text{Regret} > 0$ → **предупреждение, но НЕ блокировка**
- $\Delta\text{Regret} > \text{threshold}_{\text{high}}$ → **запись в Audit Log + уведомление supervisor**
- $\Delta\text{Regret} > \text{threshold}_{\text{critical}}$ → **обязательное обоснование + I33 активируется**

См. раздел 3.6 для формализации порогов.

### 3.4. ConflictMatrix

**Назначение:** Хранение и анализ векторов факторов AI и Human.

**Методология DivergenceScore:**

Косинусная близость не подходит для агрономических решений, так как они не являются чистыми векторами признаков. Используется **экономически взвешенная метрика**:

$$
\text{DivergenceScore} = f(\Delta\text{EconomicImpact},\ \Delta\text{Risk},\ \text{ConfidenceGap},\ \text{Frequency})
$$

$$
\text{DivergenceScore} = w_1 \cdot |\Delta\text{Profit}| + w_2 \cdot \Delta\text{TailRisk} + w_3 \cdot (1 - \text{ConfidenceAI}) + w_4 \cdot \text{FrequencyPenalty}
$$

Где:
- $\Delta\text{Profit}$ — разница ожидаемой прибыли (нормализованная)
- $\Delta\text{TailRisk}$ — разница хвостового риска
- $\text{ConfidenceGap}$ — разрыв в уверенности AI (1 - confidence AI)
- $\text{FrequencyPenalty}$ — штраф за повторяющиеся конфликты по одному параметру
- $w_1..w_4$ — веса (per-tenant конфигурация)

**Обоснование:** Эта метрика имеет ценность для Level D, так как позволяет выявлять систематические паттерны расхождений с экономическим контекстом.

**Структура:**
```typescript
interface ConflictVector {
  economicImpact: number;    // |ΔProfit| нормализованный
  tailRiskDelta: number;     // ΔCVaR
  confidenceGap: number;     // 1 - confidence_ai
  frequencyPenalty: number;  // штраф за повторяющиеся конфликты
  divergenceScore: number;   // агрегированная метрика
  explanation: string;       // объяснение от ExplainabilityBuilder
}
```

### 3.5. DivergenceTracker

**Назначение:** Запись каждого факта расхождения в иммутабельный лог.

**Схема БД:**
```prisma
model DivergenceRecord {
  id              String   @id @default(cuid())
  companyId       String
  planId          String
  aiDraftId       String
  humanAction     Json     // что сделал человек
  deltaRisk       Float    // ΔRisk
  explanation     String   // объяснение расхождения
  conflictVector  Json     // ConflictVector
  timestamp       DateTime @default(now())
  
  divergenceScore Float    // экономически взвешенная метрика
  simulationMode  String   // 'DETERMINISTIC' | 'MONTE_CARLO'
  horizon         Int      @default(3) // горизонт в годах
  
  @@index([companyId, planId])
  @@index([timestamp])
}
```

### 3.6. EscalationPolicy

**Назначение:** Формализация порогов эскалации при высоком Regret.

**Уровни эскалации:**

| Уровень | Условие | Действие |
|---------|---------|----------|
| **LOW** | $\text{Regret} \leq 5\%$ от avg profit | Запись в лог, нет уведомлений |
| **MODERATE** | $5\% < \text{Regret} \leq 15\%$ | Предупреждение в UI, запись в Audit Log |
| **HIGH** | $15\% < \text{Regret} \leq 30\%$ | Уведомление supervisor, обязательный просмотр |
| **CRITICAL** | $\text{Regret} > 30\%$ | I33 активируется: требуется письменное обоснование |

**Per-tenant конфигурация:**
```typescript
interface EscalationConfig {
  tenantId: string;
  thresholds: {
    moderate: number;  // default: 0.05 (5% от avg profit)
    high: number;      // default: 0.15
    critical: number;  // default: 0.30
  };
  supervisorNotification: {
    enabled: boolean;
    channels: ('email' | 'telegram' | 'in-app')[];
    recipientRoles: ('MANAGER' | 'OWNER')[];
  };
}
```

**Тип порогов:** Relative (% от среднегодовой прибыли на га), не absolute. Это обеспечивает масштабируемость для хозяйств разного размера.

**Anti-Gaming защита baseline:**

Если пороги относительны к `avgProfit`, возникает риск манипуляции baseline. Защита:

```typescript
interface BaselineConfig {
  // Скользящее среднее за 3 года (не за текущий сезон)
  avgProfitCalculation: 'ROLLING_3Y';
  
  // Фиксация в начале сезона, не пересчитывается в реальном времени
  snapshotAt: 'SEASON_START';
  
  // Иммутабельность: baseline не может быть изменен в течение сезона
  immutable: true;
}
```

**Правило:** `avgProfit` = rolling 3-year average, фиксируется snapshot в начале сезона. Неизменяем в течение сезона.

---

## 4. Интеграция с FSM

### 4.1. Расширение DraftStateManager

**Новый переход:**
```
GENERATED_DRAFT --[HUMAN_OVERRIDE]--> OVERRIDE_ANALYSIS --> APPROVED (with warning)
```

**Обязательные действия на HUMAN_OVERRIDE:**
1. Вызов `OverrideRiskAnalyzer.calculate(aiDraft, humanAction)`
2. Вызов `CounterfactualEngine.simulate(state, humanAction)`
3. Запись в `DivergenceTracker`
4. Генерация объяснения через `ExplainabilityBuilder`

### 4.2. Guard Conditions

```typescript
canTransition('HUMAN_OVERRIDE'): boolean {
  // AI НЕ блокирует переход
  // Но требует полноты данных для расчета ΔRisk
  return this.hasRequiredMetadata(humanAction);
}
```

---

## 5. Инварианты Level C (I29–I32)

### I29: Risk Awareness
$$
\text{humanOverride} \rightarrow \Delta Risk \text{ calculation mandatory}
$$

**Реализация:** Guard на FSM transition HUMAN_OVERRIDE.

### I30: Model Reproducibility
$$
\text{counterfactual}(S, A')_0 = \text{counterfactual}(S, A')_n
$$

**Реализация:** Centralized entropy control через EntropyController (Level B).

### I31: Conflict Tracking
$$
\forall \text{ divergence: record}(\text{divergenceMetadata})
$$

**Реализация:** DivergenceTracker + Prisma schema.

### I32: Explainable Disagreement
$$
\text{divergence.explanation} \neq \text{null}
$$

**Реализация:** ExplainabilityBuilder (Level B) расширяется для conflict scenarios.

### I33: High-Regret Escalation
$$
\text{Regret} > \text{threshold}_{\text{critical}} \rightarrow \text{supervisorNotification.required} = \text{true}
$$

**Формальное определение:**
$$
\forall \text{override}: \text{Regret}(A') > \text{threshold}_{\text{critical}} \Rightarrow \exists \text{justification} \neq \text{null}
$$

**Реализация:** Guard на FSM transition `CONFIRM_OVERRIDE` при Critical уровне.

> **Важное уточнение:** I33 блокирует **подтверждение** (`CONFIRM_OVERRIDE`), но НЕ блокирует **само действие** (`HUMAN_OVERRIDE`). Человек может отменить override через `CANCEL_OVERRIDE`. Это не нарушает границу Level C: решение остается за человеком.

**Отличие от I29:** I29 требует расчета ΔRisk для любого override. I33 требует **обоснования** только при критическом уровне Regret.

---

## 6. Границы Level C

### Что Level C делает:
- ✅ Рассчитывает risk-adjusted Regret (ΔProfit + ΔTailRisk + ΔVolatility)
- ✅ Моделирует альтернативные траектории (Deterministic + Monte-Carlo)
- ✅ Учитывает 3-летний дисконтированный горизонт
- ✅ Фиксирует конфликты в иммутабельный лог с экономической метрикой
- ✅ Показывает объяснения расхождений
- ✅ Эскалирует критические конфликты (I33)

### Что Level C НЕ делает:
- ❌ Блокирует решения человека (кроме I33: требует обоснования)
- ❌ Изменяет прошлые решения
- ❌ Переобучает модель на основе конфликтов (это Level D)
- ❌ Принимает автономные решения без участия человека

---

## 7. Принцип встраивания

> **Level C не изолирован — он встроен:**
> - в CORE (архитектура и инварианты)
> - в AGRO_DOMAIN (математика)
> - в RAI_DOMAIN (governance)
> - в PRODUCT (UI)
> - в ENGINEERING (API)
> - в TESTING и METRICS

**Ключевой принцип:**
Каждый уровень расширяет систему, а не живет отдельно.

---

## 8. Связанные документы

- [LEVEL_C_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_INVARIANTS.md)
- [FSM_EXTENSION.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/FSM_EXTENSION.md)
- [CONFLICT_ENGINE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/CORE_SUBSYSTEMS/CONFLICT_ENGINE.md)
- [REGRET_MODEL_SPEC.md](file:///f:/RAI_EP/docs/02_DOMAINS/AGRO_DOMAIN/REGRET_MODEL_SPEC.md)
- [DIVERGENCE_SCORE_SPEC.md](file:///f:/RAI_EP/docs/02_DOMAINS/AGRO_DOMAIN/DIVERGENCE_SCORE_SPEC.md)
- [EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md](file:///f:/RAI_EP/docs/00_STRATEGY/EVOLUTION_ARCHITECTURE_MASTER_A_TO_F.md)
