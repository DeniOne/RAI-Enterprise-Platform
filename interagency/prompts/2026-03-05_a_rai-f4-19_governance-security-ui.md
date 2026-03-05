# PROMPT — Governance & Security Control UI (Phase 4.19)
Дата: 2026-03-05
Статус: active
Приоритет: P2

## Цель
Реализовать фронтенд-модуль для управления безопасностью и комплаенсом (Governance & Security). Это завершающая часть Phase 4, объединяющая Incident Feed, Governance Counters и политики автономности.

## Контекст
- **Backend API готовы:**
  - `GET /rai/incidents/feed` (Incidents Feed - F4.11)
  - `GET /rai/governance/counters` (Governance Counters - F4.11)
  - `POST /rai/incidents/:id/resolve` (F4.11)
- **UI Workbench:** `apps/web/app/(app)/governance/security`

## Задачи (что сделать)
- [ ] **Governance Counters Widget:**
  - Отображение счетчиков `TenantIsolationSentinel` (попытки кросс-тенанта) и `SensitiveDataFilter`.
  - Статистика по типам заблокированных данных.
- [ ] **Incidents Feed View:**
  - Список инцидентов с фильтрацией по критичности (High/Medium/Low).
  - Привязка к `traceId` (ссылка на `/control-tower/trace/:traceId`).
  - Возможность "Resolve" инцидента с вводом комментария.
- [ ] **Security Alerts:**
  - Визуализация "Auto-Runbooks" — какие скрипты реагирования были запущены (например, "Quarantine activated for Agent X").
- [ ] **Доступ:**
  - Модуль доступен только для ролей ADMIN или COMPLIANCE.

## Стек и стиль
- NEXT.js, Tailwind, zinc-950 дизайн.
- Использовать существующие компоненты UI (Cards, Tables, Badges).

## Definition of Done (DoD)
- [ ] Лента инцидентов работает, отображает реальные данные и позволяет помечать их как решенные.
- [ ] Счетчики безопасности обновляются в реальном времени или при загрузке.
- [ ] Ссылки на Forensic Explorer (Control Tower) ведут на правильные трейсы.
- [ ] `tsc` & `pnpm build` (web) проходят.

## Что вернуть на ревью
- Скриншоты или описание ленты инцидентов и счетчиков.
