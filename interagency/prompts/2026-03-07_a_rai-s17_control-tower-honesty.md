# PROMPT — A_RAI S17 Control Tower Honesty
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести `Control Tower` и truthfulness/forensics spine до состояния, где observability больше не врёт по ключевым quality-claims. После этой задачи evidence должен реально доезжать в audit/trace слой, `BS%` должен читаться из живой evidence-driven цепочки, а `Control Tower` обязан показывать не только базовые метрики, но и честные quality/eval показатели и critical-path visibility.

## Контекст
- После `S16` основные governance/eval/registry хвосты закрыты, но в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` остаются `PARTIAL` по связанной группе:
  - `Evidence Tagging`
  - `BS%`
  - `Quality & Evals Panel`
  - частично `Governance counters` / observability honesty
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` всё ещё открыты:
  - `В панели реально отображаются BS%, Evidence Coverage, Acceptance Rate, Correction Rate`
  - `Есть critical path visibility`
  - частично `queue/backpressure visibility`
- Архитектурно это один контур:
  - `evidence -> audit -> trace summary -> dashboard/control tower`
- Сейчас главный риск самообмана остаётся прежним: часть quality-claims уже описана как реализованная, но end-to-end честность этой цепочки всё ещё слабее документации.

## Ограничения (жёстко)
- Не делать cosmetic UI patch без backend source of truth.
- Не подменять missing evidence/metrics нулями или “красивыми” fallback-значениями.
- Не ломать существующие:
  - replay safety
  - tenant isolation
  - governance incidents
  - prompt governance / eval workflow
- Не расползаться в большой редизайн Control Tower; нужна правда в данных и минимально достаточное UI/API отражение.
- Не закрывать claim, если метрика всё ещё вычисляется декоративно или из заглушки.

## Задачи (что сделать)
- [ ] Довести `Evidence Tagging` до реального audit/trace persistence:
  - evidence refs должны доезжать в `AiAuditEntry`/эквивалентный source of truth;
  - trace/forensics path должен читать не только собранные в памяти данные, но и persisted evidence trail.
- [ ] Убедиться, что `BS%` и `Evidence Coverage` считаются из этой живой persisted цепочки без декоративных fallback semantics.
- [ ] Закрыть `Quality & Evals Panel` по честным метрикам:
  - `Acceptance Rate`
  - `Correction Rate` (или честный instrumented статус, если метрика ещё не может быть посчитана полностью)
  - `BS%`
  - `Evidence Coverage`
- [ ] Добавить/усилить `critical path visibility` в backend + UI/API:
  - ключевые runtime phases;
  - bottleneck/critical trace understanding без ручного гадания.
- [ ] Если queue/backpressure visibility уже можно закрыть в том же контуре без расползания scope, сделать это; если нет, честно не заявлять.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md`, если после работы связанные quality/observability claims можно перевести из `PARTIAL`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Evidence refs реально persist и читаются из trace/audit source of truth.
- [ ] `BS%` и `Evidence Coverage` feed’ят observability из живой цепочки, а не из декоративной модели.
- [ ] `Control Tower` показывает честные quality/eval metrics для заявленного scope.
- [ ] Есть critical path visibility минимум для ключевого runtime spine.
- [ ] Tenant isolation и replay safety не деградировали.
- [ ] Есть producer-side тесты на evidence persistence и panel/source-of-truth contract.

## Тест-план (минимум)
- [ ] Unit/service-level: evidence refs доезжают в persisted audit/trace metadata.
- [ ] Unit/service-level: `BS%`/coverage читаются из persisted evidence chain без фейкового нулевого fallback.
- [ ] Integration/service-level: dashboard/control-tower API возвращает честные quality metrics.
- [ ] Integration/service-level: critical path / runtime phases доступны в trace observability contract.
- [ ] Regression: replay mode не пишет side effects и не искажает quality metrics.
- [ ] Regression: tenant isolation на explainability/dashboard path сохранена.

## Что вернуть на ревью
- Изменённые файлы.
- Где именно теперь persist evidence и как они доходят до panel/API.
- Какие quality metrics реально стали source-of-truth-backed.
- Что именно добавлено для critical path visibility.
- Результаты `tsc` и целевых тестов.
- Явное указание, какие `PARTIAL` claims после этого можно перевести в лучший статус.
