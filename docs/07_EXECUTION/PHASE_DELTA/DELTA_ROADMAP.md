---
id: DOC-EXE-PHD-001
type: Execution Plan
layer: Phase Delta (Integration)
status: Enforced
version: 2.0.0
owners: [@techlead, @program_manager]
last_updated: 2026-02-20
---

# УРОВЕНЬ F: ФОРМАЛЬНАЯ ДОРОЖНАЯ КАРТА ВНЕДРЕНИЯ (DELTA_ROADMAP)

## 0. Область Применения (Scope)
Документ задает жесткий (Hard-Gated) вектор запуска Level F (Institutional API). Переход между фазами не привязан к календарным датам (Agile-fallacy), а строго детерминирован срабатыванием математических и архитектурных метрик (Exit Criteria).

---

## 1. Фаза Delta-1: Forensic Foundation (Теневой Запуск)
**Цель:** Развертывание криптографического ядра и механизма якорения без внешнего L7 трафика (Air-gapped Network).

### 1.1 Scope of Work
- Деплой микросервисов `F_SNAPSHOTTER` и `F_RATING_ENGINE` в Private Subnet.
- Инициализация WORM S3 Bucket (Compliance Mode) для логов.
- Холостой прогон пайплайна исторических данных (Backfill) за $24$ месяца.

### 1.2 Hard Exit Criteria (Ворота перехода в Delta-2)
- [ ] Ошибка расхождения хэшей (Hash Mismatch Rate) при пересчете истории за 24 месяца $= 0.00\%$.
- [ ] Регистрация $< 1$ сбоя Anchor L1 Broadcast за $7$ дней непрерывного Shadow-наблюдения.
- [ ] Z-Score детектор откалиброван (MAD baseline) на $100,000+$ исторических срезах с генерацией $\le 0.1\%$ False Positives.

---

## 2. Фаза Delta-2: Integration Vanguard (Dark Launch)
**Цель:** Активация `F_INSURANCE_API` для закрытого пула из 1-2 Tier-1 Страховых партнеров (Sandbox Environment).

### 2.1 Scope of Work
- Настройка mTLS и выдача OAuth2 (Client Credentials) профилей партнерам.
- Запуск M-of-N Governance Vault (HSM) для ротации Worker-ключей.
- Имитация инъекции византийских данных (Byzantine Injection) для проверки стрессоустойчивости.

### 2.2 Hard Exit Criteria (Ворота перехода в Delta-3)
- [ ] CISO-Аудит пройден: Отсутствие уязвимостей High/Critical (CVSS $\ge 7.0$) при внешнем Pen-test'е.
- [ ] Партнер X подтвердил способность расшифровать Ed25519 подписи и сматчить Merkle Proofs.
- [ ] SLA API Gateway удерживается ($\ge 99.99\%$ Uptime, P95 Latency $\le 150$ms) при нагрузке $1000$ RPS в течение $72$ часов.

---

## 3. Фаза Delta-3: Institutional Mainnet (Production)
**Цель:** Открытие API для всех сертифицированных финансовых B2B институтов. Автоматическая (Unattended) эмиссия Сертификатов.

### 3.1 Scope of Work
- Снятие IP-White-listing (Переход на глобальный WAF + Rate Limit).
- Передача ключей в Production Governance (5-of-7 Shards).
- Активация Public Root Hash Explorer (Для аудиторов).

### 3.2 Hard Exit Criteria (Ворота перехода в Delta-4)
- [ ] Документальное M-of-N подписание `Genesis Block` (Протокол DELTA_GOVERNANCE_APPROVAL).
- [ ] Выдача $\ge 100$ реальных финансовых премий/кредитов партнерами на основе сигналов Level F без технических сбоев (Zero-Defect).
- [ ] Полноценное прохождение 1 (одного) учебного судебного диспута (Fire Drill) через протокол LEVEL_F_DISPUTE_PROTOCOL за $\le 10$ минут (Deterministic Replay).

---

## 4. Фаза Delta-4: Regulated Ecosystem (Масштабирование)
**Цель:** Расширение модели на производные активы (Токенизация, Карбоновые Офсеты, Деривативы).

### 4.1 Scope of Work
- Запуск Secondary Consortium Ledger для High-Frequency якорения ($\le 1$ hour).
- Внедрение Parametric Insurance Hooks (Прямые смарт-контракты с выплатой по триггеру `P05_risk < 0.05`).
- Интеграция с Европейскими RegTech реестрами (ESG Reporting).

### 4.2 Hard Exit Criteria (Метрики Успеха)
- [ ] Инциденты типа `Split-View` или `Replay Attack` в Prod $= 0$.
- [ ] Brier Score системы предсказания (Level B/F) превосходит рыночные актуарные baseline-модели на $\ge 15\%$.

---

## 5. Абсолютные Ингибиторы (Critical Path Dependencies)

Переход по Дорожной Карте блокируется автоматически (Stop-Ship), если:
1. **Level E Stability Indicator:** Level E не удерживает Invariant `I34` без ручных Override'ов в течение $30$ дней.
2. **Key Ceremony Delay:** M-of-N кворум не может собраться физически для генерации Root CA.
3. **Legal Red-Flag:** Отсутствие официального юридического заключения о том, что `RiskProfile` соответствует GDPR/CCPA по критерию Data Minimization.
