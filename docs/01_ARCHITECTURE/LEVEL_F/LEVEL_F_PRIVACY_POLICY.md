---
id: DOC-ARH-LVLF-012
type: Specification
layer: Architecture
status: Enforced
version: 2.0.0
owners: [@techlead, @dpo]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНСТИТУЦИОНАЛЬНАЯ ПОЛИТИКА ПРИВАТНОСТИ (LEVEL_F_PRIVACY_POLICY)

## 0. Область Применения (Scope & Binding)
Данный документ является **Технической Спецификацией Приватности (Formal Privacy Specification v2.0)** для Level F API. Документ транслирует юридические требования GDPR, CCPA и банковской тайны в математически проверяемые архитектурные ограничения (Privacy-by-Design and by-Default). Любое изменение API, ослабляющее эти метрики, блокируется на уровне CI/CD Pipeline.

---

## 1. Архитектура Минимизации Данных (Data Minimization Mathematics)

Level F оперирует исключительно агрегированными и деривативными метриками. Сырая телеметрия (Raw IoT) остается на Level D/E.

### 1.1 Spatial Obfuscation (Размытие Координат)
Передача точных GPS-полигонов полей внешним потребителям (Tier-1 Банки/Страховые) ЗАПРЕЩЕНА по умолчанию.
- **Ограничение:** Гео-координаты транкейтируются (округляются) до $3$ знаков после запятой в координатной сетке WGS84 (точность $\approx 110$ метров).
- **Исключение:** Передача полного полигона возможна только при наличии `Explicit Agronomic Consent Token` (TTL $\le 24$ часа) для расчета прецизионных рисков.

### 1.2 k-Anonymity для Публичных Реестров
Для защиты от деанонимизации ферм через пересечение публичных баз данных (Inference Attacks), публикация агрегированной статистики (Public Benchmark API) подчиняется правилу $k$-анонимности:
- **Strict Limitation:** $k \ge 5$. Ни один запрос, гранулирующий выборку до группы менее $5$ фермерских хозяйств в одном макро-регионе, не обслуживается (`403 Forbidden: k-anonymity violation`).
- **Differential Privacy Threshold:** Набор данных с $N < 20$ подвергается добавлению Лапласовского шума с параметром $\epsilon = 0.5$ перед отдачей аналитикам.

---

## 2. Матрица Раскрытия Рисков (Disclosure Tiering Model)

Доступ к API стратифицирован по моделям угроз:

| Tier | Потребитель | Авторизация | Доступный Пол Пейлоада (Payload View) | Justification (Обоснование) |
| :--- | :--- | :--- | :--- | :--- |
| **T1** | Публичный Сканер / Ритейлер | Без токена | Только `Certification Tier` (Gold/Silver) и хэш `snapshot_id`. | Public claims verification. |
| **T2** | Smart-Contract (On-chain) | ZKP / Oracle | Только бинарный флаг `RCS >= 75: true`. | Minimal on-chain footprint. |
| **T3** | Страховая Компания / Банк | M2M OAuth2 + Consent | `FRS`, P05 Uncertainty Matrix, Counterfactuals. | Risk Underwriting requirements. |
| **T4** | CISO / Регулятор / Big-4 | M-of-N Audit Token | Реплика Immutable WORM Log, полные графы вычислений, Raw Payload. | Forensic Validation & Legal Dispute. |

---

## 3. Криптографическая Трассируемость Согласий (Consent Architecture)

Privacy не опирается на доверие. Каждый байт, покинувший Level F в сторону банка, требует математического доказательства согласия владельца данных.

1. **Explicit Consent Token:** API Level F требует передачи токена согласия, подписанного ключом пользователя в Level E.
2. **Consent-to-Endpoint Binding:** Согласие гранулярно (Scope-bound). Токен, выданный для `/api/v1/ratings`, вызовет `403` при попытке чтения `/api/v1/financial-signal`.
3. **Revocation Propagation SLA:** При отзыве пользователем согласия на устройстве, инвалидация токена в Redis-кэше Level F Gateway обязана произойти за $\le 100$ мс. Любой M2M запрос после $t+100ms$ отбивается.
4. **Audit Trail of Access:** Факт передачи данных $D$ банку $B$ на основе токена $C$ хэшируется и пишется в Immutable Log: $H = SHA256(B \parallel D \parallel C \parallel Timestamp)$. Владелец может запросить (GDPR Right of Access) лог всех чтений своего профиля (Data Lineage trace).

---

## 4. Исполнение Права на Забвение (Right to Erasure / GDPR Art. 17)

Финансовая неизменяемость (Immutable Ledgers) принципиально конфликтует с GDPR Right to Erasure. Платформа разрешает конфликт через криптографическое уничтожение (Crypto-shredding).

- **Архитектура Хранения:** ПИИ (Персонально Идентифицируемая Информация - ФИО, точные GPS) никогда не пишутся в WORM лог или блокчейн в открытом виде.
- **Envelope Encryption:** ПИИ шифруются Data Encryption Key (DEK). DEK шифруется Key Encryption Key (KEK) в KMS.
- **Erasure Execution:** При легитимном GDPR-запросе на удаление, уничтожается сам $K_i$ (ключ DEK) в HSM. 
- **Результат:** Записи в WORM хранилище остаются неизменными (сохраняя целостность Merkle Root и аудиторские цепочки Стандарта), но ПИИ мгновенно превращаются в криптографический мусор без возможности восстановления.

---

## 5. Комплаенс-Метрики (Enforcement Rules)

| Privacy Control | Enforcement Mechanism | Violation Action | SLA / Threshold |
| :--- | :--- | :--- | :--- |
| **GPS Truncation** | L7 API Payload Serializer | Drop connection if raw float > 3 decimals | Always Active |
| **k-Anonymity** | DB Aggregation Middleware | Throw `PrivacyConstraintError` | $k \ge 5$ |
| **Consent Revocation**| Redis Eviction Pub/Sub | Disconnect existing HTTP streams | $\le 100$ ms latency |
| **Crypto-shredding** | AWS KMS / HashiCorp Vault API | Trigger S2 Alert if KMS fails | $\le 2$ hours upon request |
