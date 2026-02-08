# Active Context: RAI_EP (2026-02-07)

## Current Project State
- **[2026-02-06] Sprint B5 (R&D Engine) Complete**: Реализован научно-валидный контур с жестким FSM, блокировками замеров и версионированием протоколов. Пакет `@rai/rd-engine` интегрирован в API.
- **[2026-02-06] Sprint B4 (Legal AI & GR Automation) Complete**: Реализована глубокая правовая онтология, движок комплаенс-сигналов и GR-контроллер. Пройден архитектурный аудит.
- **[2026-02-06] Milestone 13 (Knowledge Fabric) Complete**: Реализован граф знаний с фокусом на контекст и полная русификация интерфейса. Исправлены баги SSR и БД.
- **[2026-02-06] Sprint B3 (Finance & Economy) Complete**: Реализован CFO Control Plane. Внедрена модель Economy (Immutable Ledger, Pure Attribution) и Finance (Budgets, FSM, Liquidity Radar). Пройдена верификация CFO Quality Gate. Авторизация и доступ к дашборду восстановлены.
- **[2026-02-05] Sprint B2 (HR Ecosystem & Strategic Alignment) Complete**: Реализована 3-контурная HR-модель (Foundation, Incentive, Development). Внедрена стратегическая интеграция с CMR через деаккумулированные снепшоты человеческого капитала.
- **[2026-02-04] Sprint B1 (Consulting Control Plane) Complete**: Реализована Tech Map, CMR, Risk & Insurance, SLA Logic.
- **[2026-02-04] Sprint B0 (Tech Debt & Resilience) Complete**: Внедрен единый FSM, Redis сессии для бота и полная изоляция бота от БД. Усилена надежность API-клиента.


### Recent Problematics & Fixes (2026-02-07)
- **Resolved**: Phase Beta+ (The Final Mile).
    - Implemented: `RegistryAgentService` for AI-driven asset ingestion (Machinery, StockItems).
    - Implemented: `TelegramNotificationService` with internal HTTP API communication protocol.
    - Implemented: `IntegrityGate` admission rules for TechMap activation based on physical resources.
- **Phase Beta Status**: **COMPLETE ✅**. All core contours (B0-B6) and extended Beta+ features are physically integrated and verified.

## Current Focus
- **Phase Gamma Planning**: Moving towards orbital stability and large-scale autonomous operations.
- **Vision AI (B7)**: Preparing for advanced pest/disease diagnosis.

## Tech Debt & Future Roadmap
- **[2026-02-05] Vertical Integrity (B1: TechMap) Complete**: Проведен сквозной аудит. Контур "Задача -> Техкарта -> Видимость" замкнут. Каноническая проверка пройдена (Service=IO, Multi-tenancy подтверждена).
- **Sprint B3.5 (Priority) Complete**:
  - [x] **Vertical Integrity**: Реализованы слои для B1 (TechMap), B2 (HR Pulse) и B3 (CFO Widgets). Все срезы прошли аудит и замкнуты физически. Проблемы с роутингом (`/api` prefix) и авторизацией решены.
- **Sprint B5 (DONE)**:
  - [x] **R&D Engine**: Научный контур с FSM и Protocol-first инвариантами.
- **Sprint B6 (MISSING)**:
  - [ ] **Supply Chain & JIT**: Оптимизация логистики и поставок.
  - [ ] **Machinery Registry**: Учет флота и техники.

## Active Decisions
- **Standardization**: Используем структуру документов с префиксами (00, 10, 20...) для строгого порядка.
- **Language**: Весь контент и коммуникация ведутся на русском языке с использованием (по желанию пользователя) экспрессивной лексики.
- **Memory**: Отказались от внешних MCP-навыков в пользу классического Memory Bank.

## B6 Invariants (Architectural Hardening)
- **Policy Loop**: `PolicySignal` -> `LegalRequirement.status` -> `ComplianceStatus` -> `RiskEngine`. Сигналы должны физически менять риск-профиль.
- **Front Canon (Beta)**: Весь фронт Beta — это Read-only проектор истины (`FRONT_CANON_BETA.md`). Любое управление — только через Telegram.
- **Front Architecture (Beta)**: Отказ от sidebar в пользу контекстной навигации и Explanation Layer (`FRONT_ARCHITECTURE_BETA.md`).
- **Front UX Map (Beta)**: Карта экранов осознанности на русском языке (`FRONT_UX_MAP_BETA.md`). Глубина < 3.
