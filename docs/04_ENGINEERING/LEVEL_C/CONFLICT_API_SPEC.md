---
id: DOC-ENG-LC-001
type: Engineering Specification
layer: Engineering
status: Draft
version: 1.3.0
owners: [@techlead]
last_updated: 2026-02-18
---

# CONFLICT API — Level C
## REST API спецификация для Conflict Engine (Hardened)

---

## 0. Статус документа

**Уровень зрелости:** D2 (Formal Specification)  
**Привязка:** Conflict Engine, Level C Architecture, Level C Test Matrix
**Protocol:** REST + Event Sourcing

---

## 0.1 Domain Constraints (I29)

Все компоненты ΔRisk должны удовлетворять следующим математическим ограничениям:
- **Range**: $\text{component} \in [-1, 1]$, где -1 (Максимальное снижение риска), 1 (Максимальное повышение).
- **Aggregation**: `totalRisk = Σ(component_i * weight_i)`, где `Σ weights = 1`.
- **Finite**: Значения `NaN`, `Infinity` запрещены на уровне API (400 Bad Request).

---

## 1. Global Headers (Enterprise Audit)

Каждому запросу **обязательно** требуется:
- `X-Request-ID`: UUID для отслеживания цепочки запросов.
- `X-Correlation-ID`: UUID для связки HUMAN_OVERRIDE_INITIATED -> DIVERGENCE_RECORDED.
- `Idempotency-Key`: UUID для предотвращения Replay Attack.
    - **Persistence**: Хранится в Redis с TTL = 24 часа.
    - **Concurrency**: Первый запрос устанавливает NX lock. Параллельные запросы с тем же ключом получают `425 Too Early` или `202 Accepted` (если процесс идет).

---

## 2. Endpoints

### POST /api/v1/conflict/override

**Назначение:** Инициировать Human Override и расчет ΔRisk

**Request:**
```typescript
{
  planId: string; // Validated against JWT tenant claims
  draftId: string;
  humanAction: {
    parameterName: string;
    oldValue: number;
    newValue: number;
    justification?: string;
  };
}
```

**Response:**
```typescript
{
  overrideId: string;
  deltaRisk: {
    yieldRisk: number;
    financialRisk: number;
    complianceRisk: number;
    totalRisk: number; // Isomorphic to DivergenceRecord storage
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isCritical: boolean; // True if HIGH or CRITICAL per I33 classification
  alternativeScenario: {
    yieldForecast: number;
    costEstimate: number;
    profitEstimate: number;
    simulationHash: string; // Reproducibility link
    stateHash: string;      // Formal state identity
    actionHash: string;     // Formal action identity
  };
  divergenceScore: number;
  explanation: string;
  status: 'PENDING_CONFIRMATION' | 'AUTO_APPROVED';
  hashAlgorithm: 'sha256:v1';
}
```

---

### POST /api/v1/conflict/confirm

**Назначение:** Подтверждение override. 
**Atomic Contract:** Создание `DivergenceRecord`, публикация события и обновление статуса Draft происходят в одной БД-транзакции.

**Request:**
```typescript
{
  overrideId: string;
  acknowledgedRisk: boolean;
  justification?: string; // Required if isCritical == true (I33)
  clientSimulationHash: string; // Guard against simulation drift
}
```

**Hash Guard Behavior:**
- Если `clientSimulationHash != serverSideRecomputedHash`:
  - Ответ: `412 Precondition Failed`.
  - Body: `{ error: 'SIMULATION_DRIFT', message: 'Input state changed since override initiation' }`.
  - Клиент обязан перезапросить `/override`.

---

## 3. Canonicalization Contract (I30)

Для обеспечения воспроизводимости хешей (I30) API гарантирует:
1.  **Key Ordering**: При расчете хеша ключи JSON-объектов сортируются лексикографически (Stable Object Key Ordering).
2.  **Float Normalization**: Все числа с плавающей запятой округляются до 8 знаков после запятой с использованием **IEEE 754 Round Half To Even** перед хешированием.
3.  **Null Equivalence**: Поля со значением `null` или `undefined` исключаются из сериализации. Они семантически эквивалентны отсутствующим полям (Absent fields).
4.  **UTF-8 Stability**: Использование нормализации Unicode (NFC) для всех строковых полей justification и объяснений.
5.  **No Nulls**: Пустые объекты `{}` и объекты с `null`-полями дают идентичный канонический вид.

---

## 4.1 Hash Algorithm Upgrades (Lifecycle)

1.  **Versioning**: Канонический формат хеша — `algorithm:version` (например, `sha256:v1`).
2.  **Introduction of v2**: При вводе нового алгоритма сервер поддерживает оба алгоритма в течение Transition Period (параллельный расчет).
3.  **Backward Compatibility**: Существующие `DivergenceRecord` с `v1` остаются валидными.
4.  **Forced Recompute Protocol**: При запросе с заголовком `X-Forced-Recompute: true` сервер обязан пересчитать хеш по актуальному `v-latest`, если входные данные доступны.

---

## 5. Timestamp & Clock Policy

1.  **Authority**: Все временные метки генерируются на стороне сервера. Клиентские `timestamp` игнорируются.
2.  **Clock Source**: Используется **Monotonic Server Clock** для интервалов и UTC System Clock для логов.
3.  **Timezone**: Все значения строго в `ISO 8601 UTC` (Z-префикс).

---

## 6. Events (Event Sourcing)

**Global Rule:** Все события имеют поле `version: number`.

### DELTA_RISK_CALCULATED
```typescript
{
  type: 'DELTA_RISK_CALCULATED';
  version: 1;
  overrideId: string;
  deltaRisk: object;
  simulationHash: string;
  hashAlgorithm: string;
  timestamp: string;
}
```

### DIVERGENCE_RECORDED
```typescript
{
  type: 'DIVERGENCE_RECORDED';
  version: 1;
  divergenceId: string;
  planId: string;
  tenantId: string;
  deltaRisk: object;
  isCritical: boolean;
  simulationHash: string;
  timestamp: string;
}
```

---

## 7. Security & Hardening

### Replay Protection
- `overrideId` имеет TTL = 10 минут.
- Повторный вызов `/confirm` с тем же `overrideId` возвращает статус из кэша (Idempotency).

### Tenant Isolation (I31)
- Все запросы проходят через Middleware: `planId` -> `checkTenantOwner(jwt.tenantId)`.
- В БД записи расхождений содержат `tenantId` с B-tree индексом.

---

## 8. Rate Limiting & Flow Control

**Counterfactual Engine:**
- Limit: 100 req/min/user.
- **Backpressure**: При превышении возвращается `429 Too Many Requests` с заголовком `Retry-After`.
- **Circuit Breaker**: Если среднее время симуляции > 2сек, включается Half-Open режим для защиты ресурсов.

---

## 9. Согласованность с Test Matrix v1.4.0

| Инвариант | Механизм в API |
|-----------|-----------------|
| **I29** (Risk) | Изоморфная `deltaRisk` структура, `isCritical` флаг. |
| **I30** (Det) | `simulationHash`, `hashAlgorithm`, `stateHash` в ответе. |
| **I31** (Log) | DB Transaction Guarantee в `/confirm`, `X-Correlation-ID`. |
| **I32** (Expr) | `explanation` с обязательной XSS-санитацией. |
| **I33** (Esc) | Фактическая блокировка в FSM при `isCritical && !justification`. |

---

## 10. Связанные документы

- [LEVEL_C_ARCHITECTURE.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/CORE/LEVEL_C/LEVEL_C_ARCHITECTURE.md)
- [LEVEL_C_FORMAL_TEST_MATRIX.md](file:///f:/RAI_EP/docs/05_TESTING/LEVEL_C_FORMAL_TEST_MATRIX.md)

---

[Changelog]
- v1.0.0: Базовая спека REST.
- v1.1.0: Hardened Audit Update. Добавлены Enterprise Audit Headers, Transactional Atomicity, Hash Versioning и Tenant Isolation.
- v1.2.0: Expert Audit Hardening. Формализованы доменные ограничения ΔRisk, Redis Idempotency, Canonicalization Contract и Monotonic Clock Policy. 
- v1.3.0: Final Expert Polish. Округление Half To Even, Null/Absent семантика, Hash Upgrade Lifecycle и State/Action Hash transparency. (Formal-Grade)
