# PROMPT — A_RAI S18 BudgetController Runtime Authority
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести `BudgetController` до состояния, где он реально участвует в основном runtime execution path мультиагентной системы, а не существует как частично изолированный сервис. После этой задачи budget/token governance должен влиять на живой orchestration flow `Supervisor -> AgentRuntime -> tools/composer`, с понятными enforcement semantics, observability и producer-side proof.

## Контекст
- После `S17` главным оставшимся structural `PARTIAL` в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` остаётся:
  - `BudgetController — полноценный governor токенов и деградации в основном runtime-потоке`
- В `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md` также открыт пункт:
  - `BudgetController реально участвует в execution path`
- Сейчас budget-governor существует в коде, но из claim-а и readiness-check следует, что он ещё недостаточно вплетён в канонический runtime spine как жёсткий authority layer.
- Это важный pre-launch шаг: даже при закрытых registry/governance/eval claims AI-контур остаётся слабее production-grade, если budget/degradation policy можно обойти или если она не управляет живым runtime.

## Ограничения (жёстко)
- Не делать декоративную “интеграцию” через один лог или формальный вызов без влияния на поведение runtime.
- Не ломать существующие:
  - tenant isolation
  - replay safety
  - autonomy/risk-policy gating
  - prompt governance / eval workflow
  - explainability/trace chain
- Не подменять runtime budget authority UI-индикаторами.
- Не расползаться в большой cost-accounting проект; нужен работающий runtime governor для текущего AI spine.

## Задачи (что сделать)
- [ ] Зафиксировать каноническую точку(и) budget enforcement в runtime spine:
  - до fan-out / до tool execution / до composition / после execution для post-check;
  - должно быть ясно, где budget влияет на решение системы.
- [ ] Интегрировать `BudgetControllerService` в боевой runtime так, чтобы:
  - budget реально мог блокировать/деградировать выполнение;
  - это было видно в execution result/trace/observability;
  - поведение было воспроизводимым и тестируемым.
- [ ] Определить и реализовать честную runtime semantics budget outcomes:
  - allow
  - degrade
  - deny / fail-safe
- [ ] Убедиться, что replay и read-only сценарии не искажаются budget governance без причины.
- [ ] Добавить observability/audit signal на budget decisions, если его ещё нет в достаточном виде.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md`, если после работы claim `BudgetController` можно поднять из `PARTIAL`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] `BudgetController` реально участвует в основном runtime execution path.
- [ ] Budget outcomes реально меняют runtime behavior, а не только пишут метаданные.
- [ ] Enforcement semantics прозрачны: allow / degrade / deny.
- [ ] Replay safety и tenant isolation не деградировали.
- [ ] Есть producer-side тесты на runtime budget enforcement.
- [ ] Claim `BudgetController` можно аргументированно поднять из `PARTIAL`, либо остаточный разрыв честно зафиксирован.

## Тест-план (минимум)
- [ ] Unit/service-level: budget policy возвращает разные runtime outcomes по разным условиям.
- [ ] Integration/service-level: `Supervisor`/`AgentRuntime` реально используют budget governor в execution path.
- [ ] Regression: replay mode не ломается и не создаёт лишних budget side effects.
- [ ] Regression: autonomy/risk gating продолжают работать вместе с budget governance.
- [ ] Regression: trace/observability видят budget decision без tenant leakage.
- [ ] Минимум один сценарий degrade и один сценарий deny.

## Что вернуть на ревью
- Изменённые файлы.
- Где именно budget enforcement встроен в runtime spine.
- Какие runtime outcomes реализованы и как они проявляются в response/trace.
- Какие observability/audit сигналы теперь пишет budget layer.
- Результаты `tsc` и целевых тестов.
- Явное указание, можно ли теперь перевести claim `BudgetController` из `PARTIAL`.
