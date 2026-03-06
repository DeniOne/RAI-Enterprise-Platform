# A_RAI — Multi-Agent Production Readiness Checklist

Дата: 2026-03-05  
Назначение: ультимативный чеклист готовности мультиагентной системы `A_RAI` к реальному внедрению AI в продуктовый контур `RAI_EP`.

## Как пользоваться

- Это не wishlist и не маркетинговый документ.
- Галка ставится только если есть:
  - код;
  - тесты;
  - runtime-подтверждение или smoke;
  - observability;
  - техлидское принятие.
- Если есть только UI, спека или “сервис вроде написан”, галку не ставить.
- Если claim не подтверждается кодом и рантаймом, считать пункт открытым.

## Статусы

- `[ ]` не готово
- `[x]` готово и принято

## 0. Executive Gate

- [ ] Есть единый источник правды по статусу готовности AI-контура.
- [ ] `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md` актуален.
- [ ] Критичные claims больше не находятся в `PARTIAL` или `MISSING` без явного плана закрытия.
- [ ] Есть список блокеров, которые запрещают rollout при незакрытии.
- [ ] Есть owner на каждый критичный трек.

## 1. Business Fit and Scope Control

- [ ] Зафиксировано, что `RAI_EP` строит AI-слой для агроконсалтинга, а не “чат для фермы”.
- [ ] Для каждого агента определена бизнес-роль, а не только техническая роль.
- [ ] Для каждого агента зафиксирован список допустимых действий и явных запретов.
- [ ] Для каждого агентного сценария определён Human-in-the-Loop.
- [ ] Нет agent flows, которые обходят детерминированный бизнес-контур.

## 2. Multi-Agent Topology

- [ ] `Supervisor` реально декомпозирован на рабочие компоненты.
- [ ] `IntentRouter` не декоративный и реально маршрутизирует запросы.
- [ ] `BudgetController` реально участвует в execution path.
- [ ] `MemoryCoordinator` реально участвует в recall/append/profile flow.
- [ ] `AgentRuntime` реально управляет lifecycle, deadline, fan-out.
- [ ] `ResponseComposer` реально собирает output и режет PII.
- [ ] Глубина делегирования ограничена и контролируется.
- [ ] Нет скрытых обходов runtime через ad-hoc вызовы сервисов.

## 3. Agent Contracts

- [ ] Для каждого агента определён строгий input contract.
- [ ] Для каждого агента определён строгий output contract.
- [ ] Для каждого агента зафиксированы capabilities.
- [ ] Для каждого агента определён token budget.
- [ ] Для каждого агента определён deadline.
- [ ] Для каждого агента есть fallback при ошибке/таймауте.
- [ ] Для каждого агента есть тесты happy-path и failure-path.

## 4. Tool Gating and Capability Control

- [ ] Все tool calls идут через typed registry.
- [ ] Нет string-execution и невалидированных payload calls.
- [ ] Все tool payloads валидируются схемами.
- [ ] У каждого инструмента есть risk-level.
- [ ] WRITE/CRITICAL инструменты реально gated.
- [ ] Tool access реально зависит от agent capability set.
- [ ] Tool access реально зависит от tenant/role/policy.
- [ ] Все tool calls логируются с `traceId`.

## 5. Tenant Isolation and Security

- [ ] `companyId` берётся только из trusted context.
- [ ] Tenant isolation enforced на уровне Prisma/query layer.
- [ ] Нет контроллеров, принимающих `companyId` из payload в критичном контуре.
- [ ] Нет raw SQL без tenant guard.
- [ ] Security path покрыт тестами на cross-tenant access.
- [ ] Есть логирование tenant violations.
- [ ] Есть governance-счётчики по tenant/security incidents.

## 6. Deterministic Core Protection

- [ ] Все расчёты с бизнес-последствиями вынесены в deterministic engine/service.
- [ ] AI не пишет в ledger напрямую.
- [ ] AI не меняет критичные FSM-статусы напрямую.
- [ ] AI не активирует документы/техкарты напрямую.
- [ ] AI не обходит `RiskGate` / `IntegrityGate`.
- [ ] Есть тесты, подтверждающие запреты на критичные AI-действия.

## 7. Memory Readiness

- [ ] `MemoryAdapter` является реальным обязательным слоем, а не интерфейсом ради красоты.
- [ ] Работает recall по tenant/user/page context.
- [ ] Работает append interaction.
- [ ] Работает profile read/update.
- [ ] Есть retention policy.
- [ ] Есть delete/purge story.
- [ ] Есть audit trail на чтение/использование памяти.
- [ ] Память не ломает tenant isolation.

## 8. Evidence and Truthfulness Spine

- [ ] Каждый агентный ответ может нести `evidence`.
- [x] `Evidence` доезжает до `AiAuditEntry.metadata`.
- [x] `SafeReplay` не ломается из-за нового metadata contract.
- [x] `TruthfulnessEngine` реально вызывается из боевого контура.
- [x] `TraceSummary` содержит реальные, а не декоративные quality-метрики.
- [x] `BS%` считается из реальных evidence/claim данных.
- [x] `Evidence Coverage` считается из прозрачной модели.
- [x] `invalidClaimsPct` считается из прозрачной модели.
- [ ] Нет “нулевых заглушек”, маскирующихся под живые метрики.

## 9. Explainability and Forensics

- [x] У каждого AI trace есть `traceId`.
- [x] `traceId` связывает tool calls, audit entries, trace summary, incidents, widgets.
- [x] Explainability API реально отдаёт timeline исполнения.
- [x] Forensics реально показывает evidence refs.
- [x] Forensics показывает ключевые этапы `router -> runtime -> tools -> composer`.
- [x] Для критичного trace можно восстановить причину решения без ручного гадания.
- [x] `Safe Replay` работает в read-only режиме.
- [x] Replay не создаёт side effects.

## 10. Observability and Control Tower

- [x] `Control Tower` читает живые данные, а не мок/нулевые записи.
- [ ] В панели реально отображаются `BS%`, `Evidence Coverage`, `Acceptance Rate`, `Correction Rate`.
- [x] Есть панель худших traces.
- [ ] Есть critical path visibility.
- [x] Есть cost visibility.
- [ ] Есть queue/backpressure visibility.
- [x] Есть error-rate visibility.
- [x] Есть latency visibility.

## 11. Incidents and Governance

- [x] Есть единая модель incident lifecycle.
- [x] Пишутся security incidents.
- [x] Пишутся quality incidents.
- [ ] Пишутся autonomy/policy incidents.
- [x] У incident есть `traceId`, `type`, `severity`, `status`.
- [x] Incident feed читается из живых данных.
- [x] Есть resolve workflow.
- [ ] Есть runbook/fallback action для критичных инцидентов.

## 12. Autonomy Control

- [x] Есть явные уровни автономности.
- [x] Переход между уровнями управляется метриками, а не ручной магией.
- [x] При деградации качества система умеет уходить в `tool-first`.
- [x] При сильной деградации система умеет уходить в `quarantine`.
- [x] Policy changes реально влияют на runtime.
- [ ] Автономность нельзя случайно обойти через UI или ручной config.

## 13. Agent Registry and Runtime Authority

- [ ] Registry существует как доменная модель, а не только как config CRUD.
- [ ] Есть first-class сущность агента.
- [ ] Есть first-class mapping agent -> tools/capabilities.
- [ ] Есть first-class tenant access control.
- [x] Registry влияет на runtime.
- [x] Disable agent реально выключает поведение.
- [x] Capability narrowing реально ограничивает tool access.
- [x] Tenant deny реально enforced в runtime.

## 14. Prompt Governance and Safe Evolution

- [ ] Есть versioning prompt/model/config changes.
- [x] Есть `GoldenTestSet` не в виде заглушки.
- [x] Есть реальный `EvalRun`.
- [x] Изменение prompt/model/config проходит через eval gate.
- [x] Есть canary mechanism.
- [x] Есть rollback mechanism.
- [x] Без проваленного eval нельзя считать конфиг боевым.
- [x] Есть audit trail изменений prompt/config.

## 15. Testing Readiness

- [x] Есть unit tests на ключевые контракты.
- [ ] Есть integration tests на runtime spine.
- [x] Есть tests на tenant isolation.
- [x] Есть tests на evidence/truthfulness path.
- [x] Есть tests на replay safety.
- [x] Есть tests на governance incidents.
- [x] Есть tests на autonomy transitions.
- [ ] Есть smoke tests на живые API маршруты.

## 16. Delivery and Techlead Discipline

- [ ] Для каждого critical task есть prompt в `interagency/prompts/`.
- [ ] Для каждого completed task есть report в `interagency/reports/`.
- [ ] `interagency/INDEX.md` актуален.
- [ ] `memory-bank/task.md` актуален.
- [ ] `memory-bank/progress.md` не врёт о готовности.
- [ ] Ни один `APPROVED` не выдан без code evidence.
- [ ] Ни один `DONE` не поставлен, если runtime не подтверждён.

## 17. Pre-Launch Gate

- [ ] Есть список P0 blockers на запуск.
- [ ] Все P0 blockers закрыты.
- [ ] Есть rollback plan на случай деградации после включения AI.
- [ ] Есть rollout strategy: shadow -> pilot -> controlled rollout.
- [ ] Есть kill-switch.
- [ ] Есть owners на инциденты первых 7 дней.
- [ ] Есть мониторинг после запуска.
- [ ] Есть критерий, по которому rollout будет остановлен.

## 18. Hard Stop Conditions

- [x] Нельзя запускать AI, если `Evidence -> BS% -> Governance` spine не замкнут.
- [x] Нельзя запускать AI, если registry не влияет на runtime.
- [ ] Нельзя запускать AI, если tenant isolation не подтверждён тестами.
- [x] Нельзя запускать AI, если `TraceSummary` и observability питаются заглушками.
- [x] Нельзя запускать AI, если incidents feed не ловит quality/security события.
- [ ] Нельзя запускать AI, если prompt/config changes могут обходить eval/canary/rollback.

## Финальный критерий готовности

- [ ] Мультиагентная система не является витриной.
- [ ] AI-слой встроен в бизнес-контур без обхода deterministic core.
- [ ] Риск, качество, правдивость и наблюдаемость управляются системой, а не ручным героизмом команды.
- [ ] `A_RAI` можно включать в controlled rollout без лжи самим себе.
