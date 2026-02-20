---
id: DOC-ARH-LVLF-SNP
type: Core Architecture
layer: Level F
status: Enforced
owners: [@techlead]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ИНВАРИАНТЫ СНИМКА (SNAPSHOT INVARIANTS)

Данный документ формализует процесс снятия `Read-Only` снимков состояния из Level E, которые будут служить криптографическим сырьем (raw input) для `Rating Engine` Level F.

## 1. Детерминированные границы снимка (Deterministic Snapshot Boundary)

Для того чтобы сертификат (Level F) мог быть математически воспроизведен, необходимо точно зафиксировать, *какие именно* данные входят в `Snapshot`.

### 1.1 Состав Snapshot Payload
Любой snapshot `S` в момент времени `T` должен включать:
1. **Raw Source**: Массив Tuple из PostgreSQL Level E (TechMaps, Plan Executions, Yield Forecasts, R3 Risk Metrics) для конкретного `companyId`.
2. **Schema Definition**: Версия схемы БД (например, `schema_v4.2`), использовавшаяся при извлечении.
3. **Temporal Bounds**: Точный диапазон дат операций (`startDate` и `endDate`).
4. **Lineage Hash**: Хэш всех моделей Machine Learning (Forecast Models), использовавшихся для генерации предиктивной части данных.

> **Инвариант S1 (Boundary Check):** Snapshot $S_{n}$ считается недействительным, если он не содержит хэш схемы БД или хэш моделей прогнозирования.

---

## 2. Защита от атаки повторного воспроизведения (Replay Protection)

Для обеспечения институционального доверия система Level F должна предотвращать попытки злоумышленника (или сбойного процесса) переопубликовать старый, выгодный snapshot $S_{n-k}$ под видом нового $S_n$.

### 2.1 Иерархический Merkle DAG
Все снимки связываются в направленный ациклический граф (DAG) наподобие блокчейна.

- $H(S_n) = SHA256(CanonicalJson(S_n \ || \ H(S_{n-1})))$
- Инвариант **S2 (DAG Continuity)**: Запрос на обработку снимка $S_n$ моментально отвергается с кодом `409 Conflict`, если его `previous_hash` не совпадает с $H(S_{n-1})$, лежащим в Head of Chain базы Level F.

### 2.2 Монотонно возрастающие индексы
Каждый `Snapshot` обязан включать поле (Nonce), которое монотонно возрастает (например, `NTP timestamp` в микросекундах или глобальный `sequence_id`). Если `nonce(S_n) <= nonce(S_{n-1})`, снимок бракуется.

---

## 3. Временная Согласованность (Temporal Consistency Guard)

Level F не доверяет системному времени серверов Level E в абсолютной форме. Возможны атаки на NTP.

### 3.1 Skew Validation
- Snapshot извлекается с `Time(E)` (время сервера базы Level E).
- Контроллер приема снимка (Snapshot Controller) проверяет его по `Time(F)` (доверенное время сертификационного движка).
- Разница $|Time(F) - Time(E)| \le \Delta_{max}$ (например, $300$ секунд / $5$ минут).

> **Инвариант S3 (Time Skew Tolerance):** Если дельта $\Delta$ превышает $\Delta_{max}$, кластер переходит в `SAFE_HALT`, так как это свидетельство мощной рассинхронизации или MITM/Spoofing-атаки.

---

## 4. Версионирование Схемы БД (Schema Versioning)

При обновлении системы Level E (добавление новых полей в `Execution`, удаление старых) старые сертификаты Level F *не должны ломаться*.

### 4.1 Frozen Types
Rating Engine (Level F) получает вместе со снимком `Schema Definition` (документ или хэш схемы). Level F Rating Engine содержит встроенные Adapter'ы под каждую выпущенную версию схемы.

### 4.2 Изменение правил оценки (Calculation Logic)
Если Rating Engine обновляется, он меняет свою `EngineVersion` (например, v1.0 $\rightarrow$ v2.0).
Сертификат явно маркируется `RatingEngineVersion: vX.Y`. Старые сертификаты перерасчету **не подлежат**. Их rebuild возможен только через запуск старой версии Rating Engine Container/WASM.
