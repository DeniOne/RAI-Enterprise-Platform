---
id: DOC-ENG-LVLF-003
type: Architecture Specification
layer: Engineering (Certification)
status: Enforced
version: 2.0.0
owners: [@techlead, @ciso]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: АРХИТЕКТУРА ДВИЖКА СЕРТИФИКАЦИИ (F_CERT_ENGINE_ARCH)

## 0. Аксиома Подписи (Cryptographic Axiom)
Сервис `F_CERT_ENGINE` — это единственный узел в кластере RAI, имеющий физический доступ (Session Key) к интерфейсу подписания Сертификатов. Алгоритм не "назначает" статус, он выносит криптографически доказуемый вердикт `Pass/Fail` на основе конечного автомата.

---

## 1. Концепция Цифрового Сертификата (Tokenomics)

Сертификат (Регенеративный статус) платформы — это стандартизированный JWT (JSON Web Token), расширенный для M2M-аудита.

### 1.1 Структура Сертификата
- **Header:** `{"alg": "EdDSA", "typ": "JWT", "kid": "RAI-LVL-F-KEY-2025-A"}`
- **Payload Claims:**
  - `iss`: "RAI Enterprise Platform (Level F)"
  - `sub`: `farm_id` (или обезличенный `cohort_id` для T2 Privacy)
  - `jti`: Уникальный `certificate_id`
  - `exp`: Истекает строго через $365$ дней (TTL).
  - `rai:tier`: "PLATINUM" | "GOLD" | "SILVER"
  - `rai:snapshot`: Хэш `TrustSnapshot`, на базе которого выдан сертификат.

### 1.2 Алгоритм Подписи
- Используется строго **Ed25519** (EdDSA) благодаря его устойчивости к Side-Channel атакам и детерминированности подписей (в отличие от ECDSA, который требует надежного генератора случайных чисел для k-nonce).

---

## 2. HSM Integration & Key Lifecycle (Интеграция с ключами)

Приватные ключи (Root/Intermediate) **НИКОГДА** не загружаются в память сервера или Docker-контейнера.

### 2.1 Workflow Подписания 
1. `F_CERT_ENGINE` собирает Payload.
2. Отправляет Payload (или его хеш) через gRPC/mTLS в выделенный сервис KMS (HashiCorp Vault / AWS CloudHSM).
3. KMS выполняет аппаратную подпись внутри анклава (Enclave).
4. KMS возвращает бинарную сигнатуру `F_CERT_ENGINE`.

### 2.2 Ротация Ключей (Key Rotation)
- Ключи подписи (Intermediate Keys) автоматически ротируются каждые 90 дней (задается в `kid` заголовка JWT).
- Утечка промежуточного ключа не компрометирует исторические сертификаты (Root Key защищен оффлайн кворумом M-of-N).

---

## 3. State Machine Гейтов (Certification Gates)

Движок действует как строгий `AND` вентиль. Отказ по любому из Gate-узлов немедленно обрывает конвейер (Fail-Fast) и генерирует формальный код отказа (Обязательно для Explainability).

| Gate Name | Mathematical Constraint | Rejection Code |
| :--- | :--- | :--- |
| **G1: Contract Validation** | `ContractState == MANAGED_REGN` | `E_CERT_001_INVALID_CONTRACT` |
| **G2: Depth Threshold** | `History(N_Seasons) >= 2` | `E_CERT_002_INSUFFICIENT_HISTORY` |
| **G3: Economic Value** | `SRI_Delta >= 0` AND (Нет падения Урожая $>15\%$) | `E_CERT_003_YIELD_COMPROMISE` |
| **G4: Tail Risk Failsafe**| `P05_Risk < 0.05` | `E_CERT_004_CATASTROPHIC_RISK` |
| **G5: Rule of Law** | `Active_Level_E_Violations == 0` | `E_CERT_005_GOVERNANCE_BREACH` |

---

## 4. Архитектура Отзыва (Revocation Flow - CRL)

Если фермер нарушает контракт *после* выпуска сертификата (напр., вспахал no-till поле), Сертификат должен быть убит до истечения `exp`.

1. **Trigger:** `governance_log` Level E фиксирует `S1` Deviation.
2. **Revocation Add:** `certificate_id` вносится в базу `RevokedCertificates` (Bloom Filter + Redis Set).
3. **Webhook Ping:** `F_CERT_ENGINE` рассылает подписанные Webhook-уведомления подписанным страховым компаниям: `{"action": "REVOKE", "jti": "...", "reason": "S1_BREACH"}`.
4. **API Gateway Intercept:** Любой `GET` запрос к `F_INSURANCE_API` с отозванным сертификатом мгновенно отдаст `401 Revoked`.
