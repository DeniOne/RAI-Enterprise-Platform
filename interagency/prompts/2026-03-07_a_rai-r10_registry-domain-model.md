# PROMPT — A_RAI R10 Registry Domain Model
Дата: 2026-03-07
Статус: active
Приоритет: P0

## Цель
Перевести `Agent Registry` из состояния config-CRUD вокруг `AgentConfiguration` в first-class доменную модель, которая является реальным runtime source of truth для мультиагентной системы `A_RAI`. После этой задачи registry должен описывать агентов, их capability/tool bindings и tenant access как доменные сущности, а runtime должен читать именно эту модель, а не хардкод и не legacy-конфиг.

## Контекст
- Это прямое закрытие `R10. Registry Domain Model` из `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md`.
- Это также продвигает блок `13. Agent Registry and Runtime Authority` из `docs/00_STRATEGY/STAGE 2/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md`.
- По текущему коду главный разрыв в том, что runtime authority уже частично реальна, но держится на:
  - Prisma-модели `AgentConfiguration`;
  - хардкоде `TOOL_RUNTIME_MAP` в `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`;
  - CRUD-логике `apps/api/src/modules/explainability/agent-management.service.ts`.
- Это не соответствует архитектурному принципу capability-based tool gating из:
  - `docs/00_STRATEGY/STAGE 2/RAI_FARM_OPERATING_SYSTEM_ARCHITECTURE.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`
- Бизнес-рамка жёсткая: `RAI_EP` строит AI-слой для результатного агроконсалтинга. AI не должен становиться авторитетом, а registry не должен открывать обход deterministic/risk/integrity контуров.

## Ограничения (жёстко)
- Multi-tenancy строго обязательна:
  - `companyId` только из trusted context;
  - никаких tenant-sensitive решений из payload;
  - tenant deny/access должен реально enforced в runtime.
- Нельзя делать cosmetic-рефакторинг ради красоты. Нужен рабочий доменный минимум, который двигает `R10`.
- Нельзя ломать текущие runtime guardrails:
  - `RiskPolicy`;
  - `AutonomyPolicy`;
  - `PendingAction`;
  - replay safety;
  - tenant isolation.
- Нельзя оставлять новый registry только на UI/API-уровне. Он обязан реально управлять runtime.
- Нельзя делать новый параллельный “второй реестр”, который не используется в execution path.
- Не трогать frontend/UI, кроме случаев, когда backend-контракт неизбежно требует минимальной правки DTO.
- Не плодить новые planning docs в `interagency/plans/`; этот prompt является полным ТЗ.

## Задачи (что сделать)
- [ ] Спроектировать минимальную first-class доменную модель registry для AI-агентов. На уровне данных должны появиться отдельные сущности или эквивалентный явный доменный слой для:
  - agent;
  - agent capability binding;
  - agent tool binding или вычислимый equivalent;
  - tenant agent access.
- [ ] Честно определить судьбу `AgentConfiguration`:
  - либо мигрировать в legacy/projection;
  - либо сохранить только как derived/read model;
  - но не оставлять её главным runtime source of truth.
- [ ] Убрать из runtime критичную зависимость от хардкода `TOOL_RUNTIME_MAP`.
- [ ] Реализовать сервис разрешений/резолвинга runtime-конфига, который читает новую доменную модель и возвращает:
  - активен ли агент;
  - разрешён ли инструмент;
  - по какому binding/capability/tool-access решение принято;
  - действует ли tenant deny/allow.
- [ ] Интегрировать этот сервис в execution path `rai-chat`, чтобы:
  - disable agent реально отключал поведение;
  - capability narrowing реально запрещал tool access;
  - tenant deny реально блокировал доступ в runtime.
- [ ] Сохранить backward-safe поведение для уже существующих записей/данных:
  - если нужна миграция, она должна быть пошаговой и безопасной;
  - если нужен transitional fallback, он должен быть явно помечен как legacy и покрыт тестом.
- [ ] Обновить API/сервис management-слоя так, чтобы он работал поверх новой доменной модели, а не прямого CRUD-иллюзиона вокруг `AgentConfiguration`.
- [ ] Добавить audit evidence на критичные изменения registry-конфигурации.
- [ ] Обновить `interagency/INDEX.md` статусом `READY_FOR_REVIEW`, когда задача будет выполнена.

## Decision / Domain Notes
- Минимально допустимый результат: не “идеальный universal registry”, а first-class runtime authority именно для AI-агентов `agronomist`, `economist`, `knowledge`, `monitoring`.
- Предпочтение:
  - явные таблицы/модели и явные binding-сущности;
  - а не JSON-комбайн с неявной семантикой.
- Если полный вынос prompt/model/maxTokens в новую модель сейчас слишком широк, допустим staged approach:
  - Stage A: authority-модель доступа и activation;
  - Stage B: prompt/model/tokens как policy/config layer.
- Но в review должно быть видно, что `R10` реально улучшен, а не переименован.

## Definition of Done (DoD)
- [ ] В кодовой базе есть first-class registry domain для AI-агентов, а не только `AgentConfiguration` CRUD.
- [ ] Runtime читает новую модель в execution path.
- [ ] `AgentConfiguration` либо legacy, либо projection, и это явно видно в коде/комментариях/именовании.
- [ ] Нет критичного runtime-решения, которое зависит только от `TOOL_RUNTIME_MAP` хардкода.
- [ ] Disable agent реально выключает поведение в runtime.
- [ ] Capability narrowing реально ограничивает tool access в runtime.
- [ ] Tenant access control реально enforced в runtime.
- [ ] Tenant isolation не деградировала.
- [ ] Replay mode и existing risk/autonomy gating не сломаны.
- [ ] Изменения покрыты producer-side тестами на ключевые контракты.

## Тест-план (минимум)
- [ ] Unit: резолвинг runtime authority для active/inactive agent.
- [ ] Unit: capability narrowing блокирует недопустимый tool.
- [ ] Unit: tenant deny блокирует доступ even if global config allows.
- [ ] Unit: legacy fallback работает только в переходном сценарии и явно покрыт тестом.
- [ ] Integration/service-level: `RaiToolsRegistry`/runtime действительно используют новый resolver.
- [ ] Regression: replayMode не ломается.
- [ ] Regression: autonomy/risk-policy gating продолжают работать поверх нового registry authority.
- [ ] Regression: существующие explainability/management сценарии не падают на новом контракте.
- [ ] Минимум один smoke-like тест на end-to-end chat execution path с runtime enforcement.

## Что вернуть на ревью
- Изменённые файлы (полный список).
- Краткое объяснение новой доменной модели:
  - какие сущности добавлены;
  - что стало source of truth;
  - что переведено в legacy/projection.
- Список миграций Prisma и их смысл.
- Список удалённого/сниженного хардкода.
- Результаты тестов с командами и статусами PASS/FAIL.
- Явное указание, какие пункты `R10` теперь можно считать закрытыми, а какие ещё нет.
