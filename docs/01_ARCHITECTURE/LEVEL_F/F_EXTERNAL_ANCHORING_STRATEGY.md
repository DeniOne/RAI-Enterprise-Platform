---
id: DOC-ARH-LVLF-ANC
type: Core Architecture
layer: Level F
status: Enforced
owners: [@techlead]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: СТРАТЕГИЯ ВНЕШНЕГО ЯКОРЕНИЯ (EXTERNAL ANCHORING)

Отсутствие якорения (Anchoring) во внешний, публично верифицируемый источник превращает Систему Институционального Оракула (Level F) в простую частную базу данных. Для гарантии неизменяемости задним числом (preventing retroactive modifications), система публикует криптографические доказательства наружу.

## 1. Модель Якорения (Anchoring Model)

Система **НЕ ХРАНИТ** данные ферментации (GPS, суммы денег, имена) в публичных реестрах. Модель якорения базируется исключительно на *Доказательствах Состояния* (State Proofs).

### 1.1 Публикуемый Payload (Anchor Data)
- **Merkle Root**: Только хэш корня ежедневного дерева выпущенных сертификатов ($H_{root}$).
- **Timestamp**: Временная метка генерации $H_{root}$.
- **Signature**: Ed25519 подпись Institutional Gateway, подтверждающая, что это валидный $H_{root}$.

---

## 2. Публичный Блокчейн (Public Blockchain Anchor)

Основной якорь — публичная сеть с высокой экономической стоимостью переписывания истории (L1).

### 2.1 Выбор L1 / L2 сетей (Multi-chain Approach)
Для обеспечения надежности и снижения транзакционных издержек, публикация (Anchoring transaction) производится параллельно в две сети:
1. **Primary**: Ethereum L2 (Optimism / Arbitrum) — низкая стоимость транзакции, быстрая окончательность.
2. **Secondary (Fallback)**: Bitcoin (например, через `OP_RETURN`) или Ethereum L1 — выполняется реже (например, раз в неделю) для абсолютной криптографической гарантии.

### 2.2 Интеллектуальный Контракт (The Anchor Contract)
На Primary сети развертывается Solidity смарт-контракт:
```solidity
contract RaiOracleAnchor {
    event AnchorPublished(uint256 indexed batchId, bytes32 merkleRoot, uint256 timestamp);
    
    address public trustedSigner; // Cloud HSM address
    
    function publishAnchor(uint256 batchId, bytes32 merkleRoot, bytes calldata signature) external {
        // Проверка подписи Ed25519 (или ECDSA secp256k1)
        require(verify(merkleRoot, signature, trustedSigner), "Invalid Oracle Signature");
        emit AnchorPublished(batchId, merkleRoot, block.timestamp);
    }
}
```

---

## 3. Резервный Якорь (RFC 3161 Time-Stamping Authorities)

Блокчейн-сети подвержены собственным рискам (реорганизация цепи, простой RPC, санкционные ограничения). Как дополнительный слой к Public Blockchain, Level F использует институциональные Time-Stamping сервисы (TSA).

### 3.1 Архитектура TSA
- Система генерирует хэш $H_{root}$.
- Отправляет его к нескольким независимым TSA (например, Apple, DigiCert, GlobalSign) по протоколу RFC 3161.
- TSA возвращает токен, подписанный своим TLS-сертификатом, подтверждающий, что TSA наблюдал $H_{root}$ в момент времени $T_{tsa}$.
- Токены сохраняются в S3 WORM как неоспоримые доказательства в суде.

---

## 4. Инварианты Якорения (Anchoring Constraints)

> **A1 (Anchor Timeout):** Если система Level F произвела сертификаты, но не смогла опубликовать `Anchor` (в Blockchain **ИЛИ** TSA) в течение 24 часов (Anchor Timeout), выпуск новых сертификатов переходит в `SAFE_HALT`.

> **A2 (State Verification):** Любая страховая компания (Потребитель сертификата) может получить сертификат, рассчитать его хэш, и по пути Merkle Tree проверить вхождение этого хэша в $H_{root}$, опубликованный в блокчейне.
