---
id: DOC-ARH-PNC-LD-002
type: Principle
layer: Architecture
status: Accepted
version: 2.3.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ПРИНЦИП: Объяснимая эволюция (Explainable Evolution D6+++)

---

## 1. Формулировка

> **Каждое обновление модели должно сопровождаться формальным отчетом об эволюции (Evolution Report), объясняющим причины изменений и гарантирующим безопасность.**

> **Invariant D5:** `Promotion allowed iff ExplainabilityContractSatisfied`

---

## 2. Формальная структура (Evolution Report Schema)

Артефакт `EvolutionReport` описывает дельту состояния ($S_t \to S_{t+1}$).

```typescript
interface EvolutionReport {
  // Metadata & Identity
  id: string;                 // UUID
  modelId: string;            // SHA256 Lineage Hash
  parentVersionId: string;    // SHA256 Parent Hash
  createdAt: ISODate;
  
  // 1. Performance Explainability
  performanceDelta: {
    metric: 'MAE' | 'RMSE' | 'R2';
    direction: 'MINIMIZE' | 'MAXIMIZE'; 
    oldValue: number;
    newValue: number;
    delta: number;            
    deltaPercent: number;     
  }[];

  // 2. Bias Analysis (Invariant D4)
  biasAnalysis: {
    metric: 'DemographicParity' | 'EqualOpportunity';
    oldScore: number;
    newScore: number;
    delta: number;            // Must be <= 0
  }[];

  // 3. Feature Importance Shift
  featureImportanceDelta: {
    feature: string;
    oldWeight: number;
    newWeight: number;
    deltaPercent: number;
  }[];

  // 4. Drift Context
  driftAnalysis: {
    detected: boolean;
    magnitude: number;        // Statistical Distance (e.g. KL Divergence)
    threshold: number;        // Governance Threshold used
    driftType: 'DATA' | 'CONCEPT' | 'COVARIATE' | 'NONE';
    explanation: string;      
  };

  // 5. Override Context
  adminOverride?: {
    adminId: string;          // Role.ADMIN
    justification: string;    // Min length > 20 chars
    auditLogId: string;       // Link to Audit Event
    timestamp: ISODate;
  };

  // 6. Traceability
  trainingDataFingerprint: string; // Hash(SnapshotID)
}
```

---

## 3. Strict Non-Regression Policy

Определим вспомогательные предикаты для метрики $m$:

$$
IsNonRegression(m) \iff
(m.dir = MIN \land m.delta \le 0) \lor 
(m.dir = MAX \land m.delta \ge 0)
$$

$$
IsRegression(m) \iff \neg IsNonRegression(m)
$$

| Metric | Direction | Policy |
|--------|-----------|--------|
| **MAE/RMSE** | **MINIMIZE** | $\Delta > 0$ is Regression |
| **R2** | **MAXIMIZE** | $\Delta < 0$ is Regression |
| **Bias** | **MINIMIZE** | $\Delta > 0$ is Hard Block |

---

## 4. Formal Contract Definition (Invariant)

Продвижение версии $V$ разрешено (`Promotable`), тогда и только тогда, когда истинен предикат:

$$
ExplainabilityContractSatisfied(V) \iff
\begin{cases} 
  SchemaValid(V.report) \land \\
  
  \forall m \in V.perf: [ IsNonRegression(m) \lor ( IsRegression(m) \land V.override \neq \emptyset ) ] \land \\
  
  \forall b \in V.bias: IsNonRegression(b) \land \\
  
  (V.drift.detected \iff V.drift.magnitude > V.drift.threshold) \land \\
  
  (V.drift.detected \implies len(V.drift.explanation) > 10) \land \\
  
  V.trainingDataFingerprint \neq \text{null}
\end{cases}
$$

**Else:** `Promotion = DENIED`.

---

## 5. Механизм принуждения (Enforcement Mechanism)

### A. CI Gate Logic (Predicate Execution)
Pipeline выполняет проверку предиката автоматически:
1.  **Metric Loop:** Для каждой метрики проверяется `IsNonRegression`.
    *   Если `false`, проверяем наличие `adminOverride` в корне отчета.
    *   Если `override` нет — **FAIL**.
2.  **Bias Loop:** Для каждой метрики Bias проверяется `IsNonRegression`.
    *   Если `false` — **FAIL** (Override игнорируется для Bias).
3.  **Drift Consistency:** Проверяем, что флаг `detected` математически соответствует порогу.

### B. Immutable Storage
`EvolutionReport` сохраняется в CAS (Content-Addressable Storage). Хэш отчета включен в метаданные версии модели. Изменение justification невозможно без изменения ID версии.

---

## 6. Связанные документы
- [LEVEL_D_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/LEVEL_D_INVARIANTS.md)
- [RETRAINING_PIPELINE_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_D/RETRAINING_PIPELINE_ARCHITECTURE.md)
