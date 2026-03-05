# PHASE 4 — Observability & Control Tower: Quality + %Bullshit + Ratings + Rewards (Add-on Spec)

Контекст: расширяем Phase 4 (Swarm Dashboard / Connection Map / Explainability Explorer) так, чтобы Control Tower управлял не только нагрузкой и стоимостью, но и **качеством/честностью ответов**, рейтингами и системой наград.

---

## 0) Цель расширения

Сделать Control Tower институциональным:
- видеть **SLO/SLA**, очереди, ретраи, узкие места;
- измерять **качество и честность** ответов (в т.ч. **% пиздежа** = доля неподтверждённых/ошибочных утверждений);
- иметь **рейтинги и баллы** (агенты/пользователи/тенанты) с защитой от шума;
- включить **Reward Engine** (бюджет/модель/автономность) на основе метрик качества.

Ожидаемый эффект:
- меньше галлюцинаций и “домысливаний” в проде;
- быстрый разбор инцидентов по traceId;
- управляемая эволюция агентов (L1–L4 автономность) на данных.

---

## 1) Что добавить в Phase 4 UI (Control Tower)

### 1.1 Swarm Dashboard — новые панели
1) **SLO / Error Budget**
- SLO по агентам и по тенантам (latency, error rate, availability).
- Error Budget burn-rate, алерты по перерасходу.

Эффект: видно соблюдение обещаний сервиса, а не просто графики.

2) **Queues / Backpressure**
- Размеры очередей, время ожидания, дедлайны, timeouts, отмены.
- Ретраи, причины ретраев, “где копится долг”.

Эффект: находишь реальные “заторы” и причины деградации.

3) **Cost Decomposition**
- Разложение стоимости: LLM tokens vs tool calls vs RAG/DB vs egress.
- Top-N самых дорогих трасс и агентов.

Эффект: режешь расходы точечно.

4) **Workload Hotspots**
- Top conversations / top workloads (самые долгие/дорогие traceId).
- Сегментация по сценариям/страницам/типам задач.

Эффект: видно, где система реально “горит”.

---

### 1.2 Agent Connection Map — расширение графа вызовов
- **Retry/Failure Topology**: какие ребра чаще падают/ретраятся.
- **Critical Path**: подсветка критического пути по traceId (где ушло время).

Эффект: оптимизация по факту узких мест, а не предположения.

---

### 1.3 Explainability Explorer — Forensics режим
Добавить режим **Decision Timeline** по traceId:
- Router decision → fan-out агентов → tool calls → composer → final answer
- доказательства (evidence refs), версии промтов/моделей, параметры, policyId
- “пакет” для аудита: hashes/ledger refs (если есть)

Эффект: разбор инцидентов превращается в протокол, а не в чтение логов.

---

## 2) Качество и честность: метрика “% пиздежа” (Bullshit Percent)

### 2.1 Определение метрики
Вводим **BS% (Bullshit Percent)** на каждый `traceId`:

**BS% = 100 * (Σ weight(UnverifiedClaims + InvalidClaims) / Σ weight(AllClaims))**

Где:
- **Claim** — атомарное проверяемое утверждение: факт, число, конкретная рекомендация, причинно-следственная связь.
- **Verified** — утверждение имеет опору (evidenceRef): DB row id / tool result id / doc chunk id / calculation id / trace evidence.
- **Unverified** — опоры нет (конкретика “из воздуха”, общие уверенные утверждения без данных).
- **Invalid** — противоречит контексту/данным/инвариантам (самый красный флаг).

**Weights (минимально):**
- weight=1: общие/низкорисковые
- weight=2: агрономические действия, сроки, нормы, расчёты
- weight=3: юридическое/финансовое/безопасность/серьёзный риск

Эффект: “много текста” не скрывает ложь — важные утверждения “весят” больше.

---

### 2.2 Сигналы для расчёта BS% (как собрать без ручного ада)
1) **Evidence Coverage (auto)**
- считаем, у какой доли claims есть `evidenceRef`.

2) **Contradiction/Invariant Checks (auto)**
- если ответ конфликтует с известными полями контекста/инвариантами → `InvalidClaims++`.

3) **Spot-check (human, 1–3% трейсов)**
- оператор быстро отмечает 1–3 “выдумки” → калибруем автоклассификацию.

Эффект: 97% метрик считается автоматически, человек только калибрует.

---

### 2.3 Вкладка Truthfulness / Honesty в Control Tower
Показывать:
- BS% avg / p95 по агентам
- Invalid% (противоречия) по агентам
- EvidenceCoverage% по агентам
- BS% по тенантам/сценариям (где бедный контекст, где инструменты недоступны)
- Top-20 worst traces по BS% (кликабельные → Explainability Explorer)

Эффект: видно, проблема в агенте или в данных/интеграциях.

---

### 2.4 Политики управления роем по BS%
Пороги (стартовые):
- **BS% ≤ 5%** → допускаем более автономные действия
- **5–15%** → ок, но без авто-исполнения; просим подтверждение
- **15–30%** → принудительный tool-first; обязательный evidence
- **>30%** → quarantine: только через человека + обязательный разбор

Эффект: честность становится рычагом управления автономностью.

---

## 3) Quality & Evals: регрессии и дрейф

### 3.1 Quality Panel
- Acceptance Rate / Rejection Rate
- Correction Rate (сколько раз исправляли)
- Auto-fix success rate (если применимо)
- BS% / Invalid% / EvidenceCoverage%
- Outcome-confirmed rate (где есть подтверждение результата)

Эффект: качество становится измеримой метрикой, а не субъективным ощущением.

### 3.2 Drift / Regression Alerts
- алерт при ухудшении BS% p95, acceptance, invalid%
- привязка к релизам: promptVersion/modelVersion/toolVersion

Эффект: ловишь деградации сразу после изменений.

---

## 4) Баллы, рейтинги и “награды” (Rewards)

### 4.1 Agent Points (внутренние очки агента)
Правило начисления:
- +X за accept
- +Y за accept + outcome подтверждён
- +Z за self-heal/auto-fix без ухудшения BS%
Штрафы:
- −A за BS% > порога
- −B за invalid claims
- −C за reject / human override

Эффект: агент “зарабатывает” доверие и автономность, а не получает её вручную.

---

### 4.2 Reputation Levels (L1–L4) — автоматический перевод
Задаём уровни:
- **L1 Experimental**: нестабильный, высокий BS% p95 или мало подтверждений
- **L2 Stable**: acceptance стабилен, BS% avg низкий
- **L3 Trusted**: outcome-confirmed высокий, BS% p95 стабильно в норме
- **L4 Autonomous**: длительная стабильность + error budget ok + низкие overrides

Правило: уровень пересчитывается периодически (например, daily) по окну N дней.

Эффект: автономность перестаёт быть “вкусовщиной” и становится политикой.

---

### 4.3 User/Tenant Ratings и доверие к фидбэку
Вводим **FeedbackCredibilityScore**:
- вес фидбэка растёт, если он коррелирует с outcome’ами/проверками
- “шумный” фидбэк имеет меньший вес

Эффект: рейтинги не ломаются от случайных оценок и троллинга.

---

## 5) Security & Governance (для институционалки)

1) **Tenant Isolation Sentinel**
- попытки кросс-тенант доступа, блокировки, алерты.

2) **SensitiveDataFilter Counters**
- что и сколько маскируется, всплески.

3) **Two-Person Rule Queue**
- очередь действий, требующих подтверждения, SLA подтверждения.

Эффект: контроль главных рисков мульти-тенанта и утечек.

---

## 6) Incident Ops: превращаем дашборд в “пульт управления”

1) **Incidents Feed**
- severity, статус, ответственный, ссылка на trace bundle.

2) **Auto-Runbooks**
- действия при X: выключить агент, включить fallback, поднять threshold, включить tool-only.

Эффект: снижение MTTR и меньше ошибок оператора.

---

## 7) Минимальный контракт данных (чтобы всё заработало быстро)

### 7.1 TraceSummary (обязательные поля)
Добавить в каждый trace:
- `bullshitPercent` (BS%)
- `evidenceCoveragePercent`
- `invalidClaimsPercent`
- `claimCountWeighted`
- `qualitySignals`: {unsupportedClaims, contradictions, overconfidence, toolAvoidance, fixes}
- `promptVersion`, `modelVersion`, `toolVersions[]`, `policyId`
- `pointsDelta`: {agent, user, tenant}
- `outcome`: {confirmed:boolean, metricDelta?, timestamp?}

Эффект: все графики/рейтинги строятся автоматически.

---

## 8) План внедрения (короткий, по шагам)

### Шаг 1 — Сбор телеметрии + TraceSummary
Действие: начать писать TraceSummary с полями из раздела 7.  
Эффект: появляется единый источник правды для Control Tower.

### Шаг 2 — Truthfulness метрики
Действие: реализовать claim extraction + evidence tagging (MVP: эвристики + tool refs).  
Эффект: BS% начинает считаться и управлять политиками.

### Шаг 3 — UI вкладки Quality / Truthfulness
Действие: добавить панели BS% / EvidenceCoverage / Invalid% + топ трассы.  
Эффект: мгновенная наблюдаемость честности и качества.

### Шаг 4 — Политики автономности по BS%
Действие: включить пороги и режимы tool-first/quarantine.  
Эффект: автоматическое снижение рисков галлюцинаций.

### Шаг 5 — Ratings & Rewards
Действие: начисление очков + уровни L1–L4 + credibility score фидбэка.  
Эффект: управляемая эволюция агентов на данных.

### Шаг 6 — Incident Ops
Действие: incidents feed + runbooks.  
Эффект: операционная готовность и быстрый откат деградаций.

---

## 9) Definition of Done (критерии готовности)
- BS% считается для 100% ответов (traceId), есть p95 по агентам и тенантам.
- Любой traceId открывается в Timeline + видно evidence/provenance.
- Пороги BS% реально влияют на autonomy/tool-first/quarantine.
- Agent Points и L1–L4 пересчитываются автоматически.
- Есть топ “worst traces” и алерты на регрессии.
- Инциденты создаются из алертов и ведут на trace bundle.

---