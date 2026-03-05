# Отчёт — Control Tower Observability Dashboard (F4.17)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-17_control-tower-ui.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые / добавленные файлы

### API
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — экспорт `PerformanceMetricsService`
- `apps/api/src/modules/explainability/explainability-panel.controller.ts` — эндпоинт `GET /rai/explainability/performance?timeWindowMs` (AggregatedMetrics: successRatePct, avgLatencyMs, p95LatencyMs, byAgent)

### Web
- `apps/web/lib/api.ts` — блок `api.explainability`: dashboard, performance, costHotspots, traceTimeline, traceForensics, traceTopology, replayTrace
- `apps/web/app/(app)/control-tower/page.tsx` — страница Control Tower: виджеты SLO & Reliability (Latency avg/p95, Success rate, цветовая индикация порогов), Quality & Evals (BS% avg, Evidence coverage), Cost Analytics (totalCostUsd, по моделям, Top по стоимости со ссылками на трейс), блок «Худшие трейсы» со ссылками
- `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx` — страница трейса: вкладки Forensics (timeline + evidence) и Topology Map (граф react-force-graph-2d, критический путь подсвечен красным), кнопка «Replay Trace» (POST replay, переход на новый traceId)

## Реализовано

- **SLO & Reliability:** графики/блоки Latency (avg, p95) и Success Rate с порогами (p95 ≤ 5000 ms, success ≥ 95%), цвет зелёный/красный; разбивка по агентам.
- **Cost Analytics:** totalCostUsd за окно, разбивка по моделям, список Top Hotspots по стоимости со ссылками на `/control-tower/trace/:traceId`.
- **Topology Map:** на странице трейса вкладка «Topology Map» — граф узлов (request, router, agent, tools, composer), `criticalPathNodeIds` подсвечены красным и жирнее.
- **Replay:** кнопка «Replay Trace» на странице трейса; вызов `POST /rai/explainability/trace/:traceId/replay`; при успехе редирект на новый `replayTraceId` (для ADMIN; при 403 показ ошибки).
- **Стек:** Next.js 14, React, Tailwind; тёмный премиальный фон (zinc-950/900), стеклянные карточки (backdrop-blur). Графики — блоки с цифрами (recharts/chart.js в проекте не подключены, использованы компактные метрики).

## Результаты проверок

### tsc
- `apps/api`: PASS
- `apps/web`: PASS

### pnpm build (apps/web)
- Сборка падает на **существующих** страницах: `/consulting/execution/manager` (useSearchParams без Suspense), advisory recommendations route (cookies). Код Control Tower в сборку не входит в этих ошибках.

## DoD

- [x] Дашборд отображает реальные данные из dashboard, performance, cost-hotspots API
- [x] Визуализация топологии трейса работает, критический путь подсвечен
- [x] Кнопка Replay работает (для админов; при отсутствии прав показывается ошибка)
- [x] `tsc` (apps/api и apps/web) проходят без ошибок

## Новые компоненты (описание UI)

- **Control Tower (главная):** три карточки в ряд (SLO, Quality, Cost), под ними карточка «Худшие трейсы» со ссылками. Все данные через `api.explainability.*`.
- **Trace Forensics:** заголовок с traceId, кнопка Replay, табы «Forensics» (список этапов таймлайна с duration и evidence) и «Topology Map» (force-directed граф, узлы критического пути — красные).
