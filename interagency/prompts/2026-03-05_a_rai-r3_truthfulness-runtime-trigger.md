# PROMPT — R3 Truthfulness Runtime Trigger (Truth Sync Recovery)
Дата: 2026-03-05  
Статус: active  
Приоритет: P0

## Цель
Довести runtime-вызов `TruthfulnessEngine` до детерминированного и проверяемого состояния. После `R2` в коде уже появился вызов `TruthfulnessEngine` из `SupervisorAgent`, но сейчас это выглядит как хрупкая post-processing цепочка. Нам нужен не “вызов вроде есть”, а гарантированный боевой контур: audit entry записан, затем truthfulness считается по реальным audit-данным, после чего quality-поля `TraceSummary` обновляются без гонок, без фальши и без влияния на пользовательский ответ.

## Контекст
- Почему это важно сейчас:
  - `R1` довёз `evidence` до `AiAuditEntry.metadata`.
  - `R2` сделал `TraceSummary` честно nullable и убрал нулевые заглушки.
  - Но spine `evidence -> aiAuditEntry -> TruthfulnessEngine -> TraceSummary.updateQuality` ещё надо зафиксировать как надёжную runtime-цепочку, а не как “best effort побочный вызов”.
- Ключевой риск:
  - если `TruthfulnessEngine` читает audit trail раньше, чем запись `AiAuditEntry` реально закоммитилась, система может посчитать `BS%` по пустому или неполному следу;
  - если цепочка не покрыта producer/runtime тестами, она снова развалится при следующем рефакторинге.
- На какие документы опираемся:
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md`
  - `docs/00_STRATEGY/STAGE 2/ANTIGRAVITY SOFTWARE FACTORY — ORCHESTRATOR PROMPT.md`
- Ключевые текущие файлы:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts`
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts`

## Ограничения (жёстко)
- `companyId` только из trusted context. Никаких tenant-данных из payload.
- Не лезть в `Agent Registry`, `Control Tower UI`, `Prompt RFC`, `GoldenTestSet`, `incidents` и другие соседние треки.
- Не расползаться в расчёт `invalidClaimsPct` и полную claim-модель. Это следующий шаг.
- Не подменять runtime-надежность “асинхронным fire-and-forget, который обычно успевает”.
- Ошибки truthfulness-контура не должны ломать ответ клиенту, но должны быть наблюдаемы и тестируемы.
- Backward compatibility обязательна:
  - старые traces без `evidence` не должны ломать pipeline;
  - replay mode не должен порождать side effects, противоречащие текущей модели.

## Задачи (что сделать)
- [ ] Проверить и зафиксировать корректный порядок операций в `SupervisorAgent`:
  - запись `AiAuditEntry`
  - вызов `TruthfulnessEngine`
  - `TraceSummary.updateQuality`
- [ ] Если сейчас между записью audit entry и чтением его в `TruthfulnessEngine` возможна гонка, убрать её архитектурно, а не надеждой на event loop.
- [ ] Сделать runtime-цепочку truthfulness явно проверяемой:
  - success path: audit entry с evidence -> `calculateTraceTruthfulness` -> `updateQuality`
  - no-evidence path: controlled fallback -> честный `bsScorePct`
  - failure path: ошибка движка не ломает клиентский ответ, но не теряется бесследно
- [ ] Явно проверить и закрепить семантику `replayMode`:
  - должен ли replay пересчитывать truthfulness;
  - если да, то без нарушения read-only invariants;
  - если нет, это должно быть выражено кодом и тестом.
- [ ] Убедиться, что `TruthfulnessEngine` считается по реально сохранённому audit trail, а не по эфемерным данным из памяти процесса.

## Что не делать
- [ ] Не добавлять новый UI.
- [ ] Не менять DTO панелей без необходимости.
- [ ] Не начинать считать `invalidClaimsPct`.
- [ ] Не рефакторить весь `SupervisorAgent` ради красоты.
- [ ] Не переносить этот трек в event bus / outbox orchestration, если для текущего DoD достаточно локального честного упорядочивания.

## Definition of Done (DoD)
- [ ] `TruthfulnessEngine` вызывается из боевого runtime-контура в гарантированно корректном порядке относительно записи `AiAuditEntry`.
- [ ] Для trace с evidence `TraceSummary.updateQuality` получает реальный `bsScorePct` после чтения audit trail.
- [ ] Для trace без evidence система проходит по честному fallback path без падения.
- [ ] Ошибка truthfulness-контура не ломает пользовательский response, но остаётся наблюдаемой.
- [ ] Семантика `replayMode` зафиксирована кодом и тестами.
- [ ] `tsc` PASS.
- [ ] Целевые `jest` PASS.

## Тест-план (минимум)
- [ ] Unit/spec: success path `audit create -> truthfulness -> updateQuality`.
- [ ] Unit/spec: no-evidence path -> controlled fallback.
- [ ] Unit/spec: truthfulness failure не ломает `orchestrate()` response.
- [ ] Unit/spec: `replayMode` соответствует выбранной семантике.
- [ ] Unit/spec: `updateQuality` не вызывается на “фантомных” данных раньше audit persistence.
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` для затронутого пакета.
- [ ] Целевые `jest` по затронутым файлам/модулям.

## Что вернуть на ревью
- Изменённые файлы (список).
- Краткое описание финального порядка runtime-операций.
- Объяснение, как устранена или исключена гонка между audit persistence и truthfulness calculation.
- Результаты `tsc`.
- Результаты `jest`.
- Короткое доказательство из тестов, что `updateQuality` вызывается только после доступности audit-данных.

## Критерий приёмки техлидом
Задача считается принятой только если после доработки можно честно сказать: `TruthfulnessEngine` стал частью надёжного runtime-контура, а не асинхронной декоративной цепочки, которая иногда успевает, а иногда врёт.
