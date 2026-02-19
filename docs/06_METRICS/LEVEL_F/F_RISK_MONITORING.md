---
id: DOC-MTR-LVLF-002
type: Metrics Specification
layer: Metrics (Observation)
status: Enforced
version: 2.0.0
owners: [@techlead, @ciso, @chief_quant]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ПРОТОКОЛ МОНИТОРИНГА РИСКОВ (F_RISK_MONITORING)

## 0. Аксиома Изоляции Риска (Risk Isolation Protocol)
Level F **не может** изменять поведение фермы или управлять аграрным риском (это задача Level E). Мониторинг Level F — это радар (Sentinel), сфокусированный на отслеживании **системных сбоев**, **манипуляций (Gaming)** и **макро-климатических лебедей (Black Swans)**.

Любой сработавший KRI (Key Risk Indicator) имеет детерминированный алгоритм эскалации (Circuit Breaker).

---

## 1. Системные и Математические Аномалии (Data Poisoning)

### 1.1 Инфляционный Дрейф (Z-Score Drift Indicator)
- **Вектор Атаки:** Массовое программное завышение SRI на уровне датчиков (Level C/D/E).
- **Метрика (KRI):** Вычисление Медианного Абсолютного Отклонения (MAD) для градиента рейтингов по региону $\Delta FRS$.
- **Триггер:** Средний $\Delta FRS$ когорты превышает $Z-score > 3.0$ относительно исторического бейзлайна за тот же сезон.
- **Reaction SLA:** Мгновенный (`< 5s`) флаг `ANOMALY_DETECTED` в объекте `RiskProfile`. Страховщик видит предупреждение о пониженной доверительной вероятности.

### 1.2 Ограничитель Консенсуса (Split-View Oracle Mismatch)
- **Вектор Атаки:** Один из $N$ оракулов Level E скомпрометирован и шлет идеальные подписи, но фейковые данные (Byzantine Fault).
- **Метрика (KRI):** Дельта между заявленным значением урожайности (IoT) и спутниковым оптическим/радарным (NDVI/SAR) прокси-значением.
- **Триггер:** Расхождение $\ge 15\%$.
- **Reaction SLA:** Итеративное отключение недостоверного узла из расчета $FRS$. Пометка снимка как `BYZANTINE_FAULT_REJECT`.

---

## 2. Макро-Актуарные Риски (Systemic Correlation)

### 2.1 Концентрация P05 Кластеров (Contagion Effect)
- **Угроза:** Засуха или наводнение в одном макрорегионе вызывает коррелированный скачок `P05_Risk > 0.05` сразу у $30\%$ сертифицированных ферм. Страховщику грозит каскадный дефолт.
- **Метрика (KRI):** Пространственная автокорреляция Индекса Морана (Moran's I) для показателя P05.
- **Триггер:** Moran's I пересекает порог статистической значимости (p-value $< 0.01$).
- **Reaction:** Асинхронно публикуется `Macro-Shock Alert` по Webhook/Kafka для систем аллокации банков. Расчеты API не останавливаются, но `Confidence_Interval` снимка расширяется инверсно пропорционально корелляции.

---

## 3. Криптографические Угрозы (Infrastructure Breaches)

### 3.1 Истощение Лимитов (API DDoS Extortion)
- **Угроза:** Брутфорс или парсинг (Scraping) базы данных с целью деанонимизации ферм.
- **Метрика (KRI):** Доля HTTP `429 Too Many Requests` в трафике конкретного Tenant ID.
- **Триггер:** Скорость отказов `429` превышает $500$ событий в минуту.
- **Reaction SLA:** WAF (Web Application Firewall) применяет IP/JWT Banning на $24$ часа и поднимает алерт SecOps.

### 3.2 Anchor Desynchronization (Утеря Блокчейн-Якоря)
- **Угроза:** Сервис не может записать Merkle Root в Layer 1 из-за газовой войны (Gas Spike) или падения RPC-узла.
- **Метрика (KRI):** Время последней успешной транзакции $T_{last\_anchor}$.
- **Триггер:** Часы $\Delta T \ge 24.5$ часов.
- **Reaction SLA:** Мгновенный Fallback на запись в Secondary Consortium Ledger + Оповещение Audit-комитета уровня $S2$.

---

## 4. Матрица Эскалации (S-Levels)

| Уровень (Sev) | Условие Триггера | Ответ системы (Auto) | Требуемое Вмешательство |
| :--- | :--- | :--- | :--- |
| **S3 (Warn)** | Единичные $Z > 3$ отклонения. Таймауты API ($P99 > 300ms$). | Троттлинг источника, Retry-логика. | SRE On-call investigation. |
| **S2 (High)** | L1 Censorship. $Moran's I$ correlation shock. | Fallback на L2 Anchor. Расширение Confidence Interval в API. | Уведомление Governance Council (Email/Slack). |
| **S1 (Crit)** | Утечка Master Key. Compromise of $5+ / 7$ Governance nodes. Разрушение Merkle Tree. | Аппаратный `SAFE_HALT` Firewall Drop для всего Level F. | M-of-N Disaster Recovery сбор (Физическое присутствие). |
