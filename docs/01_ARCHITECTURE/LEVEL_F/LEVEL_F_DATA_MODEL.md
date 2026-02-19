---
title: LEVEL_F_DATA_MODEL
version: 1.0.0
level: F
status: PRODUCTION_READY
schema_evolution_policy: STRICT_VERSIONED
governance_binding: REQUIRED
economic_binding: REQUIRED
cryptographic_integrity: MANDATORY
---

# 1. Архитектурная цель модели
Модель данных Level F является окончательным "якорем" институционального доверия. Она обеспечивает детерминированный переход от агрономической телеметрии к финансово-обязательным сигналам.

- **Immutable**: Любой объект после получения кворума подписей (2/3) становится физически неизменяемым.
- **Append-only**: Цепочка снапшотов растет строго линейно. Нарушение связности хешей приводит к блокировке системы.
- **Mutable**: Изменение разрешено только для параметров "живых" сезонов (статус `PLANNED` или `ACTIVE`) через формализованный протокол переходов состояний.

# 2. Общие принципы
- **Schema Versioning**: SemVer 2.0.0. Любой breaking change требует инкремента Major-версии.
- **Canonical Serialization**: 
  - Формат: **Deterministic CBOR**.
  - Сортировка полей: **Lexicographic** (включая вложенные объекты).
  - Числа: **Fixed-point Q32.32** (IEEE 754 float СТРОГО ЗАПРЕЩЕН).
- **Hashing & Signatures**: SHA-256 (хеш) и Ed25519 (подпись).
- **UTC Enforcement**: Все временные метки ОБЯЗАНЫ быть в формате ISO8601 UTC.
- **Clock Source**: Синхронизация через P2P NTP с погрешностью < 100мс.

# 3. Trust Boundary & Root Anchor Model
## 3.1 Граница доверия (Trust Boundary)
Level F принимает на вход снапшоты от Level E, но не доверяет их внутреннему расчету. 
- **Responsibility Level E**: Достоверность первичных датчиков и агрономическая логика.
- **Responsibility Level F**: Детерминизм финансового рейтинга, неизменность истории и исполнение Governance-решений.

## 3.2 Root Anchor Mechanism
- **Genesis Anchor**: Первое состояние фермы в системе (Season Index 0) содержит `GenesisHash`, запечатанный в L1 или аналогичном неизменяемом реестре.
- **Periodic Anchoring**: Каждые N сезонов (или при закрытии года) Root-хеш цепочки публикуется во внешнем доверенном реестре.
- **PreviousHash Reference**: Каждый снапшот обязан ссылаться на хеш предыдущего, создавая неразрывную криптографическую ленту.

# 4. TrustSnapshot (10/10 Spec)
```json
{
  "schema_version": "1.0.0",
  "snapshot_id": "uuid-v4",
  "tenant_id": "string-id-canonical",
  "season_id": "string-ref",
  "authority_id": "governance-node-id",
  "timestamp": "ISO8601-UTC",
  "data": {
    "season_index": "uint64-monotonic",
    "payload_hash": "sha256-hex",
    "previous_snapshot_hash": "sha256-hex",
    "root_anchor_hash": "sha256-hex|null"
  },
  "signature": "ed25519-hex"
}
```

# 5. JWT Certificate Payload (Institutional Spec)
```json
{
  "iss": "authority_node_pubkey",
  "sub": "farm_id",
  "aud": "RAI_FINANCIAL_NETWORK",
  "iat": 1740000000,
  "exp": 1742592000,
  "max_lifetime": "90d",
  "season_context": {
    "season_id": "string",
    "season_index": 12,
    "status_at_issue": "CLOSED"
  },
  "economic_claims": {
    "frs_score": "q32.32",
    "formula_hash": "sha256-hex",
    "payout_verified": true
  },
  "governance_ref": "decision-hash-hex",
  "revocation_node": "dns-or-hash-registry"
}
```

# 6. SeasonDefinition (Deterministic Binding)
```json
{
  "schema_version": "1.0.0",
  "season_id": "string-unique",
  "region": "iso-3166-2",
  "status": "PLANNED|ACTIVE|CLOSED|EXTENDED|CANCELLED",
  "dates": {
    "start": "ISO8601-UTC",
    "harvest_end": "ISO8601-UTC",
    "settlement_deadline": "ISO8601-UTC"
  },
  "computation_binding": {
    "rating_formula_hash": "sha256-hex",
    "payout_formula_hash": "sha256-hex",
    "computation_proof": "reference-to-verification-log"
  },
  "governance_binding": {
    "council_quorum": "5/7",
    "decision_hash": "sha256-hex",
    "rollback_policy": "NO_OVERRIDE_AFTER_CLOSED"
  },
  "economic_binding": {
    "token_contract": "address",
    "penalty_rules_hash": "sha256-hex",
    "settlement_currency": "USD"
  },
  "authority_signature": "ed25519-hex"
}
```

# 7. System Invariants (Validation Rules)
1. **Contiguity Invariant**: `snapshot.season_index` обязан быть строго инкрементальным (+1).
2. **Terminal State Invariant**: Если `season.status = CLOSED`, любые новые снапшоты для этого `season_id` отвергаются.
3. **Immutability Invariant**: После публикации `RatingSnapshot` с финальным рейтингом, `calculation_formula_hash` не может быть изменен.
4. **Economic Invariant**: `settlement_deadline` обязан быть $\ge harvest\_end + 7d$.
5. **Trust Invariant**: `previous_snapshot_hash` обязан соответствовать хешу предыдущей записи в БД.

# 8. Governance Conflict Resolution & Rollback
- **Rollback Policy**: Роллбэк решения возможен только в статусах `PLANNED` или `ACTIVE`.
- **Closed Lock**: После перехода в `CLOSED` решение считается окончательным. Ошибки исправляются только через выпуск нового "корректирующего" сезона/сертификата с пометкой `AMENDMENT`.
- **Conflict Resolution**: При расхождении между Governance Vote и Автоматическим расчетом, система переходит в `SAFE_HALT` до вмешательства Экспертной панели.

# 9. Attack Surface & Mitigation Table

| Вектор Атаки | Описание | Метод Нейтрализации |
| :--- | :--- | :--- |
| **Time Drift** | Манипуляция меткой времени для обхода `exp` | Bounded P2P NTP (max 10s drift) |
| **Oracle Collusion** | Сговор нод для подмены рейтинга | 2/3 Byzantine Quorum + Slashing |
| **Replay Attack** | Повтор старого валидного снапшота | Monotonic SeasonIndex + Monotonic Nonce |
| **Cartelization** | Захват Governance Council | Разделение ключей (HSM) + Multi-sig (5/7) |
| **Desync Attack** | Рассинхрон реестров между нодами | SAFE_HALT при отсутствии консенсуса > 60с |

# 10. Security & Implementation Strategy
- **Isolation**: Tenant isolation на уровне физической схемы БД или RLS (Row Level Security).
- **Audit Trace**: Каждое поле `governance_ref` ссылается на криптографическое доказательство голосования.
- **Forensic Reconstruction**: Любой независимый аудитор может воспроизвести состояние системы, имея Genesis Hash и цепочку CBOR-снапшотов.

# 11. Enforcement Strategy
| Entity | Validation Point | Failure Action |
| :--- | :--- | :--- |
| **Snapshot** | P2P Ingest | DISCONNECT_NODE |
| **Season State** | Governance Service | LOCK_TRANSITION |
| **Rating** | Deterministic Engine | HASH_MISMATCH_HALT |
| **Economic** | Settlement Controller| BLOCK_PAYMENT |
