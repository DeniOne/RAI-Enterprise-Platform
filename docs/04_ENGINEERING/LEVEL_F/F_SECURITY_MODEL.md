---
id: DOC-ARH-LVLF-009
type: Specification
layer: Architecture
status: Proposed
version: 2.1.0
owners: [@techlead, @ciso]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНСТИТУЦИОНАЛЬНАЯ МОДЕЛЬ БЕЗОПАСНОСТИ (F_SECURITY_MODEL)

## 0. Scope & Trust Boundaries (Границы Доверия)

Данный документ декларирует формальную Модель Безопасности (Security Model v2.1) инфраструктуры Level F. Спецификация предназначена для регуляторов, аудиторов Big-4 и CISO банковских структур.

### 0.1 Определение Границ (Scope Definition)
**Что ЗАЩИЩАЕТСЯ (In-Scope):**
- Целостность (Integrity) и неизменяемость (Immutability) всех `RiskProfile` и `TrustSnapshot`, выдаваемых потребителям.
- Криптографические ключи подписи Level F (Key Material).
- Межсервисный транспорт (M2M Transport) между Level E и Level F.
- API шлюзы, обслуживающие внешние B2B запросы.

**Что НЕ ЗАЩИЩАЕТСЯ (Out-of-Scope):**
- Физическая безопасность IoT-датчиков на ферме (делегировано Level D).
- Компрометация приватного ключа смарт-контракта конечного пользователя (фермера).

### 0.2 Модель Доверия (Explicit Trust Model)
Level F реализует парадигму **Zero-Trust (Нулевое Доверие)** к смежным системам.

**Formal Trust Assumptions Table:**
| Assumption (Допущение) | Justification (Обоснование) | What Breaks if False (Последствия) | Mitigation (Смягчение) |
| :--- | :--- | :--- | :--- |
| **Level E is Potentially Byzantine** | Сенсоры и Edge-узлы ферм могут быть скомпрометированы для подделки урожайности. | Level F может выдать незаслуженный высокий скор (False Positive). | Слой External Data Cross-Verification (S2.2), BFT Consensus Quorum. |
| **HSM hardware is trustworthy** | Доверяем сертификации среды исполнения (FIPS 140-2 Level 3). | Тотальная утечка Signing Keys (S1 Critical). | Извлечение Master Key требует физического M-of-N кворума (5-of-7). |
| **Public Ledgers are immutable** | Ethereum Mainnet / Consortium Ledger имеют $\ge51\%$ Honest Hashrate. | Split-view / переписывание истории аудита (Repudiation). | Multi-Anchor стратегия (S4.2) для исключения единой точки отказа Layer-1. |
| **Internal Ops are partially malicious** | Инсайдерская угроза (Insider Threat) неизбежна в финансовом секторе. | Извлечение GDPR-sensitive данных, подмена логов. | WORM Object Lock Logs, Область RLS, Envelope Encryption без прямого доступа DBA. |

---

## 1. Формальная Модель Угроз (Formal Threat Model - STRIDE)

Для классификации векторов атак используется методология STRIDE. 

| Threat Category | Description / Attack Vector | Impact Level | Mitigation Protocol |
| :--- | :--- | :--- | :--- |
| **S**poofing | *Key Compromise:* Утечка ключа Level F для подписи ложных `TrustSnapshot`. | **CRITICAL (S1)** | Генерация ключей в HSM. M-of-N (5-of-7) кворум. Off-grid хранение Root CA. |
| **T**ampering | *Supply Chain Compromise:* Модификация бинарных файлов CI/CD. | **CRITICAL (S1)** | Reproducible builds, SBOM, Code Signing. TEE Validation. |
| **R**epudiation | *Split-view Attack:* Выдача банку и аудитору разных версий состояния. | **HIGH (S2)** | *Anchor Censorship Mitigation:* Multi-Anchoring в публичные сети. |
| **I**nformation Disclosure | *Insider Collusion:* Сговор инсайдеров (DevOps + DBA). | **HIGH (S2)** | RLS и Envelope Encryption через KMS. DBA не имеет Audit Token'а. |
| **D**enial of Service | *Time Desynchronization:* Атака на NTP для обхода Replay Protection. | **MEDIUM (S3)** | Трехконтурный stratum-1 NTP. Пакеты с $\Delta t > 5000ms$ отбрасываются. |
| **E**levation of Privilege | *Replay Attack:* Перехват и реплей API запроса для льгот. | **HIGH (S2)** | Redis JTI caching (15m TTL). Validation of monotonic `season_index`. |

### 1.1 Residual Risk Register (Formalized)
Все остаточные риски задокументированы и формально принимаются.
- **Review Interval:** Каждые 90 дней (или при S1/S2 инциденте).
- **Risk Acceptance Policy:** Принятие риска $\ge15$ требует подписи Board of Directors. До этой отметки — CISO.

| Risk ID | Risk Category | Risk Owner | Likelihood (1-5) | Impact (1-5) | Residual Score (= L*I) | Action / Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| R-001 | HSM Core Zero-Day Exploit | CISO | 2 (Low) | 5 (Critical) | **10** (Acceptable) | Managed via Multi-vendor HSM. |
| R-002 | 5-of-7 Keyholder Simultaneous Extortion | Chief Legal | 1 (Very Low) | 5 (Critical) | **5** (Acceptable) | Separation of Jurisdictions. |
| R-003 | L1 Chain (Ethereum) 51% Attack | Head of Arch | 2 (Low) | 3 (High) | **6** (Acceptable) | Multi-Anchor Fallback to Consortium Ledger. |
| R-004 | Subtle Data Poisoning from Level E | CDO | 4 (High) | 3 (High) | **12** (Monitor) | Z-score / MAD Anomaly Detection tuning. |

---

## 2. Архитектура Верификации & Byzantine Fault Model (BFT)

### 2.1 Explicit Byzantine Fault Model
Поскольку Level E (Сенсоры, IoT, локальные узлы ферм) считается *Potentially Compromised Byzantine Component*, Level F имплементирует строгий допуск BFT (Byzantine Fault Tolerance).
- **BFT Tolerance:** $f < n/3$, где $n$ — количество кросс-верифицирующих источников оракулов для одной Фермы.
- **Quorum Logic (Oracle Disagreement):** Для утверждения `RiskProfile`, данные Level E ($Oracle_1$) кросс-верифицируются со спутниковым индексом NDVI ($Oracle_2$) и метео-историей ($Oracle_3$). Если $1$ из $3$ оракулов показывает расхождение `>15%` (Byzantine behavior), включается мажоритарное голосование.
- **Byzantine Handling:** При отсутствии кворума состояния `2/3`, снимок физически бракуется (`BYZANTINE_FAULT_REJECT`), профиль фермы замораживается до Manual Governance Audit.

### 2.2 Протокол Верификации Данных
Каждый входящий `TrustSnapshot` проходит пайплайн жесткого отсева:
1. **Deterministic Serialization:** Canonical JSON (RFC 8785) перед хешированием.
2. **Schema Enforcement:** Валидация JSON-Schema (`additionalProperties: false`).
3. **Nonce & Replay Prevention:** `nonce` и монотонный `season_index`.
4. **Timestamp Tolerance Window:** $\le 300$ секунд. `REJECT`, если $\Delta t > 300s$.

### 2.3 Anomaly Detection Model (Z-Score / MAD)
- **Baseline Construction:** Исторический Z-Score по каждому макро-региону (Zone normalization).
- **Statistical Model:** Median Absolute Deviation (MAD) для устойчивости к выбросам.
- **Drift Detection & Auto-Freeze:** Если $\Delta FRS > \mu + 3\sigma$ за 1 сезон, система автоматически ставит `INVESTIGATION_PENDING` (Auto-freeze threshold).

---

## 3. Криптографическая Архитектура & Управление Ключами

### 3.1 Иерархия Ключей
1. **Offline Root CA:** Air-Gapped хранилище. Включается 1 раз в год.
2. **Intermediate CA:** Cloud HSM.
3. **Signing Keys:** Ротируются каждые 24 часа. 
4. **Revocation Mechanism:** CRL endpoint, обновление 5 минут. Устаревшая ветка отзывается мгновенно.

### 3.2 Управление Кворумом (M-of-N)
- **Схема:** Модифицированная схема Шамира (Shamir's Secret Sharing) `5-of-7`.
- **Jurisdictional Separation:** Хранители в 3+ разных юрисдикциях.
- **Collusion Mitigation:** 2 из 7 хранителей — независимые Big-4 аудиторы.

### 3.3 Explicit Cryptographic Agility Policy
Обеспечивается способность системы плавно мигрировать на квантово-устойчивые или обновленные примитивы при теоретическом взломе алгоритма (Cryptographic break).
- **Current Stack:** Ed25519-Dilithium Hybrid (Signatures), SHA-256 (Hashing).
- **Migration & Sunset Policy:** При обнаружении критической уязвимости в примитиве (NIST alert), CISO активирует `Agility Switch`. Платформа поддерживает параллельный выпуск Dual-Signed сертификатов (Old + New) в течение 90 дней (Migration Period). Через 90 дней старый алгоритм переходит в Sunset-режим (только чтение/verify исторических данных).
- **Minimum Key Sizes (2030+ Policy):** RSA запрещен. ECC-кривые строго $\ge 256$-bit. Симметричное шифрование (AES) строго $\ge 256$-bit GCM.

---

## 4. Якорение и Неизменяемость (Anchoring)

### 4.1 Multi-Anchor Strategy
Одиночный якорь создает единую точку отказа и уязвимость для Layer-1 цензуры (Anchor Censorship Attack). Level F использует каскадную парадигму Multi-Anchoring.
- **Primary Anchor:** Public Ethereum Mainnet (`Smart Contract`). Наивысшая децентрализация. Окно публикации: каждые 24 часа.
- **Secondary Anchor:** Permissioned Bank Consortium Ledger (например, Hyperledger Fabric главных банков-партнеров). Гарантированный финалити. Окно: 4 часа.
- **Tertiary Timestamp Authority (TSA):** RFC 3161 Timestamping от 3-х независимых национальных центров сертификации (NTP-основано). Для форензики, не требующей блокчейна.
- **Anchor Censorship Detection:** Audit-watcher ноды проверяют, был ли `Merkle Root` включен в Primary Anchor в срок. При задержке $>24$ часов объявляется `L1_CENSORSHIP_ALARM`, и запросы `/proof` обслуживаются через Secondary Anchor.

---

## 5. Изоляция и Сетевое Взаимодействие (Air-Gap & Isolation)

- **Network Topology:** Изолированный VPC. Ingress-трафик только в API Gateway (Port `443/TCP`). `DENY ALL` для остальных портов.
- **Packet Validation Order:** 1) WAF DDoS Scrubbing $\rightarrow$ 2) mTLS Handshake $\rightarrow$ 3) Rate Limits & JWT Val $\rightarrow$ 4) JSON Schema Val $\rightarrow$ 5) L7 Logic. Пакет отбрасывается немедленно на шаге ошибки.
- **Time Synchronization Source:** 3 независимых stratum-1 NTP сервера (Round-robin + Median).

---

## 6. Логирование и Аудит (Forensic Audit)

- **Immutable Log Architecture:** Логи (Audit Trail) в WORM (Write-Once-Read-Many) хранилище S3 Object Lock, Compliance Mode. Удаление Root IAM запрещено.
- **Hash Chaining:** $LogHash_n = SHA256(Payload_n \parallel LogHash_{n-1})$.
- **Log Retention Policy:** Строго $7$ лет (SEC Rule 17a-4(f)).
- **Independent Audit API:** Экспорт NDJSON с `manifest.json`, подписанным платформой. Реплей событий.

---

## 7. Модель Реагирования на Инциденты (Incident Response Model)

Все аномалии классифицируются по Escalation Matrix:

| Severity | Имя Инцидента | Триггер | Реакция (Action) | SLA реакции |
| :--- | :--- | :--- | :--- | :--- |
| **S1** | **CRITICAL_BREACH** | Утечка Signing Key / HSM | Полный `SAFE_HALT` (`503`). Активация CRL; Кворум 5-of-7. Public SEC 8-K. | $\le 15$ минут |
| **S2** | **DATA_COMPROMISE** | Сбой Anchoring / Split-view | Заморозка `/proof`. Переход на Secondary Anchor. | $\le 2$ часов |
| **S3** | **SYSTEM_DEGRAD**| Отказ Оракула (Cross-Check) | Переход в Degraded Mode (`stale_data: true`). | $\le 4$ часов |
| **S4** | **ANOMALY_WARN** | Всплеск (Drift) MAD | Активация `INVESTIGATION_PENDING` локально. | $\le 24$ часов |
| **S5** | **ROUTINE_ERROR** | M2M retry-storm | Авто-отбой WAF 429 Rate Limit. | Auto |

---

## 8. Защита Цепочки Поставок (Supply Chain Security)

- **Reproducible Builds:** Компиляция MUST давать побитово идентичный хеш на разных раннерах.
- **SBOM:** SPDX/CycloneDX генерация обязательна (Commit в `main`).
- **Dependency Pinning:** Semantic Lock (`integrity` hashes).
- **Code Signing:** Binary verification через Kubernetes Admission Controller (отказ неподписанным).

---

## 9. Business Continuity & Disaster Recovery (Технологический DR Остов)

Модель обеспечения непрерывности бизнеса вне рамок кибератак:
- **RTO (Recovery Time Objective):** Максимальное время простоя API сервисов Level F: **$\le 1$ часа**. (В случае потери гео-региона).
- **RPO (Recovery Point Objective):** Максимальная потеря данных TrustSnapshot: **$0$ минут** (синхронная кросс-региональная репликация WAL БД в 3 дата-центра).
- **Geo-Redundancy Policy:** Сервисы резервируются по принципу `Active-Active` между минимум двумя Tier-3 Data Centers, разнесенными на $>500$ км (защита от локальных природных катастроф).
- **Cold Start Protocol & HSM Recovery:** В случае тотального стирания инфраструктуры (Ransomware Data Wiping), воссоздание `Level F Trust Anchor` из зашифрованных WORM бекапов и физического извлечения HSM Cloud Export Token активируется исключительно кворумом 5/7 Board-одобренных инженеров. Документирован playbook на 65 шагов.

---

## 10. Метрики и Измеримые Гарантии (Enforcement)

Платформа мониторит следующие аппаратные SLAs:

| Блок защиты | Enforcement Rule | Мониторинг | Действие при отказе | Max Tolerable Deviation |
| :--- | :--- | :--- | :--- | :--- |
| **Time Sync** | Clock $\Delta$ to NTP stratum-1 | Daemon 60s | Shutdown Worker Unit | $\le 100$ ms |
| **Anchoring** | Merkle Root to Primary Anchor | Indexer | Fallback on Secondary Anchor | $\le 2$ hours |
| **Primary L1**| Censorship Lag to Anchor | Watcher Node| Trigger `L1_CENSORSHIP_ALARM` | $\le 24$ hours |
| **Replay Shield** | Redis `jti` check latency | APM (DataDog)| Trip Circuit Breaker, drop | $\le 10$ ms |

---

## 11. Перечень Абсолютных Security Guarantees

Аудитор получает формальные гарантии:
1. **Integrity:** Ни один RiskProfile не может быть изменен после подписи (Ed25519-Dilithium).
2. **Non-Repudiation:** Хаш в Multi-Anchor сетях + WORM-логи (SEC 17a-4) означает абсолютную неотрекаемость.
3. **Split-View Resistance:** Multi-Anchor архитектура с публичным Мерклом парализует саму попытку выдать разные состояния двум участникам.
4. **Collusion Resistance:** Изменение ключей/логики требует $5$-из-$7$ (M-of-N). Одиночный CISO или Lead Dev имеют $0\%$ контроля над Root CA.
5. **Key Compromise Resilience:** Область атаки (Exposure Window) при краже worker-ключа строго лимитирована 24-часовым TTL и 15-минутным CRL Revocation `SAFE_HALT`.
6. **Byzantine Fault Tolerance:** Ложь Edge-нод фермы отлавливается математическим кворумом внешних оракулов.
7. **Audit Transparency:** Оцифрованный, полностью независимый форензика-эндпоинт для Big-4 и регуляторов.
