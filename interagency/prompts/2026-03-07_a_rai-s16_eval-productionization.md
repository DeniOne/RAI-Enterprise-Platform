# PROMPT — A_RAI S16 Eval Productionization
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести `GoldenTestSet / EvalRun` до состояния, где они перестают быть `PARTIAL` и становятся реальным production-grade gate для safe evolution AI-агентов. После этой задачи eval-контур должен быть достаточно честным, чтобы не выглядеть как ограниченный набор локальных проверок вокруг governance workflow, а как воспроизводимый и наблюдаемый quality gate для агентных изменений.

## Контекст
- После `R12`, `S14` и `S15` `PromptChange RFC` уже подтверждён, но в `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` claim
  - `GoldenTestSet / EvalRun реально production-grade, а не заглушка`
  остаётся `PARTIAL`.
- Сейчас есть candidate-aware eval logic, golden sets и governance workflow, но остаются системные разрывы:
  - eval всё ещё выглядит как ограниченный набор тестовых наборов без полноценного run-level evidence/coverage story;
  - неочевидно, что результаты eval можно использовать как устойчивый quality gate beyond happy-path;
  - не закрыта честная связь `change request -> eval corpus -> verdict evidence`.
- Этот шаг продвигает `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`, разделы:
  - `14. Prompt Governance and Safe Evolution`
  - `15. Testing Readiness`

## Ограничения (жёстко)
- Не делать декоративный refactor вокруг названий `EvalRun` без усиления реального контракта.
- Не сводить задачу к добавлению ещё пары JSON golden-set файлов без улучшения run semantics.
- Не ломать существующий governed workflow `change request -> eval -> canary -> promote/rollback`.
- Не ослаблять tenant isolation, runtime registry authority, autonomy/risk guardrails.
- Не расползаться в большой UI-проект; backend quality gate и его evidence важнее витрины.

## Задачи (что сделать)
- [ ] Зафиксировать и реализовать более честный run-level контракт для eval:
  - что именно является единицей eval run;
  - какие metadata/results persist или явно возвращаются;
  - как run связывается с конкретным `change request`, `role`, `prompt/model` candidate.
- [ ] Усилить coverage golden/eval path минимум для канонических агентов:
  - чтобы наборы и verdict не выглядели слишком узкими или stub-like;
  - чтобы было видно различие `pass/fail/degraded` не только по одному искусственному сценарию.
- [ ] Сделать eval evidence пригодным для ревью:
  - явные summary/results;
  - понятные поля, по которым техлид может увидеть, почему change допускается или блокируется.
- [ ] Проверить, что governance workflow реально опирается на этот усиленный eval contract, а не только формально вызывает сервис.
- [ ] Обновить `TRUTH_SYNC_STAGE_2_CLAIMS.md`, если после работы claim `GoldenTestSet / EvalRun` можно поднять из `PARTIAL`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Есть более честный и явный eval run contract для agent changes.
- [ ] Eval results привязаны к конкретному candidate/change request и пригодны для review evidence.
- [ ] Golden/eval coverage больше не выглядит pure-stub-only для заявленного scope.
- [ ] Governance workflow использует усиленный eval contract без декоративности.
- [ ] Есть producer-side тесты на key pass/fail/degraded paths.
- [ ] Claim `GoldenTestSet / EvalRun` можно аргументированно поднять из `PARTIAL`, либо в отчёте честно зафиксирован оставшийся разрыв.

## Тест-план (минимум)
- [ ] Unit/service-level: eval run создаёт/возвращает candidate-specific summary с понятным verdict basis.
- [ ] Unit/service-level: failing/degraded candidate не выглядит как тот же success-path с косметическим флагом.
- [ ] Regression: approved candidate workflow по-прежнему проходит controlled path.
- [ ] Regression: tenant isolation на eval/governance path сохранена.
- [ ] Regression: agent-specific golden sets реально участвуют в verdict.
- [ ] Минимум один integration/service-level сценарий `change request -> eval evidence -> governance decision`.

## Что вернуть на ревью
- Изменённые файлы.
- Как теперь устроен eval run contract.
- Что именно стало source of truth для eval evidence.
- Какие agent-specific scenarios покрыты и чего всё ещё не хватает.
- Результаты `tsc` и целевых тестов.
- Явное указание, можно ли теперь перевести claim `GoldenTestSet / EvalRun` из `PARTIAL`.
