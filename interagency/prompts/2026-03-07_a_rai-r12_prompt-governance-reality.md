# PROMPT — A_RAI R12 Prompt Governance Reality
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Сделать `PromptChange RFC` исполняемым runtime workflow, а не набором разрозненных механизмов. После этой задачи изменение prompt/model/config для AI-агентов должно проходить через единый управляемый путь: версия изменения -> eval verdict -> canary decision -> rollback/approve, с audit evidence и без возможности случайного обхода через UI или ручной config.

## Контекст
- Это прямое закрытие `R12. Prompt Governance Reality` из `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md`.
- Это также двигает раздел `14. Prompt Governance and Safe Evolution` из `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`.
- Сейчас в коде есть куски механики, но нет цельного agent-specific workflow:
  - `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`
  - `apps/api/src/modules/explainability/agent-config-guard.service.ts`
  - `docs/00_STRATEGY/STAGE 2/PROMPT_CHANGE_RFC.md`
  - куски canary/rollback в adaptive-learning контуре.
- После принятия `R10` следующий системный разрыв именно здесь: safe evolution maturity остаётся недостаточной.

## Ограничения (жёстко)
- Нельзя сводить задачу к ещё одному markdown-доку. Нужен исполняемый backend workflow.
- Нельзя принимать “eval gate” только как router-only или stub-only механику.
- Нельзя позволять activation config/prompt/model change в обход verdict/canary/rollback.
- Нельзя ломать tenant isolation, replay safety, autonomy/risk-policy, существующий registry authority.
- Нельзя делать чисто UI-решение без backend enforcement.
- Не трогать frontend, кроме минимального DTO/API-контракта, если это неизбежно.

## Задачи (что сделать)
- [ ] Зафиксировать каноническую модель change workflow для agent prompt/model/config changes:
  - change request / version;
  - eval run;
  - verdict;
  - canary state;
  - rollback state;
  - production activation decision.
- [ ] Сделать так, чтобы изменение agent config/prompt/model не могло стать боевым без формального `APPROVED`/эквивалентного verdict.
- [ ] Привязать eval к реальным agent changes, а не только к абстрактному `IntentRouter`.
- [ ] Довести `GoldenTestSet` / `EvalRun` до честного agent-aware состояния минимум для канонических AI-агентов, где это возможно в текущем scope.
- [ ] Интегрировать canary / rollback в workflow так, чтобы это было видно в коде как обязательный путь safe evolution, а не отдельный необязательный механизм “где-то рядом”.
- [ ] Обеспечить audit trail change workflow.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Есть единый backend workflow safe evolution для agent prompt/model/config changes.
- [ ] Изменение config/prompt/model не активируется в production в обход eval verdict.
- [ ] Canary/rollback участвуют в workflow не декларативно, а исполняемо.
- [ ] `GoldenTestSet` / `EvalRun` больше не выглядят pure-stub-only для заявленного scope.
- [ ] Есть audit evidence на critical transitions workflow.
- [ ] Есть producer-side тесты на approve/block/rollback path.

## Тест-план (минимум)
- [ ] Unit/service-level: config change без успешного eval verdict блокируется.
- [ ] Unit/service-level: failed eval не даёт production activation.
- [ ] Unit/service-level: canary-degraded path ведёт к rollback/quarantine outcome.
- [ ] Regression: валидный approved change может пройти controlled activation path.
- [ ] Regression: tenant isolation не нарушена.
- [ ] Regression: existing registry/config management flow не ломается.

## Что вернуть на ревью
- Изменённые файлы.
- Краткое описание workflow и его state machine.
- Какой именно путь теперь обязателен для change activation.
- Что в старой реализации было декоративным и чем заменено.
- Результаты `tsc` и целевых тестов.
- Явное указание, какие подпункты `R12` теперь можно считать закрытыми, а какие ещё нет.
