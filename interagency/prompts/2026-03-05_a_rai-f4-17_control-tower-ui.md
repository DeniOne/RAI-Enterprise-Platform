# PROMPT — Control Tower Observability Dashboard (Phase 4.17)
Дата: 2026-03-05
Статус: active
Приоритет: P1

## Цель
Реализовать фронтенд-часть панели управления Swarm Control Tower. Это должен быть дашборд, агрегирующий данные о производительности, стоимости и топологии роя агентов.

## Контекст
- **Backend API готовы:**
  - `GET /rai/explainability/dashboard` (Quality & Evals - F4.5)
  - `GET /rai/explainability/performance` (SLO/Errors - F4.12)
  - `GET /rai/explainability/cost-hotspots` (Cost - F4.13)
  - `GET /rai/explainability/trace/:traceId/topology` (Connection Map - F4.14)
- **UI Workbench:** У нас есть `apps/web/src/modules/governance/control-tower` (или создайте, если нет).

## Задачи (что сделать)
- [ ] **Виджеты SLO & Reliability:**
  - Графики Latency (avg/p95) и Error Rate (Error Budget) на базе `performance-metrics`.
  - Цветовая индикация превышения порогов (красный/зеленый).
- [ ] **Виджет Cost Analytics:**
  - Круговая диаграмма или список по `totalCostUsd` (от LLM моделей).
  - Список "Top Hotspots" (самые дорогие трейсы со ссылками на дебаг).
- [ ] **Визуализация Топологии (Trace Map):**
  - При просмотре конкретного трейса (режим Forensics) добавить вкладку "Topology Map".
  - Отобразить граф (nodes), где критический путь (`criticalPathNodeIds`) подсвечен красным/жирным.
  - Кастомный рендеринг для узлов: `request`, `router`, `tools`.
- [ ] **Интеграция Safe Replay:**
  - Кнопка "Replay Trace" (только для ADMIN), вызывающая `POST /.../replay`.
  - Переход в новый трейс после реплея.

## Стек и стиль
- **Framework:** Vite + React (текущий стек `apps/web`).
- **Styling:** Vanilla CSS (согласно политике), премиальный темный дизайн (Glassmorphism), плавные переходы.
- **Charts:** Можно использовать `recharts` или `chart.js` (проверьте, что уже есть в `package.json`).

## Definition of Done (DoD)
- [ ] Дашборд отображает реальные данные из всех API.
- [ ] Визуализация топологии трейса работает и подсвечивает критический путь.
- [ ] Кнопка Replay работает (для админов).
- [ ] `tsc` & `pnpm build` (apps/web) проходят без ошибок.

## Что вернуть на ревью
- Скриншоты работающего дашборда (или описание UI).
- Список новых компонентов.
