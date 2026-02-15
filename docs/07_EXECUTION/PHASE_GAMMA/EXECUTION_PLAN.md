---
id: DOC-EXE-GEN-143
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Phase Gamma — Execution Plan

> Старт фазы: **Gamma (Cognitive Intelligence)**  
> Цель: превратить накопленные данные в операционную экспертизу и проактивные рекомендации.

---

## 1) Definition of Done (DoD) для фазы Gamma

Фаза Gamma считается завершенной, если одновременно выполнены критерии ниже.

### 1.1 Продуктовые результаты
- В проде работает **Unified Memory v1**:
  - semantic graph (связи Поле ↔ Гибрид ↔ Погода ↔ Операция ↔ Урожай),
  - episodic retrieval по похожим кейсам,
  - procedural recommendations (адаптация техкарт).
- Запущены 3 AI-направления с измеримым quality-gate:
  - **Vision AI** (болезни/вредители по фото),
  - **Satellite Monitoring** (NDVI/NDRE + алерты),
  - **Active Advisory** (проактивные рекомендации в workflow).
- В интерфейсах (Telegram/Web) доступен единый поток:
  - входящий сигнал → анализ → рекомендация → подтверждение человеком → audit trail.

### 1.2 Технические критерии
- SLA inference API не ниже **99.5%** за последние 30 дней.
- p95 latency:
  - online-recommendation ≤ **2.5s**,
  - image diagnosis ≤ **5s**,
  - episodic retrieval ≤ **1.5s**.
- Для всех AI-решений есть versioning моделей, feature/schema contracts, rollback-процедура.
- Полный observability-контур: метрики, логи, трассировки, алерты on-call.

### 1.3 Governance и безопасность
- Все high-impact рекомендации требуют **human-in-the-loop** подтверждения.
- Включены explainability-артефакты:
  - «почему совет выдан»,
  - какие факторы повлияли,
  - confidence score.
- Реализованы политики доступа к данным и журналирование критичных действий.

### 1.4 Бизнес-критерии
- Не менее **20%** рекомендаций принимаются пользователями в пилоте.
- Снижение времени на разбор инцидента минимум на **30%** относительно Beta baseline.
- Минимум **2 подтвержденных экономических кейса** (например, раннее обнаружение проблемы и предотвращение потерь).

---

## 2) Декомпозиция работ и спринтов (12 недель)

Модель: 6 спринтов по 2 недели, 4 параллельных трека.

## 2.1 Треки

### Track A — Data & Memory Platform
- A1. Data contracts для агро-сигналов, фото, спутниковых слоев, операций.
- A2. Semantic graph schema + pipeline загрузки событий.
- A3. Vector index + episodic retrieval API.
- A4. Quality monitoring (data drift, schema drift, freshness).

### Track B — AI Solvers
- B1. Vision baseline (классы болезней/вредителей, quality dataset).
- B2. Satellite anomaly detection (NDVI/NDRE + зонирование).
- B3. Recommendation ranking (risk × economics × confidence).
- B4. Active advisory orchestration rules.

### Track C — Product & UX Integration
- C1. Единый recommendation card в Telegram/Web.
- C2. Обязательное подтверждение/отклонение рекомендации пользователем.
- C3. Feedback loop (причина отклонения, post-fact outcome).
- C4. Explainability UI блоки.

### Track D — MLOps, Reliability, Security
- D1. CI/CD для моделей и inference-сервисов.
- D2. Shadow mode + canary rollout.
- D3. SLO/SLA dashboards и alerting.
- D4. Incident runbooks + rollback + доступы и аудит.

## 2.2 План по спринтам

### Sprint 1–2 (Недели 1–4): Data & Infrastructure Readiness
- Инфраструктура K8s: namespace, квоты/лимиты, secrets.
- Сквозная наблюдаемость: Trace ID (OTel-compatible) между сервисами.
- Унифицированные data contracts (JSON-схемы, semver) для сигналов данных.
- pgvector smoke test и создание архитектуры векторного слоя.
- Скелет ingestion (поглощения сигналов) для AI-задач.
- Risk Engine endpoint в режиме read-only/dry-run.

> [!IMPORTANT]
> Спринты 1–2 фиксируются как этап инфраструктурной и дата-готовности.
> **Обучение AI-моделей, инференс, рекомендации НЕ входят** в этот этап.

**Выход этапа:** Подготовленная инфраструктура, наблюдаемость, протоколы данных, готовность к подключению AI-солверов или финальных моделей.

### Sprint 3–4 (Недели 5–8): Integration
- Подключить episodic retrieval и recommendation API в общий orchestration flow.
- Включить human confirmation и audit trail в интерфейсах.
- Развернуть observability + SLO dashboards + алерты.
- Провести shadow testing на реальных данных.

**Выход этапа:** end-to-end поток в shadow mode, контролируемые метрики качества.

### Sprint 5 (Недели 9–10): Pilot
- Ограниченный пилот на выделенном наборе полей/команд.
- Измерение acceptance rate, latency, precision/recall по ключевым кейсам.
- Тюнинг ранжирования рекомендаций и объяснений.

**Выход этапа:** подтвержденная польза в пилоте, список улучшений до GA.

### Sprint 6 (Недели 11–12): Hardening & Go-Live
- Canary rollout → staged production rollout (`10% -> 25% -> 50% -> 100%`) с gate-критериями и авто-стопом.
- Нагрузочные/stress тесты advisory read/write-path + capacity report (p95/p99/error rate).
- Reliability hardening по результатам тестов + проверка graceful degradation.
- Финальные runbooks, on-call readiness, alert routing, rollback rehearsal.
- Финальная приемка по DoD и бизнес-метрикам + формальный go/no-go decision record.

**Выход этапа:** production-ready Gamma v1.

---

## 3) Launch Checklist (готовность к запуску Gamma)

## 3.1 Product readiness
- [ ] Финальный перечень пользовательских сценариев (diagnosis, anomaly, advisory).
- [ ] Для каждого сценария есть owner, KPI и playbook реакции.
- [ ] UX copy и объяснения рекомендаций утверждены бизнесом.

## 3.2 Data & Model readiness
- [ ] Датасеты версионированы, источники документированы.
- [ ] Offline-метрики достигли минимальных порогов качества.
- [ ] Дрейф-детекторы и data quality алерты активны.

## 3.3 Engineering readiness
- [ ] CI/CD пайплайны для моделей и сервисов зеленые.
- [ ] Нагрузочное тестирование и деградационные сценарии пройдены.
- [ ] Rollback протестирован (не только описан).

## 3.4 Reliability & Ops readiness
- [ ] SLO/SLI утверждены, dashboards доступны on-call команде.
- [ ] Alert routing проверен (Pager/ChatOps).
- [ ] Incident runbook и коммуникационный шаблон готовы.

## 3.5 Security & Compliance readiness
- [ ] RBAC настроен по ролям (агроном, руководитель, аналитик, админ).
- [ ] Аудит критичных действий и рекомендаций включен.
- [ ] Политики хранения/удаления чувствительных данных утверждены.

## 3.6 Business readiness
- [ ] Зафиксирован baseline для сравнения эффективности (до Gamma).
- [ ] Согласованы критерии экономического эффекта и методика расчета.
- [ ] Назначен цикл review результатов пилота (еженедельно).

---

## Операционный ритм управления фазой
- Еженедельный steering review (продукт + домен + engineering + ops).
- Раз в 2 недели: gate-review по критериям DoD.
- Единая «Gamma Scoreboard» панель:
  - adoption,
  - quality,
  - latency,
  - бизнес-эффект.
