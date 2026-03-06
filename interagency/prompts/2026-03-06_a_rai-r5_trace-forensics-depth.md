# PROMPT — R5 Trace Forensics Depth (Truth Sync Recovery)
Дата: 2026-03-06  
Статус: active  
Приоритет: P0

## Цель
Довести `Explainability / Forensics` до уровня, где по одному `traceId` можно восстановить не просто факт вызова AI, а реальную причинную цепочку исполнения: `router -> runtime -> tools -> composer -> quality update`. После `R1-R4` у нас уже есть evidence в audit trail, честный `TraceSummary`, runtime-trigger truthfulness и базовый claim accounting. Но forensic timeline пока ещё слишком плоский: он показывает куски следа, а не полную структуру принятия решения. `R5` должен превратить explainability из “списка записей” в рабочий инструмент расследования.

## Контекст
- Почему это важно сейчас:
  - Без нормального forensic timeline даже честные quality-метрики будут плохо объяснимы.
  - `Control Tower` и explainability уже существуют, но глубина разбора trace пока недостаточная для реального инцидент-анализа.
  - После `R4` quality уже считает claims/evidence, значит теперь нужно дать человеку нормальную картину “что произошло и почему”.
- Что уже сделано:
  - `R1`: evidence доезжает до audit trail.
  - `R2`: `TraceSummary` хранит честные nullable/live quality-поля.
  - `R3`: truthfulness runtime pipeline выполняется в правильном порядке.
  - `R4`: есть канонический claim accounting и прозрачные формулы quality.
- На какие документы опираемся:
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`
- Ключевые текущие файлы:
  - `apps/api/src/modules/explainability/explainability-panel.service.ts`
  - `apps/api/src/modules/explainability/trace-topology.service.ts`
  - `apps/api/src/modules/explainability/dto/explainability-timeline.dto.ts`
  - `apps/api/src/modules/explainability/dto/trace-forensics.dto.ts`
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
  - `apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx`

## Ограничения (жёстко)
- `companyId` только из trusted context.
- Не расползаться в новый dashboard, registry, autonomy, incidents feed и prompt governance.
- Не переписывать весь `Control Tower` UI. Нужен точечный доменный апгрейд explainability/forensics.
- Не подменять отсутствующие runtime-фазы выдуманными событиями. Если чего-то нет в коде/следе, это надо либо честно добавить, либо не показывать.
- Backward compatibility обязательна:
  - старые traces без новых forensic phase markers не должны ломать API;
  - UI должен переваривать как старый, так и новый shape timeline.

## Задачи (что сделать)
- [ ] Определить минимальный канонический набор forensic phase markers для trace:
  - `router`
  - `trace_summary_record`
  - `audit_write`
  - `truthfulness_calculation`
  - `quality_update`
  - `composer`
  - при наличии — `pending_action` / `decision` / `quorum`
- [ ] Решить, где эти phase markers формируются:
  - либо в `SupervisorAgent` как runtime metadata,
  - либо на основе уже существующих записей и timestamps,
  - либо гибридно, но без магии и без потери причинности.
- [ ] Довести `ExplainabilityPanelService.getTraceTimeline(...)` и/или `getTraceForensics(...)` так, чтобы они возвращали не только evidence refs, но и явные этапы исполнения trace.
- [ ] Свести `trace topology` и `forensics timeline` к одной логике, чтобы они не рассказывали разные истории про один и тот же trace.
- [ ] Убедиться, что в forensic response можно связать:
  - вызванные tools
  - quality result (`bsScorePct`, `coverage`, `invalidClaimsPct`)
  - evidence refs
  - runtime phase order
- [ ] При необходимости минимально обновить trace page UI, но только чтобы она реально показывала новый forensic смысл, а не просто получила ещё одно поле в JSON.

## Что не делать
- [ ] Не делать новый визуальный стиль.
- [ ] Не расползаться в полноценный incident cockpit.
- [ ] Не строить event-sourcing “на будущее”, если достаточно локального честного phase tracking.
- [ ] Не трогать claim accounting formulas (`R4` уже их зафиксировал).

## Definition of Done (DoD)
- [ ] По одному `traceId` можно восстановить последовательность исполнения, а не только список audit rows.
- [ ] Forensics показывает evidence refs вместе с context этапа, на котором они появились.
- [ ] Trace page / explainability API не ломаются на старых traces.
- [ ] Topology и forensics не расходятся по смыслу.
- [ ] Есть тесты на новый forensic shape и phase order.
- [ ] `tsc` PASS.
- [ ] Целевые `jest` PASS.

## Тест-план (минимум)
- [ ] Unit/spec: timeline содержит канонические этапы в правильном порядке.
- [ ] Unit/spec: forensics возвращает evidence refs + quality summary + runtime phases.
- [ ] Unit/spec: старый trace без phase markers не ломает API.
- [ ] Unit/spec: tenant isolation в explainability/forensics не ломается.
- [ ] При изменении UI: проверить trace page на nullable/legacy данные.
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` для затронутого пакета.
- [ ] Целевые `jest` по explainability/forensics и затронутым сервисам.

## Что вернуть на ревью
- Изменённые файлы (список).
- Краткое описание канонической forensic phase model.
- Объяснение, как связаны `timeline`, `topology`, `evidence refs` и `quality summary`.
- Результаты `tsc`.
- Результаты `jest`.
- Короткое доказательство из тестов или JSON-ответа, что один trace теперь читается как причинная цепочка, а не как разрозненный список записей.

## Критерий приёмки техлидом
Задача считается принятой только если после доработки можно открыть один `traceId` и без гадания понять:
1. что вызвало trace,
2. какие tools и quality-этапы реально прошли,
3. на чём держались claims/evidence,
4. почему итоговый quality result именно такой.
