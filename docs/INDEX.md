---
id: DOC-ARH-GEN-007
type: Navigation
layer: Meta
status: Approved
version: 2.1.0
owners: [@techlead]
last_updated: 2026-02-19
---

# УКАЗАТЕЛЬ ДОКУМЕНТАЦИИ (RAI_EP)

> **Версия Управления**: 2.0 (Enterprise Topology)
> **Статус**: [STRICT-GOVERNANCE-ENABLED]

---

## 🧭 Навигация по слоям

### 00 — [СТРАТЕГИЯ (00_STRATEGY/)](file:///f:/RAI_EP/docs/00_STRATEGY/)
Бизнес-цели, Видение, Дорожная карта и Экономика юнита.
- [VISION_SCOPE.md](file:///f:/RAI_EP/docs/00_STRATEGY/VISION_SCOPE.md)
- [ROADMAP_PHASES.md](file:///f:/RAI_EP/docs/00_STRATEGY/ROADMAP_PHASES.md)
- [LEVEL_F_STRATEGY.md](file:///f:/RAI_EP/docs/00_STRATEGY/LEVEL%20F%20—%20INDUSTRY%20COGNITIVE%20STANDARD.md)

### 01 — [АРХИТЕКТУРА (01_ARCHITECTURE/)](file:///f:/RAI_EP/docs/01_ARCHITECTURE/)
Технический фундамент: Принципы, HLD, ADR и Основные концепции.
- **Level F (Trust Layer):**
    - [LEVEL_F_CONCEPT.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/LEVEL_F/LEVEL_F_CONCEPT.md)
    - [LEVEL_F_INVARIANTS.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/LEVEL_F/LEVEL_F_INVARIANTS.md)
    - [LEVEL_F_DATA_MODEL.md](file:///f:/RAI_EP/docs/01_ARCHITECTURE/LEVEL_F/LEVEL_F_DATA_MODEL.md)

### 02 — [ДОМЕНЫ (02_DOMAINS/)](file:///f:/RAI_EP/docs/02_DOMAINS/)
Бизнес-логика: Агро-сущности, Консалтинг и Энтерпрайз логика.
- **Level F (Economy):**
    - [F_CERTIFICATION_MODEL.md](file:///f:/RAI_EP/docs/02_DOMAINS/ECONOMY_DOMAIN/F_CERTIFICATION_MODEL.md)
    - [F_FARM_RATING_MODEL.md](file:///f:/RAI_EP/docs/02_DOMAINS/ECONOMY_DOMAIN/F_FARM_RATING_MODEL.md)

### 03 — [ПРОДУКТ (03_PRODUCT/)](file:///f:/RAI_EP/docs/03_PRODUCT/)
Пользовательский опыт: UI/UX спецификации, Telegram-бот и Дизайн-система.
- [LEVEL_F_PRODUCT_OVERVIEW.md](file:///f:/RAI_EP/docs/03_PRODUCT/LEVEL_F_PRODUCT_OVERVIEW.md)
- [LEVEL_F_API_SPEC.md](file:///f:/RAI_EP/docs/03_PRODUCT/LEVEL_F_API_SPEC.md)

### 04 — [ИНЖЕНЕРИЯ (04_ENGINEERING/)](file:///f:/RAI_EP/docs/04_ENGINEERING/)
Детали реализации: API контракты, База данных, Сервисы и Инфраструктура.
- **Level F (Services):**
    - [F_SNAPSHOTTER_ARCH.md](file:///f:/RAI_EP/docs/04_ENGINEERING/LEVEL_F/F_SNAPSHOTTER_ARCH.md)
    - [F_SECURITY_MODEL.md](file:///f:/RAI_EP/docs/04_ENGINEERING/LEVEL_F/F_SECURITY_MODEL.md)

### 05 — [ОПЕРАЦИИ (05_OPERATIONS/)](file:///f:/RAI_EP/docs/05_OPERATIONS/)
Runtime: Runbooks, Инциденты и Мониторинг.

### 06 — [МЕТРИКИ (06_METRICS/)](file:///f:/RAI_EP/docs/06_METRICS/)
Аналитика: Формулы KPI и Технические метрики.
- [F_SUCCESS_METRICS.md](file:///f:/RAI_EP/docs/06_METRICS/LEVEL_F/F_SUCCESS_METRICS.md)
- [F_RISK_MONITORING.md](file:///f:/RAI_EP/docs/06_METRICS/LEVEL_F/F_RISK_MONITORING.md)

### 07 — [ИСПОЛНЕНИЕ (07_EXECUTION/)](file:///f:/RAI_EP/docs/07_EXECUTION/)
Управление проектом: Фазы, Спринты и WBS.
- [DELTA_ROADMAP.md](file:///f:/RAI_EP/docs/07_EXECUTION/PHASE_DELTA/DELTA_ROADMAP.md)

---

## 🛠️ Системные инструменты
- **Проверка управления**: `node scripts/verify-invariants.cjs`
- **Восстановление ссылок**: `node scripts/doc-fix-links.cjs`

---
*Сгенерировано Antigravity Technical Lead в соответствии с LANGUAGE_POLICY.md*
