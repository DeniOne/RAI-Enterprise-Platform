# PROMPT — A_RAI S13 Autonomy/Policy Incidents & Runbooks
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Довести incidents/governance контур до production-grade для autonomy/policy событий. После этой задачи система должна не только блокировать действия через `AutonomyPolicy` / `RiskPolicy`, но и писать соответствующие live incidents с `traceId`, типом, severity и lifecycle, а также иметь исполняемые runbook/fallback actions для критичных случаев.

## Контекст
- Production-readiness checklist всё ещё держит открытыми:
  - `Пишутся autonomy/policy incidents`
  - `Есть runbook/fallback action для критичных инцидентов`
- Сейчас quality/security incidents уже живые, но autonomy/policy path в governance всё ещё слабее заявленного.
- Архитектурно это следующий системный шаг после `R10` и `R12`: runtime authority и safe evolution уже усилены, теперь нужно замкнуть operational response.

## Ограничения (жёстко)
- Не делать декоративные incident types без реального runtime trigger.
- Не делать UI-only работу без backend source of truth.
- Не ломать tenant isolation: `companyId` только из trusted context.
- Не ослаблять существующие `RiskPolicy`, `AutonomyPolicy`, `PendingAction`, replay safety и audit trail.
- Не плодить новый параллельный incident subsystem; расширять существующий governance/incident contour.

## Задачи (что сделать)
- [ ] Ввести live autonomy/policy incident logging в execution path:
  - `TOOL_FIRST` forced human approval;
  - `QUARANTINE` block;
  - policy-blocked critical action;
  - при необходимости governed prompt/config rollback incidents.
- [ ] Привязать incident creation к реальному runtime trace (`traceId`, companyId, severity, subtype/lifecycle).
- [ ] Добавить runbook/fallback action model для критичных incidents:
  - например `fallback_to_tool_first`, `quarantine_agent`, `require_human_review`, `rollback_change_request` или эквивалентный безопасный набор.
- [ ] Сделать так, чтобы governance feed и counters читали эти incidents как live data, а не как hidden subtype noise.
- [ ] Обеспечить resolve/action lifecycle и audit evidence для runbook execution.
- [ ] Обновить `interagency/INDEX.md` до `READY_FOR_REVIEW` после выполнения.

## Definition of Done (DoD)
- [ ] Autonomy/policy incidents реально пишутся из runtime/governance path.
- [ ] У incident есть `traceId`, `type`, `severity`, `status`.
- [ ] Есть хотя бы один исполняемый runbook/fallback action для критичных autonomy/policy incidents.
- [ ] Governance feed показывает эти incidents из живых данных.
- [ ] Counters/governance summary учитывают autonomy/policy incidents отдельно от security/quality.
- [ ] Есть producer-side тесты на incident creation и runbook execution path.

## Тест-план (минимум)
- [ ] Unit/service-level: `QUARANTINE` block создаёт autonomy incident.
- [ ] Unit/service-level: `TOOL_FIRST` forced PendingAction создаёт policy/autonomy incident.
- [ ] Unit/service-level: runbook/fallback action переводит incident lifecycle и пишет audit evidence.
- [ ] Regression: quality/security incidents не ломаются.
- [ ] Regression: tenant isolation сохранена.
- [ ] Regression: governance feed/counters читают новые incidents как live source.

## Что вернуть на ревью
- Изменённые файлы.
- Краткое описание incident taxonomy и runbook model.
- Где именно в runtime создаются новые incidents.
- Какие runbook actions исполняемы и какие guardrails на них наложены.
- Результаты `tsc` и целевых тестов.
- Явное указание, какие пункты production-readiness по incidents/governance теперь можно считать закрытыми.
