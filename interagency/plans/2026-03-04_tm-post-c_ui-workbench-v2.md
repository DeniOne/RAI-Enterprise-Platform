# ПЛАН — TM-POST-C: UI TechMap Workbench v2
Дата: 2026-03-04
Статус: **DRAFT**
Decision-ID: AG-TM-POST-C-007

## Результат
- Подготовленный к исполнению план обновления `TechMapWorkbench` от заглушки к рабочему UI для DAG-операций, Evidence upload и ChangeOrder workflow.
- Подготовленный план безопасной интеграции новых UI-панелей без изменения backend-домена и без нарушения tenant/security-инвариантов.
- Подготовленный план тестового покрытия (`TechMapWorkbench.spec.tsx`) для ключевых UI-сценариев, включая FROZEN-режим.

## Границы
- Входит: обновление `apps/web/components/consulting/TechMapWorkbench.tsx`.
- Входит: добавление `apps/web/components/consulting/OperationDagView.tsx`.
- Входит: добавление `apps/web/components/consulting/EvidencePanel.tsx`.
- Входит: добавление `apps/web/components/consulting/ChangeOrderPanel.tsx`.
- Входит: обновление/добавление тестов `apps/web/components/consulting/TechMapWorkbench.spec.tsx` (RTL).
- Входит: fetch-интеграция только через `/api/tech-map/evidence` и `/api/tech-map/change-order`.
- Не входит: изменения backend `apps/api/src/modules/tech-map/*`.
- Не входит: изменения Prisma-схемы, миграции БД, новые npm-зависимости.
- Не входит: изменение FSM-логики в `lib/consulting/ui-policy.ts` и `getEntityTransitions`.

## Предварительные проверки
- Проверены foundation-документы для стадии планирования: `CANON.md`, `ARCHITECTURAL_AXIOMS.md`, `FORBIDDEN.md`, `SECURITY_CANON.md`, `LANGUAGE_POLICY.md`.
- Decision-ID `AG-TM-POST-C-007` присутствует в prompt и зарегистрирован в `DECISIONS.log` со статусом `ACCEPTED`.
- Blocking-gate реализации: любые изменения кода разрешены только после канонического токена `ACCEPTED: interagency/plans/2026-03-04_tm-post-c_ui-workbench-v2.md`.
- Tenant/security-инвариант: `companyId` не извлекается из UI props/URL; используется только trusted `authority` context.
- Архитектурный инвариант: фронтенд не делает прямых DB/Prisma-вызовов, только API.

## Риски
- UI-риск DAG: без новых библиотек визуализация зависимостей может стать сложной для чтения при большом количестве операций.
- UX-риск FROZEN: частичная блокировка интерактивности может оставить активные элементы и нарушить FSM-политику.
- Data-contract риск: расхождения в типах `dependencies`, `changeOrders`, `evidence` между UI и API могут привести к runtime-ошибкам.
- Security-риск upload: некорректная обработка ошибок `fetch/FormData` может скрыть неуспешную отправку доказательств.
- Test-risk: недостаточное покрытие edge-case сценариев (`operations: []`, отсутствующие optional-поля) может пропустить регресс.

## План работ
- [ ] Уточнить и обновить интерфейсы в `TechMapWorkbench`:
- Расширить `Operation` полями `dependencies`, `operationType`, `bbchWindowStart`, `bbchWindowEnd`, `isCritical`.
- Добавить `ChangeOrderSummary` и `EvidenceSummary`.
- Расширить `techMap` props (`changeOrders`, `areaHa`, `cropZoneId`) с безопасными optional-контрактами.
- [ ] Реализовать `OperationDagView.tsx`:
- Рендер операций в хронологическом/серийном порядке.
- Визуально выделить `isCritical`.
- Добавить отрисовку зависимостей стрелками через SVG/CSS без сторонних библиотек.
- При `isFrozen` включить read-only режим (`pointer-events: none`/disabled).
- [ ] Добавить в `TechMapWorkbench` переключатель вида `Список / График` и интегрировать `OperationDagView`.
- [ ] Реализовать `EvidencePanel.tsx`:
- Кнопка прикрепления только при `!isFrozen && operation.evidenceRequired`.
- Hidden `input[type=file]`, отправка через `POST /api/tech-map/evidence` с `FormData`.
- Inline-ошибки и список `EvidenceSummary`.
- Визуальная маркировка операций с `evidenceRequired`.
- [ ] Реализовать `ChangeOrderPanel.tsx`:
- Список `changeOrders` с цветовым кодом статусов.
- Форма создания change order (`reason`, `changeType`).
- Submit через `POST /api/tech-map/change-order`.
- Полная блокировка в `isFrozen`.
- [ ] Интегрировать панели в `TechMapWorkbench` с lazy-render (accordion/state), добавить `areaHa` и `cropZoneId` в header.
- [ ] Обновить/добавить `TechMapWorkbench.spec.tsx` (минимум 4 теста):
- Empty render без ошибок.
- FROZEN: интерактивные элементы недоступны.
- Критическая операция получает целевой класс.
- `ChangeOrderPanel` не рендерится в `isFrozen`.
- [ ] Выполнить проверки качества: `pnpm --filter web exec tsc --noEmit` и `pnpm --filter web test --testPathPattern="TechMapWorkbench"`.

## DoD
- [ ] `pnpm --filter web exec tsc --noEmit` PASS.
- [ ] `pnpm --filter web test --testPathPattern="TechMapWorkbench"` PASS и покрывает минимум 4 unit-теста.
- [ ] `TechMapWorkbench` корректно рендерится при `operations: []`.
- [ ] DAG-визуализация корректно рендерит зависимости из `MapOperation.dependencies`.
- [ ] FROZEN-режим полностью блокирует интерактивность (кнопки/инпуты/submit).
- [ ] В UI нет прямых DB/Prisma вызовов.
- [ ] В проект не добавлены новые npm-зависимости.
- [ ] Evidence upload UI отображается только при `evidenceRequired: true` и обрабатывает ошибки inline.
- [ ] ChangeOrder panel отображается/скрывается согласно состоянию и данным `changeOrders`.
