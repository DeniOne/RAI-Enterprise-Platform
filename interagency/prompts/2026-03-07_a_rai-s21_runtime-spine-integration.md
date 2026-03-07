# PROMPT — A_RAI S21 Runtime Spine Integration Proof
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Закрыть production-readiness gap `Есть integration tests на runtime spine` и подтвердить, что ключевой execution spine работает как связанная система, а не как набор хорошо покрытых unit/service тестов. После этой задачи должен появиться интеграционный proof на путь `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`.

## Контекст
- После `S20` основные structural Stage 2 claims по registry, governance, eval, quality, configurator и budget уже `CONFIRMED`.
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` всё ещё открыт важный pre-launch пункт:
  - `Есть integration tests на runtime spine`
- Сейчас у нас много producer-side unit/controller tests, но не хватает одного явного слоя proof, что:
  - runtime orchestration использует registry authority;
  - budget/policy/governance не живут отдельно;
  - audit/trace metadata доезжают после реального интеграционного execution path;
  - critical guardrails не ломаются при совместной работе.

## Ограничения (жёстко)
- Не подменять integration proof набором новых unit-тестов в соседних сервисах.
- Не строить огромный e2e harness на весь продукт, если можно закрыть gap таргетированным integration scope.
- Не ломать:
  - tenant isolation
  - replay safety
  - governed prompt/config workflow
  - quality-governance loop
  - registry/budget runtime authority
- Не расползаться в нагрузочное тестирование, queue simulation или UI smoke: здесь нужен именно runtime spine integration.

## Задачи (что сделать)
- [ ] Определить канонический integration scope для runtime spine:
  - `SupervisorAgent`
  - `AgentRuntimeService`
  - `RaiToolsRegistry`
  - registry/runtime config authority
  - budget/policy gating
  - audit/trace persistence
- [ ] Добавить минимум 2-3 интеграционных сценария, в которых одновременно подтверждаются несколько слоёв системы, а не один isolated service:
  - happy-path execution с persisted audit/trace output;
  - guarded path (`budget deny`, `policy/tool-first/quarantine` или equivalent);
  - runtime path с effective registry/governed state.
- [ ] Доказать, что integration tests действительно проходят через канонический runtime spine, а не обходят его моками до бессмысленности.
- [ ] Если потребуется, немного укрепить test harness/DI wiring для realistic integration path, но без отдельного архитектурного рефакторинга.
- [ ] Обновить `A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`, если пункт про integration tests на runtime spine можно честно закрыть.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Есть integration proof на канонический runtime spine.
- [ ] Тесты проходят через реальные orchestration boundaries, а не только через прямые вызовы isolated services.
- [ ] Подтверждены вместе как минимум:
  - runtime execution,
  - guardrail/gating,
  - audit/trace side effects.
- [ ] Tenant isolation и replay safety не деградировали.
- [ ] Пункт `Есть integration tests на runtime spine` можно поднять в readiness checklist.

## Тест-план (минимум)
- [ ] Integration: `Supervisor -> Runtime -> Tools -> Response/Audit`.
- [ ] Integration: guarded runtime path (`budget deny` или `policy block`) не исполняет tools и пишет корректный trace/audit/incident signal.
- [ ] Integration: runtime учитывает effective registry/governed state, а не только raw storage row.
- [ ] Regression: replay / tenant isolation не ломаются в выбранном integration harness.

## Что вернуть на ревью
- Изменённые файлы.
- Какой именно integration harness выбран и почему он действительно покрывает runtime spine.
- Какие сценарии доказаны.
- Какие части runtime spine теперь покрыты совместно, а не поодиночке.
- Результаты `tsc` и целевых integration tests.
- Явное указание, можно ли теперь закрыть readiness-пункт про integration tests.
