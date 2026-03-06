# REPORT — R4 Claim Accounting and Coverage (Truth Sync Recovery)

**Дата**: 2026-03-06  
**Статус**: READY_FOR_REVIEW  
**Промт**: `interagency/prompts/2026-03-05_a_rai-r4_claim-accounting-and-coverage.md`  
**Decision-ID**: `AG-RAI-R4-001`

## 1. Резюме изменений
Реализована каноническая модель Claim Accounting, которая переводит качественные метрики AI из области эвристик в область проверяемого учета. Теперь `Evidence Coverage` и `invalidClaimsPct` считаются на основе общего количества утверждений (`EvidenceReference`), зафиксированных в аудит-трейле.

## 2. Каноническая модель Claim Accounting
Для каждого трейса (Trace) система собирает все `EvidenceReference` из `AiAuditEntry.metadata`.

| Метрика | Формула | Описание |
| :--- | :--- | :--- |
| **totalClaims** | `count(evidenceRefs)` | Общее кол-во утверждений в трейсе. |
| **claimsWithEvidence** | `count(ev with sourceId)` | Утверждения, подкрепленные ссылкой на источник. |
| **verifiedClaims** | `status == VERIFIED` | Утверждения с confidence >= 0.6. |
| **unverifiedClaims** | `status == UNVERIFIED` | Утверждения с confidence [0.3, 0.6) или без источника. |
| **invalidClaims** | `status == INVALID` | Утверждения с confidence < 0.3. |

### Формулы качества (Quality Metrics)
- **bsScorePct** (Bullshit Index): Взвешенная сумма (unverified + invalid) по доменным весам (Agro/Finance=3, General=1).
- **evidenceCoveragePct**: `(claimsWithEvidence / totalClaims) * 100`
- **invalidClaimsPct**: `(invalidClaims / totalClaims) * 100`

**Поведение при отсутствии данных**:
Если `totalClaims = 0`, то `BS% = 100`, `Coverage = 0%`, `Invalid = 0%`. Это "пессимистичный" сценарий: если агент ничего не доказал, он на 100% не заслуживает доверия по умолчанию.

## 3. Изменения в коде
- **TruthfulnessEngineService**:
  - Метод `calculateTraceTruthfulness` возвращает объект `TruthfulnessResult`.
  - Внедрена логика `accounting` и расчет всех трех Pct-метрик.
- **TraceSummaryService**:
  - `UpdateTraceSummaryQualityParams` расширен полем `invalidClaimsPct`.
  - Метод `updateQuality` теперь пишет это поле в базу (модель Prisma это позволяет).
- **SupervisorAgent**:
  - Трубопровод `Truthfulness` теперь прокидывает все три метрики в `updateQuality`.
  - Удален избыточный метод `calcEvidenceCoverage` (теперь это зона ответственности движка).
- **DTO (Explainability)**:
  - Проверено соответствие `TraceSummaryDto` и `TraceForensicsDto`.

## 4. Верификация
- **tsc**: PASS.
- **jest**: 20 тестов в 3 сюитах PASS.
  - `truthfulness-engine.service.spec.ts`: 5 тестов (success, mixed, zero, unverified).
  - `trace-summary.service.spec.ts`: 4 теста (record, quality update).
  - `supervisor-agent.service.spec.ts`: 11 тестов (orchestration, truthfulness pipeline ordering).

## 5. Доказательство честности
В тесте `mixed claims` (1 invalid agro [weight 3], 1 verified general [weight 1]):
- `totalClaims` = 2.
- `invalidClaims` = 1.
- `invalidClaimsPct` = 50% (честно 1/2).
- `bsScorePct` = 75% (взвешенно 3/4).
- `evidenceCoveragePct` = 100% (оба утверждения имели `sourceId`).

Это доказывает, что система больше не использует "среднюю температуру по больнице", а ведет точный учет каждого утверждения.
