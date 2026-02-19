---
id: DOC-ENG-LVLF-001
type: Architecture Specification
layer: Engineering (Data Ingestion)
status: Enforced
version: 2.0.0
owners: [@techlead, @data_architect]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: АРХИТЕКТУРА ИНСТИТУЦИОНАЛЬНОГО СНАПШОТТЕРА (F_SNAPSHOTTER_ARCH)

## 0. Аксиома Неизменяемости (Immutability Axiom)
`F_SNAPSHOTTER` — это криптографический "Морозильник". Он конвертирует динамический стейт реляционной базы Level E в статичный, детерминированный, хешированный JSON-документ (`TrustSnapshot`). Мутации данных после прохождения Snapshotter'а физически невозможны.

---

## 1. Архитектура Сериализации (Canonical Serialization)
Для предотвращения атак типа "Different Hash for Same Data" (ошибки порядка ключей в JSON), применяется строгая каноникализация перед хешированием.

### 1.1 Canonical JSON (RFC 8785)
Все собираемые данные Level E подвергаются строгой нормализации:
- Ключи объекта сортируются лексикографически.
- Удаляются все пробелы и переносы (Minification).
- Числа с плавающей точкой форматируются строго по IEEE-754 без экспоненциальной нотации для значений $< 1e21$.
- Date/Time приводится к ISO 8601 в UTC `YYYY-MM-DDThh:mm:ss.sssZ`.

### 1.2 Пайплайн Хеширования
$Payload_{raw} \rightarrow CanonicalJSON(Payload) \rightarrow SHA256 \rightarrow Snapshot\_ID$

---

## 2. Структура Merkle DAG (Криптографическая История)
Снимки не хранятся разрозненно. Каждый снимок фермы ссылается на предыдущий, формируя неизменяемую цепочку (Directed Acyclic Graph).

### 2.1 State Linkage (Связывание Стейта)
Каждый новый пакет данных обязан включать:
- `previous_snapshot_id`: Хеш предыдущего снимка (или `GENESIS_HASH` для первой записи).
- `merkle_root_level_e`: Корневой хеш состояния базы Level E на момент выгрузки.

### 2.2 Защита от Затирания Истории (Split-View Mitigation)
Если злоумышленник удаляет снимок $N$ из базы, снимок $N+1$ перестает проходить криптографическую проверку (Broken Link), мгновенно сигнализируя об атаке $S1$ Integrity Breach.

---

## 3. Интеграция WORM Storage (Data Physics)

Сгенерированные снимки покидают пределы изменяемых баз данных (PostgreSQL) для юридической защиты (Legal Defensibility).

### 3.1 Облачный Архив (Amazon S3 / GCP Cloud Storage)
- **Object Lock:** Бакеты настроены в режиме `Compliance Mode` с Retention Period $= 10$ Years.
- **Права доступа:** Роль `snapshot_worker` имеет права `s3:PutObject`, но у нее физически отозваны права `s3:DeleteObject` и `s3:OverwriteObject`. Перезаписать отправленный снимок невозможно даже Администратору базы.

### 3.2 Layer 1 Anchor Broadcast
Пул хешей новых снимков (Merkle Tree Root) каждые $24$ часа отправляется в смарт-контракт публичного блокчейна (Ethereum/Polygon) в качестве независимого доказательства существования данных на конкретную дату (Proof-of-Existence).

---

## 4. Граничные Условия и Ошибки (Fault Tolerance)

| Состояние Level E | Реакция F_SNAPSHOTTER | Алертинг |
| :--- | :--- | :--- |
| Отсутствует `SRI` или `P05` метрика | Амортизация (Drop). Снимок не генерируется. | `WARN: INCOMPLETE_DATASET` |
| База Level E не отвечает ($> 5s$) | Circuit Breaker Open. Остановка cron-джобы. | `CRITICAL: UPSTREAM_TIMEOUT` |
| Запись в L1 Blockchain отклонена | Fallback на L2 Consortium Ledger. | `HIGH: PRIMARY_ANCHOR_FAILURE` |
