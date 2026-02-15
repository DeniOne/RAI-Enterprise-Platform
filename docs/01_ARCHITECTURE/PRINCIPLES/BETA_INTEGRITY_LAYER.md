---
id: DOC-ARC-GEN-045
type: Standards
layer: Architecture
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# Канон: BETA_INTEGRITY_LAYER.md

**Статус:** Архитектурный закон. Обязателен. Блокирующий.  
**Контекст:** RAI_EP · Phase Beta · Canonical Infrastructure

## 1. Фундаментальный принцип «Единого тела» (System Integrity)

Фронт-офис не является автономным модулем.  
Фронт-офис — это нервные окончания (исполнительный и сенсорный контур) Бэк-офиса (головной мозг).

**Закон:** Никакое действие во Фронт-офисе не имеет права на существование, если оно не завершается детерминированной реакцией в Бэк-офисе.

---

## 2. Обязательные причинно-следственные связи (Mandatory Causal Loops)

Любое событие Фронт-офиса обязано пройти через **Integrity Gate** (Policy Enforcement Layer) для влияния на Бэк-офис:

1.  **Положительный контур (Action):**
    - `Observation(INCIDENT)` -> `IntegrityGate` -> `DeviationReview` (CMR)
    - `Observation(CONFIRMATION)` -> `IntegrityGate` -> `EconomicEvent` (Finance)
    - `Observation(DELAY)` -> `IntegrityGate` -> `DecisionRecord` -> `TechMap` (Strategy)

2.  **Негативный контур (Failure/Silence):**
    - `NO Observation` или `WEAK Evidence` -> `IntegrityGate` -> `RiskEngine` -> `Compliance / Liability Risk`

---

## 3. Integrity Gate: Policy Enforcement Layer

**Integrity Engine** — это единственный легитимный шлюз.  
- Telegram, Field Service API и другие внешние интерфейсы являются только **транспортом**.
- Источником бизнес-логики и права на изменение состояния системы обладает только Integrity Gate.

---

## 4. Канон коммуникации (Contextual Only)

1.  **Запрет свободного общения:** Любая коммуникация (Telegram Threads) должна быть производной от системного события (`Task`, `Observation`, `Deviation`).
2.  **Hard Ban:** Свободные чаты, личные сообщения и "просто комментарии" вне контекста моделей данных запрещены.
3.  **Traceability:** Каждое сообщение должно быть трассируемо до конкретного инцидента или задачи.

---

## 5. Доказательная база (Evidence Standards)

Каждое наблюдение (`FieldObservation`) обязано содержать:
1.  **Intent:** Явное указание цели (Monitoring, Incident, итд).
2.  **IntegrityStatus:** Оценка силы доказательства (Strong, Weak, None).

---

## 6. Критерий завершения Beta (Inviolable Gate)

Фаза Beta считается закрытой ТОЛЬКО после успешного прохождения **Beta Integrity Test**:
`Task` (BO) -> `Observation` (FO) -> `IntegrityGate` (Law) -> `DeviationReview` (CMR) -> `Decision` (BO) -> `TechMap Update` (BO).

---
*Любая функция, нарушающая данный закон, подлежит немедленному удалению из кодовой базы.*
