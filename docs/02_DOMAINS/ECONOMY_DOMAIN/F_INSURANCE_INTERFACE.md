---
id: DOC-ARH-LVLF-005
type: Specification
layer: Architecture
status: Proposed
version: 1.1.1
owners: [@techlead]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНСТИТУЦИОНАЛЬНЫЙ СТРАХОВОЙ ИНТЕРФЕЙС (F_INSURANCE_INTERFACE)

## 0. Статус Документа
Данный документ является **Формальной Спецификацией (Production-Grade Level F v1.1.1 — Formal Closure Edition)** страхового API-интерфейса (`F_INSURANCE_API`). Спецификация полностью детерминирована, криптографически замкнута и пригодна для подписания B2B контрактов SLA с внешними страховыми и перестраховочными провайдерами. Документ разработан с учетом требований аудита класса "Big-4", Security Audit и External Actuarial Review. Любые неформализованные отклонения от данного RFC СТРОГО ЗАПРЕЩАЮТСЯ.

---

## 1. Контракт Данных (JSON Schema Definition)

Основным артефактом обмена является объект `RiskProfile`. Схема требует абсолютной строгой типизации и не допускает транзита неспецифицированных данных. Все Decimal-значения сериализуются как `string` для защиты от потерь точности IEEE-754 парсеров.
Minor version upgrades MUST not introduce breaking changes to canonical serialization.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://level-f.rai.io/schemas/risk-profile/v1.1.1.json",
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "interface_version": { 
      "type": "string", 
      "enum": ["v1.1.1"],
      "description": "Strict API contract version"
    },
    "schema_version": {
      "type": "string",
      "enum": ["1.1.1"]
    },
    "farm_id": { 
      "type": "string", 
      "format": "uuid",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
      "description": "UUID v4 opaque identifier"
    },
    "snapshot_id": { 
      "type": "string", 
      "format": "uuid",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
      "description": "UUID v4 of the underlying TrustSnapshot"
    },
    "generated_at": { 
      "type": "string", 
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$",
      "description": "ISO 8601 UTC timestamp of generation. MUST end in 'Z' (No offsets)."
    },
    "ttl_expires_at": {
      "type": "string", 
      "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$",
      "description": "ISO 8601 UTC timestamp. MUST end in 'Z'."
    },
    "p05_risk": {
      "type": "string",
      "pattern": "^0\\.\\d{1,8}$|^1\\.0{1,8}$",
      "description": "Probability of >5% Yield Collapse. Serialized Decimal(18,8)."
    },
    "yield_volatility": {
      "type": "string",
      "pattern": "^\\d+\\.\\d{1,8}$",
      "description": "Standard Deviation over trailing 5 seasons. Serialized Decimal(18,8)."
    },
    "governance_score": {
      "type": "string",
      "pattern": "^0\\.\\d{1,8}$|^1\\.0{1,8}$",
      "description": "Inverted Rate of Manual Interventions. Serialized Decimal(18,8)."
    },
    "sri_trend_slope": {
      "type": "string",
      "pattern": "^-?\\d+\\.\\d{1,8}$",
      "description": "Regenerative Improvement Rate (OLS b-coefficient). Serialized Decimal(18,8)."
    },
    "audit_proof": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "signer_pubkey": { "type": "string", "pattern": "^[0-9a-f]{64}$", "description": "Ed25519 Public Key (Hex)" },
        "hash": { "type": "string", "pattern": "^[0-9a-f]{64}$", "description": "SHA-256 of Canonical JSON" },
        "signature": { "type": "string", "pattern": "^[0-9a-f]{128}$", "description": "PureEdDSA Signature (Hex)" }
      },
      "required": ["signer_pubkey", "hash", "signature"]
    }
  },
  "required": [
    "interface_version", 
    "schema_version", 
    "farm_id", 
    "snapshot_id", 
    "generated_at", 
    "ttl_expires_at", 
    "p05_risk", 
    "audit_proof"
  ]
}
```
*(Архитектурное примечание: Поля локации, региона и типа культуры (`crop_type`) здесь отсутствуют намеренно. Связывание `farm_id` с климатической зоной или договором страхования происходит вне зоны покрытия Level F на этапе offchain-подписания KYC).*

---

## 2. Формализация Аудиторского Доказательства (Audit Proof Protocol)

Малейшее изменение полезной нагрузки делает объект недействительным. 

### 2.1 Криптографические Примитивы
- **Хеширование:** SHA-256 (FIPS 180-4).
- **Подпись:** Ed25519 (PureEdDSA) согласно RFC 8032. Использование CSPRNG требуется **ТОЛЬКО** для генерации самого private key (Root Key HSM). 
- **Deterministic Nonce:** Генерация `nonce` для подписи MUST быть детерминированной, как описано в RFC 8032 (nonce выводится из seed'а приватного ключа и хэшируемого сообщения). Использование системного ГПСЧ при выполнении операции `sign` СТРОГО ЗАПРЕЩАЕТСЯ во избежание риска повтора k-значения.

### 2.2 Протокол Сериализации (Canonical Serialization)
Хеш вычисляется от строки, полученной путем Canonical JSON сериализации (RFC 8785) объекта `RiskProfile` **БЕЗ** ключа `"audit_proof"`. Implementation MUST use a compliant RFC 8785 canonicalization library; custom implementations MUST pass conformance test suite.
```python
# Pseudo-code rule
canonical_string = canonicalize(remove_key(risk_profile_json, "audit_proof"))
payload_hash = SHA256(canonical_string)
signature = Ed25519_Sign(private_key, payload_hash) # Deterministic
```

### 2.3 Verify-Flow (Для Страховщика)
Внешний провайдер ОБЯЗАН выполнить детерминированную проверку:
1. Удалить ключ `"audit_proof"` из входящего JSON.
2. Выполнить строгую RFC 8785 сериализацию.
3. Вычислить SHA-256 хеш от строки.
4. Сравнить вычисленный хеш с `"audit_proof.hash"`. Если несовпадение $\rightarrow$ `REJECT`.
5. Запросить актуальный список отозванных ключей (CRL) от Root of Trust по `signer_pubkey`. Если отозван $\rightarrow$ `REJECT`.
6. Выполнить проверку подписи `Ed25519_Verify(signer_pubkey, signature, hash)`. Если `False` $\rightarrow$ `REJECT`.
7. Проверить `T_now <= ttl_expires_at`. Если `False` $\rightarrow$ `REJECT`.

### 2.4 TTL и Защита от Replay
Окно валидности ограничено 1 календарным годом ($\Delta T = \text{ttl\_expires\_at} - \text{generated\_at}$). Настоящая защита от перехваченных сессий (Replay Attack Request) обеспечивается на сетевом уровне `nonce` (в случае POST-верификаций/Webhook) или через ETag при GET. Многократное использование легитимного "непросроченного" профиля (Reuse) разрешено.

---

## 3. RFC Спецификация API Контракта (API Contract)

API предоставляет идемпотентные stateless эндпоинты по стандарту REST.

### 3.1 Endpoint: Получение Профиля Риска
- **Method:** `GET`
- **Path:** `/api/v1/insurance/{farmId}/risk-profile`
- **Security:** TLS 1.2+ REQUIRED. HSTS MUST be enabled. mTLS is OPTIONAL for B2B integrations.
- **Authentication:** OAuth 2.0 (Client Credentials Grant). `Bearer Token` c обязательным scope `insurance:read`.
- **Query Parameters:** Нет.
- **Idempotency:** Полностью идемпотентно. При неизменном состоянии `RiskProfile` возвращается `304 Not Modified` (если клиент предоставил совпавший ETag), экономя трафик и исключая повторную валидацию подписи.
- **Rate Limiting:** Управляется заголовками `X-RateLimit-Limit` (1000/min), `X-RateLimit-Remaining`.
- **Caching:** Поддерживается `ETag` (основанный на `audit_proof.hash`). Обязательный заголовок `Cache-Control: private, max-age=3600`.

**Success Responses:** 
- `200 OK` (Content-Type: `application/json`) $\rightarrow$ Возвращает `RiskProfile`.
- `304 Not Modified` $\rightarrow$ Пустое тело ответа; клиент использует закешированную подписанную версию.

**Error Codes:**
- `401 Unauthorized` — Отсутствует, просрочен токен или неверная подпись JWT.
- `403 Forbidden` — Токен валиден, но scope `insurance:read` отсутствует, либо профиль фермы отозван (`REVOKED`).
- `404 Not Found` — `farmId` не существует.
- `410 Gone` — Сертификат истек (`EXPIRED`), профиль более не актуален (Expired Snapshot).
- `422 Unprocessable Entity` — Ошибка валидации формата.
- `429 Too Many Requests` — Превышен лимит Rate Limit.
- `503 Service Unavailable` — Level F Engine недоступен (Engine unavailable).

---

## 4. Строгие Инварианты (Formal Invariants)

1. **Единственный Источник Истины:** Поле `p05_risk` MUST рассчитываться ИСКЛЮЧИТЕЛЬНО формальными моделми Level B/E. Запрещено локальное пересчитывание, ручное вмешательство или мокирование значения `p05_risk` на уровне API.
2. **Snapshot Immutability:** Базовый агрегат (TrustSnapshot), на который ссылается профиль, неизменяем.
3. **Deterministic Regeneration:** Аудитор `Big-4` MUST иметь возможность, имея на руках `TrustSnapshot`, самостоятельно прогнать генератор и получить **точно тот же хеш**. Ввиду детерминированности алгоритма подписи `Ed25519` (RFC 8032), при использовании одного и того же `private key` и `message`, итоговая **подпись MUST быть побитово идентичной**. Никакого variance не допускается.
4. **Абсолютный запрет на сырые данные:** API Level F NEVER экспортирует time-series данные с датчиков, спутниковые снимки или точные геолокации.

---

## 5. Математическая Актуарная Логика (Actuarial Formula Refinement)

Страховым партнерам предоставляется референсная базовая формула ценообразования.

$$
Premium = \max\left(0, \quad BaseRate \cdot (1 + \alpha \cdot P05_{risk} - \beta \cdot \text{Clamp}_{0}^{B_{max}}(SRI_{trend})) \right)
$$

### 5.1 Домены и Определения
- **Premium:** Премия, взимаемая страховщиком. Обязательный clamp $\ge 0$ гарантирует отсутствие отрицательной цены.
- **BaseRate:** Базовый тариф страховщика для региона.
- **$\alpha \in [1, \infty)$:** Рисковый мультипликатор. Определяет вес $P05$ в наценке.
- **$\beta \in [0, 1)$:** Дисконтный множитель за регенерацию.
- **$P05_{risk} \in [0, 1]$:** Экспортируемое значение хвостового риска.

---

## 6. Приватность и Минимизация Данных (Privacy & Data Minimization)

Протокол спроектирован с учетом требований **GDPR (Data Minimization Principle)**.

- **Data Classification Level:** `Strictly Confidential (B2B Financial)`.
- **Запрет Экспорта Raw Telemetry:** Спецификация Level F жестко запрещает отдавать сырую телеметрию. API оперирует только производными характеристиками.
- **Pseudonymization Method:** `farm_id` является `UUIDv4` и выступает как непрозрачный псевдонимизированный ключ (Opaque Identifier). 
- **Irreversibly Dissociated Validation:** Все данные в выдаче `RiskProfile` являются необратимо диссоциированными (irreversibly dissociated from an identifiable subject within the Level F boundary). Связывание с субъектом происходит на стороне Страховщика через внешний KYC-процесс.

---

## 7. Комплаенс, Требования к Сервису и Модель Угроз

### 7.1 Service Level Agreement (SLA Specification)
Контракт API для страховых провайдеров (B2B):
- **Availability:** $\ge 99.95\%$ (Uptime/Year).
- **RTO (Recovery Time Objective):** $< 15$ минут.
- **RPO (Recovery Point Objective):** $\approx 0$ (Чтение с Read Replicas WORM-хранилища).
- **Maintenance Windows:** Строго за пределами торговых часов ($02:00 - 04:00 \text{ UTC}$ каждую первую субботу месяца).

### 7.2 Threat Model (Модель Угроз)

| Угроза (Threat) | Смягчение (Mitigation & Protection) |
| :--- | :--- |
| **Data Tampering (MITM)** | Исключено архитектурой. `audit_proof` (Ed25519) делает изменение математически обнаруживаемым на стороне страховщика. |
| **Replay Attacks** | Установлен жесткий `ttl_expires_at` (MUST be UTC 'Z'). Старые идеальные слепки отклоняются. Время включено в `audit_proof.hash`. |
| **Unauthorized Scraping** | Ограничение `Rate Limit`, строгая привязка OAuth2 к Scope (`insurance:read`). Отсутствие List эндпоинтов (только GET). |
| **Downgrade Attack** | **Version negotiation is explicitly forbidden**. Формат `schema_version` и `interface_version` зафиксированы в JSON-схеме `enum: ["1.1.1"]` и подписываются. API обслуживает только текущую MAJOR версию. Вызов `/v1/` с подсунутым JSON `/v0/` обрушит валидацию RFC 8785. |
| **Model Poisoning** | Вектор обратной оценки от страховщиков **запрещен**. API Level F строго Read-Only. |

### 7.3 Log Retention Policy
Логи доступа хранятся в неизменяемом хранилище (Append-Only Ledger / AWS S3 Object Lock) минимум 7 лет (Compliance SEC Rule 17a-4(f)). Идентификация в логах: `OAuth client_id`, IP-адрес, Timestamp, и выданный `audit_proof.hash` (без самого JSON).
