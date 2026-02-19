---
id: DOC-ENG-LVLF-004
type: Architecture Specification
layer: Engineering (External Gateway)
status: Enforced
version: 2.0.0
owners: [@techlead, @secops_lead]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: АРХИТЕКТУРА API ИНСТИТУЦИОНАЛЬНОГО ШЛЮЗА (F_INSURANCE_API_ARCH)

## 0. Аксиома Изоляции (Boundary Axiom)
`F_INSURANCE_API` — это единственное физическое окно (Port 443 TCP), через которое внешние корпоративные сети (Банки, Big-4, Страховщики) могут читать данные RAI. Сервис действует в паттерне **Zero-Trust Reverse Proxy**. Движок не верит клиентам, и клиенты не верят движку (каждый ответ криптографически подписан).

---

## 1. Транспортная Безопасность (Network & Transport Security)

### 1.1 Протоколы Шифрования
- **Обязательно:** `TLS 1.3+`. Режим `Perfect Forward Secrecy (PFS)` включен жестко. `TLS 1.2` и ниже возвращают `Handshake Failed`.
- **mTLS (Mutual TLS):** Для интеграций Tier-2/Tier-3 (Страховые брокеры) используется двустороннее шифрование. Клиент обязан предоставить валидный клиентский сертификат x.509, подписанный Private CA платформы RAI.

### 1.2 Защита от Replay-Атак (Replay Protection)
Каждый `POST/PUT` запрос (напр., вызов симуляции Counterfactuals) обязан быть идемпотентным и защищенным.
- **Idempotency Key:** Заголовок `Idempotency-Key: <UUID>`. Ключ кешируется в Redis на $24$ часа. Дубль ключа мгновенно (из RAM) возвращает сохраненный ранее HTTP Response, не нагружая вычислительно ядро F (защита от CPU exhaustion).
- **JWT Nonce Caching:** Для токенов авторизации проверяется уникальность комбинации `(jti, signature)` со сроком życia $<15$ минут.

---

## 2. Алгоритм Ограничения Потока (Choke-Point Throttling)

API подвержено риску скрапинга и DDoS. Throttling реализован на уровне NGINX / Envoy (L4/L7), до попадания трафика в Node.js микросервис.

### 2.1 Глобальные Лимиты (Token Bucket Algorithm)
- **Tenant Limit (По API Key / mTLS CN):** Максимум $1000$ запросов в минуту (Capacity $= 1000$, Refill $= 16/sec$).
- **IP Limit (Defense in Depth):** $10000$ запросов в минуту с одной подсети /24 (блокировка Botnets).
- При превышении отдается `429 Too Many Requests` с RFC-заголовками `Retry-After: <seconds>`.

### 2.2 Защита от Истощения Памяти (Payload/URI Limits)
- Max Request Body Size: `256 KB`. Отбрасывается на Load Balancer (защита от JSON Zip Bombs).
- Max URI Length: `2048` символов. Защита от переполнения буфера в логгерах.

---

## 3. Архитектура Ответов и Ошибок (RFC-7807 Error Schema)

Институциональные системы не умеют парсить "кастомные" ошибки.

### 3.1 Фиксированная Схема Ошибок
Любое падение или валидационный отказ возвращается строго по стандарту **RFC 7807 (Problem Details for HTTP APIs)**:
```json
{
  "type": "urn:rai:error:auth:token_expired",
  "title": "JWT Signature Expired",
  "status": 401,
  "detail": "The provided token 'exp' claim is in the past.",
  "instance": "/audit/trace/uuid-8f19-4b2a",
  "correlation_id": "req-991283-abc"
}
```
*Stack traces (Java/Node.js exceptions) подавляются всегда.* Утечка стека = P1 Инцидент безопасности.

### 3.2 Формат Финансовых Значений
Все дробные числа в Payload (FRS, P05, суммы USD) типизируются как `string`, чтобы обойти проблему округления IEEE-754 Float64 в сторонних языках (напр., проблему парсинга `0.1 + 0.2` в Python).

---

## 4. Контракт Свежести Данных (SLA on Freshness)

Внешние системы должны знать, насколько старые данные они читают.
- В HTTP Headers ответа всегда присутствуют:
  - `Last-Modified: <UTC Timestamp>` (Дата генерации Snapshot'а).
  - `ETag: <SHA256 of JSON Payload>` (Для Cache-Control `If-None-Match`).
- **Data Freshness SLA:** Данные в API не могут отставать от физического коммита Postgres Level E более чем на $5.0$ секунд.
