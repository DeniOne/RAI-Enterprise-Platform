# PROMPT — A_RAI S14 Prompt Governance Closeout
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести `PromptChange RFC` и agent-config governance до состояния, где claim перестаёт быть `PARTIAL`: change workflow должен быть подтверждён не только service-level unit-тестами, но и HTTP/integration-путём, а control-plane API/UI больше не должны создавать иллюзию старого direct-config CRUD вместо governed workflow.

## Контекст
- Это следующий шаг после принятых `R10`, `R12` и `S13`.
- В `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md` всё ещё открыт критичный claim:
  - `PromptChange RFC`
- В `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` claim
  - `PromptChange RFC внедрён как формальный исполняемый процесс с eval/canary/rollback`
  остаётся `PARTIAL`, потому что:
  - нет HTTP-level smoke / integration proof на governed endpoints;
  - UI и management surface ещё не полностью переведены на новый workflow и могут визуально/контрактно выглядеть как legacy config editing.
- Это также двигает незакрытые пункты из `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`:
  - `Есть smoke tests на живые API маршруты`
  - `Prompt/config changes не выглядят как обходной ручной config path`
  - `Для critical task есть runtime-подтверждение, а не только unit-level evidence`

## Ограничения (жёстко)
- Не делать декоративные smoke-тесты, которые мокают весь governance workflow и ничего не доказывают.
- Не возвращать direct production write path для agent config.
- Не ослаблять существующие guardrails:
  - eval verdict gate;
  - canary / rollback;
  - tenant isolation;
  - registry runtime authority;
  - incident/governance audit trail.
- Не подменять integration-proof ручным markdown-описанием.
- Не расползаться в большой UI-редизайн; допустимы только минимальные изменения, которые убирают legacy-иллюзию и отражают governed workflow как source of truth.

## Задачи (что сделать)
- [ ] Добавить HTTP-level или controller-level integration tests на governed prompt/config workflow минимум для ключевого happy-path и rollback-path:
  - create change request;
  - start canary;
  - canary review;
  - promote approved change или rollback degraded change;
  - при необходимости verify incident/runbook coupling для rollback path.
- [ ] Проверить и закрыть оставшиеся обходные/legacy semantics в API management-слое:
  - endpoints и DTO не должны выглядеть как direct production config write;
  - response/status model должна явно отражать governed workflow state machine.
- [ ] Проверить, что control-plane surface (`agents-config` API и, если требуется, минимальный UI contract) показывает change-request-centric truth, а не старую CRUD-модель как будто она authoritative.
- [ ] Зафиксировать runtime/smoke evidence того, что governed endpoints реально работают вместе, а не только по отдельным unit-service сценариям.
- [ ] Обновить `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`, если после работы claim `PromptChange RFC` больше не должен оставаться `PARTIAL`.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Есть integration/smoke proof на governed prompt/config workflow через реальные API/controller entry points.
- [ ] Нет endpoint-а или service-path, который выглядит как разрешённая прямая production-запись config в обход workflow.
- [ ] API/DTO management-слоя отражают change-request workflow как основной контракт.
- [ ] rollback/degraded path подтверждён не только unit-level логикой, но и integration-level сценарием.
- [ ] Tenant isolation сохранена.
- [ ] Existing registry/runtime/incedent guardrails не сломаны.
- [ ] Есть producer-side evidence, достаточное чтобы claim `PromptChange RFC` перестал быть `PARTIAL`.

## Тест-план (минимум)
- [ ] Integration/controller-level: create change request без bypass direct write.
- [ ] Integration/controller-level: approved path проходит `request -> canary -> approve/promote`.
- [ ] Integration/controller-level: degraded canary path ведёт к rollback outcome.
- [ ] Regression: tenant A не может читать/двигать change request tenant B.
- [ ] Regression: старый direct config write path по-прежнему заблокирован.
- [ ] Regression: incident/audit evidence на rollback path не теряется.

## Что вернуть на ревью
- Изменённые файлы.
- Какие API/controller paths теперь являются каноническим governed workflow.
- Какие legacy semantics/DTO были убраны или переименованы.
- Какие integration/smoke tests добавлены и что именно они доказывают.
- Результаты `tsc` и целевых тестов с PASS/FAIL.
- Явное указание, можно ли после этого перевести claim `PromptChange RFC` из `PARTIAL`.
