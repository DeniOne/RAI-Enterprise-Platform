---
id: DOC-DOM-LD-003
type: Domain
layer: Domain
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# RAI DOMAIN — DRIFT REPORT (D6 Hardened)
## Доменная модель отчёта о дрейфе

---

## 1. Сущность

**DriftReport** — криптографически подписанное, иммутабельное заключение о "здоровье" модели на заданном временном окне.
Является юридически значимым документом для принятия решений о переобучении или блокировке.

---

## 2. Атрибуты (D6 Schema)

| Поле | Тип | Constraint | Описание |
|------|-----|------------|----------|
| `id` | CUID | Primary Key | Уникальный идентификатор отчёта |
| `tenantId` | UUID | Index | Тенант (Isolation) |
| `modelVersionId` | UUID | FK | Проверяемая версия модели |
| `windowStart` | DateTime | Index | Начало окна агрегации |
| `windowEnd` | DateTime | Index | Конец окна агрегации |
| `windowEventCount` | Int | $\ge 0$ | Количество событий в окне |
| `windowEventHash` | SHA-256 | Verify | Хэш агрегированных событий (Merkle Root) |
| `dataDrift` | JSON | Contract | PSI / KL metrics |
| `conceptDrift` | JSON | Contract | Feature shift metrics |
| `performanceDrift` | JSON | Contract | Accuracy / Error trend |
| `aggregateScore` | Float | [0, 1] | Итоговая оценка здоровья |
| `formulaVersion` | String | Config | Версия формулы скоринга (v1.0) |
| `severity` | Enum | - | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |
| `recommendation` | Enum | - | `NO_ACTION` \| `MONITOR` \| `RETRAIN` \| `URGENT_RETRAIN` \| `BLACKLIST` |
| `payloadHash` | SHA-256 | Unique | Хэш значимых полей |
| `payloadSignature` | Hex | Security | Подпись DriftMonitorWorker |
| `createdAt` | DateTime | Immutable | Дата формирования |

---

## 3. Drift Metrics Contract (Typed Schema v1.0)

Поля `*Drift` обязаны соответствовать схеме:

```typescript
interface DriftMetricsContract {
  schemaVersion: "1.0";
  
  dataDrift: {
    globalPsi: number;
    driftedFeatureCount: number;
    topDriftedFeatures: { name: string; psi: number }[];
  };

  conceptDrift: {
    targetDistributionShift: number; // KL Divergence
    predictionShift: number;         // PSI of predictions
  };

  performanceDrift: {
    currentMae: number;
    baselineMae: number;
    degradationRatio: number;        // (current - base) / base
  };
}
```

---

## 4. Инварианты (D6)

### A. Window Integrity (No Overlap)
Для одной `modelVersionId`:
$$
\forall r1, r2: r1.id \neq r2.id \implies [r1.start, r1.end) \cap [r2.start, r2.end) = \emptyset
$$
*Окна для одной версии модели не могут пересекаться.*

### B. Tenant Consistency
$$
ModelVersion(this.modelVersionId).tenantId == this.tenantId
$$
*Запрещено создавать отчет для чужой модели.*

### C. Data Integrity
$$
windowEventHash == MerkleRoot(LearningEvents \in [start, end])
$$
*Гарантирует, что отчет построен на реальных, неизмененных событиях.*

### D. Uniqueness
`UNIQUE(tenantId, modelVersionId, windowStart, windowEnd)`

---

## 5. Использование

1.  **ModelUpdateController:**
    *   `recommendation == RETRAIN` → Запуск пайплайна.
    *   `recommendation == BLACKLIST` → Блокировка версии.
2.  **EvolutionReportBuilder:**
    *   Использует `DriftReport` как объяснение (Explanation) причины переобучения.
3.  **Auditor:**
    *   Проверяет `payloadSignature` для подтверждения, что отчет не был подделан для скрытия деградации.

---

## 6. Связанные сущности
- `ModelVersion` — Объект проверки.
- `LearningEvent` — Исходные данные.
- `RetrainingDecision` — Следствие отчета.
