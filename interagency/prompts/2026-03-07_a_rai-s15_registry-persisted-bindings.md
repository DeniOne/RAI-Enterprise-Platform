# PROMPT — A_RAI S15 Registry Persisted Bindings
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести `Phase 4.6 Agent Registry` до состояния, где mapping `agent -> capabilities/tools` перестаёт быть частично вычисляемым или хардкодным слоем. После этой задачи runtime authority должен читать persisted first-class bindings как источник правды, а не опираться на `TOOL_RUNTIME_MAP`/derived conventions там, где нужна реальная управляемая модель registry.

## Контекст
- После `R10` registry уже стал runtime authority, но в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` claim `Phase 4.6 полноценный registry-модуль` остаётся `PARTIAL`.
- Главный незакрытый хвост прямо назван там же:
  - persisted `AgentToolMapping` и полная Prisma-модель registry ещё не доведены.
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` также остаётся открытым пункт:
  - `Есть first-class mapping agent -> tools/capabilities`
- Архитектурный смысл шага:
  - `R10` дал authority-layer;
  - `S15` должен убрать остаточную “нечестность” в bindings-модели, чтобы registry был не только resolver-сервисом, но и persisted source of truth для runtime tool authority.

## Ограничения (жёстко)
- Не делать второй параллельный registry, который не участвует в runtime execution path.
- Не возвращать критичные runtime-решения к хардкоду `TOOL_RUNTIME_MAP` как основному источнику правды.
- Не ломать tenant isolation: все tenant-sensitive bindings/access rules только через trusted `companyId` context.
- Не ломать уже принятые guardrails:
  - `RiskPolicy`
  - `AutonomyPolicy`
  - `PendingAction`
  - replay safety
  - prompt governance workflow
- Не уходить в большой UI-переписыватель; допускаются только минимальные DTO/API правки, если они нужны для честного контракта.
- Не делать purely-decorative Prisma entities, если runtime их не читает.

## Задачи (что сделать)
- [ ] Ввести persisted first-class модель bindings для registry-домена:
  - agent capability binding;
  - agent tool binding или эквивалентный явный persisted contract;
  - при необходимости tenant override/deny на уровне bindings.
- [ ] Перевести runtime resolver так, чтобы решение `какой агент имеет право на какой tool/capability` читалось из persisted registry-модели, а не из derived-only map.
- [ ] Честно определить судьбу оставшегося хардкода:
  - либо удалить;
  - либо оставить только как bootstrap/legacy fallback с явной маркировкой и тестом.
- [ ] Доказать, что disable/narrowing/tenant deny продолжают работать уже поверх persisted bindings.
- [ ] Обновить management/read API настолько, чтобы было видно: bindings приходят из registry-domain source of truth, а не из случайного legacy projection.
- [ ] Добавить audit evidence на критичные изменения persisted bindings, если таких записей ещё нет.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md`, если после работы claim `Phase 4.6 полноценный registry-модуль` можно поднять из `PARTIAL`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] В кодовой базе есть persisted first-class binding model для `agent -> capabilities/tools`.
- [ ] Runtime execution path читает эту модель как authority source.
- [ ] Остаточный хардкод bindings не является primary source of truth.
- [ ] Tenant access / capability narrowing / disable agent по-прежнему enforced.
- [ ] Legacy fallback, если он остаётся, явно помечен и покрыт тестом.
- [ ] Management/read surface не врёт о том, откуда берётся authority.
- [ ] Есть producer-side тесты, подтверждающие persisted binding enforcement.

## Тест-план (минимум)
- [ ] Unit/service-level: persisted capability binding разрешает допустимый tool.
- [ ] Unit/service-level: отсутствие persisted binding блокирует tool access.
- [ ] Unit/service-level: tenant deny/override поверх bindings реально влияет на runtime.
- [ ] Integration/service-level: `RaiToolsRegistry`/runtime используют persisted resolver, а не старый hardcoded-only path.
- [ ] Regression: `disable agent`, `capability narrowing`, `tenant deny` не ломаются.
- [ ] Regression: replay safety и risk/autonomy gating сохраняются.
- [ ] Migration/backward-compatibility: legacy bootstrap/fallback, если существует, явно покрыт тестом.

## Что вернуть на ревью
- Изменённые файлы.
- Краткое описание новой persisted bindings-модели.
- Какие runtime-решения перестали зависеть от хардкода.
- Какие миграции добавлены и каков их backward-safe смысл.
- Какие тесты доказывают persisted authority.
- Явное указание, можно ли после этого поднять claim `Phase 4.6 полноценный registry-модуль`.
