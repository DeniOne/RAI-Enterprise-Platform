---
id: DOC-ARH-LVLF-011
type: Test Specification
layer: Architecture
status: Enforced
version: 1.0.0
owners: [@techlead, @qa_lead, @ciso]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНСТИТУЦИОНАЛЬНАЯ ТЕСТОВАЯ СПЕЦИФИКАЦИЯ (LEVEL_F_FORMAL_TEST_SPEC)

## 0. Манифест Верификации
Level F — это криптографический оракул и точка входа для B2B финансов. Обычных Unit-тестов недостаточно. Данная спецификация описывает **Hardcore Verification Matrix**, предназначенную для симуляции катастрофических сбоев, византийских атак, временных десинхронизаций и компрометаций Root-ключей.

Код, не проходящий `100%` данных тестов в CI/CD (Nightly Stress Build), **не может** быть развернут в Production.

---

## 1. Byzantine & FSM Consistency Tests
(Защита от лжи смежных систем)

### 1.1 Byzantine Sensor Quorum ($f \ge n/3$)
- **Симуляция:** Подделка входов от Level E. 2 из 5 (т.е. $\ge 33\%$) оракулов для фермы Х передают завышенную урожайность с идеальными крипто-подписями.
- **Ожидаемый результат (Assert):** Механизм кросс-верификации обнаруживает отклонение $>15\%$ со спутником (NDVI). Снимок получает `BYZANTINE_FAULT_REJECT`. Система замораживает профиль.
- **Strict Constraint:** Время реакции $< 200$ мс.

### 1.2 Deterministic Snapshot Replay (Dispute Triage)
- **Симуляция:** Загрузка исторического `snapshot_id` и `payload` в Air-Gapped контейнер с точным `model_hash`.
- **Ожидаемый результат:** Сгенерированный JSON (RiskProfile + Explainability) совпадает с историческим бит-в-бит (hash-match).
- **Strict Constraint:** Расхождение даже на $10^{-8}$ в float $\rightarrow$ `TEST_FAILED`.

---

## 2. Cryptographic Hardcore Scenarios
(Пытки Security Модели)

### 2.1 M-of-N Governance Bypass Attempt
- **Симуляция:** Попытка выпуска нового Intermediate CA сертификата с подписями только от $4$ из $7$ хранителей (Shard Holders).
- **Ожидаемый результат:** HSM Governance Vault аппаратно отклоняет транзакцию (`INSUFFICIENT_QUORUM`).

### 2.2 Replay Attack via JWT & Nonce
- **Симуляция:** Перехват легитимного M2M JWT-токена с действительным сроком жизни ($<15$ мин). Злоумышленник посылает дубликат пакета с тем же `jti` (JWT ID) ИЛИ тем же `nonce`.
- **Ожидаемый результат:** Redis JTI-кэш находит совпадение. API мгновенно ( $< 10$ мс) отбрасывает пакет с `401 Token already used` и `SLA Breach Alert`.

### 2.3 Clock Skew & Time Desynchronization
- **Симуляция:** Искусственный сдвиг системного времени Worker-узла на $+305$ секунд.
- **Ожидаемый результат:** Запрос `POST /api/v1/financial-signal` отбивается API-Шлюзом с флагом `Timestamp Tolerance Exceeded (>300s)`.

### 2.4 Cryptographic Agility Sunset
- **Симуляция:** Подача легитимного пакета, подписанного алгоритмом, который переведен в статус `Sunset` $91$ день назад (policy = 90d).
- **Ожидаемый результат:** `400 Bad Request: Deprecated Signature Scheme`.

---

## 3. Anchor & Immutability Warfare
(Тесты на устойчивость к цензуре Layer 1)

### 3.1 Primary L1 Censorship
- **Симуляция:** Блокировка RPC-узлов (Infura/Alchemy) или искусственная перегрузка Ethereum Mainnet (Gas spike). `Merkle Root` не публикуется в течение $24.5$ часов.
- **Ожидаемый результат:** Node Watcher фиксирует `L1_CENSORSHIP_ALARM`. API `/proof` автоматически переключается (Fallback) на обслуживание через Secondary Anchor (Consortium Ledger).

### 3.2 Split-view History Falsification
- **Симуляция:** Инъекция (Monkey-patching) в БД для изменения уже заякоренного RiskProfile. Вызов метода `GET /proof`.
- **Ожидаемый результат:** Функция `MerkleInclusionProof` падает на лету, так как пересчитанный корневой хеш оспоренного дерева Меркла не совпадает с публичным якорем. Выбрасывается `S1 CRITICAL_BREACH`.

---

## 4. Reverse Proxy & Volumetric Defense
(Защита от аппаратного истощения)

### 4.1 Payload Memory Exhaustion (Zip Bomb)
- **Симуляция:** Отправка JSON payload объемом $256.1$ KB (лимит $256$ KB) через `POST /financial-signal`.
- **Ожидаемый результат:** NGINX / Envoy отбрасывает пакет на L4/L7 до парсинга JSON (защита от CPU spike). Отбивка `413 Payload Too Large`.

### 4.2 Rate-Limit DDoS
- **Симуляция:** Фокусная отправка $1005$ запросов за 1 минуту от одного `tenant_id` (RBAC Rate limit $1000/min$).
- **Ожидаемый результат:** С $1001$-го запроса WAF возвращает `429 Too Many Requests` с корректными заголовками `X-RateLimit-Reset`.

### 4.3 Malformed Error Schema
- **Симуляция:** Вызов принудительного Exception внутри ядра движка F.
- **Ожидаемый результат:** Платформа **НЕ ПРОКИДЫВАЕТ** Stack Trace наружу. Возвращается строго RFC 7807 формат: `{"type": "urn:rai:error:internal", "status": 500, "detail": "Internal constraints execution failed", "instance": "/audit/trace/uuid-...", "correlation_id": "..."}`.

---

## 5. Dispute Economics Test
(Защита от спама аудиторов)

### 5.1 Dispute Triage Escrow Burn
- **Симуляция:** Участник вызывает `CreateDispute` (Tier-2) без достаточного депозита (Stake/Escrow Vault balance).
- **Ожидаемый результат:** Отказ смарт-контракта/реестра `INSUFFICIENT_STAKE`.

### 5.2 Deterministic Slasher
- **Симуляция:** Спорящий проигрывает Tier-1 Dispute (Deterministic Replay подтвердил правоту платформы).
- **Ожидаемый результат:** Stake заявителя сжигается (или блокируется) мгновенно, без задержек. Лог помечается как `REJECTED_FALSE_CLAIM`.

---

## 6. Итоговые Критерии Прохождения
1. **Mutation Coverage:** $\ge 95\%$ (Код должен падать при мутации бизнес-констант).
2. **Deterministic Assertions:** Все JSON-ответы тестируются на строгий `eq` (Без `~=`).
3. **Execution P99:** Весь набор крипто-тестов запускается $\le 5$ минут в Pipeline (Параллелизация).
