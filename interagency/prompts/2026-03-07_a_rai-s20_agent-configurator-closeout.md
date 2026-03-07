# PROMPT — A_RAI S20 Agent Configurator Closeout
Дата: 2026-03-07
Статус: active
Приоритет: P1

## Цель
Довести `Agent Configurator` до состояния, где claim `UI + API настройки агентов` можно поднять из `PARTIAL` без самообмана. После этой задачи control-plane surface для агентов должен быть честно завязан на governed/runtime truth, а не выглядеть как legacy CRUD-панель поверх `AgentConfiguration`.

## Контекст
- После `S19` в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` главный оставшийся Stage 2 `PARTIAL` в AI control-plane контуре:
  - `Agent Configurator существует как UI + API настройки агентов`
- У нас уже закрыты связанные structural claims:
  - governed prompt/config workflow (`S14`, `R12`)
  - persisted registry bindings (`S15`)
  - eval evidence (`S16`)
  - control-tower honesty и quality/governance loop (`S17`, `S19`)
- Значит оставшийся разрыв уже не в базовой механике, а в том, насколько `Agent Configurator` честно отражает:
  - governed change-request semantics;
  - persisted registry/tools/capabilities authority;
  - runtime source of truth;
  - отсутствие direct-write иллюзий.

## Ограничения (жёстко)
- Не возвращать direct CRUD semantics под видом “упрощения UX”.
- Не ломать:
  - governed `change request -> eval -> canary -> promote/rollback`
  - registry runtime authority
  - tenant isolation
  - audit trail изменений
  - budget/autonomy/governance loops
- Не делать большой визуальный редизайн без изменения source-of-truth semantics.
- Не поднимать claim в `CONFIRMED`, если UI/API всё ещё продают legacy `AgentConfiguration` как authoritative write path.

## Задачи (что сделать)
- [ ] Проверить и закрыть остаточную legacy-семантику в `Agent Configurator` UI:
  - surface должен быть change-request-centric и registry-aware;
  - должно быть видно, что production/runtime state идёт из governed/runtime truth, а не из локального form state.
- [ ] Проверить и, если нужно, усилить API contract:
  - read model должен отражать effective runtime state, bindings source, tenant access и governed status;
  - write path должен оставаться только через governed flow и не оставлять двусмысленного impression “прямой edit = instant production change”.
- [ ] Убедиться, что `tools/capabilities`, tenant access, activation state и effective source честно видны в configurator surface.
- [ ] Если нужно, добавить controller-level / integration proof, что:
  - configurator читает effective/runtime-aware данные;
  - direct bypass production config невозможен;
  - UI/client contract не обходит governed flow.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md`, если claim `Agent Configurator` теперь можно поднять в `CONFIRMED`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] `Agent Configurator` больше не создаёт впечатление direct production CRUD.
- [ ] UI/API отражают effective runtime/governed state, а не только legacy storage row.
- [ ] Write path остаётся governed и подтверждён тестами.
- [ ] Tenant isolation и audit trail не деградировали.
- [ ] Claim `Agent Configurator` можно аргументированно перевести в `CONFIRMED`, либо остаточный разрыв честно локализован.

## Тест-план (минимум)
- [ ] Controller/service-level: configurator read model отдаёт effective registry-aware state.
- [ ] Controller/service-level: direct production bypass невозможен.
- [ ] UI/client-level: control-plane surface и client contract используют governed semantics.
- [ ] Regression: tenant isolation сохранена.
- [ ] Regression: bindings / effective tools/capabilities / activation state отображаются без расхождения с runtime source of truth.

## Что вернуть на ревью
- Изменённые файлы.
- Как теперь configurator отражает effective runtime/governed state.
- Где именно устранена legacy CRUD-иллюзия, если она оставалась.
- Какие тесты подтверждают отсутствие direct bypass и честность read model.
- Результаты `tsc` и целевых тестов.
- Явное указание, можно ли теперь перевести claim `Agent Configurator` в `CONFIRMED`.
