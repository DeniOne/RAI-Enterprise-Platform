---
id: DOC-EXE-LD-001
type: Execution
layer: Operations
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# LEVEL D — ROLLOUT PLAN (D6+ Industrial)
## План развёртывания Adaptive Self-Learning

---

## 1. Стратегия развёртывания (Phased Rollout)

### Formal Gates & Exit Criteria

#### Stage 1: Shadow Mode (Passive Learning)
*В этой фазе система считает дрейф и запускает обучение, но **не** деплоит модели.*
*   **Goal:** Накопление статистики и валидация `DriftMonitor`.
*   **Artifacts:** `EvolutionReport`, `LineageGraph` (Ghost Nodes).
*   **Exit Criteria:**
    1.  **Data Coverage:** $> 90\%$ активных тенантов имеют Learning Events.
    2.  **False Positive Rate:** $< 5\%$ (по оценке агрономов).
    3.  **Pipeline Stability:** 0 падений Orchestrator за 2 недели.

#### Stage 2: Pilot (Human-in-the-loop)
*ИИ предлагает обновление, человек (Committee) утверждает.*
*   **Goal:** Отработка процесса Governance.
*   **Artifacts:** `ApprovalRecord`, `ValidationChecklist`.
*   **Tenants:** whitelist (Top-5 Loyal).
*   **Exit Criteria:**
    1.  **Approvals:** Мин. 5 успешных ручных подтверждений.
    2.  **Rejections:** Мин. 1 корректный отказ (проверка бдительности).
    3.  **Audit Trail:** 100% решений имеют криптографическую подпись.

#### Stage 3: Controlled Autonomy (Production)
*ИИ принимает решения самостоятельно в рамках Risk Matrix.*
*   **Goal:** Масштабирование на все тенанты.
*   **Guards:** `Rate Limit`, `Budget Cap`, `Canary`.
*   **Exit Criteria:**
    1.  **SLA:** 99.9% Uptime of Inference.
    2.  **Economy:** Positive ROI confirmed by `MetricEquity`.

---

## 2. Stability Safeguards (Safety Barriers)

### 2.1. Anti-Oscillation Guard
Защита от "мерцания" версий (Retrain -> Rollback -> Retrain).
*   **Rule:** Если модель откатилась, новая версия не может быть предложена в течение 7 дней (Cooldown).
*   **Implementation:** `Blacklist(TenantId, FeatureSignature)`.

### 2.2. Rate Limiting
*   **Max Retrain Frequency:** 1 раз в 2 недели на тенанта (Pilot), 1 раз в месяц (Autonomy).
*   **Reason:** Агрономические циклы медленные. Частый ретрейн — признак оверфиттинга на шуме.

### 2.3. Drift Smoothing
*   **Window:** `DriftScore` усредняется за 7 дней скользящего окна.
*   **Threshold:** `metric > th_critical` должно держаться мин. 3 дня подряд.

---

## 3. Рецепт Rollback (D4 Enforcement)

### 3.1. Canary Rollback (Sensitive)
*Откат во время A/B теста.*
*   **Trigger:** Относительное падение точности (`Rel ΔMAE > 5%`) по сравнению с Control Group.
*   **Action:**
    1.  Traffic -> 0%.
    2.  Status -> `FAILED`.
    3.  Alert -> `P2 Warning`.

### 3.2. Production Rollback (Severe)
*Откат утвержденной (Active) модели.*
*   **Trigger:** Абсолютное нарушение метрик (`RMSE > Threshold`) или `Bias Breach`.
*   **Action:**
    1.  Promote Previous Stable Version (`v-1`).
    2.  Status -> `ROLLED_BACK`.
    3.  Alert -> `P1 Incident`.
    4.  **Forensic Lock:** Заморозка всех обновлений тенанта до разбора инцидента.

---

## 4. Observability Spec

### 4.1. Alerts Policy
| Severity | Condition | Channel | SLA |
|----------|-----------|---------|-----|
| **P1** | `Production Rollback`, `Lineage Corruption` | Call + SMS | 15 min |
| **P2** | `Canary Fail`, `Drift > Critical` | Slack (#alerts-ml) | 4 hours |
| **P3** | `Quota Exceeded`, `Shadow Error` | Jira Ticket | 24 hours |

### 4.2. Dashboards Ownership
*   **Executive View (`Impact`):** Владелец — Product Owner. (ROI, Yield Delta).
*   **Engineer View (`Health`):** Владелец — ML Ops. (Latency, GPU Load, Pipeline State).
*   **Agronomist View (`Quality`):** Владелец — Lead Data Scientist. (Drift Maps, Accuracy).

---

## 5. График реализации

| Неделя | Фаза | Activity |
|--------|------|----------|
| **W1-4**| **Shadow** | Deploy Orchestrator (Passive). Accumulate Baselines. |
| **W5-8**| **Pilot** | Connect 5 Tenants. Manual Approval UI. First Retrains. |
| **W9+** | **Autonomy** | Enable Auto-Retrain. Scale to 100% Tenants. |

---

## 6. Связанные документы

- [ADR_LD_001_CONTROLLED_AUTONOMY.md](../../01_ARCHITECTURE/DECISIONS/ADR_LD_001_CONTROLLED_AUTONOMY.md)
- [LEVEL_D_IMPLEMENTATION_PLAN.md](../../04_ENGINEERING/LEVEL_D_IMPLEMENTATION_PLAN.md)
- [MODEL_UPDATE_STATE_MACHINE.md](../../01_ARCHITECTURE/HLD/MODEL_UPDATE_STATE_MACHINE.md)
