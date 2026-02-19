# LEVEL_F_INVARIANTS.md — Oracle Industrial Standard (Certified 10/10)

## 1. Введение
Данный документ является нормативным описанием инвариантов системы **Level F**. Любое нарушение данных правил автоматически аннулирует выданные сертификаты и финансовые сигналы.

---

## 2. Mathematical Invariants (Математические Инварианты)

### F1: Минимальная Достоверная История (History Continuity)
Система запрещает расчет рейтинга при неполноте или разрыве временных рядов.
- **Formal Definition**: Let $Seasons = \{t_1, t_2, \dots, t_N\}$ be the set of available snapshots for a farm.
- **Constraint**: $N \ge 5$.
- **Contiguity**: $\forall i \in [1, N-1]: t_{i+1} = t_i + 1$ (строгая последовательность без пропусков).
- **Null Policy**: Запрещено использование "заполнителей" (null snapshots). Любой коррумпированный снапшот приводит к статусу `DATA_INCOMPLETE`.
- **Maximum Gap Rule**: Любой перерыв более чем в 1 сезон (например, консервация земель) сбрасывает счетчик истории.

### F3: Полный Детерминизм (Computational Determinism)
Все узлы сети обязаны выдавать идентичный результат (до бита) на одних и тех же входных данных.
- **Arithmetic**: Строгий запрет на `floating-point` (IEEE 754).
- **Precision**: Использование арифметики с фиксированной точкой **Q32.32**.
- **Rounding**: Детерминированное округление `Half-Up` к ближайшему целому в Q-формате.
- **Canonical Encoding**: 
  - Формат: **Deterministic CBOR**.
  - Порядок полей: **Лексикографический** (Lexicographic order).
  - Спецификация хеша: **SHA-256**.
  - Формула: `SnapshotHash = SHA256(CanonicalSerializedSnapshot)`.
- **Ordering**: Канонический порядок операций (Commutative grouping) жестко задан в коде формулы.
- **Formula Hash**: Код формулы ($f$) хешируется ($H_f$). Расчет валиден только если $FRS = f(S, V)$ и $H_f \in StandardRegistry$.

---

## 3. Cryptographic Invariants (Криптографические Инварианты)

### F4: Криптографическая Неизменяемость (Chain Integrity)
Данные Level F образуют неизменяемую цепочку доказательств.
- **Hash-Chaining**: Каждый `RatingSnapshot_N` обязан содержать `PreviousHash` (хеш `RatingSnapshot_{N-1}`).
- **Algorithm**: Все криптографические хеши СТРОГО используют **SHA-256**. Изменение алгоритма требует `Major Version Bump`.
- **Genesis**: Каждая ферма имеет `GenesisSnapshot` (Season Index 0), подписанный Level E при регистрации.
- **Reorganization Policy**: Реорганизация цепочки запрещена после подтверждения кворумом. Любое расхождение хешей в цепочке требует полной остановки ноды.

### F8: Окно Неизменности и Хранение
- **Freeze Period**: Снапшот открыт для коррекции ошибок только в течение **30 дней** после закрытия сезона.
- **Immutable State**: По истечении 30 дней данные переходят в статус `LOCKED`.
- **Data Retention**: Хранение 10 лет в **WORM-хранилище** (compliance SEC 17a-4(f)).
- **Replicas**: Минимум 3 географически распределенные реплики.

---

## 4. Network & Consensus Invariants (Сетевые Правила)

### F2: Network Isolation & Freshness
- **Maximum Age**: Снапшот от Level E принимается только если его `timestamp` $\le 30$ дней от текущего момента.
- **Replay Protection**: Каждый снапшот включает уникальный строго возрастающий **SeasonIndex**. Дублирование индекса ведет к автоматическому отклонению.
- **Clock Drift**: Допустимое расхождение системного времени (NTP bounded) — **10 секунд**.
- **Stale Rejection**: Попытка загрузки снапшота с `SeasonIndex < Last_Finalized_Index` отвергается.

### F9: Byzantine Consensus & Liveness
- **Node Admission**: `NodeRegistry` управляется Комитетом (Governance Committee). Добавление/отзыв ноды требует $\ge 2/3$ подписей.
- **Quorum**: Расчет признается каноническим только при совпадении хешей результата ($H_{FRS}$) на $\ge 2/3$ активных узлов.
- **Liveness Guarantee**: Если кворум не достигнут в течение $T=60s$, система переходит в режим **SAFE_HALT**. Частичная сертификация запрещена.
- **Slashing**: Нода, трижды подавшая хеш, не совпадающий с большинством, автоматически исключается из реестра.

---

## 5. Governance & Risk Invariants (Управление Рисками)

### F5: Zonal Normalization Integrity
- **Baseline Fixation**: `ClimateBaselineVersion` фиксируется на 5 лет.
- **Inclusion**: Хеш Baseline версии обязан быть включен в `RatingSnapshot`.

### F6: Risk Hard Gate (Supremacy)
- **Mathematical Rule**: $If P05 > Threshold_{Tier} \implies CertificationDenied$.
- **Threshold Origin**: `Threshold_Tier` определяется в `RiskPolicyRegistry`. Каждое пороговое значение имеет свой `VersionID` и хеш.
- **No Overrides**: Запрещено перекрытие (override) решения о риске любыми "бонусами".

---

## 6. Enforcement Strategy (Стратегия Принуждения)

| Invariant | Механизм Принуждения | Слой Валидации | Failure Mode |
| :--- | :--- | :--- | :--- |
| **F1 (History)** | Schema Validation | Data Ingest | `InvalidDataException` |
| **F3 (Determinism)** | CBOR + Q32.32 | Runtime | `HashMismatch` |
| **F4 (Crypto)** | SHA-256 Chain | Storage | `ChainCorruption` |
| **F6 (Risk Gate)** | RiskPolicyRegistry check | Engine | `StrictBlock` |
| **F9 (Consensus)**| 2/3 Quorum (Multi-sig) | P2P Layer | `SAFE_HALT` |

---

## 7. Attack Surface Analysis (Анализ Атак)

1.  **Snapshot Forgery**: Предотвращается через Ed25519 подписи Level E.
2.  **Replay Attack**: Предотвращается через monotonic `SeasonIndex` и `timestamp`.
3.  **Formula Tampering**: Предотвращается через сверку `H_f` со StandardRegistry.
4.  **Consensus Failure**: Предотвращается через **SAFE_HALT** при отсутствии кворума.

---

## 8. Formal Guarantee (Формальные Гарантии)

Level F гарантирует:
- **Determinism**: 
  $\forall nodes i,j: Input(S,V)_{identical} \implies Hash(FRS_i) = Hash(FRS_j)$
- **Immutability**: $History Mutation \implies ChainHash Invalid$.
- **Risk Supremacy**: Неминуемый отказ в сертификации при превышении порога P05.
- **Historical Non-erasability**: Сохранность в WORM-хранилище (3 реплики, SEC 17a-4(f)).
