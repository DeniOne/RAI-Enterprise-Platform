---
id: DOC-ARH-LVLF-002
type: Specification
layer: Architecture
status: Proposed
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ФОРМАЛЬНАЯ СПЕЦИФИКАЦИЯ МОДЕЛИ ДОВЕРИЯ (LEVEL_F_TRUST_MODEL)

## 0. Статус Документа
Данный документ является **Формальной Спецификацией (Specification v2.1.0)** протокола доверия Level F. Документ имеет статус **Bank-Grade Hardening** и предназначен для внешнего аудита, интеграции с финансовыми организациями (банки, страховые компании) и регуляторами. 
Все положения документа строго детерминированы. Архитектура не предполагает врождённого доверия ни к одному из участников системы (Zero Trust Model).

---

## 1. Формальные Определения (Formal Definitions)

Все сущности протокола доверия строго типизированы и сериализуются в формате YAML/JSON.

### 1.1 TrustSnapshot
Атомарный, неизменяемый слепок состояния доверия, привязанный к конкретному моменту времени.

```yaml
TrustSnapshot:
  type: object
  properties:
    schema_version: { type: string, pattern: "^[0-9]+\\.[0-9]+\\.[0-9]+$" }
    snapshot_id: { type: string, format: uuid }
    epoch_id: { type: string, format: uuid, description: "Reference to the active Epoch" }
    prev_hash: { type: string, format: hex, description: "SHA-256 of the previous TrustSnapshot within the epoch" }
    root_hash_level_e: { type: string, format: hex, description: "Merkle root of Level E state" }
    deterministic_execution_hash: { type: string, format: hex, description: "Hash of the execution environment and models" }
    frs_value: { type: number, format: float, description: "Farm Rating Score" }
    rcs_value: { type: number, format: float, description: "Risk Calibration Score" }
    timestamp: { type: string, format: date-time, description: "ISO 8601 UTC timestamp" }
    signer_key_id: { type: string, description: "Fingerprint of the signing key" }
    signature: { type: string, format: hex, description: "Ed25519 signature of Canonical(TrustSnapshot)" }
  required: [schema_version, snapshot_id, epoch_id, prev_hash, root_hash_level_e, deterministic_execution_hash, frs_value, rcs_value, timestamp, signer_key_id, signature]
```

### 1.2 Epoch (Explicit Epoch Model)
Непрерывный, криптографически связанный период работы системы доверия в рамках заранее определённого корня доверия (RootOfTrust). Введение `Epoch` предотвращает атаки типа Fork (Fork attack mitigation).
- **Множественные эпохи:** Параллельные (живые) эпохи СТРОГО ЗАПРЕЩЕНЫ. В любой момент времени в системе может быть активна только одна Epoch.
- **External Verifier:** Аудитор определяет текущую валидную `Epoch` через официальный реестр корней доверия (RootOfTrust Registry).

```yaml
Epoch:
  type: object
  properties:
    epoch_id: { type: string, format: uuid }
    start_snapshot_id: { type: string, format: uuid, description: "The genesis snapshot_id of this epoch" }
    root_of_trust: { $ref: "#/components/schemas/RootOfTrust" }
    status: { type: string, enum: [ACTIVE, CLOSED, COMPROMISED] }
  required: [epoch_id, start_snapshot_id, root_of_trust, status]
```

### 1.3 CertificationEvent
Событие выдачи, отзыва или приостановки сертификата.

```yaml
CertificationEvent:
  type: object
  properties:
    event_id: { type: string, format: uuid }
    event_type: { type: string, enum: [ISSUE, REVOKE, SUSPEND] }
    snapshot_id: { type: string, format: uuid, description: "Reference to the base TrustSnapshot" }
    reason_code: { type: string }
    timestamp: { type: string, format: date-time }
    signature: { type: string, format: hex }
```

### 1.4 RootOfTrust
Базовый криптографический якорь, относительно которого валидируются все цепочки внутри `Epoch`.

```yaml
RootOfTrust:
  type: object
  properties:
    root_public_key: { type: string, format: hex, description: "Ed25519 Public Key" }
    creation_timestamp: { type: string, format: date-time }
    revocation_list_url: { type: string, format: uri }
```

### 1.5 Attestation
Криптографическое утверждение о факте или метрике.

```yaml
Attestation:
  type: object
  properties:
    attestation_id: { type: string, format: uuid }
    subject: { type: string, description: "Entity ID" }
    predicate: { type: string, description: "Metric or Fact ID" }
    value: { type: any }
    valid_until: { type: string, format: date-time }
    signature: { type: string, format: hex }
```

### 1.6 SnapshotChain
Связанный список `TrustSnapshot`, образующий неизменяемую историю внутри конкретной `Epoch`.

```yaml
SnapshotChain:
  type: array
  items:
    $ref: "#/components/schemas/TrustSnapshot"
  description: "Must form a valid hash chain where chain[i].prev_hash == SHA256(Canonical(chain[i-1]))"
```

### 1.7 AuditPackage
Полный самодостаточный пакет для оффлайн-верификации.

```yaml
AuditPackage:
  type: object
  properties:
    epoch: { $ref: "#/components/schemas/Epoch" }
    chain: { $ref: "#/components/schemas/SnapshotChain" }
    attestations: { type: array, items: { $ref: "#/components/schemas/Attestation" } }
    signatures: { type: array }
```

### 1.8 RiskProfileExport
Анонимизированный или авторизованный срез рисков для страховых или банков.

```yaml
RiskProfileExport:
  type: object
  properties:
    farm_id_hashed: { type: string, format: hex }
    epoch_id: { type: string, format: uuid }
    rcs_history: { type: array, items: { type: number } }
    anomaly_events: { type: integer }
    export_timestamp: { type: string, format: date-time }
    insurance_attestation: { $ref: "#/components/schemas/Attestation" }
```

---

## 2. Определение Протокола TrustSnapshot (TrustSnapshot Protocol Definition)

Все снимки доверия обязаны формироваться по строгим криптографическим правилам.

1. **Версионирование (Versioning):** Указывается в явном виде (`schema_version`, формат SemVer). Изменение мажорной версии требует создания новой `Epoch` и нового `RootOfTrust`.
2. **Canonical Serialization Format & Signature Scope (Формальное определение):**
   Для предотвращения атак типа *Signature Ambiguity* вводится строгая функция канонизации.
   ```text
   Canonical(TrustSnapshot) =
     CanonicalSerialize(
       TrustSnapshot WITHOUT signature field
     )
   ```
   *Пояснение:* Поле `signature` ИСКЛЮЧАЕТСЯ из объекта перед сериализацией. Поле `signer_key_id` ОБЯЗАТЕЛЬНО ВКЛЮЧАЕТСЯ. Подписывается ровно тот payload (payload envelope), который возвращает `Canonical()`.
   Сериализация выполняется в формат **Canonical CBOR** (RFC 7049, Section 3.9) или **Canonical JSON** (RFC 8785) для обеспечения побитовой идентности.
3. **Deterministic Ordering Rule:** Все поля в сериализованном формате MUST быть отсортированы по алфавиту ключей (lexicographical order) перед сериализацией.
4. **Hashing Algorithm:** Для всех операций хеширования используется исключительно алгоритм **SHA-256 (OID 2.16.840.1.101.3.4.2.1)**.
5. **Signature Scheme:** Для подписей используется асимметричная криптосистема **Ed25519 (RFC 8032)**. Использование RSA или классического ECDSA запрещено.
6. **Timestamp Anchoring Policy:** Временные метки (`timestamp`) MUST генерироваться в формате ISO 8601 (UTC, микросекундная точность). Источником точного времени (Clock synchronization source) MUST служить стратумные серверы по протоколу **RFC 5905 NTPv4**. Если разница времени между Level E и Level F превышает 500мс, снимок отклоняется (Time-drift constraint).
7. **Transport Security Boundaries:** Любые сетевые взаимодействия (передача снимков, запросы к API) MUST осуществляться через защищенный канал с обязательным применением **TLS 1.3** (или выше).

---

## 3. Криптографическая Модель (Cryptographic Model)

### 3.1 Архитектура Управления Ключами (Key Management Architecture)

Управление ключами строится по иерархическому принципу:

1. **Root Key (Cold Storage HSM):**
   - **Роль:** Выпуск сертификатов (intermediate CA) для подчиненных узлов операционной среды внутри одной `Epoch`.
   - **Хранение:** HSM FIPS 140-2 Level 3 (или Level 4).

2. **Level E Signing Key (Warm Storage):**
   - **Роль:** Подписание агрегированных фактов о выполнении смарт-контрактов.
   - **Ротация:** Автоматическая ротация каждые 90 дней.

3. **Level F Attestation Key (Hot Storage):**
   - **Роль:** Подписание операционных `TrustSnapshot` и исходящих `Attestation`.
   - **Ротация:** Ротация каждые 24 часа через корпоративный Vault.

### 3.2 Защита от Key Substitution (Certificate Validation Procedure)

Любая проверка подписи MUST сопровождаться проверкой всей цепочки сертификатов в рамках активной `Epoch`. Строка `signer_key_id` не принимается на веру без математического доказательства принадлежности.

**Certificate Validation Procedure:**
1. Для ключа `signer_key_id` запрашивается цифровой сертификат (`C_F`), подписанный ключом Level E (`Key_E`).
2. Для ключа `Key_E` запрашивается сертификат (`C_E`), подписанный корневым ключом активной `Epoch` (`Root_Key`).
3. Проверяется отсутствие каждого из ключей в списке отозванных (CRL).
4. Проверяется срок действия (validity bounds) на момент операции.
5. Проверяется вся цепочка подписей от `signer_key_id` до `Epoch.root_of_trust`.

**Формальное требование:**
```text
ASSERT signer_key_id ∈ ValidCertificateChain(Epoch.root_of_trust)
```
*Только после успешного прохождения этого `ASSERT` разрешается выполнение `Ed25519_Verify`.*

### 3.3 Процедуры отзыва и восстановления (Compromise Recovery Flow)
См. раздел 5 `Formal State Machine` для описания полного процесса восстановления. Ключ, оказавшийся в CRL, переводит состояние `Epoch` в `COMPROMISED`.

---

## 4. Гарантия Детерминированного Исполнения (Deterministic Execution Guarantee)

Доверие базируется на математической доказуемости. Система ОБЯЗАНА гарантировать, что любой внешний наблюдатель получит идентичный результат при повторном вычислении.

1. **Reproducibility Requirement:**
   `Recompute(TrustSnapshot(t-1), Inputs(t)) == TrustSnapshot(t)` MUST produce identical output bit-by-bit. Никаких допусков или округлений алгоритмах.

2. **Фиксированный Seed и Энтропия:** Любые стохастические вычисления (симуляции рисков в Level B) обязаны использовать строго детерминированный PRNG с фиксированным Seed. **Minimum entropy requirement для базового seed составляет 256 бит**.

3. **Версионирование Моделей:** Все AI-модели версионируются через криптографические чексуммы весов. Любая используемая модель жёстко зафиксирована в спецификации `deterministic_execution_hash`.

4. **Lock модели Level B:** Во время транзакционного расчётного окна любые обновления весов строго блокируются (Write-Lock).

5. **Запрет Nondeterministic Operations:** Использование параллельных потоков с гонками данных, обращений к внешним недетерминированным факторам (например, `Math.random()`, вызовы системного времени внутри ядра) СТРОГО ЗАПРЕЩЕНО. 

6. **Hash of execution environment:** Хеш среды окружения (`deterministic_execution_hash`) рассчитывается как SHA-256 хеш от самого контейнера среды исполнения (Container Hash / Docker OCI digest), конфигурационных файлов и исходного кода ядра.

---

## 5. Формальная Конечная Автоматная Модель (Formal State Machine)

Основа гарантий Level F — прозрачное управление состояниями. Система не может "мягко деградировать". Вводится строгий конечный автомат (State Machine).

### 5.1 States (Состояния)

- **`ACTIVE`** — Штатный режим работы, генерация `TrustSnapshot`, валидация данных, интеграция активна.
- **`SAFE_HALT`** — Режим экстренной остановки. Добавление данных или генерация новых аттестатов СТРОГО ЗАПРЕЩАЕТСЯ. Система доступна в Read-Only режиме.
- **`COMPROMISED`** — Зафиксирован факт компрометации корневых ключей или обнаружено изменение исторической цепи (Fork). Epoch считается разорванной.
- **`RECOVERY`** — Переходный режим. Система восстанавливает консистентность по WORM-журналу или перестраивает SnapshotChain.
- **`ARCHIVED`** — Остановленный экземпляр `Epoch` (Terminal State). Используется только для исторического чтения.

### 5.2 Allowed Transitions & Triggers (Разрешённые переходы)

| Transition | Описание | Инициатор (Trigger) |
| :--- | :--- | :--- |
| **`ACTIVE` → `SAFE_HALT`** | Защитная блокировка операций | Автоматически ядром Level F при: нарушении Инвариантов, дрифте времени NTP (Clock sync skew), обрыве связи с Anchor реестром. |
| **`SAFE_HALT` → `RECOVERY`** | Начало устранения причин остановки | **Только вручную** (Governance Council + Security Lead) после подписания инцидент-репорта. Система не выходит из SAFE_HALT сама. |
| **`RECOVERY` → `ACTIVE`** | Возврат в штатный режим | Автоматически (Bootstrapping Engine) после валидации целостности цепи без ошибок. |
| **`ACTIVE` → `COMPROMISED`** | Остановка при обнаружении криптографической или архитектурной атаки | Governance Council или Security Monitoring (при попадании ключа из `ValidCertificateChain` в CRL). |
| **`COMPROMISED` → `ARCHIVED`** | Закрытие Эпохи | Governance Council (ручной Transition). Дальнейшая эксплуатация требует запуска новой `Epoch`. |

Любые иные переходы (например, `COMPROMISED` → `ACTIVE`) на уровне архитектуры ЗАПРЕЩЕНЫ. Состояние `ARCHIVED` является конечным.

---

## 6. Матрица Угроз (Threat Model Matrix)

| Threat | Actor | Attack Vector | Impact | Mitigation | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sensor spoofing** | Farm Admin / Hacker | Подмена IoT-данных об осадках/влажности | Завышение рейтинга FRS | Кросс-валидация через Level B; Физический аудит; Аномальный скоринг | Низкий. Возможны микро-отклонения. |
| **DB tampering** | Insider (DBA) | Прямое изменение записей в PostgreSQL / Ledger | Изменение исторического FRS/RCS | Разрыв хеш-цепи (`prev_hash` не совпадёт); Внешний якорь (Ledger Anchoring) | Нулевой (атака обнаруживается мгновенно). |
| **Key compromise** | External Attacker | Кража Level F Attestation Key | Подделка снимков доверия | Ротация каждые 24ч; Хранение ключей в Vault/HSM; Root-revocation. Перевод Epoch в `COMPROMISED` | Средний (риск ограничен 24 часами). |
| **Replay attack** | Malicious Node / Insider | Повторная отправка пакета со старыми хорошими данными | Двойной учет; Избегание штрафов | Строгий монотонный season-index; Одноразовые Nonce-идентификаторы; Защита от дублей | Нулевой. |
| **Fork attack** | System Operator | Разделение цепи снимков на две параллельные ветки | Двойные траты; Несогласованность при аудите | Введение `Epoch` модели. Публикация Merkle Root во внешний WORM-реестр | Низкий. |
| **Key Substitution** | Insider / MTM Attacker | Подмена `signer_key_id` на ключи злоумышленника | Формирование "легитимных" снимков из чужого источника | Обязательный `ASSERT signer_key_id ∈ ValidCertificateChain(RootOfTrust)` в протоколе проверки | Нулевой. |
| **Signature Ambiguity** | Attacker | Изменение порядка полей или переподпись мусора | Подделка верификации | Канонизация `Canonical(TrustSnapshot)` без поля подписи | Нулевой. |
| **Insider collusion** | Agro + System Dev | Сговор агронома и разработчика для изменения весов | Искусственный буст рейтинга фермы | Строгий процесс Governance; Подпись весов; Аудит `deterministic_execution_hash` | Средний. |
| **Partial chain deletion** | Insider | Удаление компрометирующих блоков из истории | Скрытие фактов нарушения | Audit Log Integrity (Append-only hash chain). Зеркалирование во внешние леджеры стандарта WORM (SEC 17a-4(f)) | Нулевой. |

---

## 7. Протокол Внешней Верификации (External Verification Protocol)

Внешний аудитор (например, процессинговый центр банка или регулятор) выполняет следующий формальный алгоритм для проверки состояния. Если на любом шаге `ASSERT` возвращает ошибку, аудит ПРОИГРАН (FAILED), доверие аннулируется.

**Algorithm: `ExternalVerify(AuditPackage P, ReferenceEngine Engine)`**

1.  **Load epoch and root:** Загрузить `P.epoch`. Убедиться, что `P.epoch.status` равен `ACTIVE` (или `CLOSED` для исторического аудита), но НЕ `COMPROMISED`. Проверить `P.epoch.root_of_trust`.
2.  **Verify Root of Trust:** Сличить `P.epoch.root_of_trust.root_public_key` с публичным ключом регулятора/лицензиара, полученным по независимому доверенному каналу (OOB).
3.  **Check CRL:** Запросить независимый список отзыва ключей по `revocation_list_url`.
4.  **Verify Key Substitution:**
    Для каждого снимка `S` в `P.chain`:
    `ASSERT S.signer_key_id ∈ ValidCertificateChain(P.epoch.root_of_trust)`
5.  **Verify hash continuity:**
    Для `i` от `1` до `P.chain.length - 1`:
    `ASSERT P.chain[i].prev_hash == SHA256(Canonical(P.chain[i-1]))`
6.  **Verify signatures:**
    Для каждого снимка `S` в `P.chain`:
    `ASSERT Ed25519_Verify(S.signature, S.signer_key_id, Canonical(S))`
7.  **Recompute deterministic model:**
    Запустить песочницу эталонной реализации (`ReferenceEngine`), предварительно верифицировав её хеш `deterministic_execution_hash`. Подать оригинальные агрегированные входы в систему Level E.
8.  **Compare outputs:**
    Сравнить расчёты `ReferenceEngine` с предоставленными данными в последнем снимке (`P.chain[last]`):
    `ASSERT Engine.ComputeFRS() == P.chain[last].frs_value`
    `ASSERT Engine.ComputeRCS() == P.chain[last].rcs_value`
9.  **Validate invariants:**
    Выполнить прогон формальных инвариантов системы (`I1...I34`) поверх реконструированного состояния.

---

## 8. Модель Anchoring и Audit Log (Ledger Anchoring Model)

Для предотвращения атак `Fork` и `Partial Deletion`, внутренняя цепочка хешей периодически фиксируется во внешних независимых и неизменяемых средах.

1. **Audit Log Integrity Policy:** Все события изменения состояния записываются в системный журнал в режиме **Append-Only** с формированием математически неразрывной хеш-цепи (hash-chain). Никакие записи не подлежат `UPDATE`/`DELETE`.
2. **Что публикуется:** Корень дерева Меркла (Merkle Root) от пакета `TrustSnapshot` и всех `CertificationEvent` за интервал времени.
3. **Частота Anchoring:** Каждые 24 часа. Допускается Real-time в L2 сетях.
4. **WORM compliance (SEC 17a-4(f)):**
   - Индустриальные блокчейн-сети (например, сети банков-партнёров).
   - Институциональные облачные WORM хранилища со статусом Legal Hold (AWS S3 Object Lock, Azure Blob Storage Immutable Storage).

---

## 9. Роли и Управление (Governance & Roles)

Контроль доступа следует модели строгой изоляции (Separation of Duties) и минимальных привилегий (Least Privilege). Обход ролевой модели запрещён.

| Роль (Role) | Permission Boundaries (Scope) | Разрешённые операции |
| :--- | :--- | :--- |
| **TrustEngine (Service)** | Level F Context | CREATE (TrustSnapshot, Attestation) <br> READ (Level E Root Hashes) |
| **Governance Council** | Root Settings, Model Weights | UPDATE (Weights, Root Key Revocation), Исполнение `State Machine Transitions` |
| **Platform Auditor** | System Wide | READ (AuditPackage, Logs, Settings) |
| **External Verifier** | Delegated Scope | READ (RiskProfileExport, Attestations, Epochs) |

---

## 10. Формализованная Экономическая Модель Доверия (Economic Trust Model)

Оценка системного Доверия (TrustScore, $\tau$, где $0 \le \tau \le 1$) рассчитывается на уровне ядра Level F как **Исключительно Информационная Аналитическая Метрика (Informational Metric)**. Вычисление $\tau$ передаёт степень математической надёжности системы (качества доказательства фактов). 

$$ \tau = \frac{T \times (1 - \sigma_{drift})}{R_{sys}}$$

**Входные переменные:**
- **Transparency ($T \in [0, 1]$):** Доля успешно прошедших внутренней верификации `TrustSnapshot` к объёму запрашиваемых. (Normal state $T = 1.0$).
- **Consistency ($1 - \sigma_{drift}$):** Детерминированная консистентность. $\sigma_{drift}$ — зафиксированная погрешность вычислений между узлами.
- **Systemic Risk ($R_{sys} \in [1, \infty)$):** Инфраструктурный риск. Штрафной коэффициент за зафиксированные отклонения среды. (Normal state = 1.0).

### 10.1 Разделение Экономической и Интеграционной логики (Governance Policy Shift)
- **Изоляция:** Ядро Level F (Core Spec) не содержит жёстко закодированных финансовых порогов принятия решений (например, $\tau = 0.999$, при котором отключается интеграция).
- **Справочный статус:** $\tau$ передаётся во внешние системы (банки/страховые) в составе пакета RiskProfileExport «как есть».
- **Governance Policy:** Финансовые решения (Decision Automation) и пороги блокировок API/отказа в кредитном рейтинге формируются исключительно на стороне **Integration Layer / API Gateway** в соответствии с Соглашением Руководящего Совета (Governance Policy) и конкретными SLA с интегрированным банком. Регуляторная отчетность формируется поверх этих вынесенных политик, а не ядра.
