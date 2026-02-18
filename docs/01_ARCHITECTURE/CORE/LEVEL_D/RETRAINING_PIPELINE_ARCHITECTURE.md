---
id: DOC-ARH-CORE-LD-006
type: Architecture
layer: Core
status: Accepted
version: 3.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# RETRAINING PIPELINE ARCHITECTURE (The Magnum Opus)
## Архитектура Оркестратора Управляемой Эволюции (D6 Industrial)

---

## 0. Статус документа

**Уровень зрелости:** D6 (Industrial Grade)
**Binding:** STRICT (Violation = Incident)
**Назначение:** Единый источник истины для реализации класса `RetrainingOrchestrator`.

---

## 1. Концепция (The Factory)

**Retraining Pipeline** — это не просто скрипт обучения. Это **Транзакционный Завод** по производству Интеллектуального Капитала (Model Equity).
Он принимает Сырье (`LearningEvents`), перерабатывает его через Станки (`Training`, `Validation`), проверяет Качество (`Canary StatSig`) и выпускает Продукт (`Champion Model`).

---

## 2. Orchestrator Specification

### 2.1. Class Definition
```typescript
/**
 * THE SUPREME COMMANDER
 * Singleton per Tenant. Guaranteed Linearizability of Evolution.
 */
class RetrainingOrchestrator {
  private fsm: PipelineFSM;
  private quota: QuotaGuard;
  private mutex: DistributedLock;
  private economy: ImpactCalculator;

  // The Main Entry Point
  async execute(trigger: DriftReport): Promise<PipelineRun> {
    // 1. Isolation & Locking
    await this.quota.checkResources(trigger.tenantId);
    using lock = await this.mutex.acquire(`pipeline:${trigger.tenantId}`);

    // 2. The Cycle
    let run = await this.fsm.createRun(trigger);
    
    try {
      run = await this.phaseTraining(run);      // Shadow Mode
      run = await this.phaseValidation(run);    // Offline Metrics
      run = await this.phaseCanary(run);        // Online StatSig
      run = await this.phasePromotion(run);     // Atomic Swap
    } catch (error) {
       await this.phaseEmergency(run, error);
    }
    
    return run;
  }
}
```

---

## 3. Finite State Machine (The Protocol)

Жизненный цикл `PipelineRun` строго детерминирован.
Любой переход требует выполнения **Guard Conditions**.

| State | Transition To | Guard Condition | Side Effect |
|-------|---------------|-----------------|-------------|
| **DRAFT** | `TRAINING` | `QuotaAvailable` AND `DataSnapshotLocked` | Reserve GPU / Checksum Data |
| **TRAINING** | `VALIDATED` | `JobSuccess` AND `LossConverged` | Upload Artifacts (S3) |
| **VALIDATED** | `SHADOW` | `OfflineMetrics > Baseline` | Deploy to Shadow Pods |
| **SHADOW** | `CANARY` | `StabilityCheckPassed` (No crashes 1h) | Route 5% Traffic |
| **CANARY** | `CHAMPION` | **SPRT(p < 0.05)** AND `YieldDelta > 0` | Atomic Promotion / Calc Equity |
| **CHAMPION** | `DEPRECATED` | `NewChampionPromoted` | Archive Weights |
| **ANY** | `QUARANTINED` | `SecurityBreach` OR `BiasDetected` | Page Admin / Lock Updates |
| **ANY** | `FAILED` | `Exception` OR `Timeout` | Release Quota / Alert |

---

## 4. Statistical Verification (The Math)

### 4.1. Canary Guard (SPRT)
Мы не используем "vibes". Мы используем **Sequential Probability Ratio Test**.

**Hypothesis:**
- $H_0$: Новая модель $M_1$ не лучше старой $M_0$ ($\Delta Error \le 0$).
- $H_1$: Новая модель $M_1$ лучше ($\Delta Error > \epsilon$).

**Stop Rule:**
Накапливаем `Log-Likelihood Ratio (LLR)` на каждом событии:
- Если $LLR > \log(\frac{1-\beta}{\alpha}) \approx 2.94$ → **PROMOTE** (Reject $H_0$).
- Если $LLR < \log(\frac{\beta}{1-\alpha}) \approx -1.6$ → **ROLLBACK** (Accept $H_0$).

**Параметры:** $\alpha=0.05, \beta=0.20$.

---

## 5. Tenant Isolation & Security (The Law)

### 5.1. Resource Quotas
Перед входом в фазу `TRAINING`:
1.  **Check Budget:** `currentSpend < monthlyCap ($500)`.
2.  **Check GPU:** `gpuHours < limit (100h)`.
3.  **Check Storage:** `artifactSize < limit (50GB)`.

### 5.2. Cross-Tenant Barrier
- **Context:** `ActiveTenantContext` пробрасывается во все потоки.
- **DB:** Row-Level Security (RLS) на чтение `LearningEvents`.
- **Training:** Контейнеры запускаются в изолированных Namespace без доступа к сети (кроме S3).

---

## 6. Economic Model Strategy (The Value)

В момент промоушена (`CANARY` -> `CHAMPION`) рассчитывается **Model Equity**:

$$ Equity(M) = \sum_{f \in Fields} (Yield_{pred} - Yield_{base}) \times Area_f \times Price_{crop} \times Confidence(M) $$

Это число записывается в `ModelVersion.equity`.
Руководитель видит: **"Мы создали актив стоимостью $50,000"**.

---

## 7. Disaster Recovery (The Safety)

1.  **Checkpointing:** Каждая фаза FSM сохраняет состояние в БД. При рестарте пода Orchestrator продолжает с прерванной фазы.
2.  **Distributed Mutex:** Redis-lock с TTL защищает от запуска двух пайплайнов для одного тенанта.
3.  **Emergency Stop:** Кнопка "Kill Switch" в админке моментально переводит все PipelineRuns в `FAILED` и останавливает GPU job.

---

## 8. Связанные документы
- [LEVEL_D_IMPLEMENTATION_PLAN.md](file:///f:/RAI_EP/docs/04_ENGINEERING/LEVEL_D_IMPLEMENTATION_PLAN.md)
- [MODEL_UPDATE_STATE_MACHINE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/HLD/MODEL_UPDATE_STATE_MACHINE.md)
